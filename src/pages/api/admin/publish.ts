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
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (!(await verifySessionToken(cookies.get(SESSION_COOKIE)?.value))) {
      return json({ error: "로그인이 만료되었습니다. 다시 로그인해주세요." }, 401);
    }
    if (!isSameOrigin(request)) {
      return json({ error: "요청 출처를 확인할 수 없습니다." }, 403);
    }
    if (!VERCEL_DEPLOY_HOOK_URL) {
      return json({ error: "deploy_hook_not_configured" }, 503);
    }

    const res = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: "POST" });
    if (!res.ok) {
      return json({ error: `배포 요청 실패 (${res.status})` }, 502);
    }

    return json({ ok: true }, 200);
  } catch (e: any) {
    return json({ error: `서버 오류: ${e?.message ?? e}` }, 500);
  }
};
