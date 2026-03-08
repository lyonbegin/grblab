/**
 * SmartPowerSafetyDetailPage.jsx
 * AI CCTV > 산업 전기 안전 · 전력 통합 모니터링 시스템
 * (구 AnalogGaugeAIDetailPage 전면 교체 — 보고서 전항목 반영)
 *
 * 이미지 경로 (public/riskimage/):
 *   gauge-01-before.jpg   — 배관·설비 현장 전경
 *   gauge-02-gauges.jpg   — 다양한 아날로그 게이지
 *   gauge-03-ai-read.jpg  — AI 판독 화면
 *   gauge-04-digital.jpg  — 디지털 계기 AI 인식
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
  { label: '현장 설비 전경',        img: '/riskimage/gauge-01-before.jpg' },
  { label: '아날로그 계기 현황',    img: '/riskimage/gauge-02-gauges.jpg' },
  { label: 'AI 실시간 판독',        img: '/riskimage/gauge-03-ai-read.jpg' },
  { label: '디지털 계기 자동 인식', img: '/riskimage/gauge-04-digital.jpg' },
]

/* ══════════════════════════════════════
   KPI 통계
══════════════════════════════════════ */
const STATS = [
  { num: '70%+',  label: '국내 제조현장 아날로그 계기 잔존 비율' },
  { num: '3단계', label: '전기 안전 → 운영 효율 → 전력 비용 절감' },
  { num: '24/7',  label: 'CT + 카메라 AI 무인 실시간 감시' },
  { num: '0건',   label: '배선·설비 교체 공사 없이 도입' },
]

/* ══════════════════════════════════════
   3단계 가치 구조
══════════════════════════════════════ */
const VALUE_STEPS = [
  {
    step: '1단계 — 반드시 필요',
    title: '전기 안전',
    color: '#1a1a1a',
    bg: '#fff',
    border: '#e8e8e8',
    items: ['과부하·과전류 즉시 감지', '설비 이상 조기 발견', '화재·고장 예방', '차단기·경광등 상태 감시', '야간·무인 구간 24/7 감시'],
  },
  {
    step: '2단계 — 운영 개선',
    title: '운영 효율',
    color: '#1a1a1a',
    bg: '#fff',
    border: '#e8e8e8',
    items: ['순찰 의존 → 데이터 기반 전환', '이상 이력 자동 기록', '설비별 상태 파악', '반복 이상 구간 히트맵', '예방 정비 우선순위 제안'],
  },
  {
    step: '3단계 — 비용 절감',
    title: '전력 비용',
    color: '#1a1a1a',
    bg: '#fff',
    border: '#e8e8e8',
    items: ['피크 전력 접근 전 선제 경보', '계약전력 재검토 근거 자동 생성', '야간 불필요 부하 감지', '설비별 전력 기여도 분석', '기본요금 절감 포인트 제시'],
  },
]

/* ══════════════════════════════════════
   CT 단독 vs 카메라 단독 vs 결합 비교
══════════════════════════════════════ */
const COMPARE_ITEMS = [
  {
    title: 'CT 센서만',
    color: '#888',
    pros: ['전류 수치 정밀 측정', '연속 데이터 확보', '피크 분석 가능'],
    cons: ['현장 계기 상태 확인 불가', '차단기·경광등 상태 모름', '기존 설비 표시값 연결 약함'],
  },
  {
    title: '카메라 AI만',
    color: '#888',
    pros: ['계기판·표시창 상태 확인', '차단기·경광등 인식', '기존 설비 무변경 적용'],
    cons: ['실제 부하 변화량 정밀 수집 어려움', '전력 데이터 연속성 부족', '피크 관리 기능 제한적'],
  },
  {
    title: 'CT + 카메라 AI 결합',
    color: '#1a1a1a',
    pros: ['영상 기반 상태 확인 + 실측 수치 데이터 동시 확보', '안전·에너지·유지보수 동시 대응', '카메라=보고, CT=재고, AI=연결해 의미 생성'],
    cons: [],
    isBest: true,
  },
]

/* ══════════════════════════════════════
   전기 안전 기능 9종
══════════════════════════════════════ */
const SAFETY_FEATURES = [
  { num: '01', title: '과전류 감지', desc: '설정 임계치 초과 즉시 경보' },
  { num: '02', title: '전류 급상승 감지', desc: '단시간 급변 이벤트 포착' },
  { num: '03', title: '3상 불균형 감지', desc: '상별 전류 편차 실시간 분석' },
  { num: '04', title: '무부하·공회전 감지', desc: '불필요 가동 설비 자동 식별' },
  { num: '05', title: '비정상 ON/OFF 감지', desc: '반복 이상 패턴 탐지' },
  { num: '06', title: '과부하 설비 탐지', desc: '용량 초과 운전 설비 감시' },
  { num: '07', title: '차단기 상태 감시', desc: '트립·이상 표시 카메라 인식' },
  { num: '08', title: '계기판 경고 표시 인식', desc: '분전반 경고등·이상 표시 감지' },
  { num: '09', title: '열화상 연동 가능', desc: '분전반 발열 이상 확장 감지' },
]

/* ══════════════════════════════════════
   전력 소비 관리 기능 7종
══════════════════════════════════════ */
const POWER_FEATURES = [
  { title: '공장별 총사용량 추이', desc: '일·주·월 전력 소비 트렌드 그래프' },
  { title: '라인별 소비 패턴', desc: '생산라인별 전력 기여도 분석' },
  { title: '설비별 전력 기여도', desc: '고소비 설비 자동 순위화' },
  { title: '피크 시간대 분석', desc: '피크 발생 구간 히트맵 시각화' },
  { title: '야간 불필요 부하 감지', desc: '무인 시간대 비정상 전력 소비 탐지' },
  { title: '계약전력 재검토 근거 제공', desc: '실측 데이터 기반 재계약 근거 자동 생성' },
  { title: '기본요금 절감 포인트 분석', desc: '피크 관리 → 계약전력 조정 → 기본요금 절감' },
]

/* ══════════════════════════════════════
   실제 활용 시나리오 4가지
══════════════════════════════════════ */
const SCENARIOS = [
  { num: '01', title: '공기압축기 이상 감지', body: '압축기 전류 점진적 상승 + 압력 게이지 저하가 동시 발생 → AI가 복합 이상 이벤트로 판단 → 관리자 앱 즉시 알림 → 베어링 교체로 화재 사전 차단', color: '#1a1a1a' },
  { num: '02', title: '냉동기 야간 공회전 감지', body: '야간 무인 구간에 냉동기 무부하 공회전 지속 감지 → 불필요 전력 소비 자동 기록 → 다음날 관리자에게 리포트 제공 → 월 수십만원 전기료 절감', color: '#1a1a1a' },
  { num: '03', title: '분전반 경고등 감지', body: '순찰자 없는 야간, 분전반 내 경고등 점등 → 카메라 AI가 경고등 색상·상태 변화 즉시 인식 → 관리자 앱 알림 발송 → 차단기 트립 원인 조기 파악', color: '#1a1a1a' },
  { num: '04', title: '피크 도달 전 관리자 알림', body: '오후 2~4시 생산 집중 구간, 계약전력의 90% 도달 → AI가 피크 초과 예측 → 선제 경보 발송 → 비핵심 설비 일시 정지 → 기본요금 초과 차단', color: '#1a1a1a' },
]

/* ══════════════════════════════════════
   6단계 스토리 파이프라인
══════════════════════════════════════ */
const STORY_ITEMS = [
  { num: '01', badge: '문제 상황',    title: '전류 이상은\n사고 전에 이미 신호를 보냅니다',         body: '모터 과부하 → 발열 → 설비 이상 → 화재·고장·생산 중단. 이 흐름은 갑자기 시작되지 않습니다. 전류 이상, 온도 상승, 게이지 수치 변화 — 사고 전 신호는 반드시 있습니다. 문제는 그 신호를 사람이 24시간 볼 수 없다는 것입니다. 야간 무인 구간, 순찰 사각지대, 기록 누락이 반복됩니다.', img: '/riskimage/gauge-01-before.jpg', accent: '#1a1a1a' },
  { num: '02', badge: '현장 실태',    title: '계기는 있습니다\n하지만 아무도 계속 보지 않습니다',       body: '압력·온도·유량·전류계가 이미 설치되어 있습니다. 분전반 계기판, 차단기 상태표시, 경광등도 있습니다. 그러나 이 모든 것은 사람이 직접 눈으로 봐야만 의미가 있습니다. 순찰 간격 사이, 야간, 주의가 분산된 순간 — 바로 그 때 이상이 시작됩니다.', img: '/riskimage/gauge-02-gauges.jpg', accent: '#1a1a1a' },
  { num: '03', badge: 'AI 판독',      title: '카메라가 대신 보고\nAI가 수치로 변환합니다',              body: '카메라 영상에서 게이지 영역을 자동 인식하고 바늘 위치를 수치로 변환합니다. 압력·온도·유량·레벨 아날로그 게이지와 LCD·LED 디지털 계기를 동시에 판독합니다. 분전반 계기판, 차단기 상태, 경광등 점등 여부까지 카메라 한 대로 확인합니다. 기존 계기 교체 없이 카메라 설치만으로 즉시 작동합니다.', img: '/riskimage/gauge-03-ai-read.jpg', accent: '#1a1a1a' },
  { num: '04', badge: 'CT 전류 측정', title: '비접촉 전력 센서로\n실제 전류를 실시간 측정합니다',          body: '비접촉식 CT 센서를 기존 케이블에 클램프 방식으로 부착합니다. 배선 공사 없이 메인 인입선과 주요 설비 라인의 3상 전류 불균형·과전류·급상승·무부하 공회전을 실시간 감지합니다. 카메라가 상태를 보고, CT가 전류를 재고, AI가 두 데이터를 연결해 의미를 만듭니다.', img: '/riskimage/rc.png', accent: '#1a1a1a' },
  { num: '05', badge: '전기 안전 경보', title: '이상 감지 즉시\n경보와 알림이 동시에 발송됩니다',       body: '과전류·상불평형·설비 과부하·차단기 이상·비정상 반복 ON/OFF — 이상 이벤트가 감지되는 즉시 현장 경보등, 경광등, 관리자 앱에 동시 알림이 발송됩니다. 화재 예방·설비 보호·사고 예방 논리로 작동하며, 야간 무인 구간에도 중단 없이 감시합니다. 이상 이력은 자동 로그로 저장됩니다.', img: '/riskimage/ab.png', accent: '#1a1a1a' },
  { num: '06', badge: '전력 비용 관리', title: '피크를 잡으면\n기본요금이 내려갑니다',                  body: '전류 데이터가 축적되면 설비별 전력 소비 패턴, 피크 시간대, 야간 불필요 부하가 분석됩니다. 계약전력의 90% 도달 시 선제 경보를 보내 초과를 차단하고, 계약전력 재검토 근거를 자동으로 생성합니다. 전기 안전을 기본 가치로, 전력 비용 절감을 추가 가치로 — 두 가지 명분을 동시에 가집니다.', img: '/riskimage/electro.png', accent: '#1a1a1a' },
]

/* ══════════════════════════════════════
   차별점 5가지
══════════════════════════════════════ */
const DIFF_ITEMS = [
  { num: '01', title: '기존 계기 교체 불필요', desc: '아날로그·디지털 계기 그대로 두고 카메라만 설치합니다. 설비 투자 없이 즉시 적용됩니다.' },
  { num: '02', title: '카메라 + CT 저비용 시작', desc: '고가 EMS 없이 카메라와 CT 클램프 조합으로 시작합니다. 필요에 따라 단계적으로 확장합니다.' },
  { num: '03', title: '설비 상태 + 전력 상태 동시 감시', desc: '카메라로 눈에 보이는 상태를, CT로 눈에 안 보이는 전류를 동시에 확인합니다.' },
  { num: '04', title: '노후 공장·임대 공장 즉시 적용', desc: '배선 공사·설비 개조가 없으므로 노후 설비 현장, 임대 공장에서도 계약 갈등 없이 도입됩니다.' },
  { num: '05', title: '안전 명분 + 비용 명분 동시 보유', desc: '전기 안전으로 경영책임자를 설득하고, 전력 비용 절감으로 현장 관리자를 설득합니다.' },
]

/* ══════════════════════════════════════
   타깃 시장
══════════════════════════════════════ */
const TARGETS = [
  { grade: '제조업', color: '#1a1a1a', list: ['중소 제조업 공장', '산업단지 입주 공장', '전기실·기계실이 있는 현장', '보일러실·냉동기실·컴프레서실', '설비가 노후화된 공장', '야간 무인 운영 구간이 있는 현장'], reason: '계기는 있는데 실시간 관리 안 됨 / 전기료는 높지만 원인 모름 / 별도 EMS는 비싸다고 느낌' },
  { grade: '컨설팅 파트너', color: '#555', list: ['산업단지 관리공단', '공장 집합형 임대시설', '에너지 컨설팅 업체', '전기안전 관리 대행사', '설비 유지보수 업체'], reason: '다수 현장을 모니터링하는 플랫폼으로 확장 가능 — 단일 공장이 아닌 서비스형 운영' },
]

/* ══════════════════════════════════════
   Phase 로드맵 3단계
══════════════════════════════════════ */
const ROADMAP = [
  { phase: 'Phase 1', title: '전기 안전형 MVP', color: '#1a1a1a', items: ['분전반 계기판 AI 판독', '메인 CT 측정', '실시간 전류·경보 대시보드', '과전류·급상승 알림', '일간 이벤트 로그'], goal: '"전기 안전 감시 시스템"으로 먼저 시장 진입' },
  { phase: 'Phase 2', title: '전력 관리형 확장', color: '#555', items: ['설비별 CT 추가', '전력 추세 분석', '피크 경보', '야간 부하 탐지', '월간 소비 리포트'], goal: '전기요금 관리 솔루션으로 확장' },
  { phase: 'Phase 3', title: '예지보전형 고도화', color: '#888', items: ['복합 이벤트 분석', '고장 전조 패턴 인식', '반복 이상 설비 자동 추천', '유지보수 우선순위 제안'], goal: '예지보전·운영최적화 영역으로 확장' },
]

/* ══════════════════════════════════════
   시스템 구성 카드 4종
══════════════════════════════════════ */
const SYSTEM_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M11 11L11 5" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M11 11L15 9" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="11" cy="11" r="1.2" fill="#1a1a1a"/>
      </svg>
    ),
    title: '게이지·계기판 AI 자동 판독',
    desc: '아날로그 게이지 바늘을 수치로 변환하고 LCD·LED 디지털 계기는 OCR로 인식합니다. 분전반 표시창·차단기·경광등까지 카메라 한 대로 통합 감시합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M6 11h10M11 6v10" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.4" strokeDasharray="3 2"/>
      </svg>
    ),
    title: 'CT 비접촉 전류 측정',
    desc: '클램프 방식 CT 센서를 기존 케이블에 비접촉 부착합니다. 메인 인입·설비별·라인별 전류를 실시간 측정하며 3상 불균형·과전류·급상승을 즉시 감지합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 14l3-4 3 2 3-5 4 6H4z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M4 17h14" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="16" cy="6" r="1.5" fill="#ff3b30"/>
      </svg>
    ),
    title: '이상 감지 실시간 경보',
    desc: '과전류·상불평형·무부하 공회전·비정상 ON/OFF·피크 접근을 실시간 분석합니다. 현장 경보등과 관리자 앱에 동시 알림을 전송합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="12" rx="2" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M7 9h8M7 13h5" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="16" cy="13" r="1.5" stroke="#1a1a1a" strokeWidth="1.2"/>
      </svg>
    ),
    title: '전력 소비 분석 대시보드',
    desc: '설비별 전력 기여도·피크 시간대·야간 불필요 부하를 시각화합니다. 계약전력 재검토 근거를 자동 생성하고 기본요금 절감 포인트를 분석합니다.',
  },
]

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function SmartPowerSafetyDetailPage() {
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

        {/* ══════ SECTION 1 · 히어로 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '48px 20px 52px' : '72px 40px 80px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 36 : 72, alignItems: isMobile ? 'flex-start' : 'center' }}>
              <div style={{ flex: '0 0 auto', maxWidth: isMobile ? '100%' : 480 }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>산업 전기 안전 · 전력 통합 모니터링 시스템</div>
                  <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 32 : 52, letterSpacing: isMobile ? '-1px' : '-2px', marginBottom: isMobile ? 16 : 22, fontWeight: 400 }}>
                    <span style={{ fontWeight: 900 }}>전기 안전부터</span><br/>전력 비용까지<br/>하나로 잡습니다
                  </h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 14 : 18 }}>
                    카메라 AI 판독 + CT 전류 측정으로<br/>
                    기존 설비 그대로 — 배선 공사 없이<br/>
                    전기 안전·운영 효율·전력 비용을 통합 감시합니다.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: isMobile ? 24 : 36 }}>
                    {['① 전기 안전', '② 운영 효율', '③ 전력 비용 절감'].map((t, i) => (
                      <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#555', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 20, padding: '5px 12px' }}>{t}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <motion.button style={p.ctaPrimary} whileTap={{ scale: 0.97 }} whileHover={{ background: '#333' }}>지금 무료로 시작하기</motion.button>
                    <motion.button style={p.ctaSecondary} whileTap={{ scale: 0.97 }}>도입 상담 →</motion.button>
                  </div>
                </motion.div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                  <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: isMobile ? '4/3' : '16/9', position: 'relative', background: '#111' }}>
                    <AnimatePresence mode="wait">
                      <motion.img key={activeSlide} src={HERO_SLIDES[activeSlide].img} alt={HERO_SLIDES[activeSlide].label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }} />
                    </AnimatePresence>
                    <motion.div style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3) 50%,transparent)', zIndex: 2 }} animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }} />
                    <motion.div style={{ position: 'absolute', top: 14, right: 14, width: 12, height: 12, borderRadius: '50%', background: '#fff', zIndex: 3 }} animate={{ scale: [1, 1.7, 1], opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
                    <AnimatePresence mode="wait">
                      <motion.div key={`lbl-${activeSlide}`} style={p.imgLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>{HERO_SLIDES[activeSlide].label}</motion.div>
                    </AnimatePresence>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {HERO_SLIDES.map((s, i) => (
                      <button key={i} onClick={() => setActiveSlide(i)} style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, background: activeSlide === i ? '#1a1a1a' : '#f2f2f2', color: activeSlide === i ? '#fff' : '#888', fontSize: 11, fontWeight: activeSlide === i ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif", transition: 'all 0.2s', padding: '0 4px', lineHeight: 1.3 }}>{s.label}</button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ SECTION 2 · 통계 바 ══════ */}
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

        {/* ══════ SECTION 3 · 3단계 가치 구조 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>제품 가치 구조</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>안전이 먼저,<br/><span style={{ fontWeight: 900 }}>비용 절감은 따라옵니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>전기 안전을 기본 가치로 삼고, 운영 효율과 전력 비용 절감을 순서대로 올립니다. 안전 명분과 비용 명분을 동시에 가집니다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 14 : 20, marginTop: isMobile ? 32 : 52 }}>
              {VALUE_STEPS.map((v, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{ borderRadius: 14, border: `1.5px solid ${v.border}`, background: v.bg, padding: '28px 24px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: v.color, letterSpacing: '0.06em', marginBottom: 8 }}>{v.step}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 20, letterSpacing: '-0.5px' }}>{v.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {v.items.map((item, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, flexShrink: 0 }}/>
                          <span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 4 · CT vs 카메라 vs 결합 비교 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>왜 둘을 같이 써야 하는가</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>CT만도, 카메라만도<br/><span style={{ fontWeight: 900 }}>부족합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>카메라 = 상태를 본다. CT = 전류를 잰다. AI = 둘을 연결해 의미를 만든다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 14 : 20, marginTop: isMobile ? 32 : 52 }}>
              {COMPARE_ITEMS.map((c, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{ borderRadius: 14, border: c.isBest ? '2px solid #1a1a1a' : '1px solid #e8e8e8', background: c.isBest ? '#f5f5f5' : '#fff', padding: '24px 22px', position: 'relative' }}>
                    {c.isBest && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20 }}>GRB</div>}
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a', marginBottom: 16 }}>{c.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: c.cons.length ? 16 : 0 }}>
                      {c.pros.map((pr, j) => (
                        <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ color: '#1a1a1a', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{pr}</span>
                        </div>
                      ))}
                    </div>
                    {c.cons.length > 0 && (
                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {c.cons.map((cn, j) => (
                          <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{ color: '#ccc', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>✗</span>
                            <span style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>{cn}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

       {/* ══════ SECTION 5 · 시스템 구성도 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>시스템 구성도</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>카메라 · CT · AI가<br/><span style={{ fontWeight: 900 }}>하나로 연결됩니다</span></h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div style={{ marginTop: isMobile ? 32 : 52, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                {[
                  { title: '수집 계층', items: ['카메라 — 분전반·게이지 촬영', 'CT 센서 — 메인 인입·설비별 전류', '디지털 계기 촬영'] },
                  { title: '분석 계층', items: ['엣지 게이트웨이 / 서버', 'OCR·게이지 판독', '전류 데이터 수집', '이상 감지 엔진', '피크 분석·이벤트 로깅'] },
                  { title: '운영 계층', items: ['전기 안전 상태', '전력 소비 현황', '피크 경보', '설비 이상 경보', '일·주·월 리포트'] },
                ].map((layer, i, arr) => (
                  <div key={i} style={{ display: 'contents' }}>
                    <div style={{ borderRadius: 12, border: '1px solid #e8e8e8', background: '#fafafa', padding: '20px 22px', width: isMobile ? '100%' : 'auto', flex: isMobile ? 'none' : 1, boxSizing: 'border-box' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.06em', marginBottom: 12 }}>{layer.title}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {layer.items.map((it, j) => (
                          <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#bbb', flexShrink: 0 }}/>
                            <span style={{ fontSize: 12, color: '#555' }}>{it}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ color: '#ccc', fontSize: 20, padding: isMobile ? '8px 0' : '0 12px', textAlign: 'center', flexShrink: 0, transform: isMobile ? 'rotate(90deg)' : 'none' }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>


        {/* ══════ SECTION 6 · 전기 안전 기능 9종 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>전기 안전 기능</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>전기 이상 신호를 <br/><span style={{ fontWeight: 900 }}>실시간으로 감지합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>단순 게이지 판독이 아닙니다 — 화재·고장·사고로 이어지는 전기 이상 신호를 선제적으로 포착합니다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 10 : 14, marginTop: isMobile ? 28 : 48 }}>
              {SAFETY_FEATURES.map((f, i) => (
                <FadeIn key={i} delay={i * 0.05}>
                  <div style={{ borderRadius: 10, background: '#fff', border: '1px solid #f0f0f0', padding: '18px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#bbb', marginBottom: 10, letterSpacing: '0.04em' }}>{f.num}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: '#999', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 7 · 전력 소비 관리 7종 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>전력 소비 관리 기능</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>전기료가 왜 높은지<br/><span style={{ fontWeight: 900 }}>데이터로 보여줍니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>전기 안전 위에 얹는 2차 가치 — 피크 관리로 계약전력을 낮추고 기본요금을 절감합니다.</p>
            </FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: isMobile ? 28 : 48 }}>
              {POWER_FEATURES.map((f, i) => (
                <FadeIn key={i} delay={i * 0.05}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, background: '#fafafa', borderRadius: 10, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1a1a1a', color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{String(i+1).padStart(2,'0')}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 8 · 6단계 스토리 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>작동 원리</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>전류 이상이 사고가 되기 전<br/><span style={{ fontWeight: 900 }}>6단계로 차단합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>문제 인식부터 전력 비용 절감까지 — 카메라 AI + CT 센서가 만드는 통합 감시 흐름입니다.</p>
            </FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 52 : 80, marginTop: isMobile ? 40 : 64 }}>
              {STORY_ITEMS.map((item, i) => {
                const isEven = i % 2 === 0
                return (
                  <FadeIn key={i} delay={0.04}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : (isEven ? 'row' : 'row-reverse'), gap: isMobile ? 20 : 64, alignItems: 'center' }}>
                      <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '50%' }}>
                        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 6px 32px rgba(0,0,0,0.1)', background: '#f0f0f0' }}>
                          <img src={item.img} alt={item.title} style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} />
                          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 20 }}>{item.num}</div>
                            <div style={{ background: item.accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{item.badge}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 28, height: 2, background: item.accent, borderRadius: 2 }}/>
                          <div style={{ fontSize: 11, color: '#bbb', fontWeight: 700, letterSpacing: '0.08em' }}>STEP {item.num}</div>
                        </div>
                        <h3 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 18, whiteSpace: 'pre-line' }}>{item.title}</h3>
                        <p style={{ fontSize: isMobile ? 14 : 15, color: '#666', lineHeight: 1.8 }}>{item.body}</p>
                      </div>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 9 · 실제 활용 시나리오 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>실제 활용 시나리오</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>우리 현장에서<br/><span style={{ fontWeight: 900 }}>실제로 일어나는 일입니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>공기압축기·냉동기·분전반·피크 관리 — 현장에서 바로 적용되는 4가지 대표 시나리오입니다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 14 : 20, marginTop: isMobile ? 28 : 48 }}>
              {SCENARIOS.map((s, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={{ borderRadius: 12, border: `1.5px solid ${s.color}20`, background: '#fff', padding: '24px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: s.color, color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.num}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{s.title}</div>
                    </div>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>{s.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 10 · 차별점 5가지 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>시스템 Feature</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>안전 관리는 기본 <br/><span style={{ fontWeight: 900 }}>현장형 전력 관리 시스템</span></h2>
            </FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: isMobile ? 28 : 48 }}>
              {DIFF_ITEMS.map((d, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, background: '#fff', borderRadius: 12, padding: '20px 22px', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', background: '#1a1a1a', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{d.num}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>{d.title}</div>
                      <p style={{ fontSize: 13, color: '#777', lineHeight: 1.6 }}>{d.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 11 · 타깃 시장 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>타깃 시장</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>이런 현장에<br/><span style={{ fontWeight: 900 }}>가장 잘 맞습니다</span></h2>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 14 : 20, marginTop: isMobile ? 28 : 48 }}>
              {TARGETS.map((t, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{ borderRadius: 12, border: `1.5px solid ${t.color}20`, background: '#fff', padding: '26px 24px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: '0.06em', marginBottom: 14 }}>{t.grade}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                      {t.list.map((item, j) => (
                        <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }}/>
                          <span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14, fontSize: 12, color: '#999', lineHeight: 1.7 }}>{t.reason}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 12 · 시스템 구성 카드 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>시스템 구성</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>기존 설비 그대로<br/>당장 내일부터 적용됩니다</h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>계기 교체 없이, 배선 공사 없이 — 카메라와 CT 클램프만으로 도입합니다.</p>
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

        {/* ══════ SECTION 13 · Phase 로드맵 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>단계별 도입 로드맵</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>사업장에 맞는 <br/><span style={{ fontWeight: 900 }}>모델을 선택 합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 480 }}>전기 안전 MVP로 먼저 시장에 진입하고, 전력 관리·예지보전으로 단계적으로 확장합니다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 14 : 20, marginTop: isMobile ? 28 : 48 }}>
              {ROADMAP.map((r, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{ borderRadius: 12, border: `1.5px solid ${r.color}30`, background: '#fff', padding: '26px 22px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: r.color, letterSpacing: '0.06em', marginBottom: 8 }}>{r.phase}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', marginBottom: 18, letterSpacing: '-0.5px' }}>{r.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {r.items.map((item, j) => (
                        <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0 }}/>
                          <span style={{ fontSize: 13, color: '#444' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: `1px solid ${r.color}20`, paddingTop: 14, fontSize: 12, color: r.color, fontWeight: 700, lineHeight: 1.5 }}>목표: {r.goal}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 14 · CTA ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px 60px' : '80px 40px 96px' }}>
          <div style={{ ...p.inner, textAlign: 'center' }}>
            <FadeIn>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f6f6f6', borderRadius: 24, padding: '8px 18px', marginBottom: 40 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L2 3.5v4C2 10.3 4.2 12.8 7 13c2.8-.2 5-2.7 5-5.5v-4L7 1z" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M4.5 7l1.5 1.5 3-3" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>산업안전보건법 준수 · 스마트공장 지원사업 적용 가능 · 전기안전관리법 보조</span>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div style={{ ...p.sectionLabel, textAlign: 'center', marginBottom: 16 }}>시작할 준비가 됐나요?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
                GRB LAB과<br/>함께 구축하세요
              </h2>
              <p style={{ ...p.heroSub, fontSize: 15, maxWidth: 480, margin: '0 auto 40px' }}>
                전기 안전을 기본으로, 운영 효율과 전력 비용 절감까지.<br/>
                카메라 AI + CT 센서로 기존 설비 그대로<br/>내일부터 통합 감시를 시작합니다.
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
  featureCard:  { display: 'flex', gap: 18, padding: '24px', background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0', alignItems: 'flex-start' },
  featureIcon:  { flexShrink: 0, width: 44, height: 44, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}