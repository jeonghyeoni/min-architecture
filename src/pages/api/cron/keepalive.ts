import type { APIRoute } from "astro";
import { CRON_SECRET } from "astro:env/server";
import { json } from "../../../lib/apiGuard";
import { publicClient } from "../../../lib/supabase";

export const prerender = false;

/**
 * Supabase 무료 플랜 자동 일시정지 방지용 핑.
 *
 * 무료 플랜은 7일 동안 DB 활동이 없으면 프로젝트를 멈춘다.
 * 공개 페이지는 빌드 때만 DB 를 읽으므로 글을 한동안 안 올리면 요청이 0 이 된다.
 * vercel.json 의 크론이 하루 한 번 이 라우트를 불러 가벼운 읽기를 한 번 일으킨다.
 *
 * Vercel Cron 은 환경변수 CRON_SECRET 이 있으면 "Authorization: Bearer <값>" 을
 * 자동으로 붙여 보낸다. 값이 없거나 다르면 거절해 외부에서 마구 부르지 못하게 한다.
 */
export const GET: APIRoute = async ({ request }) => {
  if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return json({ error: "unauthorized" }, 401);
  }

  // anon 키 + RLS 라 published 행만 보인다. 서비스 키는 쓸 이유가 없다.
  const { error } = await publicClient().from("projects").select("id").limit(1);
  if (error) {
    console.error("[keepalive] supabase error:", error.message);
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true, at: new Date().toISOString() }, 200);
};
