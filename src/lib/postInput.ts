import { sanitizeContentHtml, stripHtml } from "./sanitize";

/**
 * 관리자 폼 입력 → DB 행.
 *
 * 이 함수는 원래 /api/admin/projects/index.ts 안에 있었고 [id].ts 가 거기서
 * import 해 썼다. 라우트 파일끼리 import 하는 구조는 번들링 방식에 따라
 * 런타임에 깨질 수 있어 공용 모듈로 분리했다.
 */

export const VALID_TYPES = [
  "Extension", "NewBuild", "Repair", "Interior", "Waterproofing", "Etc",
] as const;

export interface PostRow {
  title: string;
  type: string;
  type_kr: string;
  description: string;
  content_html: string;
  year: string;
  location: string;
  image: string | null;
  images: string[];
  before_image: string | null;
  after_image: string | null;
  status: "draft" | "published";
  published_at: string | null;
}

export function buildRow(input: any): PostRow {
  // 새니타이즈는 반드시 서버에서 한다. 본문은 공개 페이지에 그대로 렌더링된다.
  const contentHtml = sanitizeContentHtml(String(input?.contentHtml ?? ""));

  // 요약을 비워두면 본문에서 뽑아 쓴다.
  // meta description 이 비면 검색결과 스니펫이 엉뚱하게 잡힌다.
  const description =
    String(input?.description ?? "").trim() ||
    stripHtml(contentHtml).slice(0, 155);

  const status = input?.status === "published" ? "published" : "draft";

  return {
    title: String(input?.title ?? "").trim(),
    type: VALID_TYPES.includes(input?.type) ? input.type : "Etc",
    type_kr: String(input?.typeKr ?? "기타").trim() || "기타",
    description,
    content_html: contentHtml,
    year: String(input?.year ?? "").trim(),
    location: String(input?.location ?? "").trim(),
    image: input?.image || null,
    images: Array.isArray(input?.images) ? input.images.filter(Boolean) : [],
    before_image: input?.beforeImage || null,
    after_image: input?.afterImage || null,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  };
}
