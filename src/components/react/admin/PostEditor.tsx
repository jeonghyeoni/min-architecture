import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { EditableImage } from "./EditableImage";
import { BeforeAfterBlock } from "./BeforeAfterNode";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Columns2, Heading2,
  Image as ImageIcon, Link as LinkIcon, List, Quote, Underline as UnderlineIcon,
} from "lucide-react";

/**
 * 시공사례 작성·편집 화면.
 *
 * "네이버 블로그처럼"을 만드는 건 에디터 라이브러리가 아니라 아래 세 가지다.
 *  - 사진을 붙여넣기/드래그로 바로 올릴 수 있을 것
 *  - 툴바가 한글이고 폰에서 누를 수 있을 만큼 클 것
 *  - 자동 임시저장이 돌아 글이 날아가지 않을 것
 */

export interface PostInput {
  id?: number;
  title: string;
  type: string;
  typeKr: string;
  year: string;
  location: string;
  description: string;
  contentHtml: string;
  image: string | null;
  images: string[];
  beforeImage: string | null;
  afterImage: string | null;
  status: "draft" | "published";
}

/** 화면 표시용 한글(type_kr)은 노션 원문을 그대로 유지해야 하므로 목록을 고정한다. */
const CATEGORIES: { typeKr: string; type: string }[] = [
  { typeKr: "인테리어", type: "Interior" },
  { typeKr: "주택건축", type: "NewBuild" },
  { typeKr: "증개축", type: "Extension" },
  { typeKr: "대수리", type: "Extension" },
  { typeKr: "부분수리", type: "Repair" },
  { typeKr: "설비", type: "Repair" },
  { typeKr: "방수", type: "Waterproofing" },
];

const MAX_EDGE = 1920;
const JPEG_QUALITY = 0.82;

/**
 * 업로드 전에 브라우저에서 줄인다.
 * 폰 사진은 4~10MB라 그대로 올리면 느리고 페이지 속도에도 악영향이다.
 */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_000_000) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", JPEG_QUALITY),
  );
}

async function uploadImage(file: File, projectId?: number): Promise<string> {
  const blob = await shrink(file);
  const contentType = blob.type || "image/jpeg";

  const res = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType, projectId }),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(`[${res.status}] ${b.error ?? "업로드 주소를 받지 못했습니다"}`);
  }
  const { signedUrl, publicUrl } = await res.json();

  // Storage 로 직접 올린다. 서버 함수의 4.5MB 본문 제한을 우회한다.
  const put = await fetch(signedUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: blob,
  });
  if (!put.ok) {
    throw new Error(`이미지 업로드 실패 (${put.status}). 잠시 후 다시 시도해주세요.`);
  }

  return publicUrl;
}

interface Props {
  initial: PostInput;
}

export default function PostEditor({ initial }: Props) {
  const [form, setForm] = useState<PostInput>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const idRef = useRef<number | undefined>(initial.id);
  // ref 는 beforeunload 같은 콜백에서 최신값을 읽기 위해, state 는 화면 표시용.
  const dirtyRef = useRef(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => {
    dirtyRef.current = true;
    setDirty(true);
  };

  const markClean = () => {
    dirtyRef.current = false;
    setDirty(false);
  };

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    markDirty();
    setForm((f) => ({ ...f, [key]: value }));
  };

  /** 파일 하나를 올리고 URL 을 돌려준다. 실패 표시와 로딩 상태를 한 곳에서 처리한다. */
  const upload = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      return await uploadImage(file, idRef.current);
    } catch (e: any) {
      setError(e.message ?? "이미지 업로드 실패");
      return null;
    } finally {
      setUploading(false);
    }
  };

  /** 본문 이미지 alt. 네이버 이미지검색 유입의 주요 경로라 비워두지 않는다. */
  const autoAlt = () =>
    [form.location || "용인 처인구", form.typeKr, form.title].filter(Boolean).join(" ");

  /**
   * 예전 글에 남아 있는 갤러리·전후 사진을 본문으로 옮긴다.
   *
   * 노션에서 옮겨온 글은 사진이 images 배열과 before/after 컬럼에만 있어서
   * 본문 편집기에는 아무것도 보이지 않았다. 이제 사진은 전부 본문에서 다루므로
   * 한 번 옮겨두면 글과 사진을 원하는 순서로 섞을 수 있다.
   * 옮긴 뒤 원래 자리는 비운다. 그대로 두면 상세 페이지에 두 번 나온다.
   */
  const legacyCount = form.images.length + (form.beforeImage && form.afterImage ? 1 : 0);

  const moveLegacyIntoBody = () => {
    if (!editor || !legacyCount) return;
    if (
      !confirm(
        `예전에 등록된 사진을 본문 끝으로 옮깁니다.\n` +
          `옮긴 뒤에는 본문에서 순서를 바꾸거나 사이에 글을 쓸 수 있습니다.\n\n계속할까요?`,
      )
    ) {
      return;
    }

    const alt = autoAlt();
    const chain = editor.chain().focus("end");
    for (const src of form.images) {
      chain.createParagraphNear().setImage({ src, alt });
    }
    if (form.beforeImage && form.afterImage) {
      chain.insertContent({
        type: "beforeAfter",
        attrs: { before: form.beforeImage, after: form.afterImage },
      });
    }
    chain.run();

    markDirty();
    setForm((prev) => ({
      ...prev,
      images: [],
      beforeImage: null,
      afterImage: null,
      contentHtml: editor.getHTML(),
    }));
  };

  const insertImage = useCallback(
    async (editor: any, file: File) => {
      setUploading(true);
      setError(null);
      try {
        const url = await uploadImage(file, idRef.current);
        editor.chain().focus().setImage({ src: url, alt: autoAlt() }).run();
      } catch (e: any) {
        setError(e.message ?? "이미지 업로드 실패");
      } finally {
        setUploading(false);
      }
    },
    [form.location, form.typeKr, form.title],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      EditableImage.configure({ HTMLAttributes: { loading: "lazy" } }),
      BeforeAfterBlock.configure({ onUpload: (file) => upload(file) }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "시공 내용을 자유롭게 적어주세요. 사진은 끌어다 놓거나 붙여넣으면 올라갑니다.",
      }),
    ],
    content: initial.contentHtml || "",
    onUpdate: ({ editor }) => {
      markDirty();
      setForm((f) => ({ ...f, contentHtml: editor.getHTML() }));
    },
    editorProps: {
      attributes: { class: "post-content min-h-[420px] focus:outline-none" },
      handlePaste(view, event) {
        const file = Array.from(event.clipboardData?.files ?? [])[0];
        if (file?.type.startsWith("image/")) {
          event.preventDefault();
          insertImage(editor, file);
          return true;
        }
        return false;
      },
      handleDrop(view, event) {
        const file = Array.from((event as DragEvent).dataTransfer?.files ?? [])[0];
        if (file?.type.startsWith("image/")) {
          event.preventDefault();
          insertImage(editor, file);
          return true;
        }
        return false;
      },
    },
  });

  const save = useCallback(
    async (status: "draft" | "published", silent = false) => {
      if (!form.title.trim()) {
        setError("제목을 입력해주세요.");
        return null;
      }
      setSaving(true);
      setError(null);
      try {
        const body = { ...form, contentHtml: editor?.getHTML() ?? form.contentHtml, status };
        const isNew = idRef.current === undefined;
        const res = await fetch(
          isNew ? "/api/admin/projects" : `/api/admin/projects/${idRef.current}`,
          {
            method: isNew ? "POST" : "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        if (!res.ok) {
          // 서버가 JSON 이 아닌 응답(예: 오류 페이지)을 줄 수도 있다.
          // 그 경우 본문 앞부분이라도 보여줘야 원인을 짚을 수 있다.
          const raw = await res.text();
          let message: string;
          try {
            message = JSON.parse(raw).error ?? raw.slice(0, 200);
          } catch {
            message = raw.slice(0, 200) || "응답이 비어 있습니다";
          }
          throw new Error(`[${res.status}] ${message}`);
        }
        const data = await res.json();
        if (isNew && data.id) {
          idRef.current = data.id;
          history.replaceState(null, "", `/admin/${data.id}/edit`);
        }
        markClean();
        setSavedAt(
          new Date().toLocaleTimeString("ko-KR", {
            hour: "numeric",
            minute: "2-digit",
          }),
        );
        if (!silent) setForm((f) => ({ ...f, status }));
        return idRef.current;
      } catch (e: any) {
        setError(e.message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [form, editor],
  );

  // 20초마다 조용히 자동저장. 공개된 글은 자동으로 건드리지 않는다.
  useEffect(() => {
    const t = setInterval(() => {
      if (dirtyRef.current && form.status === "draft" && form.title.trim()) {
        save("draft", true);
      }
    }, 20_000);
    return () => clearInterval(t);
  }, [save, form.status, form.title]);

  /**
   * 저장하지 않고 나가려 할 때 경고.
   *
   * beforeunload 는 새로고침·탭닫기·주소 직접 이동만 잡는다.
   * 관리자 화면 안의 링크(목록으로 가기 등)는 잡지 못하므로 클릭도 함께 가로챈다.
   */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return;
      const link = (e.target as HTMLElement)?.closest?.("a");
      if (!link) return;

      const href = link.getAttribute("href");
      // 새 탭으로 열거나 앵커·외부 스킴이면 현재 화면을 벗어나지 않는다.
      if (!href || href.startsWith("#") || link.target === "_blank") return;

      if (!confirm("저장하지 않은 내용이 있습니다.\n이 페이지를 벗어나면 변경 내용이 사라집니다.\n\n나가시겠습니까?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  const field =
    "w-full h-[46px] px-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";
  const fieldMultiline =
    "w-full px-3 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

  return (
    <div className="space-y-6">
      {/* 상단 액션 바 */}
      {/* 카테고리 / 제목 */}
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <div>
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <select
            value={form.typeKr}
            onChange={(e) => {
              const c = CATEGORIES.find((c) => c.typeKr === e.target.value)!;
              markDirty();
              setForm((f) => ({ ...f, typeKr: c.typeKr, type: c.type }));
            }}
            className={`${field} pr-8`}
          >
            {CATEGORIES.map((c) => (
              <option key={c.typeKr} value={c.typeKr}>{c.typeKr}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">제목</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="예: 용인 처인구 양지면 30평 주택 리모델링"
            className={field}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">시공 지역</label>
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="예: 용인시 처인구 양지면"
            className={field}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">연도</label>
          <input
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="예: 2026"
            className={field}
          />
        </div>
      </div>

      {/* 대표 사진 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          대표 사진 <span className="text-muted font-normal">· 목록과 공유 카드에 쓰입니다</span>
        </label>
        <ImageSlot
          url={form.image}
          onPick={async (file) => set("image", await upload(file))}
          onClear={() => set("image", null)}
        />
      </div>

      {/* 예전 글에만 남아 있는 사진 이관 안내 */}
      {legacyCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-foreground font-medium mb-1">
            예전 방식으로 등록된 사진이 있습니다
          </p>
          <p className="text-sm text-muted mb-3">
            사진은 이제 본문에서 관리합니다. 아래 버튼을 누르면 본문 끝으로 옮겨지고,
            그 뒤에는 순서를 바꾸거나 사진 사이에 글을 쓸 수 있습니다.
          </p>
          <button
            type="button"
            onClick={moveLegacyIntoBody}
            className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90"
          >
            사진 {legacyCount}개를 본문으로 옮기기
          </button>
        </div>
      )}

      {/* 본문 */}
      <div>
        <label className="block text-sm font-medium mb-2">내용</label>
        <p className="text-sm text-muted mb-2">
          사진은 끌어다 놓거나 붙여넣으면 그 자리에 들어갑니다.
          본문 안 사진에 마우스를 올리면 위/아래 이동·삭제 버튼이 나옵니다.
        </p>
        <Toolbar
          editor={editor}
          onPickImage={(f) => insertImage(editor, f)}
          onInsertBeforeAfter={() =>
            editor
              ?.chain()
              .focus()
              .insertContent({ type: "beforeAfter", attrs: { before: null, after: null } })
              .run()
          }
        />
        <div className="border border-border border-t-0 rounded-b-lg bg-card px-4 py-4">
          <EditorContent editor={editor} />
        </div>
        {uploading && <p className="text-sm text-muted mt-2">사진 올리는 중...</p>}
      </div>

      {/* 검색 요약 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          검색 요약 <span className="text-muted font-normal">· 비워두면 본문 앞부분이 쓰입니다</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="네이버·구글 검색결과에 표시될 두세 문장"
          className={fieldMultiline}
        />
      </div>

      {/* 저장 영역. 오류는 버튼 바로 위에 띄워 눈에 걸리게 한다. */}
      <div className="border-t border-border pt-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.status === "published"}
              onChange={(e) =>
                set("status", e.target.checked ? "published" : "draft")
              }
              className="w-4 h-4"
            />
            홈페이지에 공개
          </label>

          <span className="text-sm text-muted">
            {saving
              ? "저장 중..."
              : savedAt
                ? `저장됨 · ${savedAt}`
                : dirty
                  ? "저장되지 않음"
                  : ""}
          </span>

          <button
            onClick={() => save(form.status)}
            disabled={saving}
            className="ml-auto px-6 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            저장
          </button>
        </div>

        <p className="text-sm text-muted mt-3">
          저장한 내용은 목록 화면의 <strong className="text-foreground">사이트에 반영하기</strong> 를
          눌러야 홈페이지에 나타납니다.
        </p>
      </div>
    </div>
  );
}

/** 사진 한 칸. 없으면 선택 버튼, 있으면 미리보기 + 교체/삭제. */
function ImageSlot({
  url,
  onPick,
  onClear,
}: {
  url: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      {url ? (
        <div className="border border-border rounded-lg overflow-hidden bg-card w-full max-w-[220px]">
          <img src={url} alt="" className="w-full aspect-[4/3] object-cover" />
          <div className="flex justify-between px-1 py-1">
            <IconBtn label="교체" onClick={() => ref.current?.click()}>교체</IconBtn>
            <IconBtn label="삭제" danger onClick={onClear}>삭제</IconBtn>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full max-w-[220px] aspect-[4/3] border-2 border-dashed border-border rounded-lg text-sm text-muted hover:border-foreground/40 hover:text-foreground"
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

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`px-2 py-1.5 text-xs rounded min-w-[36px] disabled:opacity-30 ${
        danger ? "text-red-600 hover:bg-red-50" : "text-muted hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
  onInsertBeforeAfter,
}: {
  editor: any;
  onPickImage: (f: File) => void;
  onInsertBeforeAfter: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  if (!editor) return null;

  const Btn = ({ on, active, title, children }: any) => (
    <button
      type="button"
      onClick={on}
      title={title}
      aria-label={title}
      className={`p-2.5 rounded min-w-[40px] flex items-center justify-center ${
        active ? "bg-foreground text-background" : "text-muted hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <span className="w-px self-stretch my-1 bg-border" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border border-border rounded-t-lg bg-card px-2 py-1.5 sticky top-[104px] z-20">
      <Btn
        title="제목"
        on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 size={18} />
      </Btn>
      <Btn title="굵게" on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
        <Bold size={18} />
      </Btn>
      <Btn
        title="밑줄"
        on={() => editor.chain().focus().toggleUnderline?.().run()}
        active={editor.isActive("underline")}
      >
        <UnderlineIcon size={18} />
      </Btn>

      <Divider />

      {/* 정렬은 드래그로 선택한 범위가 걸쳐 있는 문단들에 적용된다.
          text-align 은 문단 단위 속성이라 문단 일부만 정렬할 수는 없다. */}
      <Btn
        title="왼쪽 정렬"
        on={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
      >
        <AlignLeft size={18} />
      </Btn>
      <Btn
        title="가운데 정렬"
        on={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
      >
        <AlignCenter size={18} />
      </Btn>
      <Btn
        title="오른쪽 정렬"
        on={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
      >
        <AlignRight size={18} />
      </Btn>

      <Divider />

      <Btn
        title="목록"
        on={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List size={18} />
      </Btn>
      <Btn
        title="인용"
        on={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote size={18} />
      </Btn>

      <Divider />

      <Btn title="사진 넣기" on={() => fileRef.current?.click()} active={false}>
        <ImageIcon size={18} />
      </Btn>
      <Btn title="시공 전·후 비교 넣기" on={onInsertBeforeAfter} active={false}>
        <Columns2 size={18} />
      </Btn>
      <Btn
        title="링크"
        on={() => {
          const url = prompt("링크 주소를 입력하세요 (https://)");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        active={editor.isActive("link")}
      >
        <LinkIcon size={18} />
      </Btn>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPickImage(f);
        }}
      />
    </div>
  );
}
