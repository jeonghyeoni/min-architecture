import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Project } from './ProjectsList';

interface HomeProps {
  recentProjects: Project[];
}

export function Home({ recentProjects }: HomeProps) {
  
  const processSteps = [
    { number: "1", title: "상담", description: "고객님의 상황과 예산을 충분히 듣고 최적의 방안을 찾습니다." },
    { number: "2", title: "현장 확인", description: "직접 방문하여 꼼꼼히 확인하고 정확한 견적을 산출합니다." },
    { number: "3", title: "시공", description: "안전하고 효율적인 시공으로 고객 만족을 최우선합니다." },
    { number: "4", title: "완공", description: "마지막까지 책임지고 깨끗하게 마무리합니다." }
  ];

  const services = [
    { name: "주택 건축", filter: "NewBuild" },
    { name: "인테리어", filter: "Interior" },
    { name: "방수", filter: "Waterproofing" },
    { name: "증개축 · 대수리", filter: "Extension" },
    { name: "부분수리 · 설비", filter: "Repair" }
  ];

  const featuredProjects = recentProjects || [];
  const heroImage = featuredProjects[0]?.image || "https://images.unsplash.com/photo-1627141234469-24711efb373c?q=80&w=1600";

  return (
    <div className="bg-background">
      {/* Hero Section - Background Image with Blur */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Image with Blur */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={heroImage}
            alt=""
            className="w-full h-full object-cover scale-110 blur-sm"
          />
          <div className="absolute inset-0 bg-foreground/40" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl px-6 py-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-background mb-8 tracking-tight text-balance leading-[1.1]">
            작은 일 하나에도<br />
            <span className="text-background/80">최선을 다합니다</span>
          </h1>
          <p className="text-lg md:text-xl text-background/80 max-w-2xl mx-auto leading-relaxed mb-12">
            용인시 처인구에서 주택 건축, 인테리어, 설비,<br className="hidden md:block" />
            증개축, 대수리, 부분수리, 방수를 전문으로 합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="/projects"
              className="group inline-flex items-center gap-3 bg-background text-foreground px-8 py-4 hover:bg-background/90 transition-all font-medium"
            >
              작업 둘러보기
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="/contact"
              className="inline-flex items-center gap-3 text-background border border-background/50 hover:bg-background hover:text-foreground transition-colors font-medium px-8 py-4"
            >
              문의하기
            </a>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <p className="text-sm tracking-widest text-muted uppercase mb-4 font-medium">Projects</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
                최근 프로젝트
              </h2>
            </div>
            <a 
              href="/projects"
              className="group inline-flex items-center gap-2 text-foreground hover:text-muted transition-colors font-medium w-fit"
            >
              전체 보기
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <a 
                key={project.id}
                href={`/projects/${project.id}`}
                className="group"
              >
                <div className="aspect-[4/5] bg-card mb-6 overflow-hidden">
                  <img 
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
                <p className="text-sm text-muted mb-2 uppercase tracking-wider">{project.typeKr}</p>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-muted transition-colors leading-snug">
                  {project.title}
                </h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Card Style */}
      <section className="py-24 md:py-32 px-6 lg:px-12 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <p className="text-sm tracking-widest text-muted uppercase mb-4 font-medium">Process</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
              진행 과정
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div 
                key={step.number} 
                className="group bg-card border border-border p-8 hover:border-foreground/20 transition-colors"
              >
                <div className="text-6xl font-light text-border group-hover:text-accent transition-colors mb-8">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{step.title}</h3>
                <p className="text-muted leading-relaxed text-[15px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section - Split Layout */}
      <section className="py-24 md:py-32 px-6 lg:px-12 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/5] overflow-hidden">
                <img 
                  src="https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20241104_3%2F17306895281458kUco_JPEG%2F%25B9%25CE%25B0%25C7%25C3%25E02.jpg"
                  alt="민건축 작업 현장"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 flex flex-col justify-center">
              <p className="text-sm tracking-widest text-muted uppercase mb-4 font-medium">About</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-8 leading-tight text-balance">
                오랜 경력과 노하우로<br />신뢰를 쌓아갑니다
              </h2>
              <div className="space-y-5 text-muted leading-relaxed mb-10">
                <p>
                  15년 이상의 주거 및 상업 건축 경험을 바탕으로, 
                  최상의 시공과 디테일에 대한 관심으로 고객의 비전을 실현합니다.
                </p>
                <p>
                  합리적인 비용으로 안전하고 효율적인 시공을 진행하며,
                  무엇보다 고객 만족을 최우선으로 생각합니다.
                </p>
              </div>
              <a 
                href="/contact"
                className="group inline-flex items-center gap-2 text-foreground hover:text-muted transition-colors font-medium w-fit"
              >
                문의하기
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <p className="text-sm tracking-widest text-muted uppercase mb-4 font-medium">Services</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground leading-tight text-balance">
                전문 분야
              </h2>
            </div>
            <div className="flex flex-col">
              {services.map((service) => (
                <a 
                  key={service.name}
                  href={`/projects?filter=${service.filter}`}
                  className="group flex items-center justify-between py-6 border-b border-border hover:pl-4 transition-all"
                >
                  <span className="text-xl md:text-2xl font-medium text-foreground">{service.name}</span>
                  <ArrowUpRight className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-24 md:py-32 px-6 lg:px-12 bg-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm tracking-widest text-background/60 uppercase mb-6 font-medium">Contact</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-background mb-8 leading-tight text-balance">
            고객님의 공간,<br />함께 고민하겠습니다
          </h2>
          <p className="text-lg text-background/70 mb-12 leading-relaxed max-w-xl mx-auto">
            주택 건축부터 작은 수리까지, 편하게 상담해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 bg-background text-foreground px-8 py-4 hover:bg-background/90 transition-colors font-medium"
            >
              문의하기
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-background/30 text-background px-8 py-4 hover:bg-background hover:text-foreground transition-colors font-medium"
            >
              작업 둘러보기
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
