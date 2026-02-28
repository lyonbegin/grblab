/**
 * LogisticsDetailPage.jsx
 * AI + CCTV > 유통·물류 세부 페이지
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
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
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} style={style}>
      {children}
    </motion.div>
  )
}

const FEATURE_CARDS = [
  {
    label: '재고·적재 이상 감지',
    desc: '창고 선반·팔레트의 과적·오적재·빈 공간을 CCTV로 실시간 자동 감지합니다.',
    img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=700&q=80&fit=crop',
  },
  {
    label: '컨베이어 패키지 추적',
    desc: '분류 라인에서 패키지 흐름과 오분류를 실시간으로 추적합니다.',
    img: 'https://plus.unsplash.com/premium_photo-1682144523146-6d330ba6a40a?w=700&q=80&fit=crop',
  },
  {
    label: '지게차 동선 안전 관리',
    desc: '지게차와 보행자 동선을 동시에 모니터링해 충돌·위험을 사전에 경보합니다.',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=700&q=80&fit=crop',
  },
  {
    label: '출하·입고 자동 검증',
    desc: 'AI가 트럭 번호판·바코드·수량을 자동으로 인식해 출하 정확도를 보장합니다.',
    img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=700&q=80&fit=crop',
  },
]

const PIPELINE_ITEMS = [
  {
    num: '01',
    title: '물류 센터 CCTV 인프라 구축 및 데이터 수집',
    body: '창고·분류 라인·상하차 도크에 카메라를 설치하고 실시간 영상 데이터를 수집합니다. 기존 WMS·ERP 시스템과 연동해 재고 데이터와 영상 데이터를 함께 분석할 수 있습니다.',
    img: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800&q=80&fit=crop',
  },
  {
    num: '02',
    title: 'AI로 재고·동선·패키지를 통합 모니터링',
    body: '컴퓨터 비전이 수백 개 카메라 피드를 동시에 분석해 재고 수준, 지게차 동선, 패키지 흐름을 하나의 대시보드로 통합 관제합니다. 이상 감지 시 담당자에게 즉시 알림을 발송합니다.',
    img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80&fit=crop',
  },
  {
    num: '03',
    title: '시즌·품목 변동에도 지속 학습으로 대응',
    body: '성수기 상품 구성 변경이나 새 물류 레이아웃에도 중앙 플랫폼에서 모델을 빠르게 재학습합니다. 데이터가 누적될수록 이상 감지 정확도가 지속적으로 향상됩니다.',
    img: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=800&q=80&fit=crop',
  },
]

const DATA_FEATURES = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/><rect x="12" y="2" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/><rect x="2" y="12" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/><rect x="12" y="12" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/></svg>,
    title: '선반·존별 재고 가시화',
    desc: '창고 내 구역별 재고 수준을 실시간 수치로 변환해 피킹 효율과 보충 타이밍을 최적화합니다.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.6" strokeDasharray="4 2"/><path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: '다양한 환경 학습 데이터 증강',
    desc: '조도·계절·상품 구성 변화 등 다양한 환경을 시뮬레이션해 더 강인한 모델을 구축합니다.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 6h14M4 11h10M4 16h7" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/><circle cx="17" cy="16" r="3" stroke="#1a1a1a" strokeWidth="1.4"/></svg>,
    title: '입출고 이력 자동 기록',
    desc: '모든 입출고 이벤트를 AI가 자동으로 기록해 감사 추적·재고 불일치 원인 분석에 활용합니다.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 16l4-6 4 4 3-5 5 7H3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="16" cy="5" r="2" stroke="#1a1a1a" strokeWidth="1.4"/></svg>,
    title: '동선 히트맵·병목 분석',
    desc: '지게차·작업자 이동 경로를 열지도로 시각화해 물류 동선을 최적화하고 혼잡 구간을 개선합니다.',
  },
]

const STATS = [
  { num: '50%', label: '수동 재고 추적 시간 절감' },
  { num: '99%', label: '출하 정확도' },
  { num: '24/7', label: '무중단 창고 모니터링' },
  { num: '30%', label: '피킹 효율 향상' },
]

export default function LogisticsDetailPage() {
  const isMobile = useIsMobile()
  const [activeFeature, setActiveFeature] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActiveFeature(p => (p + 1) % FEATURE_CARDS.length), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap'); .lgs-hover { transition:transform 0.2s,box-shadow 0.2s; } .lgs-hover:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.12); }`}</style>
      <div style={p.page}>

        <section style={{ ...p.section, padding: isMobile ? '48px 20px 52px' : '72px 40px 80px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 36 : 72, alignItems: isMobile ? 'flex-start' : 'center' }}>
              <div style={{ flex: '0 0 auto', maxWidth: isMobile ? '100%' : 480 }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>AI + CCTV · 유통·물류 솔루션</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 34 : 58, letterSpacing: isMobile ? '-1px' : '-2.2px', marginBottom: isMobile ? 16 : 22 }}>
                    <span style={{ fontWeight: 900 }}>물류 효율</span>을<br/>극대화하세요
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 28 : 40 }}>
                    AI 비전이 창고 전 구역을 실시간으로 감시하고<br/>재고·안전·출하 정확도를 동시에 높입니다.
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <motion.button style={p.ctaPrimary} whileTap={{ scale: 0.97 }} whileHover={{ background: '#333' }}>지금 무료로 시작하기</motion.button>
                    <motion.button style={p.ctaSecondary} whileTap={{ scale: 0.97 }}>도입 상담 →</motion.button>
                  </div>
                </motion.div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15 }}>
                  <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: isMobile ? '4/3' : '16/9', position: 'relative', background: '#111' }}>
                    <AnimatePresence mode="wait">
                      <motion.img key={activeFeature} src={FEATURE_CARDS[activeFeature].img} alt={FEATURE_CARDS[activeFeature].label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }}/>
                    </AnimatePresence>
                    <motion.div style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.4) 50%,transparent)', zIndex: 2 }} animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}/>
                    <AnimatePresence mode="wait">
                      <motion.div key={`lbl-${activeFeature}`} style={p.imgLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>{FEATURE_CARDS[activeFeature].label}</motion.div>
                    </AnimatePresence>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {FEATURE_CARDS.map((fc, i) => (
                      <button key={i} onClick={() => setActiveFeature(i)} style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: activeFeature === i ? '#1a1a1a' : '#f2f2f2', color: activeFeature === i ? '#fff' : '#888', fontSize: 11, fontWeight: activeFeature === i ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif", transition: 'all 0.2s', padding: '0 4px', lineHeight: 1.3 }}>{fc.label}</button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

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

        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>핵심 기능</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>재고 손실·배송 오류를<br/>근본부터 차단하세요</h2>
              <p style={{ ...p.sectionSub, maxWidth: 560 }}>AI 비전이 물류 현장의 모든 이상을 사람보다 빠르게 감지합니다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16, marginTop: isMobile ? 28 : 44 }}>
              {FEATURE_CARDS.map((card, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="lgs-hover" style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '3/4', position: 'relative', backgroundImage: `url(${card.img})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#e0e0e0' }}>
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

        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>도입 프로세스</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>창고·센터·현장<br/><span style={{ fontWeight: 900 }}>맞춤형 AI 모델</span> 개발</h2>
              <p style={{ ...p.sectionSub, maxWidth: 500 }}>물류 현장 특성에 최적화된 AI를 구축하고 운영 변화에 즉각 대응합니다.</p>
            </FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 48 : 72, marginTop: isMobile ? 36 : 60 }}>
              {PIPELINE_ITEMS.map((item, i) => (
                <FadeIn key={i} delay={0.05}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : (i % 2 === 0 ? 'row' : 'row-reverse'), gap: isMobile ? 20 : 60, alignItems: 'center' }}>
                    <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '48%' }}>
                      <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/10', position: 'relative' }}>
                        <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                        <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 20 }}>{item.num}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#ccc', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>STEP {item.num}</div>
                      <h3 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.8px', lineHeight: 1.25, marginBottom: 14 }}>{item.title}</h3>
                      <p style={{ fontSize: isMobile ? 14 : 15, color: '#666', lineHeight: 1.75 }}>{item.body}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>데이터 품질</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>더 스마트한 창고를<br/>더 빠르게 구현하세요</h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>물류 AI 모델의 정확도를 극대화하는 핵심 데이터 품질 기능입니다.</p>
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

        <section style={{ ...p.section, padding: isMobile ? '52px 20px 60px' : '80px 40px 96px' }}>
          <div style={{ ...p.inner, textAlign: 'center' }}>
            <FadeIn>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f6f6f6', borderRadius: 24, padding: '8px 18px', marginBottom: 40 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2 3.5v4C2 10.3 4.2 12.8 7 13c2.8-.2 5-2.7 5-5.5v-4L7 1z" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4.5 7l1.5 1.5 3-3" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>SOC2 Type 2 인증 · 개인정보보호법 준수</span>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>GRB LAB과<br/>함께 AI를 구축하세요</h2>
              <p style={{ ...p.heroSub, fontSize: 15, marginBottom: 40, maxWidth: 440, margin: '0 auto 40px' }}>창고부터 라스트마일까지 — KRAS AI가 현장의 모든 시각 데이터를<br/>스마트 물류 인텔리전스로 전환합니다.</p>
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

const p = {
  page:        { background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif" },
  section:     { width: '100%' },
  inner:       { maxWidth: 1200, margin: '0 auto', width: '100%' },
  eyebrow:     { fontWeight: 600, color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14, fontSize: 12 },
  heroTitle:   { fontWeight: 800, color: '#1a1a1a', lineHeight: 1.08 },
  heroSub:     { color: '#999', lineHeight: 1.65, letterSpacing: '-0.2px', fontWeight: 500 },
  sectionLabel:{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 },
  sectionTitle:{ fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 14 },
  sectionSub:  { fontSize: 15, color: '#999', lineHeight: 1.65, marginTop: 8 },
  ctaPrimary:  { background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' },
  ctaSecondary:{ background: 'none', color: '#1a1a1a', border: '1.5px solid #d8d8d8', borderRadius: 8, padding: '13px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  imgLabel:    { position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 13px', borderRadius: 20 },
  featureCard: { display: 'flex', gap: 18, padding: '24px 24px', background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0', alignItems: 'flex-start' },
  featureIcon: { flexShrink: 0, width: 44, height: 44, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}