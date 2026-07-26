/**
 * 네이버/구글 검색 최적화용 중앙 설정.
 *
 * 사업자 정보(NAP: Name, Address, Phone)는 반드시 한 곳에서만 관리한다.
 * 네이버 로컬 검색은 사이트·네이버 플레이스·블로그에 적힌 상호/주소/전화번호가
 * 글자 하나까지 동일할 때 같은 업체로 묶어서 신뢰도를 준다.
 * 여기 값을 고칠 때는 네이버 플레이스 등록 정보와 반드시 똑같이 맞출 것.
 */

/**
 * 도메인은 한글 도메인 "민건축.com" 이다.
 * 한글 도메인은 IDN 이라 실제 URL 로는 Punycode 형태로 변환해서 써야 한다.
 * canonical, og:url, 사이트맵은 전부 이 ASCII 형태로 통일한다.
 * (한글 그대로 쓰면 크롤러·메신저마다 인코딩이 달라져 다른 주소로 갈린다)
 *
 *   민건축.com  →  xn--z69an80agjn.com
 */
export const SITE_URL = "https://xn--z69an80agjn.com";

/** 사람에게 보여줄 때만 쓰는 한글 도메인. 링크의 href 에는 쓰지 말 것. */
export const DISPLAY_DOMAIN = "민건축.com";

/** 네이버 플레이스. 사이트와 플레이스를 같은 업체로 묶는 핵심 연결고리. */
export const NAVER_PLACE_URL =
  "https://m.place.naver.com/place/1995142539/home";

export const BUSINESS = {
  name: "민건축",
  legalName: "민건축",
  founder: "민관식",
  phone: "0507-1359-6512",
  phoneRaw: "+82-507-1359-6512",
  businessNumber: "460-37-00630",
  street: "양지면 용곡로 38-4 1호",
  locality: "용인시 처인구",
  region: "경기도",
  postalCode: "17161",
  country: "KR",
  /** 용인시 처인구 양지면 기준 좌표 */
  latitude: 37.2342,
  longitude: 127.2758,
  openingHours: "Mo-Su 00:00-23:59",
  priceRange: "₩₩",
} as const;

/** 전체 주소 한 줄. 푸터·연락처·구조화 데이터가 모두 이 값을 쓴다. */
export const FULL_ADDRESS = `${BUSINESS.region} ${BUSINESS.locality} ${BUSINESS.street}`;

/** 시공 가능 지역. 네이버가 지역 연관도를 판단하는 근거가 된다. */
export const SERVICE_AREAS = [
  "용인시 처인구",
  "양지면",
  "포곡읍",
  "모현읍",
  "이동읍",
  "남사읍",
  "백암면",
  "원삼면",
  "용인시 기흥구",
  "용인시 수지구",
];

/**
 * 공종별 정보.
 *
 * slug 는 /services/<slug> 주소가 된다. 목표 키워드마다 색인 가능한 페이지를
 * 하나씩 두기 위한 것으로, 필터 주소(/projects?filter=)는 canonical 로
 * /projects 에 합쳐지고 robots.txt 에서도 제외되므로 검색 유입을 받지 못한다.
 *
 * title/heading 에는 목표 키워드(용인 리모델링, 처인구 집수리 등)를 그대로 담는다.
 */
export const SERVICES = [
  {
    name: "인테리어 · 리모델링",
    slug: "remodeling",
    filter: "Interior",
    keyword: "용인 리모델링",
    heading: "용인 처인구 리모델링 · 인테리어",
    title: "용인 리모델링 | 처인구 주택 인테리어 시공 - 민건축",
    description:
      "용인시 처인구 주택·상가 리모델링과 인테리어 시공. 주방, 욕실, 도배, 바닥, 전체 리모델링까지 맡습니다.",
    includes: [
      "주방 · 욕실 리모델링",
      "도배 · 장판 · 바닥재",
      "샷시 · 창호 교체",
      "전체 올수리 리모델링",
      "상가 · 사무실 인테리어",
    ],
  },
  {
    name: "부분수리 · 설비",
    slug: "repair",
    filter: "Repair",
    keyword: "용인 집수리",
    heading: "용인 처인구 집수리 · 설비",
    title: "용인 집수리 | 처인구 누수·보일러·설비 수리 - 민건축",
    description:
      "용인시 처인구 집수리 전문. 누수, 보일러, 배관, 창호 등 작은 수리부터 설비 공사까지 당일 방문 상담이 가능합니다.",
    includes: [
      "누수 탐지 · 보수",
      "보일러 · 난방 배관",
      "상하수도 배관 공사",
      "창호 · 문 수리 교체",
      "전기 · 조명 설비",
    ],
  },
  {
    name: "증개축 · 대수리",
    slug: "extension",
    filter: "Extension",
    keyword: "용인 증축",
    heading: "용인 처인구 증축 · 개축 · 대수선",
    title: "용인 증축·대수선 | 처인구 노후주택 리모델링 - 민건축",
    description:
      "용인시 처인구 노후 주택 증축, 개축, 대수선. 구조 검토부터 건축 인허가까지 함께 처리합니다.",
    includes: [
      "단독주택 증축 · 개축",
      "대수선 구조 보강",
      "건축 인허가 대행",
      "시골집 · 구옥 전체 수리",
      "단열 · 지붕 개선",
    ],
  },
  {
    name: "방수",
    slug: "waterproofing",
    filter: "Waterproofing",
    keyword: "용인 방수",
    heading: "용인 처인구 방수 공사",
    title: "용인 방수공사 | 처인구 옥상·누수 방수 시공 - 민건축",
    description:
      "용인시 처인구 옥상 방수, 우레탄 방수, 누수 탐지 및 보수. 원인을 먼저 잡고 시공합니다.",
    includes: [
      "옥상 · 지붕 방수",
      "우레탄 · 시트 방수",
      "욕실 · 베란다 방수",
      "누수 원인 탐지",
      "외벽 크랙 보수",
    ],
  },
  {
    name: "주택 건축",
    slug: "newbuild",
    filter: "NewBuild",
    keyword: "용인 주택 건축",
    heading: "용인 처인구 단독주택 · 전원주택 신축",
    title: "용인 주택건축 | 처인구 단독·전원주택 신축 - 민건축",
    description:
      "용인시 처인구 단독주택·전원주택 신축. 설계부터 인허가, 시공, 준공까지 전 과정을 진행합니다.",
    includes: [
      "단독주택 · 전원주택 신축",
      "설계 · 건축 인허가",
      "토목 · 기초 공사",
      "준공 검사 · 등기",
      "조경 · 외부 공간",
    ],
  },
] as const;

/**
 * 사이트 전역 기본 메타. 페이지에서 넘기지 않으면 이 값이 쓰인다.
 *
 * 목표 키워드 우선순위: 민건축(브랜드) > 용인/처인구 리모델링 > 용인/처인구 집수리.
 * 제목 앞쪽에 올수록 가중치가 높으므로 순서를 함부로 바꾸지 말 것.
 */
export const DEFAULT_TITLE =
  "민건축 | 용인 처인구 리모델링·집수리 전문";
export const DEFAULT_DESCRIPTION =
  "경기도 용인시 처인구 리모델링, 집수리 전문 민건축입니다. 주택 인테리어, 증개축, 대수선, 방수, 누수 보수, 주택 신축까지 처인구 전 지역 현장 방문 견적. 15년 경력의 꼼꼼한 시공을 약속드립니다. 상담 0507-1359-6512.";
export const DEFAULT_KEYWORDS = [
  "민건축",
  "용인 리모델링",
  "처인구 리모델링",
  "용인 집수리",
  "처인구 집수리",
  "용인 인테리어",
  "처인구 인테리어",
  "양지면 리모델링",
  "용인 주택 리모델링",
  "용인 증축",
  "용인 대수선",
  "용인 방수",
  "용인 주택 건축",
  "용인 리모델링 업체",
];

export const DEFAULT_OG_IMAGE = "/og-image.jpg";

/** 상대 경로를 절대 URL로. OG 이미지와 canonical은 반드시 절대 경로여야 한다. */
export function absoluteUrl(pathOrUrl: string, site?: URL | string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const base = (site ? site.toString() : SITE_URL).replace(/\/$/, "");
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

type JsonLd = Record<string, unknown>;

/**
 * 업체 정보 구조화 데이터.
 * GeneralContractor 는 LocalBusiness 의 하위 타입이라 지역 업체로 인식된다.
 */
export function buildLocalBusinessSchema(site?: URL | string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "@id": `${absoluteUrl("/", site)}#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: absoluteUrl("/", site),
    logo: absoluteUrl("/logo-full.svg", site),
    image: absoluteUrl(DEFAULT_OG_IMAGE, site),
    description: DEFAULT_DESCRIPTION,
    telephone: BUSINESS.phoneRaw,
    founder: { "@type": "Person", name: BUSINESS.founder },
    // 사업자등록번호는 네이버가 보는 사이트 공신력에 직접 작용한다.
    taxID: BUSINESS.businessNumber,
    identifier: {
      "@type": "PropertyValue",
      name: "사업자등록번호",
      value: BUSINESS.businessNumber,
    },
    // 네이버 플레이스와 같은 업체임을 명시한다. 지역 검색 신뢰도의 핵심.
    sameAs: [NAVER_PLACE_URL],
    hasMap: NAVER_PLACE_URL,
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: "KRW",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    areaServed: SERVICE_AREAS.map((area) => ({
      "@type": "AdministrativeArea",
      name: area,
    })),
    knowsAbout: SERVICES.map((s) => s.name),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "민건축 시공 서비스",
      itemListElement: SERVICES.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.description,
          areaServed: { "@type": "AdministrativeArea", name: "용인시 처인구" },
          provider: { "@id": `${absoluteUrl("/", site)}#business` },
        },
      })),
    },
  };
}

/** 사이트 자체 정보. 네이버·구글이 사이트명을 검색결과에 그대로 쓰는 근거가 된다. */
export function buildWebSiteSchema(site?: URL | string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/", site)}#website`,
    url: absoluteUrl("/", site),
    name: BUSINESS.name,
    inLanguage: "ko-KR",
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${absoluteUrl("/", site)}#business` },
  };
}

/** 빵부스러기. 검색결과에 사이트 경로가 노출되고 내부 링크 구조를 알린다. */
export function buildBreadcrumbSchema(
  items: { name: string; path: string }[],
  site?: URL | string,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, site),
    })),
  };
}

/** 시공 사례 1건 = 이미지가 있는 콘텐츠 1건으로 인식시킨다. */
export function buildProjectSchema(
  project: {
    id: string | number;
    title: string;
    typeKr: string;
    year?: string;
    location?: string;
    description?: string;
    image?: string;
    images?: string[];
  },
  site?: URL | string,
): JsonLd {
  const url = absoluteUrl(`/projects/${project.id}`, site);
  const images = (project.images?.length ? project.images : [project.image])
    .filter(Boolean)
    .map((img) => absoluteUrl(img as string, site));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: buildProjectTitle(project),
    url,
    image: images,
    description: buildProjectDescription(project),
    inLanguage: "ko-KR",
    articleSection: project.typeKr,
    ...(project.year ? { datePublished: `${project.year}-01-01` } : {}),
    contentLocation: project.location
      ? { "@type": "Place", name: project.location }
      : undefined,
    author: { "@id": `${absoluteUrl("/", site)}#business` },
    publisher: { "@id": `${absoluteUrl("/", site)}#business` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function buildFaqSchema(
  faqs: { question: string; answer: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/**
 * 시공 사례 페이지 제목.
 * "제목 | 지역 공종 시공사례 - 민건축" 형태로 만들어 지역+공종 키워드를 확보한다.
 */
export function buildProjectTitle(project: {
  title: string;
  typeKr: string;
  location?: string;
}): string {
  const place = project.location?.trim();
  const prefix = place ? `${place} ` : "용인 ";
  return `${project.title} | ${prefix}${project.typeKr} 시공사례 - 민건축`;
}

export function buildProjectDescription(project: {
  title: string;
  typeKr: string;
  year?: string;
  location?: string;
  description?: string;
}): string {
  const body = project.description?.replace(/\s+/g, " ").trim();
  const place = project.location?.trim() || "용인시 처인구";
  const head = `${place} ${project.typeKr} 시공사례 '${project.title}'${
    project.year ? ` (${project.year}년)` : ""
  }.`;
  const tail = " 민건축이 직접 시공했습니다. 현장 방문 견적 0507-1359-6512.";
  const room = 155 - head.length - tail.length;
  if (body && room > 20) {
    const snippet =
      body.length > room ? `${body.slice(0, room - 1).trimEnd()}…` : body;
    return `${head} ${snippet}${tail}`;
  }
  return `${head}${tail}`;
}

/** 이미지 대체 텍스트. 네이버 이미지 검색 유입의 거의 전부가 여기서 나온다. */
export function buildProjectImageAlt(
  project: { title: string; typeKr: string; location?: string },
  index?: number,
): string {
  const place = project.location?.trim() || "용인 처인구";
  const base = `${place} ${project.typeKr} 시공사례 - ${project.title}`;
  return typeof index === "number" ? `${base} 시공 사진 ${index}` : base;
}
