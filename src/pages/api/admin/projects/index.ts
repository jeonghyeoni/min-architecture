import type { APIRoute } from "astro";
import { serverClient } from "../../../../lib/supabase";
import { buildRow } from "../../../../lib/postInput";
import { guard, json } from "../../../../lib/apiGuard";

export const prerender = false;

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
