/**
 * ManufacturingCollisionDetailPage.jsx
 * AI + CCTV > 제조업 · 지게차 충돌 예방
 * HeavyEquipmentCollisionDetailPage와 동일한 5섹션 구조
 *
 * 이미지 경로 (public/riskimage/ 에 배치):
 *   mfg-01-blind.jpg    ← Combine_the_three_Erm54vM2H6.jpg  (지게차 사각지대 항공뷰)
 *   mfg-02-detect.jpg   ← ChatGPT_Image_2026년_3월_6일.png  (창고 AI 작업자 감지)
 *   mfg-03-camera.png   ← image.png                         (포크 끝 초소형 카메라 부착)
 *   mfg-04-fork.jpg     ← 제공된_HRaRdsXFCu.jpg             (포크 시점 AI 하부 감지)
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
  { label: '지게차 사각지대',       img: '/riskimage/mfg-01-blind.jpg' },
  { label: 'AI 작업자 감지',        img: '/riskimage/mfg-02-detect.png' },
  { label: '포크 끝 카메라 부착',   img: '/riskimage/mfg-03-camera.png' },
  { label: '하부 영상으로 전방 감지', img: '/riskimage/mfg-04-fork.jpg' },
]

/* ══════════════════════════════════════
   KPI 통계
══════════════════════════════════════ */
const STATS = [
  { num: '70%+',    label: '지게차 사고 중 부딪힘·끼임 비중' },
  { num: '3,546명', label: '최근 5년 지게차 부딪힘 재해자' },
  { num: '5분',     label: '포크 끝 카메라 부착 완료 시간' },
  { num: '실시간',  label: '하부 영상 AI 전방 상황 예측' },
]

/* ══════════════════════════════════════
   4장 이미지 스토리 파이프라인
══════════════════════════════════════ */
const STORY_ITEMS = [
  {
    num: '01',
    badge: '문제 상황',
    title: '화물을 실으면\n운전자 앞이 완전히 가려집니다',
    body: '지게차가 화물을 들어올리는 순간, 운전석에서 전방은 거의 보이지 않습니다. 하역·이동 중 전방의 작업자를 인식하기 어려운 구조적 사각지대가 생기고, 이 구간에서 부딪힘 사고의 대부분이 발생합니다. 최근 5년간 지게차 부딪힘 재해자는 3,546명 — 전체 지게차 사고의 70% 이상입니다.',
    img: '/riskimage/mfg-01-blind.jpg',
    accent: '#ff3b30',
  },
  {
    num: '02',
    badge: '솔루션 개요',
    title: '지게차 위험구역 AI가\n실시간으로 감시합니다',
    body: '지게차 이동 경로와 작업자 동선이 겹치는 모든 구간에서 AI가 사람을 감지하고 바운딩박스로 실시간 식별합니다. 지게차 운전자와 작업자에게 동시에 경보를 전달해 충돌 위험을 접근 즉시 차단합니다. 임대 장비라도 현장 인프라 설치만으로 적용 가능합니다.',
    img: '/riskimage/mfg-02-detect.png',
    accent: '#34c759',
  },
  {
    num: '03',
    badge: '카메라 부착',
    title: '포크 끝에 붙이는\n초소형 무선 카메라',
    body: '마그네틱 베이스 방식의 초소형 카메라를 포크 끝 부분에 5분 내 부착합니다. 드릴·볼트·배선이 전혀 필요 없습니다. 임대 장비 원상 복구를 요구하는 현장에서도 탈부착이 자유롭고, 장비가 교체되어도 즉시 옮겨 재사용할 수 있습니다. 무선 전송으로 운전석 모니터와 실시간 연결됩니다.',
    img: '/riskimage/mfg-03-camera.png',
    accent: '#ff9500',
  },
  {
    num: '04',
    badge: 'AI 전방 감지',
    title: '하부 일부만 보여도\nAI는 사람을 정확히 식별합니다',
    body: '화물에 가려 전방이 보이지 않는 상황에서도 포크 끝 카메라는 지면 높이의 하부 영상을 포착합니다. 사람의 발·다리 등 일부만 화면에 잡혀도 AI 모델이 전방 작업자 존재를 높은 정확도로 예측하고 즉시 경보를 발생시킵니다. 운전자의 육안 확인에 의존하지 않는 독립적 감지 채널입니다.',
    img: '/riskimage/mfg-04-fork.jpg',
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
        <rect x="3" y="6" width="14" height="10" rx="2" stroke="#1a1a1a" strokeWidth="1.6"/>
        <circle cx="10" cy="11" r="2.5" stroke="#1a1a1a" strokeWidth="1.4"/>
        <path d="M17 9h2M17 13h2" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    title: '포크 끝 초소형 카메라',
    desc: '마그네틱 베이스로 포크 끝에 5분 내 부착·탈거합니다. 무선 전송으로 배선 없이 운전석 모니터와 실시간 연결되며 임대 장비에도 즉시 적용됩니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 14l3-5 4 3 3-4 4 6H4z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="15" cy="6" r="2" stroke="#1a1a1a" strokeWidth="1.4"/>
        <path d="M2 18h18" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: '하부 영상 AI 사람 감지',
    desc: '화물에 시야가 막혀도 포크 끝 카메라가 포착한 지면 높이 영상으로 AI가 발·다리 일부만으로 전방 작업자를 정확히 식별합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="7" stroke="#1a1a1a" strokeWidth="1.6"/>
        <circle cx="11" cy="11" r="3.5" stroke="#1a1a1a" strokeWidth="1.3" strokeDasharray="3 2"/>
        <circle cx="11" cy="11" r="1.2" fill="#1a1a1a"/>
      </svg>
    ),
    title: '지게차 위험구역 AI  감시',
    desc: '지게차 이동 경로 전구간에서 작업자 동선을 바운딩박스로 실시간 식별합니다. 카메라는 현장 인프라로 설치되어 장비 교체와 무관하게 작동합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3v3M11 16v3M3 11h3M16 11h3" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="11" cy="11" r="4" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M7.5 7.5l1.5 1.5M13 13l1.5 1.5M13 7.5l-1.5 1.5M8.5 13l-1.5 1.5" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: '운전석 + 작업자 동시 경보',
    desc: '위험 감지 즉시 운전석 모니터 경보와 작업자 헬멧 태그 진동이 동시에 출력됩니다. 소음이 심한 창고·공장에서도 시각·촉각 2중 경보로 즉각 인지합니다.',
  },
]

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function ManufacturingCollisionDetailPage() {
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
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>제조업 · 지게차 충돌 예방 시스템</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 34 : 58, letterSpacing: isMobile ? '-1px' : '-2.2px', marginBottom: isMobile ? 16 : 22, fontWeight: 400 }}>
                    <span style={{ fontWeight: 900 }}>화물에 가려도</span><br/>AI는 전방을<br/>놓치지 않습니다
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 28 : 40 }}>
                    포크 끝에 붙이는 초소형 카메라가<br/>
                    하부 영상만으로 전방 작업자를 식별하고<br/>
                    충돌 전에 경보를 울립니다.
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
                      style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.35) 50%,transparent)', zIndex: 2 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* 경보 펄스 */}
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
            SECTION 3 · 4장 이미지 스토리
        ══════════════════════════════════════════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>작동 원리</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                신호수<span style={{ fontWeight: 500 }}>도 지게차에 깔린 사고  </span>
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>지게차는 화물 적재 시 운전자 시야가 가려지기 때문에 
산업안전보건기준에 따라 신호수(유도자)를 배치하도록 되어 있습니다.</p>
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>임대 장비도<br/>당장 내일부터 적용됩니다</h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>드릴도 배선도 필요 없습니다 — 마그네틱 베이스 하나로 현장 조건 그대로 도입합니다.</p>
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
                지게차부터 크레인까지 — 포크 끝 카메라 + AI로<br/>
                화물에 가려도 전방 작업자를 놓치지 않습니다.
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