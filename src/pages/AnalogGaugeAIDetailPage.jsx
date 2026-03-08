/**
 * AnalogGaugeAIDetailPage.jsx
 * AI CCTV > 아날로그 게이지 AI 판독 세부 페이지
 * HeavyEquipmentCollisionDetailPage와 동일 구조 기반
 *
 * 이미지 경로 매핑 (public/riskimage/ 폴더에 복사 필요):
 *   gauge-01-before.jpg   ← cvcv.jpg              (배관·설비 현장 전경)
 *   gauge-02-gauges.jpg   ← 스크린샷_001733.jpg   (다양한 아날로그 게이지 모음)
 *   gauge-03-ai-read.jpg  ← 스크린샷_001845.jpg   (AI 판독 화면 — 4개 게이지 박스)
 *   gauge-04-digital.jpg  ← 스크린샷_002149.jpg   (디지털 온도계 AI 인식)
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
  { label: '현장 설비 전경',      img: '/riskimage/gauge-01-before.jpg' },
  { label: '아날로그 게이지 현황', img: '/riskimage/gauge-02-gauges.jpg' },
  { label: 'AI 실시간 판독',      img: '/riskimage/gauge-03-ai-read.jpg' },
  { label: '디지털 수치 자동 인식',img: '/riskimage/gauge-04-digital.jpg' },
]

/* ══════════════════════════════════════
   KPI 통계
══════════════════════════════════════ */
const STATS = [
  { num: '70%+',  label: '국내 제조 현장 아날로그 계기 잔존 비율' },
  { num: '0건',   label: '배선·센서 공사 없이 도입' },
  { num: '4종',   label: '압력·온도·유량·레벨 동시 판독' },
  { num: '24/7',  label: '무인 실시간 이상 수치 경보' },
]

/* ══════════════════════════════════════
   6장 이미지 스토리 파이프라인
══════════════════════════════════════ */
const STORY_ITEMS = [
  {
    num: '01',
    badge: '문제 상황',
    title: '게이지는 있지만\n아무도 계속 보고 있지 않습니다',
    body: '공장 안에는 이미 압력·온도·유량·레벨 게이지가 설치되어 있습니다. 하지만 순찰 시간은 정해져 있고, 야간엔 무인 구간이 생기고, 기록은 누락됩니다. 사고는 갑자기 발생하는 것처럼 보이지만, 실제로는 그 전에 게이지 수치가 먼저 무너집니다.',
    img: '/riskimage/gauge-01-before.jpg',
    accent: '#ff3b30',
  },
  {
    num: '02',
    badge: '현장 실태',
    title: '수백 개의 아날로그 계기 —\n사람이 전부 볼 수 없습니다',
    body: '압력 게이지, 온도 게이지, 유량 게이지, 진공 게이지, 탱크 레벨 게이지, 차압 게이지… 이 계기들은 생산용이 아니라 사고 전조를 보여주는 안전 신호입니다. 문제는 계기가 없는 것이 아니라, 계기를 계속 보고 있지 못하다는 것입니다.',
    img: '/riskimage/gauge-02-gauges.jpg',
    accent: '#ff9500',
  },
  {
    num: '03',
    badge: 'AI 판독',
    title: '카메라 하나로\n4종 게이지를 동시에 읽습니다',
    body: 'AI는 카메라 영상에서 게이지 영역을 자동 인식하고, 바늘 위치를 수치로 변환한 뒤, 설정 기준치와 실시간 비교합니다. 압력(PSI)·온도(°C)·유량(L/min)·레벨(%) — 4종의 계기를 카메라 1대로 동시에 판독합니다. 기존 계기 교체 없이, 카메라 설치만으로 작동합니다.',
    img: '/riskimage/gauge-03-ai-read.jpg',
    accent: '#34c759',
  },
  {
    num: '04',
    badge: '디지털 계기',
    title: '디지털 표시 계기도\n동일하게 인식합니다',
    body: '아날로그 바늘 게이지뿐 아니라 LCD·LED 디지털 표시 계기도 OCR 기반으로 수치를 자동 인식합니다. 혼합 설비 현장에서도 카메라 한 대로 모든 유형의 계기를 통합 관리할 수 있습니다. 설비 노후도에 상관없이 적용 가능합니다.',
    img: '/riskimage/gauge-04-digital.jpg',
    accent: '#007aff',
  },
  {
    num: '05',
    badge: '경보 흐름',
    title: '수치 이상 감지 즉시\n관리자에게 알림이 전송됩니다',
    body: '설정 임계치를 벗어나는 순간, 현장 경보등과 관리자 앱에 동시 알림이 발송됩니다. 압력 상승 → 배관 파열 위험, 온도 상승 → 과열·화재 전조, 유량 저하 → 냉각 실패, 레벨 과상승 → 누출·넘침. 사고로 이어지기 전에 개입할 수 있는 골든타임을 확보합니다.',
    img: '/riskimage/gauge-03-ai-read.jpg',
    accent: '#ff3b30',
  },
  {
    num: '06',
    badge: '전체 연동',
    title: '모든 계기 수치가\n대시보드 하나로 통합됩니다',
    body: '현장의 모든 카메라에서 판독된 수치가 중앙 대시보드에 실시간 집계됩니다. 시계열 트렌드 그래프로 수치 추이를 확인하고, 반복 이상 발생 구간은 히트맵으로 시각화해 예방 정비에 활용할 수 있습니다. 설비가 추가되면 카메라 등록만으로 즉시 확장됩니다.',
    img: '/riskimage/게이지.png',
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
        <circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M11 11 L11 5" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M11 11 L15 9" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="11" cy="11" r="1.2" fill="#1a1a1a"/>
      </svg>
    ),
    title: '게이지 바늘 AI 자동 판독',
    desc: '카메라 영상에서 게이지 영역을 인식하고 바늘 위치를 수치로 자동 변환합니다. 아날로그 게이지 교체 없이, 기존 계기를 그대로 디지털화합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="12" rx="2" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M7 9h2M7 13h8M13 9h2" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="11" cy="9" r="1" fill="#1a1a1a"/>
      </svg>
    ),
    title: '디지털 계기 OCR 인식',
    desc: 'LCD·LED 디지털 표시 계기도 OCR 기반으로 수치를 자동 인식합니다. 아날로그·디지털 혼합 설비 현장에서도 단일 시스템으로 통합 관리됩니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 14l3-4 3 2 3-5 4 6H4z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M4 17h14" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: '임계치 초과 즉시 경보',
    desc: '설정 기준치를 벗어나는 즉시 현장 경보등과 관리자 앱에 동시 알림을 전송합니다. 압력·온도·유량·레벨 4종 계기별 개별 임계치 설정이 가능합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 18V8l8-5 8 5v10" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <rect x="8" y="12" width="6" height="6" rx="1" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '기존 설비 무변경 도입',
    desc: '배선 공사, 센서 교체, 설비 개조 없이 카메라 설치만으로 당장 내일부터 적용 가능합니다. 노후 설비·임대 공장 어디서든 계약 갈등 없이 도입됩니다.',
  },
]

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function AnalogGaugeAIDetailPage() {
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
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>아날로그 게이지 AI 판독 시스템</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 30 : 48, letterSpacing: isMobile ? '-1px' : '-2.2px', marginBottom: isMobile ? 16 : 22 }}>
                 <span style={{ fontWeight: 900 }}>게이지가</span>  먼저<br/><span style={{ fontWeight: 500 }}>무너집니다</span> 
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 28 : 40 }}>
                    기존 아날로그 계기를 교체하지 않고<br/>
                    카메라 + AI로 압력·온도·유량·레벨을<br/>
                    24시간 자동 판독하고 이상 즉시 경보합니다.
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
                      style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(52,199,89,0.5) 50%,transparent)', zIndex: 2 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* AI 인식 펄스 */}
                    <motion.div
                      style={{ position: 'absolute', top: 14, right: 14, width: 12, height: 12, borderRadius: '50%', background: '#34c759', zIndex: 3 }}
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
            SECTION 3 · 6단계 스토리 파이프라인
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>작동 원리</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                수치 이상이 사고가 되기 전<br/><span style={{ fontWeight: 900 }}>24/7 모니터링 합니다</span>
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>문제 인식부터 전체 연동까지 — 현장의 실제 이미지로 확인하는 아날로그 게이지 AI 판독 시스템 작동 흐름입니다.</p>
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>기존 설비 그대로<br/>당장 내일부터 적용됩니다</h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>계기를 교체하지 않아도, 배선 공사가 없어도 — 현장 조건 그대로 도입합니다.</p>
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
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>SOC2 Type 2 인증 · 산업안전보건법 준수 · 스마트공장 지원사업 적용 가능</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
                GRB LAB과<br/>함께 구축하세요
              </h2>
              <p style={{ ...p.heroSub, fontSize: 15, maxWidth: 440, margin: '0 auto 40px' }}>
                압력·온도·유량·레벨 — 기존 아날로그 게이지를 그대로 두고<br/>
                AI가 24시간 대신 읽고 이상 즉시 경보합니다.
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