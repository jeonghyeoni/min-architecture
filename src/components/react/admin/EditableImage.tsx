import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Type } from "lucide-react";
import { moveBlock } from "./moveBlock";

/**
 * 본문 안의 사진을 "글처럼" 다루기 위한 이미지 노드.
 *
 * 기본 Tiptap 이미지는 클릭해서 선택한 뒤 키보드로 지워야 해서
 * 비개발자가 쓰기 어렵다. 사진 위에 위/아래 이동, 삭제, 설명 입력 버튼을
 * 직접 붙여 사진 자체를 하나의 문단처럼 다루게 한다.
 */
function ImageNodeView({ node, updateAttributes, deleteNode, editor, getPos, selected }: any) {
  const [editingAlt, setEditingAlt] = useState(false);

  const btn =
    "p-2 rounded bg-white/95 shadow-sm border border-black/5 hover:bg-white text-muted hover:text-foreground";

  return (
    <NodeViewWrapper
      className={`relative my-4 group ${selected ? "ring-2 ring-foreground/40 rounded" : ""}`}
      data-drag-handle
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        className="w-full h-auto rounded block"
      />

      {/* 데스크톱은 마우스를 올렸을 때, 모바일은 항상 보이게 한다 */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button type="button" className={btn} title="위로" onClick={() => moveBlock(editor, getPos, -1)}>
          <ChevronUp size={16} />
        </button>
        <button type="button" className={btn} title="아래로" onClick={() => moveBlock(editor, getPos, 1)}>
          <ChevronDown size={16} />
        </button>
        <button type="button" className={btn} title="사진 설명" onClick={() => setEditingAlt((v) => !v)}>
          <Type size={16} />
        </button>
        <button
          type="button"
          className={`${btn} hover:text-red-600`}
          title="삭제"
          onClick={() => {
            if (confirm("이 사진을 본문에서 뺄까요?")) deleteNode();
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {editingAlt && (
        <div className="mt-2">
          <input
            autoFocus
            value={node.attrs.alt ?? ""}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            onBlur={() => setEditingAlt(false)}
            placeholder="사진 설명 (검색에 노출됩니다)"
            className="w-full px-3 py-2 text-sm border border-border rounded bg-card"
          />
          <p className="text-xs text-muted mt-1">
            네이버 이미지 검색에서 이 문구로 찾아옵니다. 지역·공종을 넣어주세요.
          </p>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const EditableImage = Image.extend({
  // 사진을 문단과 같은 층위의 블록으로 둔다. 글 사이사이에 끼워 넣기 위함.
  inline: false,
  group: "block",
  draggable: true,

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
