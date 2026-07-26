import { scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET } from "astro:env/server";

/**
 * 관리자 인증.
 *
 * 비밀번호 하나로 로그인하지만, 순진하게 만들면 뚫리는 지점이 정해져 있다.
 *  - 비밀번호를 평문으로 두지 않는다 (scrypt 해시)
 *  - 문자열 비교에 === 를 쓰지 않는다 (짧은 회로 평가로 타이밍이 샌다)
 *  - 세션 쿠키에 서명을 한다 (없으면 쿠키 위조로 그냥 통과된다)
 */

export const SESSION_COOKIE = "mg_admin";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일
const SCRYPT_KEYLEN = 64;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(ADMIN_SESSION_SECRET);
}

/**
 * scripts/hash-password.mjs 가 만든 "salt:hash" 형식과 대조한다.
 * 반드시 timingSafeEqual 을 쓴다.
 */
export function verifyPassword(input: string): boolean {
  const [saltHex, expectedHex] = (ADMIN_PASSWORD_HASH ?? "").split(":");
  if (!saltHex || !expectedHex) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== SCRYPT_KEYLEN) return false;

  const actual = scryptSync(input, Buffer.from(saltHex, "hex"), SCRYPT_KEYLEN);
  return timingSafeEqual(actual, expected);
}

/** 해시 생성. scripts/hash-password.mjs 에서만 쓴다. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function createSessionToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** 서명·만료·alg 를 모두 검증한다. jose 가 alg:none 공격도 막아준다. */
export async function verifySessionToken(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true, // XSS 가 세션을 훔쳐가지 못하게 한다
  secure: true,
  sameSite: "lax" as const, // strict 로 하면 외부 링크로 들어올 때 로그아웃된 것처럼 보인다
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/**
 * 변경 요청의 Origin 검사. SameSite=Lax 가 못 막는 구멍을 메운다.
 * 폼 인코딩 요청은 아예 받지 않으므로 여기서는 Origin 만 본다.
 */
export function isSameOrigin(request: Request, siteUrl: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}
