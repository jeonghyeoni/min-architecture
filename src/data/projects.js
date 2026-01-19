export const projects = [
  {
    id: 1,
    title: "모던 패밀리 하우스",
    type: "House",
    typeKr: "주택",
    year: "2025",
    location: "포틀랜드, OR",
    description: `1980년대의 오래된 주택을 현대적인 가족 주거 공간으로 완전히 변화시킨 프로젝트입니다. 주요 생활 공간을 개방하여 더 나은 동선과 야외 공간과의 연결성을 창출하는 데 중점을 두었습니다.\n\n집주인과 긴밀히 협력하여 주택의 구조적 완전성을 유지하면서 내부 레이아웃을 완전히 재구상하는 계획을 개발했습니다. 자연광을 유입하기 위해 큰 창문을 추가했으며, 전체적으로 지속 가능한 자재를 사용했습니다.`,
    image: "https://images.unsplash.com/photo-1627141234469-24711efb373c?q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1627141234469-24711efb373c?q=80&w=1600",
      "https://images.unsplash.com/photo-1768321916980-7396c5407254?q=80&w=1600", 
      // ... 추가 이미지
    ],
    beforeImage: "https://images.unsplash.com/photo-1763218161026-dd8bcfa832de?q=80&w=1600",
    afterImage: "https://images.unsplash.com/photo-1627141234469-24711efb373c?q=80&w=1600"
  },
  {
    id: 2,
    title: "도심 주방 리모델링",
    type: "Remodeling",
    typeKr: "리모델링",
    year: "2025",
    location: "시애틀, WA",
    description: "기존 구조를 유지하면서 수납과 동선을 개선한 주방 리모델링 프로젝트입니다.",
    image: "https://images.unsplash.com/photo-1768321916980-7396c5407254?q=80&w=1080",
    images: ["https://images.unsplash.com/photo-1768321916980-7396c5407254?q=80&w=1600"],
    beforeImage: null, // before 이미지가 없는 경우
    afterImage: null
  },
  {
    id: 3,
    title: "미니멀 레지던스",
    type: "House",
    typeKr: "주택",
    year: "2024",
    location: "밴쿠버, BC",
    description: "불필요한 장식을 배제한 미니멀 디자인 주택입니다.",
    image: "https://images.unsplash.com/photo-1761870065047-f2da9429db23?q=80&w=1080",
    images: ["https://images.unsplash.com/photo-1761870065047-f2da9429db23?q=80&w=1600"],
    beforeImage: null,
    afterImage: null
  },
  // 4, 5, 6번 데이터도 위와 같은 형식으로 추가...
];