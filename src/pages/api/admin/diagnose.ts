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
      present: Boolean(v),
      length: typeof v === "string" ? v.length : 0,
      // 키를 바꿔 넣은 실수를 잡기 위한 최소한의 단서
      prefix: typeof v === "string" ? v.slice(0, 6) : null,
    });
    report.env = {
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
    report.env = { error: String(e?.message ?? e) };
  }

  // 2. 요청이 도착한 주소 (CSRF 검사가 이 값과 Origin 을 비교한다)
  try {
    report.request = {
      self_origin: new URL(request.url).origin,
      origin_header: request.headers.get("origin"),
      referer_header: request.headers.get("referer"),
    };
  } catch (e: any) {
    report.request = { error: String(e?.message ?? e) };
  }

  // 3. 서비스 키로 실제 읽기가 되는가 (RLS 우회 확인)
  try {
    const { serverClient } = await import("../../../lib/supabase");
    const { data, error } = await serverClient()
      .from("projects")
      .select("id")
      .limit(1);
    report.db_read = error
      ? { ok: false, error: error.message }
      : { ok: true, rows: data?.length ?? 0 };
  } catch (e: any) {
    report.db_read = { ok: false, error: String(e?.message ?? e) };
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
      report.db_write = { ok: false, error: insErr.message };
    } else {
      await supabase.from("projects").delete().eq("id", probeId);
      report.db_write = { ok: true };
    }
  } catch (e: any) {
    report.db_write = { ok: false, error: String(e?.message ?? e) };
  }

  // 5. 새니타이즈가 도는가 (sanitize-html 번들 문제 확인)
  try {
    const { sanitizeContentHtml } = await import("../../../lib/sanitize");
    const out = sanitizeContentHtml("<p>테스트</p><script>x</script>");
    report.sanitize = { ok: true, result: out };
  } catch (e: any) {
    report.sanitize = { ok: false, error: String(e?.message ?? e) };
  }

  return json(report, 200);
};
