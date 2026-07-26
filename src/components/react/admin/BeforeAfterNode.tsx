import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useRef, useState } from "react";
import { ArrowLeftRight, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { moveBlock } from "./moveBlock";

/**
 * 시공 전/후 비교를 본문 블록으로 다룬다.
 *
 * 예전에는 글 하나에 전/후 한 쌍만 넣을 수 있었고 별도 입력칸에서 관리했다.
 * 블록으로 만들면 한 게시글에 여러 쌍을 넣고, 글 사이사이 원하는 위치에
 * 배치할 수 있다.
 *
 * 저장 형태:
 *   <div data-before-after data-before="URL" data-after="URL"></div>
 * 이 형태는 sanitize.ts 의 허용 목록과 BeforeAfterSlider 의 splitContent 가
 * 함께 알고 있어야 한다. 셋 중 하나만 바꾸면 본문에서 사라진다.
 */

interface Options {
  /** 파일을 올리고 공개 URL 을 돌려준다. PostEditor 가 주입한다. */
  onUpload: (file: File) => Promise<string | null>;
}

function Slot({
  url,
  label,
  onPick,
}: {
  url: string | null;
  label: string;
  onPick: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-muted mb-1.5">{label}</p>
      {url ? (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="block w-full group/slot relative"
          title="눌러서 교체"
        >
          <img src={url} alt="" className="w-full aspect-[4/3] object-cover rounded" />
          <span className="absolute inset-0 bg-black/0 group-hover/slot:bg-black/40 text-white text-xs flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition rounded">
            교체
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full aspect-[4/3] border-2 border-dashed border-border rounded text-xs text-muted hover:border-foreground/40 hover:text-foreground"
        >
          + 사진 선택
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPick(f);
        }}
      />
    </div>
  );
}

function BeforeAfterNodeView({
  node,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
  extension,
  selected,
}: any) {
  const [busy, setBusy] = useState<"before" | "after" | null>(null);
  const onUpload: Options["onUpload"] = extension.options.onUpload;

  const pick = async (which: "before" | "after", file: File) => {
    setBusy(which);
    try {
      const url = await onUpload(file);
      if (url) updateAttributes({ [which]: url });
    } finally {
      setBusy(null);
    }
  };

  const iconBtn =
    "p-2 rounded hover:bg-secondary text-muted hover:text-foreground disabled:opacity-30";

  return (
    <NodeViewWrapper
      className={`my-4 border border-border rounded-lg bg-card p-3 ${
        selected ? "ring-2 ring-foreground/40" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">시공 전 · 후 비교</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={iconBtn}
            title="전후 서로 바꾸기"
            onClick={() =>
              updateAttributes({ before: node.attrs.after, after: node.attrs.before })
            }
          >
            <ArrowLeftRight size={16} />
          </button>
          <button
            type="button"
            className={iconBtn}
            title="위로"
            onClick={() => moveBlock(editor, getPos, -1)}
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            className={iconBtn}
            title="아래로"
            onClick={() => moveBlock(editor, getPos, 1)}
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            className={`${iconBtn} hover:text-red-600`}
            title="삭제"
            onClick={() => {
              if (confirm("이 전후 비교를 본문에서 뺄까요?")) deleteNode();
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <Slot
          url={node.attrs.before}
          label={busy === "before" ? "올리는 중..." : "시공 전 (왼쪽)"}
          onPick={(f) => pick("before", f)}
        />
        <Slot
          url={node.attrs.after}
          label={busy === "after" ? "올리는 중..." : "시공 후 (오른쪽)"}
          onPick={(f) => pick("after", f)}
        />
      </div>

      {(!node.attrs.before || !node.attrs.after) && (
        <p className="text-xs text-muted mt-2">
          두 장 모두 넣어야 홈페이지에 비교 슬라이더가 나옵니다.
        </p>
      )}
    </NodeViewWrapper>
  );
}

export const BeforeAfterBlock = Node.create<Options>({
  name: "beforeAfter",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { onUpload: async () => null };
  },

  addAttributes() {
    return {
      before: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-before"),
        renderHTML: (attrs) => (attrs.before ? { "data-before": attrs.before } : {}),
      },
      after: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-after"),
        renderHTML: (attrs) => (attrs.after ? { "data-after": attrs.after } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-before-after]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-before-after": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BeforeAfterNodeView);
  },
});
