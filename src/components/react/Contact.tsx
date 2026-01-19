import { Mail, Phone, MapPin } from 'lucide-react';

export function Contact() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-24 px-6 lg:px-12 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            함께 고민하겠습니다
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            주택 건축부터 증개축, 대수리, 작은 부분수리까지<br />
            편하게 연락주시면 친절히 상담해드립니다.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            {/* Left Column - Information */}
            <div>
              <div className="mb-16">
                <p className="text-sm tracking-wider text-gray-500 mb-3 font-medium">문의하기</p>
                <h2 className="text-4xl font-bold text-gray-900 mb-8">
                  상담 받아보세요
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  경기 용인 지역을 중심으로 주택 건축, 설비, 증개축, 대수리, 부분수리 등을 
                  전문으로 진행하고 있습니다.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  오랜 경력과 노하우를 바탕으로 합리적인 비용과 
                  안전하고 효율적인 시공을 약속드립니다.<br />
                  고객 만족을 최우선으로 하며, 작은 일 하나에도 최선을 다하겠습니다.
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-medium">전화</p>
                    <a 
                      href="tel:5551234567"
                      className="text-lg font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      0507-1359-6512
                    </a>
                    <p className="text-sm text-gray-500 mt-1">매일, 24시간 영업 · 연중무휴</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-medium">이메일</p>
                    <a 
                      href="mailto:hello@minarchitecture.com"
                      className="text-lg font-semibold text-gray-900 hover:text-gray-600 transition-colors break-all"
                    >
                      hello@minarchitecture.com
                    </a>
                    <p className="text-sm text-gray-500 mt-1">24시간 내 답변</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-medium">지역</p>
                    <p className="text-lg font-semibold text-gray-900">
                      경기도 용인시
                    </p>
                    <p className="text-sm text-gray-500 mt-1">수지·기흥·처인구 전 지역</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="bg-gray-50 p-8 lg:p-12">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                    placeholder="성함을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                    placeholder="010-0000-0000"
                  />
                </div>

                <div>
                  <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">
                    프로젝트 유형
                  </label>
                  <select
                    id="projectType"
                    name="projectType"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-white"
                  >
                    <option value="">프로젝트 유형 선택</option>
                    <option value="extension">증개축/대수리</option>
                    <option value="newbuild">주택건축</option>
                    <option value="repair">설비/부분수리</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    프로젝트 설명
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors resize-none"
                    placeholder="필요하신 작업 내용, 일정, 예산 등을 자유롭게 말씀해주세요..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white px-8 py-4 hover:bg-gray-800 transition-colors font-medium"
                >
                  문의 보내기
                </button>

                <p className="text-sm text-gray-500 text-center">
                  영업일 기준 하루 이내에 답변드리겠습니다
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-24 px-6 lg:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-sm tracking-wider text-gray-500 mb-3 font-medium">다음 단계</p>
            <h2 className="text-4xl font-bold text-gray-900">문의 후 진행 과정</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-semibold text-gray-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">초기 상담</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                필요하신 작업, 예산, 일정 등을 논의하기 위해<br />전화 또는 미팅을 통해 편하게 상담합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-semibold text-gray-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">현장 방문</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                직접 현장을 방문하여 꼼꼼히 확인하고<br />정확한 견적을 산출합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-semibold text-gray-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">견적서 제공</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                작업 범위와 일정, 비용이 담긴<br />상세한 견적서를 드립니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <p className="text-sm tracking-wider text-gray-500 mb-3 font-medium">자주 묻는 질문</p>
            <h2 className="text-4xl font-bold text-gray-900">FAQ</h2>
          </div>
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                어떤 작업을 하시나요?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                주택 건축, 설비, 증개축, 대수리, 부분수리 등 
                주거 공간과 관련된 모든 작업을 진행합니다. 
                큰 공사부터 작은 수리까지 고객님의 상황에 맞춰 최선을 다합니다.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                공사 기간은 얼마나 걸리나요?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                작업 규모에 따라 다릅니다. 
                부분수리는 며칠에서 1-2주, 증개축은 보통 2-3개월, 
                신축은 6개월 이상 소요됩니다. 정확한 일정은 현장 확인 후 안내드립니다.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                허가나 인허가도 도와주시나요?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                네, 건축 허가와 각종 인허가 업무도 함께 진행해드립니다. 
                복잡한 행정 절차는 저희가 처리하니 편하게 맡겨주세요.
              </p>
            </div>
            <div className="pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                어느 지역에서 작업하시나요?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                경기도 용인시를 중심으로 작업하고 있습니다. 
                수지구, 기흥구, 처인구 전 지역 방문 가능하며, 인접 지역도 상담 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}