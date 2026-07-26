import type { APIRoute } from "astro";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "../../../lib/auth";

export const prerender = false;

/**
 * 무차별 대입 방어.
 *
 * 비밀번호 하나에 엔드포인트 하나뿐이라 시도 제한이 없으면 시간문제로 뚫린다.
 * 서버리스 인스턴스마다 메모리가 따로 놀아 완벽하진 않지만, 실제 공격의
 * 속도를 크게 떨어뜨린다. 더 엄격히 막으려면 Vercel Firewall 의
 * /api/admin/login 속도 제한 규칙을 함께 건다.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; firstAt: number }>();

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isLocked(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: Date.now() });
    return;
  }
  entry.count += 1;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const POST: APIRoute = async ({ request, cookies }) => {
  // 폼 인코딩은 받지 않는다. JSON 만 받으면 교차 출처 요청에 프리플라이트가
  // 걸려 SameSite=Lax 가 못 막는 CSRF 경로가 닫힌다.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "invalid_content_type" }, 415);
  }

  const ip = clientIp(request);
  if (isLocked(ip)) return json({ error: "locked" }, 429);

  let password = "";
  try {
    password = String(((await request.json()) as any)?.password ?? "");
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  if (!password || !verifyPassword(password)) {
    recordFailure(ip);
    // 자동화 도구의 시도 속도를 늦춘다.
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: "invalid_credentials" }, 401);
  }

  attempts.delete(ip);
  cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  return json({ ok: true }, 200);
};
