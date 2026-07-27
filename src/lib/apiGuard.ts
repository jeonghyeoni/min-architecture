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

/**
 * JSON 응답.
 *
 * ⚠️ 본문을 문자열이 아니라 **UTF-8 바이트로 직접 인코딩**해서 넘긴다.
 *
 * 문자열을 그대로 넘기면 런타임이 Content-Length 를 글자 수로 잡는 경우가 있는데,
 * 한글은 한 글자가 3바이트라 실제 본문보다 길이가 짧게 선언된다.
 * 그러면 본문이 중간에서 잘려 브라우저에서 "뷁궯뛻" 같은 깨진 문자가 나오거나
 * JSON 파싱이 실패해 응답이 비어 보인다.
 * 성공 응답({"ok":true})은 전부 ASCII 라 멀쩡한데 한글 오류 메시지만
 * 깨지는 탓에, 정작 원인을 알려주는 메시지가 사라지는 최악의 조합이 된다.
 *
 * charset 도 반드시 명시한다.
 */
export const json = (body: unknown, status: number) => {
  const bytes = new TextEncoder().encode(JSON.stringify(body));
  return new Response(bytes, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-length": String(bytes.byteLength),
    },
  });
};

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
