/**
 * HealthcareDetailPage.jsx
 * AI + CCTV > 의료·헬스케어 세부 페이지
 * 동일 디자인 시스템 (Noto Sans KR · #1a1a1a · motion)
 * AgricultureDetailPage와 동일한 6섹션 구조
 *
 * 이미지 출처 (모두 Unsplash 무료 라이선스):
 *   photo-1579684385127-1ef15d508118  – 병원 복도·병실 전경
 *   photo-1530026405186-ed1f139313f8  – 병원 수술실 의료진
 *   photo-1576091160550-2173dba999ef  – 의료 장비·모니터 클로즈업
 *   photo-1559757148-5c350d0d3c56   – 환자 낙상·응급 감지 분위기
 *   photo-1551190822-a9333d879b1f   – 의료 스태프 워크플로우
 *   photo-1631815587646-912b03374fce  – 병원 CCTV·복도 모니터링
 *   photo-1576671081837-49000212a639  – 의료 데이터 분석 대시보드
 *   photo-1581595219315-a187dd40c322  – 의약품·처방전 관리
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
   데이터
══════════════════════════════════════ */

const FEATURE_CARDS = [
  {
    label: '환자 낙상·응급 감지',
    desc: '병실·복도 CCTV가 환자 낙상 자세와 이상 움직임을 즉시 감지해 의료진에게 실시간 경보를 전송합니다.',
    // 병원 복도·병실 전경
    img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=700&q=80&fit=crop',
  },
  {
    label: '의료진 위생·보호구 준수',
    desc: '수술실·처치실에서 마스크·글러브·가운 착용 여부를 AI가 자동 확인해 원내 감염 리스크를 최소화합니다.',
    // 수술실 의료진
    img: 'https://images.unsplash.com/photo-1628235176517-71013205a2de?w=700&q=80&fit=crop',
  },
  {
    label: '의료 장비·바이탈 자동 판독',
    desc: '혈압계·산소포화도계·수액 모니터 등 아날로그 디스플레이를 카메라로 자동 판독해 EMR에 실시간 기록합니다.',
    // 의료 장비·모니터 클로즈업
    img: 'https://images.unsplash.com/photo-1564725075388-cc8338732289?w=700&q=80&fit=crop',
  },
  {
    label: '의약품·처방전 재고 관리',
    desc: '약국·조제실 카메라로 의약품 수량을 자동 집계하고 처방 오류를 감지해 투약 안전성과 재고 효율을 높입니다.',
    // 의약품·처방전 관리
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&q=80&fit=crop',
  },
]

const PIPELINE_ITEMS = [
  {
    num: '01',
    title: '병원·의료시설 CCTV 인프라 구축 및 의료 영상 데이터 수집',
    body: '병실·복도·수술실·약국 등 의료시설 전역에 CCTV를 배치하고 실시간 영상 스트림을 통합 수집합니다. 기존 병원 네트워크와 연동해 별도 인프라 투자 없이 AI 분석 레이어를 즉시 추가할 수 있으며, HIPAA·개인정보보호법 기준에 맞게 데이터를 암호화 관리합니다.',
    // 병원 스태프·운영 현장
    img: 'https://images.unsplash.com/photo-1664902265139-934219cee42f?w=800&q=80&fit=crop',
  },
  {
    num: '02',
    title: 'AI · CCTV · 의료기기 · 컴퓨터 비전의 통합 환자 안전 시스템 구현',
    body: '컴퓨터 비전과 AI를 결합하면 의료진에게 사실상 병원 전체를 동시에 모니터링하는 능력을 제공합니다. CCTV·웨어러블·의료기기 데이터를 통합 분석해 낙상·응급·위생 위반을 실시간 감지하고, EMR·간호 콜 시스템과 연동해 즉각적인 대응 체계를 구축합니다.',
    // 의료 데이터 분석 대시보드
    img: 'https://images.unsplash.com/photo-1564725075388-cc8338732289?w=800&q=80&fit=crop',
  },
  {
    num: '03',
    title: '진료과·시설별 지속적인 모델 개선 및 고도화',
    body: '환자 데이터가 쌓일수록 모델도 함께 성장합니다. 내과·외과·응급실 등 진료과 특성과 시설 구조에 맞게 감지 항목을 세분화하고, 임상 피드백을 반영한 지속적인 재학습으로 오탐률을 최소화하며 의료 현장 신뢰도를 높입니다.',
    // 병원 CCTV·복도 모니터링
    img: 'https://images.unsplash.com/photo-1513224502586-d1e602410265?w=800&q=80&fit=crop',
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
    title: '멀티 병실 동시 타일링',
    desc: '수십 개 병실·복도 CCTV를 동시에 처리하는 타일링 기술로 병원 전역을 빈틈없이 모니터링합니다. 소형 의약품·바이탈 수치도 높은 정확도로 인식합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.6" strokeDasharray="4 2"/>
        <path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '야간·저조도 데이터 증강',
    desc: '야간 병동, 응급실 조명 변화 등 다양한 조도 환경을 시뮬레이션한 학습 데이터를 자동 생성해 24시간 어떤 환경에서도 정확한 감지 성능을 유지합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 6h14M4 11h10M4 16h7" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="17" cy="16" r="3" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '진료과별 버전 관리',
    desc: '내과·외과·응급실·약국 등 진료과 특성에 따라 데이터셋 버전을 분리 관리합니다. 임상 피드백을 반영한 모델을 빠르게 배포하고 이전 버전과 성능을 즉시 비교합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 16l4-6 4 4 3-5 5 7H3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="16" cy="5" r="2" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '환자 안전 통합 대시보드',
    desc: '병원 전체 낙상 경보·위생 준수율·장비 가동 현황을 하나의 화면에서 실시간 파악합니다. 누적 데이터로 고위험 환자·시간대·구역을 예측해 의료진 배치를 최적화합니다.',
  },
]

const STATS = [
  { num: '90%',   label: '수작업 데이터 입력 시간 단축' },
  { num: '낙상 즉시', label: '실시간 감지 및 경보 전송' },
  { num: '24/7',  label: '무중단 환자 모니터링' },
  { num: 'HIPAA', label: '의료 정보 보호 기준 준수' },
]

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function HealthcareDetailPage() {
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
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>AI + CCTV · 의료·헬스케어 솔루션</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 34 : 58, letterSpacing: isMobile ? '-1px' : '-2.2px', marginBottom: isMobile ? 16 : 22 }}>
                    <span style={{ fontWeight: 900 }}>환자 안전</span>과<br/>의료 품질을 높이세요
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 28 : 40 }}>
                    컴퓨터 비전 AI가 낙상 감지·위생 준수·장비 판독·의약품 관리를 실시간으로 처리해<br/>
                    의료 현장의 안전 사고를 원천 차단하고 운영 효율을 극대화합니다.
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
                    <motion.div
                      style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.4) 50%,transparent)', zIndex: 2 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    />
                    <AnimatePresence mode="wait">
                      <motion.div key={`label-${activeFeature}`} style={p.imgLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        {FEATURE_CARDS[activeFeature].label}
                      </motion.div>
                    </AnimatePresence>
                  </div>

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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                사고 발생보다<br/>항상 한 발 앞서세요
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 560 }}>
                컴퓨터 비전이 의료 현장의 위험 징후를 조기에 포착해 즉각 대응할 수 있도록 돕습니다.
              </p>
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
                진료과·시설·규모<br/><span style={{ fontWeight: 900 }}>맞춤형 AI 모델</span> 개발 및 적용
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 500 }}>
                의료 현장에 특화된 맞춤형 AI 모델 개발을 통해 병원 CCTV에 즉시 적용됩니다.
              </p>
            </FadeIn>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 48 : 72, marginTop: isMobile ? 36 : 60 }}>
              {PIPELINE_ITEMS.map((item, i) => {
                const isEven = i % 2 === 0
                return (
                  <FadeIn key={i} delay={0.05}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : (isEven ? 'row' : 'row-reverse'), gap: isMobile ? 20 : 60, alignItems: 'center' }}>
                      <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '48%' }}>
                        <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/10', position: 'relative' }}>
                          <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 20, letterSpacing: '0.04em' }}>
                            {item.num}
                          </div>
                        </div>
                      </div>
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
                더 적은 데이터로<br/>더 높은 임상 정확도
              </h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>
                의료 현장 학습 데이터를 최대한 활용해 모델 성능을 극대화하는 핵심 기능입니다.
              </p>
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
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>SOC2 Type 2 · HIPAA 준수 · 개인정보보호법 준수</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
                GRB LAB과<br/>함께 AI를 구축하세요
              </h2>
              <p style={{ ...p.heroSub, fontSize: 15, maxWidth: 440, margin: '0 auto 40px' }}>
                병실부터 수술실까지 —  GRBlab이 의료 현장의 모든 시각 데이터를<br/>
                환자 안전 인텔리전스로 전환합니다.
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