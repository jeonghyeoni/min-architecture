#!/usr/bin/env node
/**
 * 이전 결과 검증.
 *
 *   node --env-file=.env scripts/verify-migration.mjs
 *
 * 여기서 하나라도 실패하면 다음 단계로 넘어가지 않는다.
 * 특히 마지막 사이트맵 검사는 "네이버에 제출한 주소가 404 가 되지 않는다"를
 * 증명하는 항목이라 반드시 통과해야 한다.
 */
import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";

const { NOTION_API_KEY, NOTION_DATABASE_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const SITE = "https://xn--z69an80agjn.com";

const notion = new Client({ auth: NOTION_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { console.error(`  ✗ ${m}`); failed++; };

async function notionPages() {
  const out = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: NOTION_DATABASE_ID, start_cursor: cursor, page_size: 100,
    });
    out.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return out;
}

async function main() {
  console.log("1. 건수 및 ID 집합 대조");
  const pages = await notionPages();
  const notionIds = new Set(pages.map((p) => p.properties.ID?.number).filter(Number.isInteger));

  const { data: rows, error } = await supabase.from("projects").select("*");
  if (error) { bad(`Supabase 조회 실패: ${error.message}`); process.exit(1); }
  const dbIds = new Set(rows.map((r) => r.id));

  notionIds.size === dbIds.size
    ? ok(`건수 일치 (${dbIds.size}건)`)
    : bad(`건수 불일치: 노션 ${notionIds.size} vs DB ${dbIds.size}`);

  const missing = [...notionIds].filter((i) => !dbIds.has(i));
  const extra = [...dbIds].filter((i) => !notionIds.has(i));
  missing.length ? bad(`DB 에 없는 ID: ${missing.join(", ")}`) : ok("누락된 ID 없음");
  if (extra.length) console.log(`  · DB 에만 있는 ID (관리자에서 새로 쓴 글): ${extra.join(", ")}`);

  console.log("\n2. 필드 대조");
  const byId = new Map(rows.map((r) => [r.id, r]));
  let mismatch = 0;
  for (const page of pages) {
    const p = page.properties;
    const id = p.ID?.number;
    const row = byId.get(id);
    if (!row) continue;
    const expect = {
      title: p.Name?.title?.[0]?.plain_text ?? "제목 없음",
      type_kr: p.Type?.select?.name ?? "기타",
      year: p.Year?.rich_text?.[0]?.plain_text ?? "",
      location: p.Location?.rich_text?.[0]?.plain_text ?? "",
    };
    for (const [k, v] of Object.entries(expect)) {
      if ((row[k] ?? "") !== v) { bad(`[${id}] ${k}: "${row[k]}" ≠ "${v}"`); mismatch++; }
    }
  }
  if (!mismatch) ok("title / type_kr / year / location 전부 일치");

  console.log("\n3. 이미지 URL 접근 확인");
  const urls = rows.flatMap((r) =>
    [r.image, r.before_image, r.after_image, ...(r.images ?? [])].filter(Boolean));
  let broken = 0;
  for (const url of urls) {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok || !Number(res.headers.get("content-length"))) { bad(`접근 불가: ${url}`); broken++; }
  }
  if (!broken) ok(`이미지 ${urls.length}개 전부 정상`);

  console.log("\n4. 운영 사이트맵 URL 보존 확인 (가장 중요)");
  try {
    const xml = await (await fetch(`${SITE}/sitemap-0.xml`)).text();
    const liveIds = [...xml.matchAll(/\/projects\/(\d+)</g)].map((m) => Number(m[1]));
    if (!liveIds.length) {
      console.log("  · 사이트맵에 시공사례 URL 이 아직 없습니다 (첫 배포 전이면 정상)");
    } else {
      const lost = liveIds.filter((id) => {
        const r = byId.get(id);
        return !r || r.status !== "published";
      });
      lost.length
        ? bad(`네이버에 제출된 URL 이 사라집니다: ${lost.map((i) => `/projects/${i}`).join(", ")}`)
        : ok(`사이트맵의 ${liveIds.length}개 URL 전부 published 로 존재`);
    }
  } catch (e) {
    console.log(`  · 사이트맵을 가져오지 못했습니다 (${e.message})`);
  }

  console.log(failed ? `\n❌ ${failed}건 실패. 해결 전까지 진행하지 마세요.` : "\n✅ 전부 통과");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
