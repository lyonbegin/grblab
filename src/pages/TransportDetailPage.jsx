/**
 * TransportDetailPage.jsx
 * AI + CCTV > 교통·운송 세부 페이지
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn) }, [])
  return isMobile
}
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} style={style}>{children}</motion.div>
}

const FEATURE_CARDS = [
  {
    label: '주차 공간 실시간 감지',
    desc: '주차장 전 구역의 빈 공간을 실시간으로 감지하고 운전자에게 즉시 안내합니다.',
    img: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=700&q=80&fit=crop',
  },
  {
    label: '번호판 자동 인식',
    desc: '진출입 차량 번호판을 자동 인식해 통행 관리와 무정차 요금 수납을 실현합니다.',
    img: 'https://images.unsplash.com/photo-1768812790664-149877f92c0f?w=700&q=80&fit=crop',
  },
  {
    label: '교통 흐름·밀집도 분석',
    desc: '교차로·고속도로 영상에서 차량 속도·밀집도를 실시간으로 분석해 혼잡을 예방합니다.',
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=700&q=80&fit=crop',
  },
  {
    label: '위험 운전·사고 감지',
    desc: '급정거·역주행·차로 이탈 등 위험 운전 패턴을 실시간으로 감지하고 즉시 경보합니다.',
    img: 'https://images.unsplash.com/photo-1713623311317-d3c43a4be4cf?w=700&q=80&fit=crop',
  },
]

const PIPELINE_ITEMS = [
  {
    num: '01',
    title: '도로·교차로·주차장 CCTV 인프라 구축',
    body: '고속도로·교차로·주차장·버스터미널 등 주요 교통 거점에 CCTV를 설치하고 실시간 영상 데이터를 수집합니다. 기존 교통 신호·관제 시스템과 API로 연동해 통합 교통 관제가 가능합니다.',
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80&fit=crop',
  },
  {
    num: '02',
    title: 'AI로 교통 흐름·주차·번호판을 통합 분석',
    body: '컴퓨터 비전 AI가 차량 종류·속도·번호판·주차 상태를 동시에 분석합니다. 실시간 교통 데이터를 기반으로 신호 최적화, 혼잡 예측, 위험 운전 경보를 자동으로 수행합니다.',
    img: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80&fit=crop',
  },
  {
    num: '03',
    title: '교통 패턴 학습으로 예측 정확도 지속 향상',
    body: '계절·시간대별 교통 패턴 데이터가 누적될수록 혼잡 예측과 이상 감지 정확도가 향상됩니다. 새로운 도로 구조나 교통 규칙 변경에도 중앙 플랫폼에서 즉시 모델을 업데이트합니다.',
    img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&fit=crop',
  },
]

const DATA_FEATURES = [
  { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/><rect x="12" y="2" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/><rect x="2" y="12" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/><rect x="12" y="12" width="8" height="8" rx="1" stroke="#1a1a1a" strokeWidth="1.6"/></svg>, title: '차량·보행자 동시 추적', desc: '교차로 내 차량과 보행자를 동시에 추적해 충돌 위험 상황을 사전에 감지하고 경보합니다.' },
  { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.6" strokeDasharray="4 2"/><path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: '야간·우천 환경 학습', desc: '야간·우천·안개 등 다양한 도로 환경 데이터를 증강해 모든 날씨에서 높은 인식률을 유지합니다.' },
  { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 6h14M4 11h10M4 16h7" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/><circle cx="17" cy="16" r="3" stroke="#1a1a1a" strokeWidth="1.4"/></svg>, title: '교통 이력 데이터 관리', desc: '시간대·요일별 교통 흐름 데이터를 자동으로 축적해 장기 패턴 분석과 도시 계획에 활용합니다.' },
  { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 16l4-6 4 4 3-5 5 7H3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="16" cy="5" r="2" stroke="#1a1a1a" strokeWidth="1.4"/></svg>, title: '교통 밀집 히트맵', desc: '구역별 차량 밀집도와 사고 다발 지점을 열지도로 시각화해 인프라 개선 우선순위를 결정합니다.' },
]

const STATS = [
  { num: '98%+', label: '주차 공간 감지 정확도' },
  { num: '40%', label: '주차장 운영 효율 향상' },
  { num: '실시간', label: '교통 흐름 분석' },
  { num: '24/7', label: '무중단 교통 모니터링' },
]

export default function TransportDetailPage() {
  const isMobile = useIsMobile()
  const [activeFeature, setActiveFeature] = useState(0)
  useEffect(() => { const id = setInterval(() => setActiveFeature(p => (p + 1) % FEATURE_CARDS.length), 3200); return () => clearInterval(id) }, [])

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap'); .trn-hover { transition:transform 0.2s,box-shadow 0.2s; } .trn-hover:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.12); }`}</style>
      <div style={p.page}>

        <section style={{ ...p.section, padding: isMobile ? '48px 20px 52px' : '72px 40px 80px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 36 : 72, alignItems: isMobile ? 'flex-start' : 'center' }}>
              <div style={{ flex: '0 0 auto', maxWidth: isMobile ? '100%' : 480 }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>AI + CCTV · 교통·운송 솔루션</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 34 : 58, letterSpacing: isMobile ? '-1px' : '-2.2px', marginBottom: isMobile ? 16 : 22 }}>
                    <span style={{ fontWeight: 900 }}>스마트 교통</span>을<br/>실현하세요
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 28 : 40 }}>
                    AI 비전이 도로·주차장·터미널을 실시간으로 분석해<br/>교통 혼잡·사고·위반을 사전에 차단합니다.
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
                    {FEATURE_CARDS.map((fc, i) => (<button key={i} onClick={() => setActiveFeature(i)} style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: activeFeature === i ? '#1a1a1a' : '#f2f2f2', color: activeFeature === i ? '#fff' : '#888', fontSize: 11, fontWeight: activeFeature === i ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif", transition: 'all 0.2s', padding: '0 4px', lineHeight: 1.3 }}>{fc.label}</button>))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ background: '#1a1a1a', padding: isMobile ? '32px 20px' : '36px 40px' }}>
          <div style={{ ...p.inner, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
            {STATS.map((stat, i) => (<FadeIn key={i} delay={i * 0.08}><div style={{ textAlign: 'center' }}><div style={{ fontSize: isMobile ? 28 : 38, fontWeight: 900, color: '#fff', letterSpacing: '-1.5px' }}>{stat.num}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500 }}>{stat.label}</div></div></FadeIn>))}
          </div>
        </section>

        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn><div style={p.sectionLabel}>핵심 기능</div><h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>교통 문제보다<br/>항상 한 발 앞서세요</h2><p style={{ ...p.sectionSub, maxWidth: 560 }}>AI가 실시간으로 교통 흐름을 분석해 혼잡과 사고를 사전에 방지합니다.</p></FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16, marginTop: isMobile ? 28 : 44 }}>
              {FEATURE_CARDS.map((card, i) => (<FadeIn key={i} delay={i * 0.1}><div className="trn-hover" style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '3/4', position: 'relative', backgroundImage: `url(${card.img})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#e0e0e0' }}><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.05) 55%)' }}/><div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px 16px' }}><div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{card.label}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{card.desc}</div></div></div></FadeIn>))}
            </div>
          </div>
        </section>

        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn><div style={p.sectionLabel}>도입 프로세스</div><h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>도로·시설·노선<br/><span style={{ fontWeight: 900 }}>맞춤형 AI 교통관제</span></h2><p style={{ ...p.sectionSub, maxWidth: 500 }}>교통 현장에 최적화된 AI를 구축하고 도시 성장에 맞춰 지속 확장합니다.</p></FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 48 : 72, marginTop: isMobile ? 36 : 60 }}>
              {PIPELINE_ITEMS.map((item, i) => (<FadeIn key={i} delay={0.05}><div style={{ display: 'flex', flexDirection: isMobile ? 'column' : (i % 2 === 0 ? 'row' : 'row-reverse'), gap: isMobile ? 20 : 60, alignItems: 'center' }}><div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '48%' }}><div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/10', position: 'relative' }}><img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/><div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 20 }}>{item.num}</div></div></div><div style={{ flex: 1 }}><div style={{ fontSize: 11, color: '#ccc', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>STEP {item.num}</div><h3 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.8px', lineHeight: 1.25, marginBottom: 14 }}>{item.title}</h3><p style={{ fontSize: isMobile ? 14 : 15, color: '#666', lineHeight: 1.75 }}>{item.body}</p></div></div></FadeIn>))}
            </div>
          </div>
        </section>

        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn><div style={p.sectionLabel}>데이터 품질</div><h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>더 많은 도로 데이터로<br/>더 정확한 교통 예측</h2><p style={{ ...p.sectionSub, maxWidth: 480 }}>교통 AI 모델의 예측 정확도를 극대화하는 핵심 기능입니다.</p></FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 12 : 18, marginTop: isMobile ? 28 : 48 }}>
              {DATA_FEATURES.map((feat, i) => (<FadeIn key={i} delay={i * 0.08}><div style={p.featureCard}><div style={p.featureIcon}>{feat.icon}</div><div><div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{feat.title}</div><p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{feat.desc}</p></div></div></FadeIn>))}
            </div>
          </div>
        </section>

        <section style={{ ...p.section, padding: isMobile ? '52px 20px 60px' : '80px 40px 96px' }}>
          <div style={{ ...p.inner, textAlign: 'center' }}>
            <FadeIn><div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f6f6f6', borderRadius: 24, padding: '8px 18px', marginBottom: 40 }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2 3.5v4C2 10.3 4.2 12.8 7 13c2.8-.2 5-2.7 5-5.5v-4L7 1z" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4.5 7l1.5 1.5 3-3" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>SOC2 Type 2 인증 · 개인정보보호법 준수</span></div></FadeIn>
            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>GRB LAB과<br/>함께 AI를 구축하세요</h2>
              <p style={{ ...p.heroSub, fontSize: 15, marginBottom: 40, maxWidth: 440, margin: '0 auto 40px' }}>도로부터 주차장까지 —  GRBlab이 현장의 모든 시각 데이터를<br/>스마트 교통 인텔리전스로 전환합니다.</p>
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