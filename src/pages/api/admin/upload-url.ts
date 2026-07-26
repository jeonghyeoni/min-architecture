import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { IMAGE_BUCKET, serverClient } from "../../../lib/supabase";
import { guard, json } from "../../../lib/apiGuard";

export const prerender = false;

/**
 * 서명된 업로드 URL 발급.
 *
 * 파일을 이 함수로 통과시키지 않는 것이 핵심이다.
 * Vercel 서버리스 함수는 요청 본문이 4.5MB 로 제한되는데 폰 사진은 그보다 크다.
 * 브라우저가 Storage 로 직접 PUT 하게 하면 그 제한과 무관해진다.
 */

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const denied = await guard(request, cookies);
    if (denied) return denied;

    let input: any;
    try {
      input = await request.json();
    } catch {
      return json({ error: "요청 본문을 읽지 못했습니다." }, 400);
    }

    const ext = EXT_BY_TYPE[input?.contentType];
    if (!ext) {
      return json({ error: "지원하지 않는 이미지 형식입니다. (jpg, png, webp, gif)" }, 400);
    }

    // 아직 id 가 없는 새 글은 drafts/ 아래에 올린다.
    const scope = Number.isInteger(Number(input.projectId))
      ? `projects/${Number(input.projectId)}`
      : `drafts/${new Date().toISOString().slice(0, 10)}`;
    const path = `${scope}/${randomUUID()}.${ext}`;

    const supabase = serverClient();
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUploadUrl(path);

    if (error) return json({ error: `업로드 준비 실패: ${error.message}` }, 500);

    const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

    return json(
      { signedUrl: data.signedUrl, token: data.token, path, publicUrl: pub.publicUrl },
      200,
    );
  } catch (e: any) {
    return json({ error: `서버 오류: ${e?.message ?? e}` }, 500);
  }
};
