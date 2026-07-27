import { defineMiddleware } from "astro:middleware";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";
import { json } from "./lib/apiGuard";

/**
 * 관리자 영역 보호.
 *
 * 여기서 막는다고 해서 각 API 핸들러의 검증을 생략하면 안 된다.
 * 미들웨어는 1차 방어선이고, 변경 라우트는 독립적으로 다시 확인한다.
 */

const LOGIN_PAGE = "/admin/login";
const PUBLIC_ADMIN_PATHS = new Set([LOGIN_PAGE, "/api/admin/login"]);

function isGuarded(pathname: string): boolean {
  return pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/");
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!isGuarded(pathname)) return next();

  // 관리자 영역은 어떤 응답이든 검색엔진에 남으면 안 된다.
  const markNoIndex = (response: Response) => {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  };

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return markNoIndex(await next());
  }

  const authed = await verifySessionToken(
    context.cookies.get(SESSION_COOKIE)?.value,
  );

  if (!authed) {
    // API 는 리다이렉트를 받으면 HTML 을 JSON 으로 파싱하려다 이상하게 깨진다.
    // 화면 요청과 API 요청을 구분해서 응답한다.
    if (pathname.startsWith("/api/")) {
      return markNoIndex(json({ error: "로그인이 만료되었습니다. 다시 로그인해주세요." }, 401));
    }
    const next = encodeURIComponent(pathname + context.url.search);
    return markNoIndex(context.redirect(`${LOGIN_PAGE}?next=${next}`, 302));
  }

  return markNoIndex(await next());
});
