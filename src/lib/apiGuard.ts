import { isSameOrigin, SESSION_COOKIE, verifySessionToken } from "./auth";

/**
 * 관리자 API 공통 응답·검증.
 *
 * 이 함수들이 라우트 파일(예: api/admin/projects/index.ts) 안에 있으면
 * 다른 라우트가 그걸 import 하게 되는데, 라우트끼리의 import 는 번들링 과정에서
 * 모듈이 로드되지 못해 **본문 없는 500** 을 내는 원인이 된다.
 * (핸들러 안의 try/catch 는 모듈 로드 실패를 잡을 수 없다)
 * 그래서 공용 로직은 반드시 lib 에 둔다.
 */

export const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * 미들웨어와 별개로 한 번 더 검증한다. UI 숨김은 인증이 아니다.
 * 통과하면 null, 막히면 응답을 돌려준다.
 */
export async function guard(
  request: Request,
  cookies: any,
  { requireJson = true }: { requireJson?: boolean } = {},
): Promise<Response | null> {
  if (!(await verifySessionToken(cookies.get(SESSION_COOKIE)?.value))) {
    return json({ error: "로그인이 만료되었습니다. 다시 로그인해주세요." }, 401);
  }
  if (!isSameOrigin(request)) {
    return json({ error: "요청 출처를 확인할 수 없습니다." }, 403);
  }
  if (requireJson && !request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "잘못된 요청 형식입니다." }, 415);
  }
  return null;
}
