/**
 * HeavyEquipmentCollisionDetailPage.jsx
 * AI CCTV > 중장비 충돌 예방 세부 페이지
 * 제공 이미지 6장 기반 Before → After 스토리 구조
 *
 * 이미지 경로 매핑 (public/riskimage/ 폴더에 복사 필요):
 *   collision-01-before.jpg  ← 제공된_caMqny5e6q.jpg  (아무 보호 없는 현장)
 *   collision-02-zones.jpg   ← 제공된_Itj48o9yxu.jpg  (3단계 구역 시스템 전경)
 *   collision-03-beacon.png  ← 스크린샷_15_39_54.png   (장비 지붕 경보 리시버 클로즈업)
 *   collision-04-worker.jpg  ← 제공된_lC9pBecB1Y.jpg  (작업자 위험구역 진입 순간)
 *   collision-05-helmet.jpg  ← 제공된_OoZQNsrPiQ.jpg  (헬멧 태그 클로즈업)
 *   collision-06-full.jpg    ← 제공된_FV0JSTv2a3.jpg  (전체 연동 시스템 항공뷰)
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
   히어로 슬라이더 — 시스템 활성 이미지 4장
══════════════════════════════════════ */
const HERO_SLIDES = [
  { label: '3단계 안전 구역',   img: '/riskimage/collision-02-zones.jpg' },
  { label: '장비 경보 리시버',    img: '/riskimage/collision-04-worker.jpg' },
  { label: '헬멧 태그 신호',    img: '/riskimage/collision-05-helmet.jpg' },
  { label: '전체 연동 시스템',  img: '/riskimage/collision-06-full.jpg' },
]

/* ══════════════════════════════════════
   KPI 통계
══════════════════════════════════════ */
const STATS = [
  { num: '52.1%',  label: '건설업 부딪힘 사고 비중 (고용노동부)' },
  { num: '5초',    label: '비침습 자석 부착 완료 시간' },
  { num: '3단계',  label: '자동 설정 안전 구역 (녹·황·적)' },
  { num: '2중',    label: '장비 리시버 + 헬멧 태그 독립 경보' },
]

/* ══════════════════════════════════════
   6장 이미지 스토리 파이프라인
══════════════════════════════════════ */
const STORY_ITEMS = [
  {
    num: '01',
    badge: '문제 상황',
    title: '아무런 보호 없이\n장비 곁에 서 있는 작업자',
    body: '건설현장에서 굴삭기 작업 반경 안에 작업자가 있어도 운전석에서는 보이지 않습니다. 연간 건설업 부딪힘 사망사고의 52.1%가 바로 이 순간 — "보이지 않아서" 발생합니다. 장비는 계속 움직이고, 작업자는 소리도 듣지 못하고, 어떤 경보도 없습니다.',
    img: '/riskimage/collision-01-before.jpg',
    accent: '#ff3b30',
  },
  {
    num: '02',
    badge: '솔루션 개요',
    title: '장비를 중심으로\n3단계 안전 구역이 자동 설정됩니다',
    body: '시스템이 켜지는 순간, 장비 반경에 3개의 보호막이 형성됩니다. 녹색(안전 구역) → 노란색(주의 구역) → 빨간색(위험 구역). 작업자가 안쪽 구역으로 진입할수록 경보 강도가 단계적으로 높아집니다. 구역 경계 반경은 현장 공종과 장비 크기에 맞게 조정 가능합니다.',
    img: '/riskimage/collision-02-zones.jpg',
    accent: '#34c759',
  },
  {
    num: '03',
    badge: '장비 부착',
    title: '자석 하나로 5분 만에\n붙이는 경보 리시버',
    body: '임대 장비라도 문제없습니다. 강력 자석 브라켓으로 장비 지붕에 부착하는 무선 경보 리시버는 배선 작업이 전혀 필요 없습니다. 헬멧 태그 신호를 실시간 수신해 설정 거리 이내 진입 시 조명 경보와 진동을 동시에 출력합니다. 장비 이동·교체 시 5분 내 탈거·재부착이 가능합니다.',
    img: '/riskimage/collision-03-beacon.png',
    accent: '#ff9500',
  },
  {
    num: '04',
    badge: '경보 발생',
    title: '작업자가 위험 구역에\n진입하는 그 순간',
    body: '헬멧 태그와 장비 리시버가 서로 신호를 교환하다가, 설정 거리 이내로 가까워지면 즉시 경보가 발생합니다. 운전석 경보기는 점등·진동하고, 작업자 헬멧 태그도 동시에 진동합니다. 시각·청각·촉각 3중 경보로 소음이 심한 현장에서도 즉각 인지가 가능합니다.',
    img: '/riskimage/collision-04-worker.jpg',
    accent: '#ff3b30',
  },
  {
    num: '05',
    badge: '헬멧 태그',
    title: '헬멧에 붙이는 순간부터\n작동하는 안전망',
    body: '작업자는 헬멧에 태그를 부착하기만 하면 됩니다. 별도 앱·설정·교육 없이  현장의 모든 장비 리시버와  자동 페어링 스캔 됩니다. ',
    img: '/riskimage/collision-05-helmet.jpg',
    accent: '#007aff',
  },
  {
    num: '06',
    badge: '전체 연동',
    title: '장비 리시버 + 헬멧 태그가\n하나의 안전망으로 연결됩니다',
    body: '현장의 모든 장비 리시버와 작업자 헬멧 태그가 게이트웨이를 통해 실시간 연동됩니다. 관리자 대시보드에서는 장비별 경보 이력, 위험 구역 진입 빈도, 태그 착용 현황을 한눈에 파악할 수 있습니다. 장비가 추가되거나 공사 구역이 바뀌어도 무선 페어링만으로 즉시 확장됩니다.',
    img: '/riskimage/collision-06-full.jpg',
    accent: '#34c759',
  },
]

/* ══════════════════════════════════════
   시스템 구성 요약 카드 4종
══════════════════════════════════════ */
const SYSTEM_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="7" stroke="#1a1a1a" strokeWidth="1.6"/>
        <circle cx="11" cy="11" r="4" stroke="#1a1a1a" strokeWidth="1.3" strokeDasharray="3 2"/>
        <circle cx="11" cy="11" r="1.5" fill="#1a1a1a"/>
      </svg>
    ),
    title: '3단계 자동 구역 설정',
    desc: '녹(안전) · 황(주의) · 적(위험) 3개 동심원 구역이 장비 리시버 기준으로 자동 형성됩니다. 구역 반경은 현장 공종과 장비 크기에 맞게 조정 가능합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3c-1.5 2-4 2.5-6 2v6c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V5c-2-.5-4.5-2-6-2z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '비침습 자석 부착 리시버',
    desc: '드릴·볼트 없이 자석으로 장비 지붕에 5분 내 부착·탈거합니다. 임대 장비 원상 복구가 필수인 현장에서도 계약 갈등 없이 적용됩니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M7 6a4 4 0 0 1 8 0v2H7V6z" stroke="#1a1a1a" strokeWidth="1.6"/>
        <rect x="4" y="8" width="14" height="10" rx="2" stroke="#1a1a1a" strokeWidth="1.6"/>
        <circle cx="11" cy="13" r="1.5" fill="#1a1a1a"/>
      </svg>
    ),
    title: '헬멧 태그 임의 off 방지',
    desc: '작업자가 태그를 끄거나 분리하면 관리자 앱에 즉시 알림이 전송됩니다. 운영 무력화 리스크를 설계 단계에서 원천 차단합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 16l4-6 4 4 3-5 5 7H3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="16" cy="5" r="2" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '경보 이력 대시보드',
    desc: '경보 발생 이력·위험 구역 진입 빈도·태그 착용 현황을 실시간으로 집계합니다. 반복 발생 구역은 히트맵으로 시각화해 동선 재설계에 활용합니다.',
  },
]

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function HeavyEquipmentCollisionDetailPage() {
  const isMobile = useIsMobile()
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveSlide(p => (p + 1) % HERO_SLIDES.length), 3200)
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
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
  >
    <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>
      중장비 충돌 예방 시스템
    </div>

    <h1
      style={{
        ...p.heroTitle,
        fontSize: isMobile ? 26 : 38,
        letterSpacing: isMobile ? '-1px' : '-2.2px',
        marginBottom: isMobile ? 16 : 22,
        fontWeight: 400
      }}
    >
      <span style={{ fontWeight: 900 }}>보이지 않던</span> 중장비 주변 위험을<br/>
      AI와 마이크로 네트워크가<br/>
      상시 감지합니다
    </h1>

    <p
      style={{
        ...p.heroSub,
        fontSize: isMobile ? 14 : 16,
        marginBottom: isMobile ? 28 : 40,
      }}
    >
      장비 리시버 + 헬멧 태그 2중 경보로<br/>
      굴삭기·지게차·덤프트럭·크레인 주변<br/>
      충돌 위험을 실시간으로 감지하고 경고합니다.
    </p>

    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <motion.button
        style={p.ctaPrimary}
        whileTap={{ scale: 0.97 }}
        whileHover={{ background: '#333' }}
      >
        지금 무료로 시작하기
      </motion.button>

      <motion.button
        style={p.ctaSecondary}
        whileTap={{ scale: 0.97 }}
      >
        도입 상담 →
      </motion.button>
    </div>
  </motion.div>
</div>

              {/* 우측 슬라이더 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                  <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: isMobile ? '4/3' : '16/9', position: 'relative', background: '#111' }}>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeSlide}
                        src={HERO_SLIDES[activeSlide].img}
                        alt={HERO_SLIDES[activeSlide].label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.55 }}
                      />
                    </AnimatePresence>
                    {/* 스캔 라인 */}
                    <motion.div
                      style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.35) 50%,transparent)', zIndex: 2 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* 경보 펄스 */}
                    <motion.div
                      style={{ position: 'absolute', top: 14, right: 14, width: 12, height: 12, borderRadius: '50%', background: '#ff9500', zIndex: 3 }}
                      animate={{ scale: [1, 1.7, 1], opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <AnimatePresence mode="wait">
                      <motion.div key={`lbl-${activeSlide}`} style={p.imgLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        {HERO_SLIDES[activeSlide].label}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {/* 탭 피커 */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {HERO_SLIDES.map((s, i) => (
                      <button key={i} onClick={() => setActiveSlide(i)} style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: activeSlide === i ? '#1a1a1a' : '#f2f2f2', color: activeSlide === i ? '#fff' : '#888', fontSize: 11, fontWeight: activeSlide === i ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif", transition: 'all 0.2s', padding: '0 4px', lineHeight: 1.3 }}>
                        {s.label}
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
            SECTION 3 · 6장 이미지 스토리 파이프라인
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>작동 원리</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                위험이 사고가 되기 전<br/><span style={{ fontWeight: 900 }}>6단계로 차단합니다</span>
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>문제 인식부터 전체 연동까지 — 현장의 실제 이미지로 확인하는 충돌 예방 시스템 작동 흐름입니다.</p>
            </FadeIn>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 52 : 80, marginTop: isMobile ? 40 : 64 }}>
              {STORY_ITEMS.map((item, i) => {
                const isEven = i % 2 === 0
                return (
                  <FadeIn key={i} delay={0.04}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : (isEven ? 'row' : 'row-reverse'), gap: isMobile ? 20 : 64, alignItems: 'center' }}>

                      {/* 이미지 */}
                      <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '50%' }}>
                        <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '16/10', position: 'relative', boxShadow: '0 6px 32px rgba(0,0,0,0.1)' }}>
                          <img
                            src={item.img}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 20, letterSpacing: '0.04em' }}>
                              {item.num}
                            </div>
                            <div style={{ background: item.accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.03em' }}>
                              {item.badge}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 텍스트 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 28, height: 2, background: item.accent, borderRadius: 2 }}/>
                          <div style={{ fontSize: 11, color: '#bbb', fontWeight: 700, letterSpacing: '0.08em' }}>STEP {item.num}</div>
                        </div>
                        <h3 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 18, whiteSpace: 'pre-line' }}>
                          {item.title}
                        </h3>
                        <p style={{ fontSize: isMobile ? 14 : 15, color: '#666', lineHeight: 1.8 }}>
                          {item.body}
                        </p>
                      </div>

                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 4 · 시스템 구성 카드 4종
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>시스템 구성</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>임대 장비도<br/>당장 내일부터 적용됩니다</h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>계약 구조를 바꾸지 않아도, 장비를 개조하지 않아도 — 현장 조건 그대로 도입합니다.</p>
            </FadeIn>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 12 : 18, marginTop: isMobile ? 28 : 48 }}>
              {SYSTEM_CARDS.map((card, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={p.featureCard}>
                    <div style={p.featureIcon}>{card.icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{card.title}</div>
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{card.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5 · CTA
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px 60px' : '80px 40px 96px' }}>
          <div style={{ ...p.inner, textAlign: 'center' }}>
            <FadeIn>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f6f6f6', borderRadius: 24, padding: '8px 18px', marginBottom: 40 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L2 3.5v4C2 10.3 4.2 12.8 7 13c2.8-.2 5-2.7 5-5.5v-4L7 1z" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M4.5 7l1.5 1.5 3-3" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>SOC2 Type 2 인증 · 산업안전보건법 준수 · 안전보건공단 스마트장비 지원사업 적용 가능</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
                GRB LAB과<br/>함께 구축하세요
              </h2>
              <p style={{ ...p.heroSub, fontSize: 15, maxWidth: 440, margin: '0 auto 40px' }}>
                굴삭기부터 크레인까지 — 장비 리시버 + 헬멧 태그로<br/>
                현장의 모든 충돌 위험을 접근 즉시 차단합니다.
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