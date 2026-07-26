import type { APIRoute } from "astro";
import { VERCEL_DEPLOY_HOOK_URL } from "astro:env/server";
import { isSameOrigin, SESSION_COOKIE, verifySessionToken } from "../../../lib/auth";

export const prerender = false;

/**
 * 사이트 재배포 트리거.
 *
 * VERCEL_DEPLOY_HOOK_URL 은 서버 전용 비밀이다. 이 URL 이 브라우저로 나가면
 * 누구나 빌드를 무한히 유발할 수 있으므로, 반드시 서버에서만 호출하고
 * 응답에도 절대 포함시키지 않는다.
 */
export const POST: APIRoute = async ({ request, cookies, site }) => {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  if (!(await verifySessionToken(cookies.get(SESSION_COOKIE)?.value))) {
    return json({ error: "unauthorized" }, 401);
  }
  if (site && !isSameOrigin(request, site.toString())) {
    return json({ error: "bad_origin" }, 403);
  }
  if (!VERCEL_DEPLOY_HOOK_URL) {
    return json({ error: "deploy_hook_not_configured" }, 503);
  }

  const res = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: "POST" });
  if (!res.ok) return json({ error: "deploy_hook_failed" }, 502);

  return json({ ok: true }, 200);
};
