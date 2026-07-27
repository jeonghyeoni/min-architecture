import type { APIRoute } from "astro";
import { guard, json } from "../../../lib/apiGuard";

export const prerender = false;

/**
 * 저장이 실패할 때 원인을 한 번에 짚기 위한 진단 엔드포인트.
 *
 * 로그인한 사람만 볼 수 있고, 비밀값은 절대 그대로 내보내지 않는다.
 * "설정되어 있는가", "길이가 그럴듯한가", "실제로 연결되는가" 만 확인한다.
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  const report: Record<string, unknown> = {};

  try {
    const denied = await guard(request, cookies, { requireJson: false });
    if (denied) return denied;
  } catch (e: any) {
    return json({ stage: "guard", error: String(e?.message ?? e) }, 500);
  }

  // 1. 환경변수가 꽂혀 있는가 (값은 노출하지 않는다)
  try {
    const env = await import("astro:env/server");
    const check = (name: string, v: unknown) => ({
      설정됨: Boolean(v),
      길이: typeof v === "string" ? v.length : 0,
      // 키를 바꿔 넣은 실수를 잡기 위한 최소한의 단서
      앞부분: typeof v === "string" ? v.slice(0, 6) : null,
    });
    report.환경변수 = {
      SUPABASE_URL: check("SUPABASE_URL", (env as any).SUPABASE_URL),
      SUPABASE_ANON_KEY: check("SUPABASE_ANON_KEY", (env as any).SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: check(
        "SUPABASE_SERVICE_ROLE_KEY",
        (env as any).SUPABASE_SERVICE_ROLE_KEY,
      ),
      ADMIN_PASSWORD_HASH: check("ADMIN_PASSWORD_HASH", (env as any).ADMIN_PASSWORD_HASH),
      ADMIN_SESSION_SECRET: check("ADMIN_SESSION_SECRET", (env as any).ADMIN_SESSION_SECRET),
      VERCEL_DEPLOY_HOOK_URL: check(
        "VERCEL_DEPLOY_HOOK_URL",
        (env as any).VERCEL_DEPLOY_HOOK_URL,
      ),
    };
  } catch (e: any) {
    report.환경변수 = { 오류: String(e?.message ?? e) };
  }

  // 2. 요청이 도착한 주소 (CSRF 검사가 이 값과 Origin 을 비교한다)
  try {
    report.요청 = {
      요청주소: new URL(request.url).origin,
      Origin헤더: request.headers.get("origin"),
      Referer헤더: request.headers.get("referer"),
    };
  } catch (e: any) {
    report.요청 = { 오류: String(e?.message ?? e) };
  }

  // 3. 서비스 키로 실제 읽기가 되는가 (RLS 우회 확인)
  try {
    const { serverClient } = await import("../../../lib/supabase");
    const { data, error } = await serverClient()
      .from("projects")
      .select("id")
      .limit(1);
    report.DB읽기 = error
      ? { 성공: false, 오류: error.message }
      : { 성공: true, 조회된행: data?.length ?? 0 };
  } catch (e: any) {
    report.DB읽기 = { 성공: false, 오류: String(e?.message ?? e) };
  }

  // 4. 쓰기가 되는가 (임시 행을 넣었다 지운다)
  try {
    const { serverClient } = await import("../../../lib/supabase");
    const supabase = serverClient();
    const probeId = 999999;
    const { error: insErr } = await supabase.from("projects").upsert(
      {
        id: probeId,
        title: "__저장 진단__",
        type: "Etc",
        type_kr: "기타",
        status: "draft",
      },
      { onConflict: "id" },
    );
    if (insErr) {
      report.DB쓰기 = { 성공: false, 오류: insErr.message };
    } else {
      await supabase.from("projects").delete().eq("id", probeId);
      report.DB쓰기 = { 성공: true };
    }
  } catch (e: any) {
    report.DB쓰기 = { 성공: false, 오류: String(e?.message ?? e) };
  }

  // 5. 새니타이즈가 도는가 (sanitize-html 번들 문제 확인)
  try {
    const { sanitizeContentHtml } = await import("../../../lib/sanitize");
    const out = sanitizeContentHtml("<p>테스트</p><script>x</script>");
    report.새니타이즈 = { 성공: true, 결과: out };
  } catch (e: any) {
    report.새니타이즈 = { 성공: false, 오류: String(e?.message ?? e) };
  }

  return json(report, 200);
};
