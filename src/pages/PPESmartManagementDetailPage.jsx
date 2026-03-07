/**
 * PPESmartManagementDetailPage.jsx
 * AI CCTV > 개인 보호구(PPE) 스마트 관리 시스템 세부 페이지
 * 핵심: PPE 미착용 AI 감지 → 부가: TBM 참석 증빙 + 출퇴근 관리
 * HeavyEquipmentCollisionDetailPage와 동일 구조 기반
 *
 * 이미지 경로 매핑 (public/riskimage/ 폴더에 복사 필요):
 *   ppe-01-tbm-scan.jpg    ← 제공된_D6GHZbY0IN.jpg
 *   ppe-02-app-check.jpg   ← In_the_setting_of_PNkwL7eYB8.jpg
 *   ppe-03-team-ble.png    ← ChatGPT_Image_2026년_3월_6일.png
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

const HERO_SLIDES = [
  { label: ' 태그 PPE 미착용 실시간 감지', img: '/riskimage/ppe-01-tbm-scan.jpg' },
  { label: 'PPE 착용 이력 앱 확인',     img: '/riskimage/ppe-02-app-check.jpg' },
  { label: 'TBM + 출퇴근 자동 기록',    img: '/riskimage/ppe-03-team-ble.png' },
]

const STATS = [
  { num: '50%', label: '전체 산업 사망사고 중 건설업 비중 (고용노동부)' },
  { num: '70%', label: '추락 사망자의 보호구 미착용 또는 부적절 착용 (KOSHA)' },
  { num: '실시간', label: ' 태그 기반 안전모 착용 여부 자동 감지' },
  { num: 'TBM', label: 'TBM 확인으로 PPE 지급 기록 자동 생성' },
]

const STORY_ITEMS = [
  {
    num: '01',
    badge: '문제 상황',
    title: '보호구는 지급했는데\n작업자가 착용하지 않습니다',
    body: '안전모·안전화·안전대는 지급됩니다. 하지만 현장에서는 더운 날, 불편하다는 이유로, "잠깐이니까"라는 이유로 착용이 빠집니다. 문제는 그 "잠깐"에 사고가 납니다. 건설현장 사망사고의 핵심 원인은 장비 부재가 아니라 착용 관리 부재입니다.',
    img: '/riskimage/hmoff.jpg',
    accent: '#ff3b30',
    extra: null,
  },
  {
    num: '02',
    badge: '법적 의무',
    title: '지급만으로는\n사업주 책임이 끝나지 않습니다',
    body: '법원 판례는 명확합니다. "사업주가 보호구를 지급한 것만으로 의무를 다했다고 볼 수 없으며, 실제로 착용하도록 관리·감독해야 할 의무가 있다." 지급 ≠ 착용. 착용 여부 감독이 없으면 사망 사고 시 업무상 과실치사로 형사처벌이 가능합니다.',
    img: '/riskimage/ppe-01-tbm-scan.jpg',
    accent: '#ff3b30',
    extra: null,
  },
 {
  num: '03',
  badge: '지급 대장 자동 작성',
  title: 'TBM 회의에서 앱 확인으로\n개인 보호구 지급 대장이 자동 작성됩니다',
  body: 'TBM 작업 전 관리자 앱으로 작업자의 얼굴과 헬멧 태그를 확인하면 당일 보호구 지급 기록이 자동으로 생성됩니다. 매일 인원이 바뀌는 일용직 근로자도 별도 서명이나 종이 대장 없이 관리할 수 있습니다. 누가 어떤 헬멧을 지급받았는지, 어느 현장에서 사용했는지 기록이 자동 저장되어 보호구 지급·관리 책임을 명확하게 증빙할 수 있습니다.',
  img: '/riskimage/ppe-02-app-check.jpg',
  accent: '#007aff',
  extra: null,
},
  {
    num: '04',
    badge: '착용 이력',
    title: '누가·언제·어디서\nPPE를 착용하지 않았는지 기록됩니다',
    body: '미착용 감지 이벤트는 작업자·날짜·구역·시간별로 자동 분류되어 관리 대시보드에 누적됩니다. 반복적으로 안전모를 벗는 구역과 작업자를 데이터로 파악하고 선제 개입이 가능합니다. 감독 기관 점검 시 PPE 관리 이행 근거 자료로 즉시 출력됩니다.',
    img: '/riskimage/hmalert.png',
    accent: '#34c759',
    extra: null,
  },
  {
    num: '05',
    badge: '부가 기능',
    title: 'TBM 참석 증빙도\n같은 시스템으로 자동 완성됩니다',
    body: '헬멧  태그 옵션을 추가하면 TBM 참석 자동 증빙이 가능합니다. TBM 시작 전 스캔 한 번으로 작업자 ID·헬멧 ID·시간·위치·사진이 자동 기록됩니다. 수기 서명 대장 없이 법적 증빙 서류가 완성됩니다. 미참석자는 즉시 관리자 앱에 알림이 발송됩니다.',
    img: '/riskimage/ppe-03-team-ble.png',
    accent: '#ff9500',
    extra: '부가 기능',
  },
  {
    num: '06',
    badge: '부가 기능',
    title: '일용직 출퇴근 관리까지\n하나의 시스템으로 통합됩니다',
    body: 'TBM 스캔이 출근 기록으로 자동 연동됩니다. 퇴근 시 재스캔으로 퇴근 시간도 기록되어 일용직 근로 시간 관리까지 한 시스템으로 통합됩니다. PPE 착용률·TBM 참석률·출퇴근 이력이 대시보드 하나에 집계되어 감독 기관 점검 시 즉시 출력 가능합니다.',
    img: '/riskimage/ppe-02-app-check.jpg',
    accent: '#ff9500',
    extra: '부가 기능',
  },
]

const SYSTEM_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="7" r="3.5" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M5 19c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
        <rect x="13" y="2" width="7" height="5" rx="1.2" stroke="#1a1a1a" strokeWidth="1.3"/>
        <path d="M14.5 4.5l1 1 2-1.5" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: ' 태그 실시간 PPE 미착용 감지',
    desc: '헬멧에 부착된  태그가 현장 게이트웨이와 신호를 교환합니다. 안전모를 착용하지 않으면 신호가 끊기고 즉시 관리자 앱에 경보가 전송됩니다. 야간·밀폐 공간에서도 정확하게 작동합니다.',
    isAddon: false,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3c-1.5 2-4 2.5-6 2v6c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V5c-2-.5-4.5-2-6-2z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '사업주 관리 의무 증빙',
    desc: 'PPE 미착용 감지 이벤트·경보 발송 이력이 자동 누적됩니다. "착용 여부를 관리·감독했다"는 법적 증빙 자료가 실시간으로 쌓여 감독 기관 점검 즉시 출력됩니다.',
    isAddon: false,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#1a1a1a" strokeWidth="1.6"/>
        <rect x="12" y="3" width="7" height="7" rx="1.5" stroke="#1a1a1a" strokeWidth="1.6"/>
        <rect x="3" y="12" width="7" height="7" rx="1.5" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M12 15h7M15 12v7" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    title: 'TBM 참석 자동 증빙',
    desc: ' 태그 옵션 추가 시 TBM 참석 기록이 자동 생성됩니다. 수기 서명 없이 작업자 ID·헬멧 ID·시간·위치·사진이 저장되어 법정 증빙 서류로 활용됩니다.',
    isAddon: true,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M11 7v4l3 2" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '출퇴근 관리',
    desc: 'TBM 스캔이 출근 기록으로 자동 연동됩니다. 퇴근 시 재스캔으로 근로 시간이 기록되어 일용직 출퇴근 명부가 수기 없이 자동 완성됩니다.',
    isAddon: true,
  },
]

export default function PPESmartManagementDetailPage() {
  const isMobile = useIsMobile()
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fff; -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={s.page}>

        {/* ── SECTION 1 · 히어로 ── */}
        <section style={{ ...s.section, padding: isMobile ? '48px 20px 52px' : '72px 40px 80px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={s.inner}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 36 : 72, alignItems: isMobile ? 'flex-start' : 'center' }}>

              <div style={{ flex: '0 0 auto', maxWidth: isMobile ? '100%' : 480 }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                  <div style={{ ...s.eyebrow, fontSize: isMobile ? 11 : 12 }}>개인 보호구(PPE) 스마트 관리 시스템</div>
                  <h1
  style={{
    ...s.heroTitle,
    fontSize: isMobile ? 30 : 42,
    letterSpacing: isMobile ? '-1px' : '-2px',
    marginBottom: isMobile ? 16 : 22
  }}
>
  <span style={{ fontWeight: 400 }}>보호구는</span> <span style={{ fontWeight: 900 }}>지급이</span> <span style={{ fontWeight: 400 }}>아니라</span><br/>
  <span style={{ fontWeight: 900 }}>착용 관리</span> <span style={{ fontWeight: 400 }}>가 의무입니다</span> 
</h1>
                  <p style={{ ...s.heroSub, fontSize: isMobile ? 14 : 15, marginBottom: 12 }}>
                    헬멧  태그가 안전모 미착용을<br/>
                    실시간으로 감지하고 즉시 경보합니다.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff8ed', border: '1px solid #ffe0a0', borderRadius: 20, padding: '6px 14px', marginBottom: isMobile ? 24 : 36 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#ff9500' }}>+ 부가 기능</span>
                    <span style={{ fontSize: 11, color: '#bbb', fontWeight: 500 }}>TBM 참석 증빙 · 출퇴근 관리 동시 지원</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <motion.button style={s.ctaPrimary} whileTap={{ scale: 0.97 }} whileHover={{ background: '#333' }}>
                      지금 무료로 시작하기
                    </motion.button>
                    <motion.button style={s.ctaSecondary} whileTap={{ scale: 0.97 }}>
                      도입 상담 →
                    </motion.button>
                  </div>
                </motion.div>
              </div>

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
                      style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,59,48,0.5) 50%,transparent)', zIndex: 2 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      style={{ position: 'absolute', top: 14, right: 14, width: 12, height: 12, borderRadius: '50%', background: '#ff3b30', zIndex: 3 }}
                      animate={{ scale: [1, 1.7, 1], opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <AnimatePresence mode="wait">
                      <motion.div key={`lbl-${activeSlide}`} style={s.imgLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        {HERO_SLIDES[activeSlide].label}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {HERO_SLIDES.map((slide, i) => (
                      <button key={i} onClick={() => setActiveSlide(i)} style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: activeSlide === i ? '#1a1a1a' : '#f2f2f2', color: activeSlide === i ? '#fff' : '#888', fontSize: 11, fontWeight: activeSlide === i ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif", transition: 'all 0.2s', padding: '0 4px', lineHeight: 1.3 }}>
                        {slide.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* ── SECTION 2 · 통계 바 ── */}
        <section style={{ background: '#1a1a1a', padding: isMobile ? '32px 20px' : '36px 40px' }}>
          <div style={{ ...s.inner, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
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

        {/* ── SECTION 3 · 6단계 스토리 ── */}
        <section style={{ ...s.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={s.inner}>
            <FadeIn>
              <div style={s.sectionLabel}>작동 원리</div>
              <h2 style={{ ...s.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                <span style={{ fontWeight: 400 }}>관리자가 없어도</span><br/><span style={{ fontWeight: 900 }}> AI </span>는 보고 있습니다
              </h2>
              <p style={{ ...s.sectionSub, maxWidth: 560 }}>
                PPE 미착용 AI 감지(핵심) + TBM 참석 증빙·출퇴근 관리.
              </p>
            </FadeIn>

            {/* 핵심 / 부가 구분선 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 52 : 80, marginTop: isMobile ? 40 : 64 }}>
              {STORY_ITEMS.map((item, i) => {
                const isEven = i % 2 === 0
                const isAddon = item.num === '05' || item.num === '06'

                /* 부가 기능 시작 전 구분선 */
                const showDivider = item.num === '05'

                return (
                  <div key={i}>
                    {showDivider && (
                      <FadeIn delay={0}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: isMobile ? 40 : 64 }}>
                          <div style={{ flex: 1, height: 1, background: '#e8e8e8' }}/>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff8ed', border: '1px solid #ffe0a0', borderRadius: 20, padding: '8px 18px' }}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                              <circle cx="6.5" cy="6.5" r="5.5" stroke="#ff9500" strokeWidth="1.3"/>
                              <path d="M4.5 6.5l1.5 1.5 3-3" stroke="#ff9500" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#ff9500' }}>부가 기능 —  태그 옵션 추가 시</span>
                          </div>
                          <div style={{ flex: 1, height: 1, background: '#e8e8e8' }}/>
                        </div>
                      </FadeIn>
                    )}

                    <FadeIn delay={0.04}>
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : (isEven ? 'row' : 'row-reverse'), gap: isMobile ? 20 : 64, alignItems: 'center', opacity: isAddon ? 0.92 : 1 }}>

                        <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '50%' }}>
                          <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '16/10', position: 'relative', boxShadow: isAddon ? '0 4px 20px rgba(0,0,0,0.07)' : '0 6px 32px rgba(0,0,0,0.1)', border: isAddon ? '1.5px solid #ffe0a0' : 'none' }}>
                            <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                            <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 20 }}>
                                {item.num}
                              </div>
                              <div style={{ background: item.accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                                {item.badge}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 2, background: item.accent, borderRadius: 2 }}/>
                            <div style={{ fontSize: 11, color: '#bbb', fontWeight: 700, letterSpacing: '0.08em' }}>
                              STEP {item.num}
                              {isAddon && <span style={{ marginLeft: 8, color: '#ff9500', fontSize: 10, fontWeight: 700 }}>+ 부가</span>}
                            </div>
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
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── SECTION 4 · 시스템 구성 카드 ── */}
        <section style={{ ...s.section, padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={s.inner}>
            <FadeIn>
              <div style={s.sectionLabel}>시스템 구성</div>
              <h2 style={{ ...s.sectionTitle, fontSize: isMobile ? 26 : 42 }}>헬멧에 태그를 부착하는 것만으로<br/>PPE 관리가 시작됩니다</h2>
              <p style={{ ...s.sectionSub, maxWidth: 520 }}>헬멧에 부착된  태그가 현장 리시버와 신호를 교환해
안전모 사용 상태를 자동으로 기록합니다.
TBM 확인과 동시에 PPE 지급 기록이 생성되고
일용직 작업자의 출근·지급 관리까지 자동으로 연결됩니다.</p>
            </FadeIn>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 12 : 18, marginTop: isMobile ? 28 : 48 }}>
              {SYSTEM_CARDS.map((card, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={{ ...s.featureCard, ...(card.isAddon ? { background: '#fffaf2', border: '1px solid #ffe0a0' } : {}) }}>
                    <div style={{ ...s.featureIcon, ...(card.isAddon ? { background: '#fff8e6', border: '1px solid #ffd580' } : {}) }}>
                      {card.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{card.title}</div>
                        {card.isAddon && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ff9500', background: '#fff3d4', padding: '2px 8px', borderRadius: 10 }}>부가</span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{card.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5 · CTA ── */}
        <section style={{ ...s.section, padding: isMobile ? '52px 20px 60px' : '80px 40px 96px' }}>
          <div style={{ ...s.inner, textAlign: 'center' }}>
            <FadeIn>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f6f6f6', borderRadius: 24, padding: '8px 18px', marginBottom: 40 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L2 3.5v4C2 10.3 4.2 12.8 7 13c2.8-.2 5-2.7 5-5.5v-4L7 1z" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M4.5 7l1.5 1.5 3-3" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>산업안전보건법 준수 · PPE 관리 의무 이행 증빙 · 고용노동부 지침 대응</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ ...s.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
                GRB LAB과<br/>함께 구축하세요
              </h2>
              <p style={{ ...s.heroSub, fontSize: 15, maxWidth: 480, margin: '0 auto 40px' }}>
                헬멧  태그로 안전모 미착용을 실시간 감지가 핵심.<br/>
                TBM 참석 증빙·출퇴근 관리까지<br/>하나의 시스템으로 확장됩니다.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button style={s.ctaPrimary} whileTap={{ scale: 0.97 }} whileHover={{ background: '#333' }}>무료로 시작하기</motion.button>
                <motion.button style={s.ctaSecondary} whileTap={{ scale: 0.97 }}>영업팀 문의 →</motion.button>
              </div>
            </FadeIn>
          </div>
        </section>

      </div>
    </>
  )
}

const s = {
  page:         { background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif" },
  section:      { width: '100%' },
  inner:        { maxWidth: 1200, margin: '0 auto', width: '100%' },
  eyebrow:      { fontWeight: 600, color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14, fontSize: 12 },
  heroTitle:    { fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1 },
  heroSub:      { color: '#999', lineHeight: 1.65, letterSpacing: '-0.2px', fontWeight: 500 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 },
  sectionTitle: { fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 14 },
  sectionSub:   { fontSize: 15, color: '#999', lineHeight: 1.65, marginTop: 8 },
  ctaPrimary:   { background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' },
  ctaSecondary: { background: 'none', color: '#1a1a1a', border: '1.5px solid #d8d8d8', borderRadius: 8, padding: '13px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  imgLabel:     { position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 13px', borderRadius: 20 },
  featureCard:  { display: 'flex', gap: 18, padding: '24px', background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0', alignItems: 'flex-start' },
  featureIcon:  { flexShrink: 0, width: 44, height: 44, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}