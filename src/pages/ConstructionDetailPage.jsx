/**
 * ConstructionDetailPage.jsx
 * AI + CCTV > 건설 세부 페이지
 * 동일 디자인 시스템 (Noto Sans KR · #1a1a1a · motion)
 * AgricultureDetailPage와 동일한 6섹션 구조
 *
 * 이미지 출처 (모두 Unsplash 무료 라이선스):
 *   t9eQm2y1tn8  – Glenov Brankovic   : 안전모+조끼 착용 작업자 콘크리트 그라인딩
 *   ESZRBtkQ_f8  – James Sullivan      : 크레인 저각 촬영 (위험구역 분위기)
 *   xQDGj1_83ro  – D.P. Alchapar       : 콘크리트 균열 클로즈업
 *   ZlKz2B__EZs  – Karolis Vaičiulis   : 일몰 배경 굴착기
 *   DWp5nUqTn6E  – Glenov Brankovic   : 건설 현장 팀 전경 (측정 테이프, 안전모)
 *   NMrUtSA7094  – CHUTTERSNAP        : 건설현장 항공뷰 (크레인·굴착기)
 *   u1KG_wZTnkg  – Sandy Millar       : 비계로 둘러싸인 신축 건물
 *   kO8f82u73Es  – Jan Huber          : 건설현장 전경 비계+크레인
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

/* ── fade-in on scroll ── */
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ══════════════════════════════════════
   데이터
══════════════════════════════════════ */

const FEATURE_CARDS = [
  {
    label: '안전장비 착용 감지',
    desc: '헬멧·안전조끼·안전화 등 보호구 착용 여부를 AI가 실시간으로 식별해 미착용 즉시 경보합니다.',
    // Glenov Brankovic – 안전모+조끼 착용 작업자가 콘크리트 그라인딩
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=80&fit=crop',
  },
  {
    label: '위험 구역 침입 감지',
    desc: '중장비 작동 반경·낙하 위험 구역 진입을 자동 감지하고 작업자·관리자에게 즉각 알림을 전송합니다.',
    // James Sullivan – 크레인 저각 촬영, 고위험 작업 분위기
    img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=700&q=80&fit=crop',
  },
  {
    label: '구조물 균열·결함 탐지',
    desc: '콘크리트·철골·비계 표면의 미세 균열과 결함을 영상 분석으로 조기에 발견해 붕괴 사고를 예방합니다.',
    // Daniela Paola Alchapar – 콘크리트 균열 클로즈업
    img: 'https://images.unsplash.com/photo-1587162146766-e06b1189b907?w=700&q=80&fit=crop',
  },
  {
    label: '중장비 동선 모니터링',
    desc: '지게차·굴착기·크레인의 이동 경로를 실시간 추적해 충돌 위험을 사전에 감지하고 경로를 최적화합니다.',
    // Karolis Vaičiulis – 일몰 배경의 굴착기
    img: 'https://images.unsplash.com/photo-1723134016539-2ee1950ec2c0?w=700&q=80&fit=crop',
  },
]

const PIPELINE_ITEMS = [
  {
    num: '01',
    title: '건설 현장 CCTV 인프라 구축 및 데이터 수집',
    body: '건설 현장 전역에 CCTV를 배치하고 실시간 영상 스트림을 통합 수집합니다. 공사 초기부터 현장 특성에 맞는 AI 학습 데이터를 축적하며, 설치 단계부터 맞춤형 모델 개발의 기반을 마련합니다. 엣지 디바이스를 활용해 네트워크 환경이 열악한 현장에서도 안정적으로 작동합니다.',
    // Glenov Brankovic – 건설 현장 팀 전경 (측정 테이프, 안전모, 조끼)
    img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&fit=crop',
  },
  {
    num: '02',
    title: 'AI · CCTV · 드론 · 컴퓨터 비전의 통합 안전 시스템 구현',
    body: '컴퓨터 비전과 AI를 결합하면 현장 관리자에게 사실상 360도 현장 시야를 제공하는 것과 같습니다. CCTV·드론·웨어러블 센서의 데이터를 실시간 통합 분석해 사고를 예방하고, 산업안전보건법 제36조 위험성평가 기준에 맞는 데이터 기반 의사결정을 실현합니다.',
    // CHUTTERSNAP – 건설현장 항공 뷰 (크레인·굴착기 내려다보는 시점)
    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&fit=crop',
  },
  {
    num: '03',
    title: '공종별 지속적인 모델 개선 및 고도화',
    body: '공사가 진행될수록 모델도 함께 진화합니다. 굴토·골조·마감 등 공종 변화에 따라 새로운 위험 유형을 추가하고, 현장별 설정 조정과 다양한 학습 기법을 중앙화된 데이터 관리 환경에서 손쉽게 적용해 반복 개선 주기를 단축합니다.',
    // Sandy Millar – 비계로 둘러싸인 신축 건물
    img: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800&q=80&fit=crop',
  },
]

const DATA_FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/>
        <rect x="12" y="2" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/>
        <rect x="2" y="12" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/>
        <rect x="12" y="12" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/>
      </svg>
    ),
    title: '멀티 카메라 타일링',
    desc: '수십 개 CCTV 피드를 동시에 처리하는 타일링 기술로 광범위한 현장을 빈틈없이 커버합니다. 소형 객체(헬멧·안전조끼)도 높은 정확도로 감지합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.6" strokeDasharray="4 2"/>
        <path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '야간·악천후 데이터 증강',
    desc: '야간 작업, 우천, 먼지, 안개 등 다양한 환경을 시뮬레이션한 이미지를 자동 생성해 실제 현장의 모든 조건에서 모델이 안정적으로 작동하도록 합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 6h14M4 11h10M4 16h7" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="17" cy="16" r="3" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '공종별 버전 관리',
    desc: '굴토·골조·마감 등 공종 변화에 따라 데이터셋 버전을 분리 관리합니다. 이전 버전과의 성능 비교를 통해 최적 모델을 빠르게 선별하고 현장에 즉시 배포합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 16l4-6 4 4 3-5 5 7H3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="16" cy="5" r="2" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '실시간 위험 진단 대시보드',
    desc: '현장 전체의 안전 지표·경보 이력·위험 구역 히트맵을 한 화면에서 파악합니다. 누적 데이터를 기반으로 반복 발생 위험 패턴을 예측하고 선제 대응합니다.',
  },
]

const STATS = [
  { num: '40%',     label: '안전 사고 감소율' },
  { num: '85%',     label: '보호구 미착용 감지 정확도' },
  { num: '27,000+', label: '건설 현장 학습 이미지' },
  { num: '실시간',   label: 'CCTV 영상 분석 속도' },
]

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function ConstructionDetailPage() {
  const isMobile = useIsMobile()
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveFeature(p => (p + 1) % FEATURE_CARDS.length), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fff; -webkit-tap-highlight-color: transparent; }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.12); }
      `}</style>

      <div style={p.page}>

        {/* ══════════════════════════════════════════
            SECTION 1 · 히어로
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '48px 20px 52px' : '72px 40px 80px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 36 : 72, alignItems: isMobile ? 'flex-start' : 'center' }}>

              {/* 좌측 텍스트 */}
              <div style={{ flex: '0 0 auto', maxWidth: isMobile ? '100%' : 480 }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>AI + CCTV · 건설 솔루션</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 34 : 58, letterSpacing: isMobile ? '-1px' : '-2.2px', marginBottom: isMobile ? 16 : 22 }}>
                    <span style={{ fontWeight: 900 }}>현장 안전</span>과<br/>생산성을 지키세요
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 28 : 40 }}>
                    컴퓨터 비전 AI가 보호구 착용·위험 구역 침입·구조물 결함을 실시간으로 분석해<br/>
                    건설 현장의 사고를 조기에 차단합니다.
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <motion.button style={p.ctaPrimary} whileTap={{ scale: 0.97 }} whileHover={{ background: '#333' }}>
                      지금 무료로 시작하기
                    </motion.button>
                    <motion.button style={p.ctaSecondary} whileTap={{ scale: 0.97 }}>
                      도입 상담 →
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* 우측: 인터랙티브 슬라이더 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                  <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: isMobile ? '4/3' : '16/9', position: 'relative', background: '#111' }}>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeFeature}
                        src={FEATURE_CARDS[activeFeature].img}
                        alt={FEATURE_CARDS[activeFeature].label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.55 }}
                      />
                    </AnimatePresence>
                    {/* 스캔 라인 */}
                    <motion.div
                      style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.4) 50%,transparent)', zIndex: 2 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* 레이블 */}
                    <AnimatePresence mode="wait">
                      <motion.div key={`label-${activeFeature}`} style={p.imgLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        {FEATURE_CARDS[activeFeature].label}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* 탭 피커 */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {FEATURE_CARDS.map((fc, i) => (
                      <button key={i} onClick={() => setActiveFeature(i)} style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: activeFeature === i ? '#1a1a1a' : '#f2f2f2', color: activeFeature === i ? '#fff' : '#888', fontSize: 11, fontWeight: activeFeature === i ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif", transition: 'all 0.2s', padding: '0 4px', lineHeight: 1.3 }}>
                        {fc.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 2 · 통계 바
        ══════════════════════════════════════════ */}
        <section style={{ background: '#1a1a1a', padding: isMobile ? '32px 20px' : '36px 40px' }}>
          <div style={{ ...p.inner, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
            {STATS.map((stat, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isMobile ? 28 : 38, fontWeight: 900, color: '#fff', letterSpacing: '-1.5px' }}>{stat.num}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 3 · 핵심 기능 4종
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>핵심 기능</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>사고보다<br/>항상 한 발 앞서세요</h2>
              <p style={{ ...p.sectionSub, maxWidth: 560 }}>컴퓨터 비전이 위험 징후를 조기에 포착해 즉각 대응할 수 있도록 돕습니다.</p>
            </FadeIn>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16, marginTop: isMobile ? 28 : 44 }}>
              {FEATURE_CARDS.map((card, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="hover-lift" style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '3/4', position: 'relative', backgroundImage: `url(${card.img})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#e0e0e0' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.05) 55%)' }}/>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{card.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{card.desc}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 4 · 파이프라인 01 · 02 · 03
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>도입 프로세스</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                공종·현장·규모<br/><span style={{ fontWeight: 900 }}>맞춤형 AI 모델</span> 개발 및 적용
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 500 }}>현장 특성에 특화된 맞춤형 AI 모델 개발을 통해 건설 CCTV에 즉시 적용됩니다.</p>
            </FadeIn>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 48 : 72, marginTop: isMobile ? 36 : 60 }}>
              {PIPELINE_ITEMS.map((item, i) => {
                const isEven = i % 2 === 0
                return (
                  <FadeIn key={i} delay={0.05}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : (isEven ? 'row' : 'row-reverse'), gap: isMobile ? 20 : 60, alignItems: 'center' }}>
                      {/* 이미지 */}
                      <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '48%' }}>
                        <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/10', position: 'relative' }}>
                          <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 20, letterSpacing: '0.04em' }}>
                            {item.num}
                          </div>
                        </div>
                      </div>
                      {/* 텍스트 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#ccc', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>STEP {item.num}</div>
                        <h3 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.8px', lineHeight: 1.25, marginBottom: 14 }}>{item.title}</h3>
                        <p style={{ fontSize: isMobile ? 14 : 15, color: '#666', lineHeight: 1.75 }}>{item.body}</p>
                      </div>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5 · 데이터 품질 기능 4종
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>데이터 품질</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>더 적은 데이터로<br/>더 높은 감지 정확도</h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>건설 현장 학습 데이터를 최대한 활용해 모델 성능을 극대화하는 핵심 기능입니다.</p>
            </FadeIn>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 12 : 18, marginTop: isMobile ? 28 : 48 }}>
              {DATA_FEATURES.map((feat, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={p.featureCard}>
                    <div style={p.featureIcon}>{feat.icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{feat.title}</div>
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{feat.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 6 · 보안 배지 + CTA
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px 60px' : '80px 40px 96px' }}>
          <div style={{ ...p.inner, textAlign: 'center' }}>
            <FadeIn>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f6f6f6', borderRadius: 24, padding: '8px 18px', marginBottom: 40 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L2 3.5v4C2 10.3 4.2 12.8 7 13c2.8-.2 5-2.7 5-5.5v-4L7 1z" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M4.5 7l1.5 1.5 3-3" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>SOC2 Type 2 인증 · 산업안전보건법 준수</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
                GRB LAB과<br/>함께 AI를 구축하세요
              </h2>
              <p style={{ ...p.heroSub, fontSize: 15, maxWidth: 440, margin: '0 auto 40px' }}>
                비계부터 크레인까지 —  GRBlab이 현장의 모든 시각 데이터를<br/>안전 인텔리전스로 전환합니다.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button style={p.ctaPrimary} whileTap={{ scale: 0.97 }} whileHover={{ background: '#333' }}>무료로 시작하기</motion.button>
                <motion.button style={p.ctaSecondary} whileTap={{ scale: 0.97 }}>영업팀 문의 →</motion.button>
              </div>
            </FadeIn>
          </div>
        </section>

      </div>
    </>
  )
}

/* ── 스타일 객체 ── */
const p = {
  page:         { background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif" },
  section:      { width: '100%' },
  inner:        { maxWidth: 1200, margin: '0 auto', width: '100%' },
  eyebrow:      { fontWeight: 600, color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14, fontSize: 12 },
  heroTitle:    { fontWeight: 800, color: '#1a1a1a', lineHeight: 1.08 },
  heroSub:      { color: '#999', lineHeight: 1.65, letterSpacing: '-0.2px', fontWeight: 500 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 },
  sectionTitle: { fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 14 },
  sectionSub:   { fontSize: 15, color: '#999', lineHeight: 1.65, marginTop: 8 },
  ctaPrimary:   { background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' },
  ctaSecondary: { background: 'none', color: '#1a1a1a', border: '1.5px solid #d8d8d8', borderRadius: 8, padding: '13px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  imgLabel:     { position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 13px', borderRadius: 20 },
  featureCard:  { display: 'flex', gap: 18, padding: '24px 24px', background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0', alignItems: 'flex-start' },
  featureIcon:  { flexShrink: 0, width: 44, height: 44, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}