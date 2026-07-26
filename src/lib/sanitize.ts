import sanitizeHtml from "sanitize-html";
import { storageOrigin } from "./supabase";

/**
 * 본문 HTML 새니타이즈.
 *
 * 작성자가 사장님 한 분뿐이라도 이건 생략할 수 없다. 본문은 **공개·색인되는
 * 페이지에 그대로 렌더링**되므로, 네이버 블로그에서 복사해 온 조각에 섞인
 * onerror= 나 <script> 가 방문자 브라우저에서 실행될 수 있다.
 *
 * 저장할 때(서버)와 렌더링할 때 두 번 통과시킨다.
 */

const ALLOWED_TAGS = [
  "p", "br", "hr",
  "h2", "h3", "h4",
  "strong", "em", "u", "s",
  "ul", "ol", "li",
  "blockquote",
  "a", "img",
  "figure", "figcaption",
  // 시공 전/후 비교 블록. 내용은 없고 속성으로만 두 사진 주소를 담는다.
  "div",
];

export function sanitizeContentHtml(dirty: string): string {
  const origin = storageOrigin();

  return sanitizeHtml(dirty ?? "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      // BeforeAfterNode 의 저장 형태. splitContent 가 이 속성으로 파싱한다.
      div: ["data-before-after", "data-before", "data-after"],
      // 정렬은 문단 단위 style 로 저장된다. 값은 아래 allowedStyles 로 제한한다.
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
    },
    allowedStyles: {
      "*": { "text-align": [/^(left|center|right|justify)$/] },
    },
    // https 만 허용. javascript:, data: 스킴을 원천 차단한다.
    allowedSchemes: ["https"],
    allowedSchemesByTag: { img: ["https"] },
    transformTags: {
      // 외부 링크는 새 창 + 크롤러에 신뢰를 넘기지 않도록 nofollow
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "nofollow noopener noreferrer",
        },
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
    exclusiveFilter: (frame) => {
      // 우리 Storage 가 아닌 곳의 이미지는 통째로 제거한다.
      // 외부 이미지는 언제든 사라지거나 추적 픽셀로 쓰일 수 있다.
      if (frame.tag === "img") {
        const src = frame.attribs.src ?? "";
        return !src.startsWith(origin);
      }
      if (frame.tag === "div") {
        // 전후비교 블록이 아닌 div 는 남길 이유가 없다.
        if (!("data-before-after" in frame.attribs)) return true;
        const before = frame.attribs["data-before"] ?? "";
        const after = frame.attribs["data-after"] ?? "";
        // 두 장 다 우리 Storage 주소여야 한다. 아니면 블록째 버린다.
        return !before.startsWith(origin) || !after.startsWith(origin);
      }
      return false;
    },
  });
}

/**
 * HTML 에서 평문만 뽑는다.
 * 사장님이 요약을 비워둔 채 발행했을 때 meta description 폴백으로 쓴다.
 */
export function stripHtml(html: string): string {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
