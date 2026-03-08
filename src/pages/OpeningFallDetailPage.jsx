/**
 * OpeningFallDetailPage.jsx
 * AI + CCTV > 건설현장 개구부 추락 예방
 * HeavyEquipmentCollisionDetailPage와 동일한 5섹션 구조
 *
 * 이미지 경로 (public/riskimage/ 에 배치):
 *   opening-01-problem.png   ← ChatGPT_Image_오후_10_20_02.png  (덮개 열린 개구부 + 작업자)
 *   opening-02-helmet.png    ← ChatGPT_Image_오후_10_29_41.png  (헬멧 태그 경보 발생)
 *   opening-03-cone.png      ← ChatGPT_Image_오후_10_29_45.png  (스마트 콘 배치)
 *   opening-04-gate-on.jpg   ← In_the_previous_sDOTObiFmt.jpg   (게이트 경보등 ON + 헬멧 태그)
 *   opening-05-gate-off.jpg  ← 건설_현장에서_5LfEUzk3hc.jpg    (게이트 경보등 OFF 비교)
 *   opening-06-edge.png      ← ChatGPT_Image_오후_10_32_04.png  (개구부 직전 작업자)
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
  { label: '덮개 열린 개구부',      img: '/riskimage/opening-01-problem.png' },
  { label: '헬멧 태그 접근 경보',   img: '/riskimage/opening-02-helmet.png' },
  { label: '스마트 콘 배치',        img: '/riskimage/opening-03-cone.png' },
  { label: '게이트 경보등 작동',    img: '/riskimage/opening-04-gate-on.jpg' },
]

/* ══════════════════════════════════════
   KPI 통계
══════════════════════════════════════ */
const STATS = [
  { num: '47.1%',  label: '현장 점검 적발 1위 — 개구부 덮개 미설치' },
  { num: '9.0%',   label: '중소규모 건설 사망사고 중 단부·개구부' },
  { num: '13m',    label: '실제 사고 사례 최대 추락 높이' },
  { num: '실시간', label: '개방 감지 → 헬멧 태그 경보 응답' },
]

/* ══════════════════════════════════════
   6장 이미지 스토리 파이프라인
══════════════════════════════════════ */
const STORY_ITEMS = [
  {
    num: '01',
    badge: '문제 상황',
    title: '작업을 위해\n잠깐 열어둔 개구부가 가장 위험합니다',
    body: '개구부 추락 사고는 "덮개가 처음부터 없어서"가 아닙니다. 자재 인양·설비 반입·확인 작업을 위해 잠깐 열어둔 순간, 통제 없이 다른 작업자가 무의식적으로 접근하면서 발생합니다. 고용노동부 현장점검 결과 개구부 덮개 미설치는 추락 위험요인 지적의 47.1%로 압도적 1위입니다.',
    img: '/riskimage/opening-01-problem.png',
    accent: '#ff3b30',
  },
  {
    num: '02',
    badge: '헬멧 태그 경보',
    title: '개구부에 가까워지는 순간\n헬멧이 먼저 경보를 울립니다',
    body: '작업자 헬멧에 부착한  태그가 개구부 주변 비콘과 실시간 통신합니다. 설정 거리 이내로 접근하면 헬멧 태그가 즉시 진동하고, 현장 경보기가 동시에 울립니다. 작업에 집중하느라 개구부를 인식하지 못한 상황에서도 신체로 직접 위험을 전달합니다.',
    img: '/riskimage/opening-02-helmet.png',
    accent: '#ff9500',
  },
  {
    num: '03',
    badge: '스마트 콘 배치',
    title: '라바콘 하나로\n무선 경보 구역이 즉시 설정됩니다',
    body: '개구부 주변에 스마트 콘을 배치하는 것만으로 무선 경보 구역이 자동으로 형성됩니다. 별도 배선·설치 공사 없이 5분 내 현장 어디서든 배치 가능합니다. 공정이 바뀌어 개구부 위치가 달라져도 콘만 이동하면 경보 구역이 즉시 재설정됩니다.',
    img: '/riskimage/opening-03-cone.png',
    accent: '#34c759',
  },
  {
    num: '04',
    badge: '출입 통제 경보',
    title: '위험구역 게이트에\n헬멧 태그가 접근하면 경보등이 점등됩니다',
    body: '개구부·추락 위험구역 진입 게이트에 경보등을 설치하면, 헬멧 태그를 착용한 작업자가 접근할 때 경보등이 자동으로 점등됩니다. 육안으로 보이지 않는 위험을 빛과 소리로 명확히 알려, 무의식적 진입을 원천 차단합니다.',
    img: '/riskimage/opening-04-gate-on.jpg',
    accent: '#ff3b30',
  },
  {
    num: '05',
    badge: '경보 비교',
    title: '경보등이 꺼진 상태와\n켜진 상태 — 차이가 생명입니다',
    body: '동일한 게이트, 동일한 상황에서 경보등의 유무가 작업자의 인식을 완전히 바꿉니다. 빨간 경보등이 켜진 순간 작업자는 본능적으로 멈추고 상황을 확인합니다. 단순하지만 가장 직접적인 물리적 경보가 개구부 추락 사고의 마지막 방어선입니다.',
    img: '/riskimage/opening-05-gate-off.jpg',
    accent: '#007aff',
  },
  {
    num: '06',
    badge: '실제 위험 순간',
    title: '개구부 직전까지\n아무도 모르고 걷습니다',
    body: '이 사진이 보여주는 것이 바로 개구부 추락의 본질입니다. 작업자는 걷고 있고, 개구부는 열려 있고, 아무런 경보도 없습니다. 덮개가 옆에 있어도 닫히지 않으면 아무 의미가 없습니다. 시스템은 이 순간 — 작업자가 개구부를 향해 걷는 바로 그 순간에 경보를 울려야 합니다.',
    img: '/riskimage/opening-06-edge.png',
    accent: '#ff3b30',
  },
]

/* ══════════════════════════════════════
   시스템 구성 카드 4종
══════════════════════════════════════ */
const SYSTEM_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3c-1.5 2-4 2.5-6 2v6c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V5c-2-.5-4.5-2-6-2z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '헬멧 태그 근접 경보',
    desc: '작업자 헬멧에 부착한  태그가 개구부 비콘과 통신해 설정 거리 진입 즉시 진동 경보를 출력합니다. 태그 임의 off 방지 설계로 운영 무력화를 원천 차단합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2l1.5 4h4l-3.2 2.5 1.2 4L11 10l-3.5 2.5 1.2-4L5.5 6h4L11 2z" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="11" cy="18" r="2" stroke="#1a1a1a" strokeWidth="1.4"/>
        <path d="M11 15v-3" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    title: '스마트 콘 무선 배치',
    desc: '개구부 주변에 스마트 콘을 놓는 것만으로 무선 경보 구역이 즉시 설정됩니다. 공정 변화로 개구부 위치가 바뀌어도 콘 이동만으로 경보 구역이 재설정됩니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="8" width="14" height="10" rx="2" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M8 8V6a3 3 0 0 1 6 0v2" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="11" cy="13" r="1.5" fill="#1a1a1a"/>
      </svg>
    ),
    title: '게이트 경보등 연동',
    desc: '위험구역 진입 게이트에 경보등을 설치하면 헬멧 태그 접근 즉시 자동 점등됩니다. 작업자의 무의식적 진입을 빛과 소리로 즉각 차단합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 16l4-6 4 4 3-5 5 7H3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="16" cy="5" r="2" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '개방 이력 관리 대시보드',
    desc: '개구부 개방 시간·접근 이벤트·미복구 알림을 실시간으로 기록합니다. "잠깐 열어둔" 상태가 얼마나 지속됐는지를 관리자가 즉시 파악하고 조치할 수 있습니다.',
  },
]

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function OpeningFallDetailPage() {
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
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>건설현장 · 개구부 추락 예방 시스템</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 34 : 58, letterSpacing: isMobile ? '-1px' : '-2.2px', marginBottom: isMobile ? 16 : 22, fontWeight: 400 }}>
                    <span style={{ fontWeight: 900 }}>잠깐 열어둔 순간</span>을<br/>시스템이<br/>놓치지 않습니다
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 28 : 40 }}>
                    개구부 추락은 몰라서가 아니라<br/>
                    잠깐이라서 발생합니다.<br/>
                    헬멧 태그 + 스마트 콘 + 게이트 경보로<br/>
                    관리 공백을 실시간으로 메웁니다.
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
                    <motion.div
                      style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.35) 50%,transparent)', zIndex: 2 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      style={{ position: 'absolute', top: 14, right: 14, width: 12, height: 12, borderRadius: '50%', background: '#ff3b30', zIndex: 3 }}
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
            SECTION 3 · 6장 이미지 스토리
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>작동 원리</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                개구부를<br/><span style={{ fontWeight: 900 }}> AI가 관리 합니다</span>
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>문제 인식부터 게이트 경보까지 — 실제 현장 이미지로 확인하는 개구부 추락 예방 시스템입니다.</p>
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>기본 방호를 대체하지 않고<br/>관리 공백을 메웁니다</h2>
              <p style={{ ...p.sectionSub, maxWidth: 500 }}>법이 요구하는 난간·덮개는 그대로 — 그 사이 잠깐 열린 순간을 시스템이 채웁니다.</p>
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
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>산업안전보건규칙 제43조 준수 보조 · 안전보건공단 스마트장비 지원사업 적용 가능</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
                GRB LAB과<br/>함께 구축하세요
              </h2>
              <p style={{ ...p.heroSub, fontSize: 15, maxWidth: 460, margin: '0 auto 40px' }}>
                덮개를 열어둔 몇 분이 현장 전체의 리스크가 됩니다.<br/>
                헬멧 태그 + 스마트 콘 + 게이트 경보로<br/>
                그 공백을 실시간으로 채웁니다.
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