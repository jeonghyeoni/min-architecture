import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Project } from './ProjectsList'; // ProjectsList에서 정의한 인터페이스 재사용

interface ProjectDetailProps {
  project: Project;
  prevProject: Project | null;
  nextProject: Project | null;
}

export function ProjectDetail({ project, prevProject, nextProject }: ProjectDetailProps) {
  const [beforeAfterSlider, setBeforeAfterSlider] = useState(50);

  // images 배열이 없거나 비어있을 경우를 대비한 안전 장치
  const galleryImages = project.images && project.images.length > 1 ? project.images.slice(1) : [];
  const mainImage = project.images && project.images.length > 0 ? project.images[0] : project.image;

  return (
    <div>
      {/* Back Navigation */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <a 
            href="/projects"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            프로젝트로 돌아가기
          </a>
        </div>
      </div>

      {/* Project Header */}
      <section className="py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <p className="text-sm tracking-wider text-gray-500 mb-4 font-medium uppercase">
                {project.typeKr}
              </p>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {project.title}
              </h1>
            </div>
            <div className="flex flex-col justify-end space-y-4">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-medium">연도</p>
                  <p className="text-lg text-gray-900">{project.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-medium">위치</p>
                  <p className="text-lg text-gray-900">{project.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Image */}
      <section className="px-6 lg:px-12 mb-24">
        <div className="max-w-7xl mx-auto">
          <div className="aspect-[16/9] bg-gray-100">
            <img 
              src={mainImage}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Project Description */}
      <section className="px-6 lg:px-12 mb-32">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm tracking-wider text-gray-500 mb-6 font-medium">프로젝트 개요</p>
          <div className="prose prose-lg max-w-none">
            {project.description && project.description.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-gray-600 leading-relaxed mb-6 text-[17px]">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {galleryImages.length > 0 && (
        <section className="px-6 lg:px-12 mb-32">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm tracking-wider text-gray-500 mb-8 font-medium">갤러리</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {galleryImages.map((image, index) => (
                <div key={index} className="aspect-[4/3] bg-gray-100">
                  <img 
                    src={image}
                    alt={`${project.title} 디테일 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Before and After Section - 데이터가 있을 때만 표시 */}
      {project.beforeImage && project.afterImage && (
        <section className="px-6 lg:px-12 mb-32">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm tracking-wider text-gray-500 mb-8 font-medium">전후 비교</p>
            <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden select-none group">
              {/* Before Image (Base) */}
              <div className="absolute inset-0">
                <img 
                  src={project.beforeImage}
                  alt="전"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* After Image (Overlay with Clip Path) */}
              <div 
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - beforeAfterSlider}% 0 0)` }}
              >
                <img 
                  src={project.afterImage}
                  alt="후"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Slider Control Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
                style={{ left: `${beforeAfterSlider}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-0.5 h-4 bg-gray-400" />
                    <div className="w-0.5 h-4 bg-gray-400" />
                  </div>
                </div>
              </div>

              {/* Invisible Range Input for Dragging */}
              <input
                type="range"
                min="0"
                max="100"
                value={beforeAfterSlider}
                onChange={(e) => setBeforeAfterSlider(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />

              {/* Labels */}
              <div className="absolute top-6 left-6 bg-black/50 text-white px-4 py-2 text-sm backdrop-blur-sm">
                BEFORE
              </div>
              <div className="absolute top-6 right-6 bg-black/50 text-white px-4 py-2 text-sm backdrop-blur-sm">
                AFTER
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Next Project CTA */}
      <section className="px-6 lg:px-12 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="border-t border-gray-200 pt-12">
            {/* Previous/Next Navigation */}
            <div className="flex items-center justify-between mb-12">
              {prevProject ? (
                <a 
                  href={`/projects/${prevProject.id}`}
                  className="group flex items-center gap-4 hover:opacity-70 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-gray-900 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500 mb-1">이전 프로젝트</p>
                    <p className="font-semibold text-gray-900 leading-snug">{prevProject.title}</p>
                  </div>
                </a>
              ) : (
                <div />
              )}

              {nextProject ? (
                <a 
                  href={`/projects/${nextProject.id}`}
                  className="group flex items-center gap-4 hover:opacity-70 transition-opacity"
                >
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">다음 프로젝트</p>
                    <p className="font-semibold text-gray-900 leading-snug">{nextProject.title}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-gray-900 transition-colors">
                    <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                </a>
              ) : (
                <div />
              )}
            </div>

            <a 
              href="/projects"
              className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors font-medium"
            >
              더 많은 프로젝트 보기
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}