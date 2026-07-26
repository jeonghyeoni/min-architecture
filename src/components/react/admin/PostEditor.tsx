import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

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
  if (!res.ok) throw new Error("업로드 주소를 받지 못했습니다");
  const { signedUrl, publicUrl } = await res.json();

  // Storage 로 직접 올린다. 서버 함수의 4.5MB 본문 제한을 우회한다.
  const put = await fetch(signedUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: blob,
  });
  if (!put.ok) throw new Error("이미지 업로드에 실패했습니다");

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
  const dirtyRef = useRef(false);

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    dirtyRef.current = true;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const insertImage = useCallback(
    async (editor: any, file: File) => {
      setUploading(true);
      setError(null);
      try {
        const url = await uploadImage(file, idRef.current);
        // 본문 이미지 alt 는 네이버 이미지검색 유입의 주요 경로다.
        // 비워두면 그대로 alt="" 가 되므로 자동으로 채워준다.
        const alt = [form.location || "용인 처인구", form.typeKr, form.title]
          .filter(Boolean)
          .join(" ");
        editor.chain().focus().setImage({ src: url, alt }).run();
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
      Image.configure({ inline: false, HTMLAttributes: { loading: "lazy" } }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "시공 내용을 자유롭게 적어주세요. 사진은 끌어다 놓거나 붙여넣으면 올라갑니다.",
      }),
    ],
    content: initial.contentHtml || "",
    onUpdate: ({ editor }) => {
      dirtyRef.current = true;
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
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error ?? "저장에 실패했습니다");
        }
        const data = await res.json();
        if (isNew && data.id) {
          idRef.current = data.id;
          history.replaceState(null, "", `/admin/${data.id}/edit`);
        }
        dirtyRef.current = false;
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

  // 20초마다 조용히 임시저장. 발행된 글은 자동으로 건드리지 않는다.
  useEffect(() => {
    const t = setInterval(() => {
      if (dirtyRef.current && form.status === "draft" && form.title.trim()) {
        save("draft", true);
      }
    }, 20_000);
    return () => clearInterval(t);
  }, [save, form.status, form.title]);

  // 저장 안 한 채로 나가려 할 때 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const publish = async () => {
    const id = await save("published");
    if (!id) return;
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    if (res.ok) {
      alert("게시했습니다.\n약 2~3분 뒤 홈페이지에 나타납니다.");
    } else {
      const b = await res.json().catch(() => ({}));
      alert(
        b.error === "deploy_hook_not_configured"
          ? "저장은 됐지만 자동 배포가 설정되지 않았습니다. Vercel 에서 Deploy Hook 을 등록해주세요."
          : "저장은 됐지만 배포 요청에 실패했습니다.",
      );
    }
  };

  const field =
    "w-full px-3 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

  return (
    <div className="space-y-6">
      {/* 상단 액션 바 */}
      <div className="sticky top-14 z-30 bg-secondary/95 backdrop-blur py-3 flex flex-wrap items-center gap-3 border-b border-border">
        <span className="text-sm text-muted mr-auto">
          {saving ? "저장 중..." : savedAt ? `저장됨 · ${savedAt}` : "저장되지 않음"}
          {form.status === "published" && " · 발행됨"}
        </span>
        <button
          onClick={() => save("draft")}
          disabled={saving}
          className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-card disabled:opacity-50"
        >
          임시저장
        </button>
        <button
          onClick={publish}
          disabled={saving}
          className="px-5 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {form.status === "published" ? "수정 내용 반영" : "게시하기"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}

      {/* 카테고리 / 제목 */}
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <div>
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <select
            value={form.typeKr}
            onChange={(e) => {
              const c = CATEGORIES.find((c) => c.typeKr === e.target.value)!;
              dirtyRef.current = true;
              setForm((f) => ({ ...f, typeKr: c.typeKr, type: c.type }));
            }}
            className={field}
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
        {form.image && (
          <img src={form.image} alt="" className="w-48 aspect-[4/3] object-cover rounded-lg mb-3" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              set("image", await uploadImage(file, idRef.current));
            } catch (err: any) {
              setError(err.message);
            } finally {
              setUploading(false);
            }
          }}
          className="text-sm"
        />
      </div>

      {/* 본문 */}
      <div>
        <label className="block text-sm font-medium mb-2">내용</label>
        <Toolbar editor={editor} onPickImage={(f) => insertImage(editor, f)} />
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
          className={field}
        />
      </div>
    </div>
  );
}

function Toolbar({ editor, onPickImage }: { editor: any; onPickImage: (f: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  if (!editor) return null;

  const Btn = ({ on, active, children }: any) => (
    <button
      type="button"
      onClick={on}
      className={`px-3 py-2 rounded text-sm min-w-[44px] ${
        active ? "bg-foreground text-background" : "hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-1 border border-border rounded-t-lg bg-card px-2 py-2 sticky top-[104px] z-20">
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
           active={editor.isActive("heading", { level: 2 })}>제목</Btn>
      <Btn on={() => editor.chain().focus().toggleBold().run()}
           active={editor.isActive("bold")}><b>굵게</b></Btn>
      <Btn on={() => editor.chain().focus().toggleUnderline?.().run()}
           active={editor.isActive("underline")}><u>밑줄</u></Btn>
      <Btn on={() => editor.chain().focus().toggleBulletList().run()}
           active={editor.isActive("bulletList")}>목록</Btn>
      <Btn on={() => editor.chain().focus().toggleBlockquote().run()}
           active={editor.isActive("blockquote")}>인용</Btn>
      <Btn on={() => editor.chain().focus().setTextAlign("center").run()}
           active={editor.isActive({ textAlign: "center" })}>가운데</Btn>
      <Btn on={() => fileRef.current?.click()} active={false}>사진</Btn>
      <Btn on={() => {
        const url = prompt("링크 주소를 입력하세요 (https://)");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }} active={editor.isActive("link")}>링크</Btn>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickImage(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
