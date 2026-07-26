import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} from "astro:env/server";

/**
 * Supabase 클라이언트는 두 종류로 엄격히 나눈다.
 *
 * - publicClient : anon 키. RLS 가 걸려 있어 status='published' 행만 읽힌다.
 *                  빌드 시 공개 페이지가 쓴다.
 * - serverClient : service_role 키. RLS 를 우회한다. 관리자 API 에서만 쓴다.
 *
 * service_role 키가 클라이언트 번들에 들어가면 데이터베이스 전체가 열린다.
 * 이 파일은 astro:env/server 에서만 값을 읽으므로 브라우저로 넘어갈 수 없고,
 * src/components/react/** 에서는 절대 import 하지 말 것.
 */

let _publicClient: SupabaseClient | null = null;
let _serverClient: SupabaseClient | null = null;

/** 공개 데이터 읽기용. 빌드 중 여러 번 호출되므로 인스턴스를 재사용한다. */
export function publicClient(): SupabaseClient {
  if (!_publicClient) {
    _publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return _publicClient;
}

/** 관리자 쓰기용. RLS 를 우회하므로 반드시 세션 검증 뒤에만 호출한다. */
export function serverClient(): SupabaseClient {
  if (!_serverClient) {
    _serverClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _serverClient;
}

export const IMAGE_BUCKET = "project-images";

/** Storage 오리진. BaseLayout 의 preconnect 와 이미지 URL 검증에 쓴다. */
export function storageOrigin(): string {
  return new URL(SUPABASE_URL).origin;
}
