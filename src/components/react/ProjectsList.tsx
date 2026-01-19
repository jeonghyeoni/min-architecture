import { useState, useEffect } from 'react';

export interface Project {
  id: string | number;
  title: string;
  type: string;
  typeKr: string;
  year: string;
  location: string;
  image: string;
  description?: string;
  images?: string[];
  beforeImage?: string | null;
  afterImage?: string | null;
}

interface ProjectsListProps {
  projects: Project[];
}

// 1. 카테고리 타입 변경
type Category = 'All' | 'Extension' | 'NewBuild' | 'Repair';

export function ProjectsList({ projects }: ProjectsListProps) {
  const [activeFilter, setActiveFilter] = useState<Category>('All');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filter = params.get('filter') as Category;
      if (filter) setActiveFilter(filter);
    }
  }, []);

  const updateFilter = (category: Category) => {
    setActiveFilter(category);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (category === 'All') {
        url.searchParams.delete('filter');
      } else {
        url.searchParams.set('filter', category);
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const filteredProjects = activeFilter === 'All' 
    ? projects 
    : projects.filter((p) => p.type === activeFilter);

  // 2. 필터 버튼 목록 변경
  const categories: { key: Category; label: string }[] = [
    { key: 'All', label: '전체' },
    { key: 'Extension', label: '증개축/대수리' }, // Remodeling -> Extension
    { key: 'NewBuild', label: '주택건축' },       // House -> NewBuild
    { key: 'Repair', label: '설비/부분수리' }     // Commercial -> Repair
  ];

  return (
    <div className="py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">프로젝트</h1>
          <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
            민건축의 주요 작업들을 소개합니다.
          </p>
        </div>

        <div className="mb-16 flex flex-wrap gap-4">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => updateFilter(category.key)}
              className={`px-6 py-3 transition-colors font-medium ${
                activeFilter === category.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {filteredProjects.map((project) => (
            <a 
              key={project.id}
              href={`/projects/${project.id}`}
              className="group block"
            >
              <div className="aspect-[4/5] bg-gray-100 mb-6 overflow-hidden">
                <img 
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  {project.typeKr} • {project.year}
                </p>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-gray-600 transition-colors leading-snug">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-500">{project.location}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}