import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { EditableImage } from "./EditableImage";
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
  const dirtyRef = useRef(false);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const replaceRef = useRef<((i: number) => void) | null>(null);
  replaceRef.current = (i: number) => {
    replaceIndexRef.current = i;
    replaceInputRef.current?.click();
  };

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    dirtyRef.current = true;
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

  const moveImage = (index: number, delta: number) => {
    dirtyRef.current = true;
    setForm((prev) => {
      const next = [...prev.images];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, images: next };
    });
  };

  /**
   * 갤러리에 있던 사진을 본문 끝에 넣고 갤러리를 비운다.
   *
   * 노션에서 옮겨온 글은 사진이 전부 갤러리 배열에만 있어서 본문 편집기에
   * 아무것도 보이지 않는다. 한 번 옮겨두면 글과 사진을 섞어 쓸 수 있다.
   * 양쪽에 중복으로 남으면 상세 페이지에 사진이 두 번 나오므로 갤러리는 비운다.
   */
  const moveGalleryIntoBody = () => {
    if (!editor || !form.images.length) return;
    if (
      !confirm(
        `갤러리 사진 ${form.images.length}장을 본문 끝으로 옮깁니다.\n` +
          `옮긴 뒤 본문에서 순서를 바꾸거나 사이에 글을 쓸 수 있습니다.\n\n계속할까요?`,
      )
    ) {
      return;
    }

    const alt = [form.location || "용인 처인구", form.typeKr, form.title]
      .filter(Boolean)
      .join(" ");

    const chain = editor.chain().focus("end");
    for (const src of form.images) {
      chain.createParagraphNear().setImage({ src, alt });
    }
    chain.run();

    dirtyRef.current = true;
    setForm((prev) => ({
      ...prev,
      images: [],
      contentHtml: editor.getHTML(),
    }));
  };

  const removeImage = (index: number) => {
    dirtyRef.current = true;
    // Storage 파일은 지우지 않는다. 다른 글이나 본문에서 같은 주소를 쓰고 있을 수
    // 있어서, 목록에서만 빼는 편이 안전하다.
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
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
      EditableImage.configure({ HTMLAttributes: { loading: "lazy" } }),
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
        <ImageSlot
          url={form.image}
          onPick={async (file) => set("image", await upload(file))}
          onClear={() => set("image", null)}
        />
      </div>

      {/* 갤러리 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          갤러리 사진
          <span className="text-muted font-normal"> · 상세 페이지에 순서대로 표시됩니다</span>
        </label>
        <p className="text-sm text-muted mb-3">
          첫 번째 사진이 상세 페이지 맨 위 큰 사진으로 쓰입니다.
        </p>

        {form.images.length > 0 && (
          <div className="mb-4 p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-foreground mb-1 font-medium">
              사진 사이사이에 설명을 쓰고 싶으시면
            </p>
            <p className="text-sm text-muted mb-3">
              갤러리 사진을 본문으로 옮기면 글과 사진을 원하는 순서로 섞을 수 있습니다.
              옮긴 뒤에는 본문에서 사진마다 위/아래 이동과 삭제가 가능합니다.
            </p>
            <button
              type="button"
              onClick={moveGalleryIntoBody}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary"
            >
              갤러리 사진 {form.images.length}장을 본문으로 옮기기
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          {form.images.map((url, i) => (
            <div key={url + i} className="border border-border rounded-lg overflow-hidden bg-card">
              <img src={url} alt="" className="w-full aspect-[4/3] object-cover" />
              <div className="flex items-center justify-between px-1 py-1">
                <div className="flex gap-0.5">
                  <IconBtn label="앞으로" disabled={i === 0} onClick={() => moveImage(i, -1)}>←</IconBtn>
                  <IconBtn label="뒤로" disabled={i === form.images.length - 1} onClick={() => moveImage(i, 1)}>→</IconBtn>
                </div>
                <div className="flex gap-0.5">
                  <IconBtn label="교체" onClick={() => replaceRef.current?.(i)}>교체</IconBtn>
                  <IconBtn label="삭제" danger onClick={() => removeImage(i)}>삭제</IconBtn>
                </div>
              </div>
              {i === 0 && (
                <p className="text-[11px] text-center text-muted pb-1">대표로 표시됨</p>
              )}
            </div>
          ))}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (!files.length) return;
            setUploading(true);
            setError(null);
            try {
              const urls: string[] = [];
              for (const f of files) urls.push(await uploadImage(f, idRef.current));
              dirtyRef.current = true;
              setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
            } catch (err: any) {
              setError(err.message);
            } finally {
              setUploading(false);
            }
          }}
          className="text-sm"
        />
        <input
          type="file"
          accept="image/*"
          hidden
          ref={replaceInputRef}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            const idx = replaceIndexRef.current;
            e.target.value = "";
            if (!file || idx === null) return;
            setUploading(true);
            try {
              const url = await uploadImage(file, idRef.current);
              dirtyRef.current = true;
              setForm((prev) => {
                const next = [...prev.images];
                next[idx] = url;
                return { ...prev, images: next };
              });
            } catch (err: any) {
              setError(err.message);
            } finally {
              setUploading(false);
              replaceIndexRef.current = null;
            }
          }}
        />
      </div>

      {/* 전 / 후 비교 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          시공 전 · 후 사진
          <span className="text-muted font-normal"> · 두 장 모두 있어야 비교 슬라이더가 나옵니다</span>
        </label>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div>
            <p className="text-sm text-muted mb-2">시공 전</p>
            <ImageSlot
              url={form.beforeImage}
              onPick={async (file) => set("beforeImage", await upload(file))}
              onClear={() => set("beforeImage", null)}
            />
          </div>
          <div>
            <p className="text-sm text-muted mb-2">시공 후</p>
            <ImageSlot
              url={form.afterImage}
              onPick={async (file) => set("afterImage", await upload(file))}
              onClear={() => set("afterImage", null)}
            />
          </div>
        </div>
        {(form.beforeImage || form.afterImage) && (
          <button
            type="button"
            onClick={() => {
              dirtyRef.current = true;
              setForm((f) => ({ ...f, beforeImage: f.afterImage, afterImage: f.beforeImage }));
            }}
            className="mt-3 px-4 py-2 border border-border rounded-lg text-sm hover:bg-card"
          >
            ⇄ 전 · 후 서로 바꾸기
          </button>
        )}
      </div>

      {/* 본문 */}
      <div>
        <label className="block text-sm font-medium mb-2">내용</label>
        <p className="text-sm text-muted mb-2">
          사진은 끌어다 놓거나 붙여넣으면 그 자리에 들어갑니다.
          본문 안 사진에 마우스를 올리면 위/아래 이동·삭제 버튼이 나옵니다.
        </p>
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
