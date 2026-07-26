import { useState } from "react";

/**
 * 시공 전/후 비교 슬라이더.
 *
 * 본문 안에 여러 개가 들어갈 수 있으므로 각 인스턴스가 자기 상태를 갖는다.
 *
 * ⚠️ 레이어 순서 주의
 * clipPath: inset(0 X% 0 0) 은 **오른쪽에서** X% 를 잘라내므로 덮개 층은
 * 왼쪽에만 남는다. 왼쪽 라벨이 BEFORE 이므로 덮개에 '시공 전' 사진이,
 * 아래 층에 '시공 후' 사진이 와야 라벨과 내용이 맞는다.
 * 이 둘을 바꾸면 BEFORE 자리에 시공 후 사진이 나온다.
 */
interface Props {
  before: string;
  after: string;
  alt?: string;
}

export function BeforeAfterSlider({ before, after, alt = "" }: Props) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden select-none">
      {/* 아래 층 = 시공 후 (오른쪽에 보임) */}
      <div className="absolute inset-0">
        <img
          src={after}
          alt={alt ? `${alt} 시공 후 완성 모습` : "시공 후 완성 모습"}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 덮개 층 = 시공 전 (왼쪽에 보임) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={before}
          alt={alt ? `${alt} 시공 전 모습` : "시공 전 모습"}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 손잡이 */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-0.5 h-4 bg-gray-400" />
            <div className="w-0.5 h-4 bg-gray-400" />
          </div>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={position}
        aria-label="시공 전후 비교 슬라이더"
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
      />

      <div className="absolute top-6 left-6 bg-black/50 text-white px-4 py-2 text-sm backdrop-blur-sm">
        BEFORE
      </div>
      <div className="absolute top-6 right-6 bg-black/50 text-white px-4 py-2 text-sm backdrop-blur-sm">
        AFTER
      </div>
    </div>
  );
}

/** 본문 HTML 안에 심는 표식. 저장 형태와 파싱 규칙을 한 곳에서 관리한다. */
export const BEFORE_AFTER_TAG = "data-before-after";

export interface ContentPart {
  type: "html" | "beforeAfter";
  html?: string;
  before?: string;
  after?: string;
}

/**
 * 본문 HTML 을 일반 HTML 조각과 전후비교 블록으로 쪼갠다.
 *
 * 빌드 시점(Node)에도 돌아야 해서 DOMParser 를 쓸 수 없어 정규식으로 처리한다.
 * sanitize-html 이 속성 순서를 바꿀 수 있으므로 순서에 의존하지 않는다.
 */
export function splitContent(html: string): ContentPart[] {
  if (!html) return [];

  const blockRe = /<div\b[^>]*\bdata-before-after\b[^>]*>\s*<\/div>/gi;
  const parts: ContentPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "html", html: html.slice(lastIndex, match.index) });
    }
    const tag = match[0];
    const before = /\bdata-before="([^"]*)"/i.exec(tag)?.[1];
    const after = /\bdata-after="([^"]*)"/i.exec(tag)?.[1];

    // 두 장이 다 있어야 비교가 성립한다. 하나라도 없으면 통째로 버린다.
    if (before && after) {
      parts.push({ type: "beforeAfter", before, after });
    }
    lastIndex = match.index + tag.length;
  }

  if (lastIndex < html.length) {
    parts.push({ type: "html", html: html.slice(lastIndex) });
  }
  return parts;
}
