#!/usr/bin/env node
/**
 * 노션 → Supabase 1회 이전 스크립트.
 *
 *   node --env-file=.env scripts/migrate-notion-to-supabase.mjs
 *   node --env-file=.env scripts/migrate-notion-to-supabase.mjs --confirm-description-changes
 *
 * 노션 데이터는 읽기만 하고 절대 수정하지 않는다. 몇 번을 다시 돌려도 안전하다(멱등).
 *
 * ⚠️ 기존 ID를 그대로 옮긴다. /projects/{id} 주소가 이미 네이버에 제출돼 있어서
 *    ID가 바뀌면 색인된 주소가 전부 404가 된다.
 */
import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

for (const [k, v] of Object.entries({
  NOTION_API_KEY, NOTION_DATABASE_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
})) {
  if (!v) {
    console.error(`환경변수 ${k} 가 없습니다. .env 를 확인해주세요.`);
    process.exit(1);
  }
}

const confirmDescriptionChanges = process.argv.includes("--confirm-description-changes");

const notion = new Client({ auth: NOTION_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = "project-images";
const TYPE_MAP = {
  "증개축": "Extension",
  "대수리": "Extension",
  "주택건축": "NewBuild",
  "설비": "Repair",
  "부분수리": "Repair",
  "인테리어": "Interior",
  "방수": "Waterproofing",
};

const EXT_BY_MIME = {
  "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
  "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
};

/** 노션은 100건씩 끊어준다. 기존 getProjects() 는 이 루프가 없어 101번째부터 조용히 사라진다. */
async function fetchAllPages() {
  const pages = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      sorts: [{ property: "ID", direction: "ascending" }],
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

function fileUrl(prop) {
  const f = prop?.files?.[0];
  if (!f) return null;
  return f.type === "file" ? f.file.url : f.external?.url ?? null;
}

/** 노션 서명 URL은 1시간이면 만료된다. 403 이면 해당 페이지만 다시 조회해 갱신한다. */
async function downloadWithRefresh(url, pageId, resolve) {
  let res = await fetch(url);
  if (res.status === 403) {
    const fresh = await notion.pages.retrieve({ page_id: pageId });
    const newUrl = resolve(fresh.properties);
    if (!newUrl) throw new Error("이미지 URL 갱신 실패");
    res = await fetch(newUrl);
  }
  if (!res.ok) throw new Error(`다운로드 실패 ${res.status}`);
  const mime = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  return { buf: Buffer.from(await res.arrayBuffer()), mime };
}

async function upload(objectPath, buf, mime) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buf, { contentType: mime, upsert: true });
  if (error) throw new Error(`업로드 실패 ${objectPath}: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

async function migrateImage(url, pageId, resolve, id, name) {
  if (!url) return null;
  try {
    const { buf, mime } = await downloadWithRefresh(url, pageId, resolve);
    const ext = EXT_BY_MIME[mime] ?? "jpg";
    return await upload(`projects/${id}/${name}.${ext}`, buf, mime);
  } catch (e) {
    console.warn(`  ⚠️ 이미지 건너뜀 (${name}): ${e.message}`);
    return null;
  }
}

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function main() {
  console.log("노션에서 데이터를 읽는 중...");
  const pages = await fetchAllPages();
  console.log(`  ${pages.length}건 조회됨\n`);

  await fs.mkdir("backup", { recursive: true });
  const snapshotPath = path.join(
    "backup", `notion-snapshot-${new Date().toISOString().slice(0, 10)}.json`,
  );
  await fs.writeFile(snapshotPath, JSON.stringify(pages, null, 2));
  console.log(`스냅샷 저장: ${snapshotPath}\n`);

  const rows = [];
  const descriptionChanges = [];

  for (const page of pages) {
    const p = page.properties;
    const id = p.ID?.number;
    if (!Number.isInteger(id)) {
      console.warn(`  ⚠️ ID 없는 페이지 건너뜀: ${page.id}`);
      continue;
    }

    const title = p.Name?.title?.[0]?.plain_text ?? "제목 없음";
    console.log(`[${id}] ${title}`);

    const typeKr = p.Type?.select?.name ?? "기타";

    // 핵심: [0] 이 아니라 join. 기존 코드는 첫 청크만 읽어
    // 2000자 넘는 설명이 이미 잘린 채 서비스되고 있었다.
    const chunks = p.Description?.rich_text ?? [];
    const fullDescription = chunks.map((t) => t.plain_text).join("");
    const oldDescription = chunks[0]?.plain_text ?? "";
    if (fullDescription !== oldDescription) {
      descriptionChanges.push({ id, title, oldLen: oldDescription.length, newLen: fullDescription.length });
    }

    const image = await migrateImage(
      fileUrl(p.Image), page.id, (pp) => fileUrl(pp.Image), id, "main");

    const galleryUrls = (p.Images?.files ?? []).map((f) =>
      f.type === "file" ? f.file.url : f.external?.url);
    const images = [];
    for (const [i, url] of galleryUrls.entries()) {
      const up = await migrateImage(
        url, page.id, (pp) => (pp.Images?.files?.[i]?.file?.url ?? pp.Images?.files?.[i]?.external?.url),
        id, `gallery-${i}`);
      if (up) images.push(up);
    }

    const beforeImage = await migrateImage(
      fileUrl(p.BeforeImage), page.id, (pp) => fileUrl(pp.BeforeImage), id, "before");
    const afterImage = await migrateImage(
      fileUrl(p.AfterImage), page.id, (pp) => fileUrl(pp.AfterImage), id, "after");

    const year = p.Year?.rich_text?.[0]?.plain_text ?? "";

    rows.push({
      id,
      status: "published",
      type: TYPE_MAP[typeKr] ?? "Etc",
      type_kr: typeKr, // 노션 원문 그대로. SERVICES[].name 으로 바꾸면 안 된다.
      title,
      description: fullDescription,
      // 현재 ProjectDetail 이 렌더링하는 모습(\n\n → <p>)과 동일하게 만들어
      // 이전된 글의 외형을 보존한다.
      content_html: fullDescription
        ? fullDescription.split(/\n{2,}/).map((x) => `<p>${escapeHtml(x.trim())}</p>`).join("")
        : "",
      year,
      location: p.Location?.rich_text?.[0]?.plain_text ?? "",
      image,
      images,
      before_image: beforeImage,
      after_image: afterImage,
      published_at: year ? `${year}-01-01T00:00:00Z` : new Date().toISOString(),
    });
  }

  if (descriptionChanges.length && !confirmDescriptionChanges) {
    console.log("\n⚠️  설명이 잘려 있던 글이 있습니다. 이전하면 meta description 이 바뀝니다:\n");
    for (const c of descriptionChanges) {
      console.log(`   [${c.id}] ${c.title}`);
      console.log(`        현재 ${c.oldLen}자 → 복구 후 ${c.newLen}자`);
    }
    console.log("\n대부분은 155자로 잘려 나가므로 실제 표시는 같을 가능성이 높습니다.");
    console.log("확인하셨으면 --confirm-description-changes 를 붙여 다시 실행해주세요.\n");
    process.exit(2);
  }

  console.log(`\nSupabase 에 ${rows.length}건 저장 중...`);
  const { error } = await supabase.from("projects").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("저장 실패:", error.message);
    process.exit(1);
  }

  const maxId = Math.max(...rows.map((r) => r.id), 0);
  console.log(`완료. 새 글은 ${maxId + 1}번부터 부여됩니다.`);
  console.log(`\n⚠️ Supabase SQL Editor 에서 아래를 한 번 실행해주세요:`);
  console.log(`   select setval('public.projects_id_seq', ${maxId});\n`);
  console.log(`이어서 검증: node --env-file=.env scripts/verify-migration.mjs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
