import type { APIRoute } from "astro";
import { serverClient } from "../../../../lib/supabase";
import { sanitizeContentHtml, stripHtml } from "../../../../lib/sanitize";
import { isSameOrigin, SESSION_COOKIE, verifySessionToken } from "../../../../lib/auth";

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/** 미들웨어와 별개로 한 번 더 검증한다. UI 숨김은 인증이 아니다. */
async function guard(request: Request, cookies: any, site: URL | undefined) {
  if (!(await verifySessionToken(cookies.get(SESSION_COOKIE)?.value))) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "invalid_content_type" }, 415);
  }
  if (site && !isSameOrigin(request, site.toString())) {
    return json({ error: "bad_origin" }, 403);
  }
  return null;
}

const VALID_TYPES = [
  "Extension", "NewBuild", "Repair", "Interior", "Waterproofing", "Etc",
];

/** 요청 본문 → DB 행. 새니타이즈는 반드시 서버(여기)에서 한다. */
export function buildRow(input: any) {
  const contentHtml = sanitizeContentHtml(String(input.contentHtml ?? ""));
  // 사장님이 요약을 비워두면 본문에서 뽑아 쓴다.
  // meta description 이 비면 검색결과 스니펫이 엉뚱하게 잡힌다.
  const description =
    String(input.description ?? "").trim() ||
    stripHtml(contentHtml).slice(0, 155);

  return {
    title: String(input.title ?? "").trim(),
    type: VALID_TYPES.includes(input.type) ? input.type : "Etc",
    type_kr: String(input.typeKr ?? "기타").trim(),
    description,
    content_html: contentHtml,
    year: String(input.year ?? "").trim(),
    location: String(input.location ?? "").trim(),
    image: input.image || null,
    images: Array.isArray(input.images) ? input.images.filter(Boolean) : [],
    before_image: input.beforeImage || null,
    after_image: input.afterImage || null,
    status: input.status === "published" ? "published" : "draft",
    published_at: input.status === "published" ? new Date().toISOString() : null,
  };
}

export const POST: APIRoute = async ({ request, cookies, site }) => {
  const denied = await guard(request, cookies, site);
  if (denied) return denied;

  let input: any;
  try {
    input = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const row = buildRow(input);
  if (!row.title) return json({ error: "title_required" }, 400);

  // id 는 지정하지 않는다. 시퀀스가 기존 최대값 다음 번호를 준다.
  const { data, error } = await serverClient()
    .from("projects")
    .insert(row)
    .select("id")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, id: data.id }, 201);
};
