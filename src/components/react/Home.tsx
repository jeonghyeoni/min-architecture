import { ArrowRight } from 'lucide-react';
// 1. ProjectsList에서 정의했던 Project 타입을 가져옵니다.
import type { Project } from './ProjectsList';

// 2. Props 타입을 정의합니다.
interface HomeProps {
  recentProjects: Project[];
}

// 3. 함수 인자에서 { recentProjects }를 구조 분해 할당으로 받아옵니다.
export function Home({ recentProjects }: HomeProps) {
  
  const processSteps = [
    { number: "01", title: "상담", description: "고객님의 상황과 예산을 충분히 듣고\n최적의 방안을 찾습니다." },
    { number: "02", title: "현장 확인", description: "직접 방문하여 꼼꼼히 확인하고\n정확한 견적을 산출합니다." },
    { number: "03", title: "시공", description: "안전하고 효율적인 시공으로\n고객 만족을 최우선합니다." },
    { number: "04", title: "완공", description: "마지막까지 책임지고\n깨끗하게 마무리합니다." }
  ];

  // recentProjects가 아직 로드되지 않았거나 없을 경우를 대비해 안전장치 추가
  const featuredProjects = recentProjects || [];
  // 메인 이미지가 없을 경우를 대비한 기본 이미지 (에러 방지용)
  const heroImage = featuredProjects[0]?.image || "https://images.unsplash.com/photo-1627141234469-24711efb373c?q=80&w=1600";

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <img 
            src={heroImage}
            alt="Modern architecture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white max-w-3xl px-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
              작은 일 하나에도<br />최선을 다합니다
            </h1>
            <p className="text-lg md:text-xl mb-12 text-white/90 leading-relaxed">
              용인시 처인구 주택 건축, 인테리어, 설비, 증개축, 대수리, 부분수리, 방수 전문
            </p>
            <a 
              href="/projects"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 hover:bg-gray-100 transition-colors font-medium"
            >
              작업 둘러보기
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <p className="text-sm tracking-wider text-gray-500 mb-3 font-medium">주요 작업</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">최근 프로젝트</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 여기서 'project' implicitly has an 'any' type 오류가 사라질 것입니다.
               위에서 recentProjects: Project[] 라고 타입을 지정했기 때문입니다.
            */}
            {featuredProjects.map((project) => (
              <a 
                key={project.id}
                href={`/projects/${project.id}`}
                className="group"
              >
                <div className="aspect-[3/4] bg-gray-100 mb-6 overflow-hidden">
                  <img 
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mb-2">{project.typeKr}</p>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-gray-600 transition-colors leading-snug">
                  {project.title}
                </h3>
              </a>
            ))}
          </div>
          <div className="mt-16 text-center">
            <a 
              href="/projects"
              className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors font-medium"
            >
              전체 프로젝트 보기
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 px-6 lg:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-sm tracking-wider text-gray-500 mb-3 font-medium">작업 방식</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">진행 과정</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {processSteps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="text-5xl font-light text-gray-300 mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-line">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-wider text-gray-500 mb-3 font-medium">소개</p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                오랜 경력과 노하우로<br />신뢰를 쌓아갑니다
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                용인시 처인구에서 주택 건축, 인테리어, 설비, 증개축, 대수리, 부분수리, 방수를 전문으로 하는 민건축입니다.<br />
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                15년 이상의 주거 및 상업 건축 경험을 바탕으로, 
                최상의 시공과 디테일에 대한 관심으로 고객의 비전을 실현합니다.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                합리적인 비용으로 안전하고 효율적인 시공을 진행하며,<br />
                무엇보다 고객 만족을 최우선으로 생각합니다.<br />작은 일 하나에도 최선을 다하겠습니다.
              </p>
              <a 
                href="/contact"
                className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors font-medium"
              >
                문의하기
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="aspect-[4/5] bg-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1693661391267-ad955aeeb564?q=80&w=1080"
                alt="Construction workspace"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-32 px-6 lg:px-12 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            고객님의 공간,<br />함께 고민하겠습니다
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed">
            주택 건축부터 작은 수리까지, 편하게 상담해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 hover:bg-gray-100 transition-colors font-medium"
            >
              문의하기
            </a>
            <a 
              href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-white text-white px-8 py-4 hover:bg-white hover:text-gray-900 transition-colors font-medium"
            >
              작업 둘러보기
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}