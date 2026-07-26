import type { APIRoute } from "astro";
import { serverClient } from "../../../../lib/supabase";
import { buildRow } from "../../../../lib/postInput";
import { guard, json } from "../../../../lib/apiGuard";

export const prerender = false;

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  try {
    const denied = await guard(request, cookies);
    if (denied) return denied;

    const id = Number(params.id);
    if (!Number.isInteger(id)) return json({ error: "잘못된 글 번호입니다." }, 400);

    let input: any;
    try {
      input = await request.json();
    } catch {
      return json({ error: "요청 본문을 읽지 못했습니다." }, 400);
    }

    const row = buildRow(input);
    if (!row.title) return json({ error: "제목을 입력해주세요." }, 400);

    const supabase = serverClient();

    // 이미 발행된 글을 수정할 때 최초 발행 시각을 덮어쓰지 않는다.
    // 바뀌면 Article 스키마의 datePublished 가 흔들린다.
    const patch: Record<string, unknown> = { ...row };
    if (row.status === "published") {
      const { data: existing } = await supabase
        .from("projects")
        .select("published_at")
        .eq("id", id)
        .maybeSingle();
      if (existing?.published_at) patch.published_at = existing.published_at;
    }

    const { data, error } = await supabase
      .from("projects")
      .update(patch)
      .eq("id", id)
      .select("id");

    if (error) return json({ error: `저장 실패: ${error.message}` }, 500);
    if (!data?.length) return json({ error: "해당 글을 찾지 못했습니다." }, 404);

    return json({ ok: true, id }, 200);
  } catch (e: any) {
    return json({ error: `서버 오류: ${e?.message ?? e}` }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  try {
    const denied = await guard(request, cookies, { requireJson: false });
    if (denied) return denied;

    const id = Number(params.id);
    if (!Number.isInteger(id)) return json({ error: "잘못된 글 번호입니다." }, 400);

    const { error } = await serverClient().from("projects").delete().eq("id", id);
    if (error) return json({ error: `삭제 실패: ${error.message}` }, 500);
    return json({ ok: true }, 200);
  } catch (e: any) {
    return json({ error: `서버 오류: ${e?.message ?? e}` }, 500);
  }
};
