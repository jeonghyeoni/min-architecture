import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { IMAGE_BUCKET, serverClient } from "../../../lib/supabase";
import { isSameOrigin, SESSION_COOKIE, verifySessionToken } from "../../../lib/auth";

export const prerender = false;

/**
 * 서명된 업로드 URL 발급.
 *
 * 파일을 이 함수로 통과시키지 않는 것이 핵심이다.
 * Vercel 서버리스 함수는 요청 본문이 4.5MB 로 제한되는데 폰 사진은 그보다 크다.
 * 브라우저가 Storage 로 직접 PUT 하게 하면 그 제한과 무관해진다.
 */

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const POST: APIRoute = async ({ request, cookies, site }) => {
  if (!(await verifySessionToken(cookies.get(SESSION_COOKIE)?.value))) {
    return json({ error: "unauthorized" }, 401);
  }
  if (site && !isSameOrigin(request, site.toString())) {
    return json({ error: "bad_origin" }, 403);
  }

  let input: any;
  try {
    input = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const ext = EXT_BY_TYPE[input.contentType];
  if (!ext) return json({ error: "unsupported_type" }, 400);

  // 아직 id 가 없는 새 글은 drafts/ 아래에 올린다.
  const scope = Number.isInteger(Number(input.projectId))
    ? `projects/${Number(input.projectId)}`
    : `drafts/${new Date().toISOString().slice(0, 10)}`;
  const path = `${scope}/${randomUUID()}.${ext}`;

  const supabase = serverClient();
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error) return json({ error: error.message }, 500);

  const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

  return json(
    { signedUrl: data.signedUrl, token: data.token, path, publicUrl: pub.publicUrl },
    200,
  );
};
