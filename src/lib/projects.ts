import { publicClient, serverClient } from "./supabase";

/**
 * 시공사례 데이터 접근 계층.
 *
 * getProjects() 의 반환 형태는 기존 src/lib/notion.js 와 **완전히 동일**하게 유지한다.
 * 덕분에 공개 페이지 네 곳은 import 경로 한 줄만 바뀌고, getStaticPaths 와
 * JSON-LD 구성, seo.ts 의 빌더들은 손대지 않아도 된다.
 *
 * DB 의 snake_case 를 camelCase 로 바꾸는 일은 이 파일에서만 한다.
 */

export interface Project {
  id: number;
  title: string;
  /** 필터용 영문 코드. seo.ts 의 SERVICES[].filter 와 대응 */
  type: string;
  /** 화면 표시용 한글. 노션 원문 그대로 */
  typeKr: string;
  year: string;
  location: string;
  /** 평문 요약. meta description 전용 */
  description: string;
  /** 위지윅 본문 HTML. 이전된 글은 비어 있을 수 있다 */
  contentHtml: string;
  image: string;
  images: string[];
  beforeImage: string | null;
  afterImage: string | null;
  status: "draft" | "published";
  updatedAt: string | null;
}

/** DB 행 → 기존 코드가 기대하는 형태 */
function toProject(row: any): Project {
  return {
    id: row.id,
    title: row.title ?? "제목 없음",
    type: row.type ?? "Etc",
    typeKr: row.type_kr ?? "기타",
    year: row.year ?? "",
    location: row.location ?? "",
    description: row.description ?? "",
    contentHtml: row.content_html ?? "",
    image: row.image ?? "",
    images: Array.isArray(row.images) ? row.images.filter(Boolean) : [],
    beforeImage: row.before_image ?? null,
    afterImage: row.after_image ?? null,
    status: row.status ?? "draft",
    updatedAt: row.updated_at ?? null,
  };
}

const COLUMNS =
  "id,status,type,type_kr,title,description,content_html,year,location,image,images,before_image,after_image,updated_at";

/**
 * 공개된 시공사례 전체. 빌드 시 공개 페이지가 사용한다.
 *
 * anon 키 + RLS 로 읽으므로 초안은 애초에 내려오지 않는다.
 * 정렬은 id 오름차순 — 상세 페이지의 이전/다음 네비게이션이 이 순서에 의존한다.
 */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await publicClient()
    .from("projects")
    .select(COLUMNS)
    .order("id", { ascending: true });

  if (error) {
    // 노션 버전은 조용히 []를 반환해 빈 사이트가 초록불로 배포됐다.
    // 빌드를 실패시켜 사고를 배포 전에 잡는다.
    throw new Error(`시공사례를 불러오지 못했습니다: ${error.message}`);
  }

  return (data ?? []).map(toProject);
}

/** 관리자 목록용. 초안까지 포함하며 최근 수정 순으로 정렬한다. */
export async function getAllForAdmin(): Promise<Project[]> {
  const { data, error } = await serverClient()
    .from("projects")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`목록 조회 실패: ${error.message}`);
  return (data ?? []).map(toProject);
}

/** 관리자 편집·미리보기용. 초안도 조회된다. */
export async function getProjectById(id: number): Promise<Project | null> {
  const { data, error } = await serverClient()
    .from("projects")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`조회 실패: ${error.message}`);
  return data ? toProject(data) : null;
}
