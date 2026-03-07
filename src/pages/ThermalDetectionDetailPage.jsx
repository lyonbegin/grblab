/**
 * ThermalDetectionDetailPage.jsx
 * AI + CCTV > 열화상 감지 · 화재 예방 시스템
 * HeavyEquipmentCollisionDetailPage와 동일한 5섹션 구조
 *
 * 이미지 경로 (public/riskimage/ 에 배치):
 *   thermal-01-smoke.png    ← ChatGPT_Image_11_34_57.png   (연기감지기 + 소화기)
 *   thermal-02-pipe.png     ← ChatGPT_Image_08_10_05.png   (배관 정상 vs 열화상 누출)
 *   thermal-03-battery.png  ← ChatGPT_Image_08_09_38.png   (배터리/전기설비 열화상)
 *   thermal-04-motor.png    ← ChatGPT_Image_08_08_32.png   (모터/기계설비 열화상)
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
   히어로 슬라이더
══════════════════════════════════════ */
const HERO_SLIDES = [
  { label: '기존 감지의 한계',      img: '/riskimage/thermal-01-smoke.png' },
  { label: '배관 열화상 이상 감지', img: '/riskimage/thermal-02-pipe.png' },
  { label: '전기설비 과열 감지',    img: '/riskimage/thermal-03-battery.png' },
  { label: '모터·기계 과열 감지',   img: '/riskimage/thermal-04-motor.png' },
]

/* ══════════════════════════════════════
   KPI 통계
══════════════════════════════════════ */
const STATS = [
  { num: '23명',   label: '아리셀 화재 사망자 — 연기감지기·소화설비 모두 있었습니다' },
  { num: '15년',   label: '아리셀 CEO 징역형 — 중대재해처벌법 역대 최고 구형' },
  { num: '72시간', label: '발화 전 열화상으로 이상 온도 감지 가능 평균 시간' },
  { num: '0.1°C',  label: '열화상 카메라 온도 분해능 — 육안 불가 초기 과열 포착' },
]

/* ══════════════════════════════════════
   4장 이미지 스토리 파이프라인
══════════════════════════════════════ */
const STORY_ITEMS = [
  {
    num: '01',
    badge: '문제 상황',
    title: '아리셀에도 연기감지기와\n소화설비는 있었습니다',
    body: '2024년 아리셀 공장 화재 — 23명이 사망했습니다. 현장에는 법이 요구하는 연기감지기와 소화설비가 모두 갖춰져 있었습니다. CEO는 중대재해처벌법으로 징역 15년을  선고 받았습니다. 연기감지기는 연소가 시작된 이후에야 작동합니다. 배터리 셀 내부 단락·전기 접촉 불량·배관 누출은 연기가 나기 훨씬 전, 온도 이상으로 먼저 신호를 보냅니다. 화재 대응이 아니라 화재 예방이 필요한 이유입니다.',
    img: '/riskimage/thermal-01-smoke.png',
    accent: '#ff3b30',
  },
  {
    num: '02',
    badge: '배관 열화상',
    title: '육안으로 멀쩡한 배관이\n열화상에서는 발화점을 드러냅니다',
    body: '왼쪽 사진의 배관은 외관상 정상처럼 보입니다. 그러나 같은 배관을 열화상 카메라로 촬영하면 오른쪽처럼 누출·마찰·과압 지점이 오렌지-적색으로 선명하게 드러납니다. AI가 임계 온도를 초과하는 지점을 자동으로 감지하고 관리자에게 즉시 알립니다.',
    img: '/riskimage/thermal-02-pipe.png',
    accent: '#ff9500',
  },
  {
    num: '03',
    badge: '전기설비 열화상',
    title: '배터리·전기함이\n내부에서 먼저 타기 시작합니다',
    body: '대형 배터리 설비와 전기 분전함은 내부 단락·과전류·접촉 불량이 발생해도 외관에 변화가 없습니다. 열화상 카메라는 도어를 열지 않고도 내부의 국소 과열 지점을 실시간으로 포착합니다. ESS 화재·전기 화재의 대부분은 이 단계에서 미리 차단할 수 있습니다.',
    img: '/riskimage/thermal-03-battery.png',
    accent: '#ff3b30',
  },
  {
    num: '04',
    badge: '기계설비 열화상',
    title: '모터·회전체 과열이\n열화상으로 즉시 포착됩니다',
    body: '베어링 마모·축 정렬 불량·과부하 운전 중인 모터와 회전 설비는 표면 온도가 먼저 상승합니다. 정상 상태(왼쪽)와 과열 상태(오른쪽)의 온도 차이를 AI가 자동으로 비교·분석해 설비 고장과 화재 위험을 동시에 예보합니다. 예방 정비 비용을 획기적으로 절감합니다.',
    img: '/riskimage/thermal-04-motor.png',
    accent: '#007aff',
  },
]

/* ══════════════════════════════════════
   시스템 구성 카드 4종
══════════════════════════════════════ */
const SYSTEM_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="7" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M11 7v5l3 2" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 4l1.5 1.5M16.5 4L18 5.5M4 18l1.5-1.5M16.5 18L18 16.5" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: '24/7 AI 자동 온도 모니터링',
    desc: '열화상 카메라가 촬영한 영상을 AI가 실시간으로 분석합니다. 사전에 설정한 임계 온도를 초과하는 지점이 감지되면 즉시 알림을 발송합니다. 사람이 없는 야간·주말에도 중단 없이 작동합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M5 17L3 19M17 17l2 2M11 3v2M3 11H1M19 11h2" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="6" y="6" width="10" height="10" rx="2" stroke="#1a1a1a" strokeWidth="1.6"/>
        <circle cx="11" cy="11" r="2" stroke="#1a1a1a" strokeWidth="1.3"/>
      </svg>
    ),
    title: '0.1°C 정밀 온도 분해능',
    desc: '고정밀 열화상 카메라가 0.1°C 단위의 온도 분포를 실시간으로 측정합니다. 육안·일반 카메라로는 불가능한 초기 이상 징후를 발화 수십 시간 전부터 포착합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 14l3-5 4 3 3-4 4 6H4z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M2 18h18" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="16" cy="6" r="1.5" fill="#ff3b30"/>
      </svg>
    ),
    title: '이상 지점 자동 표시 리포트',
    desc: '온도 이상이 감지된 설비의 위치·온도값·시간을 자동으로 기록하고 리포트를 생성합니다. 관리자는 대시보드에서 전체 현장의 열 지도를 한눈에 확인하고 우선순위에 따라 점검을 진행할 수 있습니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3c-1.5 2-4 2.5-6 2v6c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V5c-2-.5-4.5-2-6-2z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '배관 · 전기 · 기계 3종 통합 감시',
    desc: '단일 플랫폼에서 배관 누출·전기설비 과열·모터 마찰열을 통합 모니터링합니다. 설비 유형별 임계 온도 기준을 개별 설정할 수 있어 오탐을 최소화하고 실질적 위험만 알립니다.',
  },
]

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function ThermalDetectionDetailPage() {
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
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>열화상 감지 · 화재 예방 시스템</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 30 : 48, letterSpacing: isMobile ? '-1px' : '-2.2px', marginBottom: isMobile ? 16 : 22, fontWeight: 400 }}>
                    <span style={{ fontWeight: 900 }}>연기감지기 </span>있었습니다 <br/>CEO 징역 15년형 선고
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 14 : 20 }}>
                    아리셀 화재, CEO 징역 15년형 선고.<br/>
                    법적 설비를 모두 갖춰도 화재는 발생했습니다.<br/>
                    연기감지기는 불이 난 뒤에 울립니다.
                  </p>
                  <div style={{ background: '#fff5f5', border: '1px solid #ffd0d0', borderRadius: 10, padding: '14px 18px', marginBottom: isMobile ? 28 : 40 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#ff3b30', marginBottom: 6, letterSpacing: '0.03em' }}>열화상 AI의 차이</div>
                    <p style={{ fontSize: isMobile ? 13 : 14, color: '#555', lineHeight: 1.7, margin: 0 }}>
                      배터리 과열·배관 누출·전기 접촉 불량은<br/>
                      연기가 나기 <strong>수십 시간 전</strong>부터 온도로 신호를 보냅니다.<br/>
                      열화상 AI는 그 신호를 먼저 잡습니다.
                    </p>
                  </div>
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
                      style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,150,0,0.5) 50%,transparent)', zIndex: 2 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* 온도 펄스 */}
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
                  <div style={{ fontSize: isMobile ? 28 : 38, fontWeight: 900, color: '#ff9500', letterSpacing: '-1.5px' }}>{stat.num}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 3 · 4장 이미지 스토리
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>작동 원리</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                발화 전<br/><span style={{ fontWeight: 900 }}>온도가 먼저 말합니다</span>
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>연기감지기의 한계부터 배관·전기·기계 3종 열화상 감지까지 — 실제 현장 이미지로 확인하는 화재 예방 시스템입니다.</p>
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
                          <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 20, letterSpacing: '0.04em' }}>
                              {item.num}
                            </div>
                            <div style={{ background: item.accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>연기가 나기 전에<br/>온도가 먼저 경보합니다</h2>
              <p style={{ ...p.sectionSub, maxWidth: 500 }}>배관·전기·기계 3종을 단일 플랫폼으로 — 발화 전 이상 징후를 AI가 자동으로 포착합니다.</p>
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
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>소방청 화재안전기준 보조 · 산업안전보건공단 스마트장비 지원사업 적용 가능</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
                GRB LAB과<br/>함께 구축하세요
              </h2>
              <p style={{ ...p.heroSub, fontSize: 15, maxWidth: 460, margin: '0 auto 40px' }}>
                아리셀처럼 연기감지기가 있어도 화재는 납니다.<br/>
                열화상 AI는 연기 전 온도를 먼저 잡아<br/>
                CEO 징역·기업 벌금 전에 막습니다.
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