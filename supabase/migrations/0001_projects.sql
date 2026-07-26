-- 시공사례(projects) 테이블
--
-- id 는 기존 노션 ID 를 그대로 옮겨 담는다.
-- /projects/{id} URL 이 이미 사이트맵에 올라가 네이버 수집 요청까지 들어간 상태라,
-- ID 가 바뀌면 색인된 주소가 전부 404 가 된다. 절대 재발급하지 말 것.

create table public.projects (
  id            integer primary key,
  status        text not null default 'draft'
                check (status in ('draft', 'published')),

  -- type 은 서비스 페이지 필터와 맞물려 있다.
  -- src/lib/seo.ts 의 SERVICES[].filter, ProjectsList.tsx 의 Category 유니온이
  -- 이 값에 걸려 있으므로 새 값을 넣으려면 그쪽도 같이 고쳐야 한다.
  type          text not null
                check (type in ('Extension', 'NewBuild', 'Repair',
                                'Interior', 'Waterproofing', 'Etc')),

  -- 화면 표시용 한글. 노션 select 원문("증개축", "대수리", "주택건축", "설비",
  -- "부분수리", "인테리어", "방수")을 그대로 저장한다.
  -- SERVICES[].name("증개축 · 대수리")과 문자열이 다르므로 그쪽에서 파생시키면
  -- 모든 프로젝트의 <title>/<meta description>이 한꺼번에 바뀐다.
  type_kr       text not null,

  title         text not null,

  -- 검색결과 스니펫에 쓰이는 평문 요약. HTML 을 넣으면 안 된다.
  description   text not null default '',

  -- 위지윅 에디터 본문. 저장 전에 반드시 서버에서 새니타이즈한다.
  content_html  text not null default '',

  year          text not null default '',
  location      text not null default '',

  -- Supabase Storage 절대 URL. 노션과 달리 만료되지 않는다.
  image         text,
  images        jsonb not null default '[]'::jsonb,
  before_image  text,
  after_image   text,

  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 공개 목록 조회(status='published' 를 id 순으로)를 위한 인덱스
create index projects_status_id_idx on public.projects (status, id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- 새 글에 부여할 ID 시퀀스.
-- 마이그레이션으로 기존 데이터를 넣은 뒤 setval 로 최대값에 맞춘다.
create sequence public.projects_id_seq owned by public.projects.id;
alter table public.projects alter column id set default nextval('public.projects_id_seq');

-- ── RLS ──────────────────────────────────────────────────────────────
-- 빌드는 anon 키로 읽는다. 아래 정책 덕분에 초안이 getStaticPaths 에 섞이는 것이
-- 구조적으로 불가능해진다 (.eq('status','published') 를 깜빡할 여지가 없음).
-- 쓰기 정책은 일부러 만들지 않는다. 모든 쓰기는 서버에서 service_role 키로만 한다.

alter table public.projects enable row level security;

create policy "public read published"
  on public.projects
  for select
  to anon, authenticated
  using (status = 'published');

-- ── Storage ──────────────────────────────────────────────────────────
-- 읽기는 공개. 업로드는 서버가 발급한 서명 URL 로만 이뤄지므로
-- anon 에게 insert 정책을 주지 않는다.

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;
