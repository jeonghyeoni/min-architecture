import type { APIRoute } from "astro";
import { serverClient } from "../../../../lib/supabase";
import { buildRow } from "../../../../lib/postInput";
import { isSameOrigin, SESSION_COOKIE, verifySessionToken } from "../../../../lib/auth";

export const prerender = false;

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
  { requireJson = true } = {},
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

export const POST: APIRoute = async ({ request, cookies }) => {
  // 어떤 예외가 나도 JSON 으로 돌려준다. HTML 오류 페이지가 가면
  // 화면에는 원인을 알 수 없는 "저장 실패" 만 뜬다.
  try {
    const denied = await guard(request, cookies);
    if (denied) return denied;

    let input: any;
    try {
      input = await request.json();
    } catch {
      return json({ error: "요청 본문을 읽지 못했습니다." }, 400);
    }

    const row = buildRow(input);
    if (!row.title) return json({ error: "제목을 입력해주세요." }, 400);

    // id 는 지정하지 않는다. 시퀀스가 기존 최대값 다음 번호를 준다.
    const { data, error } = await serverClient()
      .from("projects")
      .insert(row)
      .select("id")
      .single();

    if (error) return json({ error: `저장 실패: ${error.message}` }, 500);
    return json({ ok: true, id: data.id }, 201);
  } catch (e: any) {
    return json({ error: `서버 오류: ${e?.message ?? e}` }, 500);
  }
};
