import { Phone, MapPin } from 'lucide-react';
import { FAQS } from '../../data/faq';
import { NAVER_PLACE_URL } from '../../lib/seo';

export function Contact() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-24 px-6 lg:px-12 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          {/* h1에 '용인 처인구 + 상담/견적' 검색 의도를 그대로 담는다. */}
          <h1 className="text-gray-900 mb-6 leading-tight">
            <span className="block text-base md:text-lg font-medium text-gray-500 mb-4">
              용인 처인구 리모델링 · 집수리 상담
            </span>
            <span className="block text-5xl md:text-6xl font-bold">
              함께 고민하겠습니다
            </span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            주택 건축부터 인테리어, 증개축, 대수리, 작은 부분수리까지<br />
            편하게 연락주시면 친절히 상담해드립니다.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 px-6 lg:px-12">
        {/* max-w-3xl mx-auto: 너비를 제한하고 중앙 정렬 */}
        {/* text-center: 글자들을 가운데 정렬 */}
        <div className="max-w-3xl mx-auto text-center">
          
          <div className="mb-16">
            <p className="text-sm tracking-wider text-gray-500 mb-3 font-medium">문의하기</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              상담 받아보세요
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              용인시 처인구에서 주택 건축, 설비, 증개축, 대수리, 부분수리 등을<br className="hidden md:block" />
              전문으로 진행하고 있습니다.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              오랜 경력과 노하우를 바탕으로 합리적인 비용과<br className="hidden md:block" />
              안전하고 효율적인 시공을 약속드립니다.
            </p>
            <p className="text-gray-600 leading-relaxed">
              고객 만족을 최우선으로 하며, 작은 일 하나에도 최선을 다하겠습니다.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            
            {/* 전화번호 */}
            {/* justify-center: 아이콘과 글자를 화면 중앙으로 배치 */}
            {/* text-left: 아이콘 옆의 글자들은 왼쪽 정렬 유지 (가독성 위해) */}
            <div className="flex gap-4 justify-center text-left items-start">
              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0 rounded-full">
                <Phone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 font-medium">전화</p>
                <a 
                  href="tel:050713596512"
                  className="text-lg font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                >
                  0507-1359-6512
                </a>
                <p className="text-sm text-gray-500 mt-1">매일, 24시간 영업 · 연중무휴</p>
              </div>
            </div>

            {/* 네이버 플레이스 - 사이트와 플레이스를 서로 연결해 같은 업체로 묶는다 */}
            <div className="flex gap-4 justify-center text-left items-start">
              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0 rounded-full">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 font-medium">네이버 플레이스</p>
                <a
                  href={NAVER_PLACE_URL}
                  target="_blank"
                  rel="noopener"
                  className="text-lg font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                >
                  민건축 플레이스 바로가기
                </a>
                <p className="text-sm text-gray-500 mt-1">길찾기 · 리뷰 확인</p>
              </div>
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
            <h2 className="text-4xl font-bold text-gray-900">
              용인 인테리어·집수리 자주 묻는 질문
            </h2>
          </div>
          {/* 화면과 FAQPage 구조화 데이터가 어긋나면 검색엔진이 무시하므로
              양쪽 모두 src/data/faq.ts 한 곳만 바라보게 한다. */}
          <div className="space-y-8">
            {FAQS.map((faq, index) => (
              <div
                key={faq.question}
                className={index === FAQS.length - 1 ? 'pb-8' : 'border-b border-gray-200 pb-8'}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}