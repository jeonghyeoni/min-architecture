import type { APIRoute } from "astro";
import { serverClient } from "../../../../lib/supabase";
import { isSameOrigin, SESSION_COOKIE, verifySessionToken } from "../../../../lib/auth";
import { buildRow } from "./index";

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

async function guard(request: Request, cookies: any, site: URL | undefined) {
  if (!(await verifySessionToken(cookies.get(SESSION_COOKIE)?.value))) {
    return json({ error: "unauthorized" }, 401);
  }
  if (site && !isSameOrigin(request, site.toString())) {
    return json({ error: "bad_origin" }, 403);
  }
  return null;
}

export const PUT: APIRoute = async ({ request, cookies, params, site }) => {
  const denied = await guard(request, cookies, site);
  if (denied) return denied;
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "invalid_content_type" }, 415);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ error: "invalid_id" }, 400);

  let input: any;
  try {
    input = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const row = buildRow(input);
  if (!row.title) return json({ error: "title_required" }, 400);

  // 이미 발행된 글을 수정할 때 published_at 을 덮어쓰지 않는다.
  // 최초 발행 시각이 바뀌면 Article 스키마의 datePublished 가 흔들린다.
  const patch: Record<string, unknown> = { ...row };
  if (row.status === "published") {
    const { data: existing } = await serverClient()
      .from("projects")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (existing?.published_at) patch.published_at = existing.published_at;
  }

  const { error } = await serverClient()
    .from("projects")
    .update(patch)
    .eq("id", id);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, id }, 200);
};

export const DELETE: APIRoute = async ({ request, cookies, params, site }) => {
  const denied = await guard(request, cookies, site);
  if (denied) return denied;

  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ error: "invalid_id" }, 400);

  const { error } = await serverClient().from("projects").delete().eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true }, 200);
};
