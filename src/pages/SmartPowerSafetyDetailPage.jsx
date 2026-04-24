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
  { num: '3축', label: '전기 안전 · 전력 운영 · 설비 상태 통합 관리' },
  { num: '24/7', label: '카메라 AI + CT 기반 상시 모니터링' },
  { num: '5분야', label: '관리 · 기계 · 전기 · 화공 · 전력·화재진단 연계' },
  { num: 'M&V', label: '성과 측정·검증 기반 절감량 산정' },
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
  { num: '04', badge: 'CT 전류 측정', title: '비접촉 CT 센서로\n실제 전류를 실시간 측정합니다',          body: '비접촉식 CT 센서를 기존 케이블에 클램프 방식으로 부착합니다. 배선 공사 없이 메인 인입선과 주요 설비 라인의 3상 전류 불균형·과전류·급상승·무부하 공회전을 실시간 감지합니다. 카메라가 상태를 보고, CT가 전류를 재고, AI가 두 데이터를 연결해 의미를 만듭니다.', img: '/riskimage/ct.png', accent: '#1a1a1a' },
  { num: '05', badge: '전기 안전 경보', title: '이상 감지 즉시\n경보와 알림이 동시에 발송됩니다',       body: '과전류·상불평형·설비 과부하·차단기 이상·비정상 반복 ON/OFF — 이상 이벤트가 감지되는 즉시 현장 경보등, 경광등, 관리자 앱에 동시 알림이 발송됩니다. 화재 예방·설비 보호·사고 예방 논리로 작동하며, 야간 무인 구간에도 중단 없이 감시합니다. 이상 이력은 자동 로그로 저장됩니다.', img: '/riskimage/alert.png', accent: '#1a1a1a' },
  { num: '06', badge: '전력 비용 관리', title: '피크를 잡으면\n기본요금이 내려갑니다',                  body: '전류 데이터가 축적되면 설비별 전력 소비 패턴, 피크 시간대, 야간 불필요 부하가 분석됩니다. 계약전력의 90% 도달 시 선제 경보를 보내 초과를 차단하고, 계약전력 재검토 근거를 자동으로 생성합니다. 전기 안전을 기본 가치로, 전력 비용 절감을 추가 가치로 — 두 가지 명분을 동시에 가집니다.', img: '/riskimage/electro.png', accent: '#1a1a1a' },
]

/* ══════════════════════════════════════
   차별점 5가지
══════════════════════════════════════ */
/* ══════════════════════════════════════
   차별점 5가지
══════════════════════════════════════ */
const DIFF_ITEMS = [
  { 
    num: '01', 
    title: '기존 계기 그대로 활용', 
    desc: '아날로그·디지털 계기를 그대로 활용합니다. 추가 계측기 교체 없이 카메라 설치만으로 데이터를 수집합니다.' 
  },

  { 
    num: '02', 
    title: '단계적 도입 구조', 
    desc: '카메라와 CT 클램프 기반으로 시작하고, 필요에 따라 EMS·설비 제어까지 단계적으로 확장할 수 있습니다.' 
  },

  { 
    num: '03', 
    title: '설비 상태와 전력 데이터를 통합 분석', 
    desc: '카메라로 설비 상태를 확인하고 CT로 전류 데이터를 수집합니다. AI가 두 데이터를 함께 분석합니다.' 
  },

  { 
    num: '04', 
    title: '노후·임대 사업장까지 고려한 적용 방식', 
    desc: '배선 공사나 설비 개조 없이 적용할 수 있어 노후 공장이나 임대 사업장에서도 부담 없이 도입 가능합니다.' 
  },

  { 
    num: '05', 
    title: '안전과 비용 개선을 동시에 제시', 
    desc: '전기 안전과 설비 상태를 함께 관리하면서 전력 비용 절감 효과까지 동시에 확보할 수 있습니다.' 
  },
]
/* ══════════════════════════════════════
   타깃 시장
══════════════════════════════════════ */
const TARGETS = [
  { grade: '1차 ', color: '#1a1a1a', list: ['중소 제조업 공장', '산업단지 입주 공장', '전기실·기계실이 있는 현장', '보일러실·냉동기실·컴프레서실', '설비가 노후화된 공장', '야간 무인 운영 구간이 있는 현장'], reason: '계기는 있는데 실시간 관리 안 됨 / 전기료는 높지만 원인 모름 / 별도 EMS 구축 비용 부담이 높은 사업장' },
  { grade: '2차 ', color: '#555', list: ['산업단지 관리공단', '공장 집합형 임대시설', '에너지 컨설팅 업체', '전기안전 관리 대행사', '설비 유지보수 업체'], reason: '다수 현장을 모니터링하는 플랫폼으로 확장 가능 — 단일 공장이 아닌 서비스형 운영' },
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


 const [showHeavySections, setShowHeavySections] = useState(false)


  useEffect(() => {
    const id = setInterval(() => setActiveSlide(p => (p + 1) % HERO_SLIDES.length), 3200)
    return () => clearInterval(id)
  }, [])


    useEffect(() => {
    const t = setTimeout(() => setShowHeavySections(true), 120)
    return () => clearTimeout(t)
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
                  <div style={{ ...p.eyebrow, fontSize: isMobile ? 11 : 12 }}>산업 전기안전 · 전력관리 통합 플랫폼</div>
                <h1 style={{ ...p.heroTitle, fontSize: isMobile ? 32 : 52, letterSpacing: isMobile ? '-1px' : '-2px', marginBottom: isMobile ? 16 : 22, fontWeight: 400 }}>
  <span style={{ fontWeight: 900 }}>전기 안전부터</span><br/>
  전력 비용까지<br/>
  통합 관리합니다
</h1>
                  <p style={{ ...p.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 14 : 18 }}>
                    카메라 AI 판독과 CT 전류 측정을 결합해<br/>
                   기존 설비를 유지한 상태에서<br/>
                   전기 안전, 설비 상태, 전력 운영 데이터를 통합 관리합니다.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: isMobile ? 24 : 36 }}>
                    {['① 전기 안전', '② 운영 효율', '③ 전력 비용 절감'].map((t, i) => (
                      <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#555', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 20, padding: '5px 12px' }}>{t}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
           <motion.button
  style={p.ctaPrimary}
  onClick={() => {
    const link = document.createElement('a');
    link.href = 'brochure.pdf';
    link.download = 'brochure.pdf';
    link.click();
  }}
  whileTap={{ scale: 0.97 }}
  whileHover={{ background: '#333' }}
>
  브로슈어 자료 받기
</motion.button>


                    
                    {/* <motion.button style={p.ctaSecondary} whileTap={{ scale: 0.97 }}>도입 상담 →</motion.button> */}
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>전기 안전을 기반으로<br/><span style={{ fontWeight: 900 }}>운영 효율과 비용 절감을 확장합니다</span></h2>
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

{showHeavySections && (
  <>

        {/* ══════ SECTION 4 · CT vs 카메라 vs 결합 비교 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>왜 둘을 같이 써야 하는가</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>CT만도, 카메라만도<br/><span style={{ fontWeight: 900 }}>부족합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>카메라는 설비 상태를 확인하고, CT는 전류 데이터를 측정하며, AI는 두 데이터를 통합 분석합니다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 14 : 20, marginTop: isMobile ? 32 : 52 }}>
              {COMPARE_ITEMS.map((c, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{ borderRadius: 14, border: c.isBest ? '2px solid #1a1a1a' : '1px solid #e8e8e8', background: c.isBest ? '#f5f5f5' : '#fff', padding: '24px 22px', position: 'relative' }}>
                    {c.isBest && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20 }}>권장</div>}
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>9가지 전기 이상을<br/><span style={{ fontWeight: 900 }}>실시간으로 감지합니다</span></h2>
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>전류 이상 징후를<br/><span style={{ fontWeight: 900 }}>AI가 선제적으로 감지합니다</span></h2>
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>산업현장에서 반복적으로<br/><span style={{ fontWeight: 900 }}>발생하는 상황입니다</span></h2>
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
<section
  style={{
    ...p.section,
    padding: isMobile ? '52px 20px' : '72px 40px',
    background: '#fafafa',
    borderBottom: '1px solid #f0f0f0',
  }}
>
  <div style={p.inner}>
    <FadeIn>
      <div style={p.sectionLabel}>서비스 차별성</div>
      <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
        기존 에너지 관리 방식과<br />
        <span style={{ fontWeight: 900 }}>구별되는 5가지 운영 구조</span>
      </h2>
    </FadeIn>

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginTop: isMobile ? 28 : 48,
      }}
    >
      {DIFF_ITEMS.map((d, i) => (
        <FadeIn key={i} delay={i * 0.06}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 20,
              background: '#fff',
              borderRadius: 12,
              padding: '20px 22px',
              border: '1px solid #f0f0f0',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: '#fff',
                background: '#1a1a1a',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {d.num}
            </div>

            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#1a1a1a',
                  marginBottom: 6,
                }}
              >
                {d.title}
              </div>
              <p style={{ fontSize: 13, color: '#777', lineHeight: 1.6 }}>
                {d.desc}
              </p>
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
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>기존 설비를 유지한 채<br/>적용합니다</h2>
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
              <div style={p.sectionLabel}>도입 로드맵</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>사업장에 최적화된<br/><span style={{ fontWeight: 900 }}>현장 모델을 적용합니다</span></h2>
              {/* <p style={{ ...p.sectionSub, maxWidth: 480 }}>전기 안전 , 전력 관리,예지보전 </p> */}
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

        {/* ══════ SECTION 15 · 전력 진단 서비스 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>전력 진단 서비스</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>사업체 현장의 전력 구조를<br/><span style={{ fontWeight: 900 }}>먼저 진단합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>컴프레셔·냉동기·팬·펌프 등 전력 소비가 큰 설비를 중심으로 절감 가능성을 분석하고, 전력 품질 이상과 낭비 요소를 도출합니다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 14 : 24, marginTop: isMobile ? 32 : 52 }}>
              {[
                { title: '전력 사용 패턴 분석', items: ['설비별 전력 소비 분석', '최대수요전력(Peak) 분석', '계약전력 적정성 검토'] },
                { title: '전력 품질 분석', items: ['고조파 상태 분석', '역률 상태 분석', '전압 불안정 구간 확인'] },
                { title: '주요 진단 대상 설비', items: ['컴프레셔 / 냉동기·냉장 설비', '펌프 / 팬 / 공조 설비', '생산 설비 모터 / 전기 히터'] },
                { title: '진단 기대 효과', items: ['전력 낭비 설비 파악', '절감 가능 설비 도출', '전력 설비 이상 조기 발견'] },
              ].map((card, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '22px 22px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 14 }}>{card.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {card.items.map((it, j) => (
                        <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#bbb', flexShrink: 0 }}/>
                          <span style={{ fontSize: 13, color: '#555' }}>{it}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 16 · 전력 절감 솔루션 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>전력 절감 솔루션</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>인버터 · EMS · 수요관리<br/><span style={{ fontWeight: 900 }}>기반의 절감 구조를 적용합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>진단 결과를 기반으로 실절감 설비를 선별 적용합니다. 모터 부하 최적화부터 피크 자동 제어까지 — 현장에 맞는 방식으로 구성합니다.</p>
            </FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: isMobile ? 32 : 52 }}>
              {[
                {
                  num: '01', title: '인버터 적용',
                  desc: '컴프레셔·냉동기·팬·펌프·생산설비 모터에 인버터를 적용해 부하에 맞게 회전수를 자동 조정합니다. 불필요한 전력 소비를 줄이고 설비 수명을 연장합니다.',
                  items: ['컴프레셔 인버터', '냉동기 인버터', '팬 / 펌프 인버터', '생산설비 모터 인버터'],
                },
                {
                  num: '02', title: 'EMS — 에너지 관리 시스템',
                  desc: '공장 전력 데이터를 실시간으로 수집·분석해 설비별 소비 현황과 이상을 즉시 파악합니다. 데이터 기반으로 운영 개선 포인트를 지속 제시합니다.',
                  items: ['실시간 전력 모니터링', '설비별 전력 분석', '피크 관리', '전력 이상 감지', '에너지 효율 분석'],
                },
                {
                  num: '03', title: '수요 관리 (Demand Control)',
                  desc: '최대수요전력 피크를 제어해 계약전력 초과를 방지하고 기본요금을 절감합니다. 자동 수요 제어 장치와 부하 순환 운전을 결합합니다.',
                  items: ['부하 순환 운전', '설비 가동 스케줄 조정', '자동 수요 제어'],
                },
              ].map((sol, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 32, background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 14, padding: '26px 24px', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#bbb', marginBottom: 8, letterSpacing: '0.04em' }}>{sol.num}</div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>{sol.title}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.75, marginBottom: 16 }}>{sol.desc}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {sol.items.map((it, j) => (
                          <span key={j} style={{ fontSize: 12, fontWeight: 600, color: '#555', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 20, padding: '4px 12px' }}>{it}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 17 · 전력 설비 안전 관리 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>전력 설비 안전 관리</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>전기 사고와 화재를<br/><span style={{ fontWeight: 900 }}>설비 점검으로 예방합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 520 }}>변압기·분전반·차단기·케이블 — 전력 설비 전반의 안전 상태를 점검하고 열화상 진단으로 과열 위험을 선제 포착합니다.</p>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 14 : 20, marginTop: isMobile ? 32 : 52 }}>
              {[
                { title: '전기 설비 점검', items: ['변압기 상태 점검', '분전반 상태 점검', '배선 접속 상태 점검', '차단기·계전기 상태 점검', '케이블 절연 상태 점검', '접지 상태 점검'] },
                { title: '열화상 진단', items: ['분전반 과열 감지', '변압기 열화상 분석', '차단기 접촉 불량 감지', '전력 케이블 발열 확인'] },
                { title: '산업 설비 전력 진단', items: ['생산 설비 전력 소비 분석', '모터 부하 상태 분석', '설비 이상 진동·과열 감지', '설비 효율 분석', '전력 낭비 요소 도출'] },
                { title: '산업 안전 연계', items: ['전기 화재 위험 점검', '설비 과부하·과열 위험', '전기 감전 위험 관리', '가연성 물질 점화 위험 분석'] },
              ].map((card, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '22px 22px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 14 }}>{card.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {card.items.map((it, j) => (
                        <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#bbb', flexShrink: 0 }}/>
                          <span style={{ fontSize: 13, color: '#555' }}>{it}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 18 · 6단계 운영 방식 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>운영 방식</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>신청, 진단, 적용, 측정·검증,<br/><span style={{ fontWeight: 900 }}>성과 정산의 절차로 운영됩니다</span></h2>
            </FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: isMobile ? 32 : 52 }}>
              {[
                { num: '01', title: '신청 접수', desc: '협회 / 산업단지 / 기업 신청' },
                { num: '02', title: '자료 분석', desc: '전력 사용 데이터 검토 — 절감 가능성 1차 판단' },
                { num: '03', title: '현장 진단', desc: '전력 설비 및 생산 설비 현장 점검 — 절감 가능 사업장만 다음 단계 진행' },
                { num: '04', title: '절감 솔루션 적용', desc: '인버터 / EMS 설치 — 초기 설치비 최소화' },
                { num: '05', title: '운영 및 모니터링', desc: '절감 성과 측정·분석 — 기준선 대비 월별 절감량 산정' },
                { num: '06', title: '성과 공유', desc: '절감액 확인 후 계약 비율로 분배 — 절감이 발생한 경우에만 비용 발생' },
              ].map((step, i) => (
                <FadeIn key={i} delay={i * 0.05}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, background: '#fafafa', borderRadius: 10, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.num}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{step.title}</div>
                      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{step.desc}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SECTION 19 · 성과기반 계약 구조 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>성과기반 에너지계약 (ESCO)</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>측정·검증된 감축량에<br/><span style={{ fontWeight: 900 }}>근거해 청구합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 600 }}>에너지절약전문기업(ESCO) 방식의 성과기반 에너지계약(Energy Performance Contract)입니다. 사업주는 설비 투자비·운영비를 선부담하지 않습니다. 기준선(Baseline) 대비 에너지 사용량 감축이 측정·검증(M&V) 프로토콜로 확인된 경우에 한하여, 산정된 절감액의 40%를 성과보수로 청구합니다. 나머지 60%는 사업주가 기존에 납부하던 전력요금에서 직접 차감되어 운영비용 절감으로 귀속됩니다.</p>
            </FadeIn>

            {/* 계약 전제 조건 3가지 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 12 : 16, marginTop: isMobile ? 32 : 48 }}>
              {[
                { num: '01', title: '투자비 선부담 없음', desc: '설비 도입·EMS 구축·운영·유지관리 비용 전액을 계약사가 투자합니다. 사업주의 초기 자본 지출(CAPEX)이 발생하지 않습니다.' },
                { num: '02', title: '감축 미확인 시 성과보수 없음', desc: 'M&V 결과 기준선 대비 에너지 사용량 감축이 확인되지 않으면 성과보수 청구가 발생하지 않습니다. 성과보증(Performance Guarantee) 구조입니다.' },
                { num: '03', title: '성과보수는 절감액의 40%', desc: 'M&V로 검증된 감축량에 산업용(을) 전력 단가 185.5원/kWh를 적용한 절감액 중 40%를 성과보수로 청구합니다. 나머지 60%는 사업주 귀속입니다.' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '22px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#bbb', marginBottom: 10, letterSpacing: '0.04em' }}>{item.num}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{item.title}</div>
                    <p style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* M&V 기준선 + 청구 산정 구조 */}
            <FadeIn delay={0.1}>
              <div style={{ marginTop: isMobile ? 24 : 32, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: isMobile ? '24px 20px' : '36px 36px' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 28 : 48 }}>

                  {/* 좌 - 기준선·M&V 절차 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>기준선(Baseline) 설정 및 측정·검증(M&V) 절차</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { label: '기준선(Baseline) 설정', desc: '계약 전 12개월 이상 실적 전력 사용량을 기준선으로 확정합니다. 생산량·가동시간·외기온도 등 변동 요인은 부하변동 보정 계수(Adjustment Factor)를 적용해 기준선을 조정합니다.' },
                        { label: '에너지성과계약(EPC) 체결', desc: '기준선·산업용 전력 단가·성과보수율(40%)·계약기간·측정 경계(Measurement Boundary)·분쟁해결 절차를 계약서에 명시합니다. 전력요금 단가 변동 시 청구단가 자동 연동 조항을 포함합니다.' },
                        { label: '설비 도입 및 시운전(Commissioning)', desc: '인버터·EMS·수요제어장치(Demand Controller) 설치 후 시운전 기간을 운영합니다. 설비 증설·감축 시 기준선 재산정 및 계약 조정 조항이 적용됩니다.' },
                        { label: '에너지 사용량 실측 개시', desc: 'IPMVP(국제성과측정검증프로토콜) 기반 M&V 계획에 따라 설비별 전력 사용량을 실측합니다. 최대수요전력(kW)과 계약전력 변동을 병행 기록하여 기본요금 영향을 산정합니다.' },
                        { label: '성과보수 산정 및 청구', desc: '감축 kWh × 185.5원/kWh = 에너지 절감액. 성과보수 = 절감액 × 40%. 매월 M&V 데이터를 사업주에게 공개하며, 감축이 확인된 기간에 한해 청구합니다.' },
                      ].map((step, i, arr) => (
                        <div key={i}>
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1a1a1a', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i+1}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 3 }}>{step.label}</div>
                              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{step.desc}</div>
                            </div>
                          </div>
                          {i < arr.length - 1 && <div style={{ marginLeft: 10, width: 2, height: 12, background: '#e8e8e8', marginTop: 4, marginBottom: 4 }}/>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 구분선 */}
                  <div style={{ width: isMobile ? '100%' : 1, height: isMobile ? 1 : 'auto', background: '#f0f0f0' }}/>

                  {/* 우 - 청구 산정 예시 표 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>월간 성과보수 산정 예시</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid #e8e8e8' }}>
                            {['감축량\n(kWh)', '에너지\n절감액', '성과보수\n(40%)', '사업주\n귀속 (60%)'].map((h, i) => (
                              <th key={i} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#aaa', whiteSpace: 'pre', lineHeight: 1.4 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['500', '92,750원', '37,100원', '55,650원'],
                            ['2,000', '371,000원', '148,400원', '222,600원'],
                            ['5,000', '927,500원', '371,000원', '556,500원'],
                            ['10,000', '1,855,000원', '742,000원', '1,113,000원'],
                          ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                              {row.map((cell, j) => (
                                <td key={j} style={{ padding: '10px 10px', fontSize: 13, color: j === 0 ? '#999' : '#1a1a1a', fontWeight: j >= 2 ? 700 : 500, whiteSpace: 'nowrap' }}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 14, fontSize: 12, color: '#bbb', lineHeight: 1.7 }}>
                      * 산업용(을) 전력 단가 185.5원/kWh 기준<br/>
                      * 생산량·가동시간 변동 시 부하변동 보정 계수(Adjustment Factor) 적용<br/>
                      * 전력요금 단가 변동 시 성과보수 청구단가 자동 연동
                    </div>

                    {/* 타임라인 */}
                    <div style={{ marginTop: 28, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#bbb', letterSpacing: '0.06em', marginBottom: 14 }}>성과기반 에너지계약(EPC) 타임라인</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { date: '계약 전', label: '기준선(Baseline) 확정 — 과거 전력 사용량 12개월 이상 분석·합의' },
                          { date: '계약 체결', label: '에너지성과계약(EPC) 체결 — 기준선·단가·성과보수율·분쟁해결 절차 명시' },
                          { date: '1~2개월 차', label: '설비 도입 및 시운전(Commissioning)' },
                          { date: '3개월 차~', label: 'M&V 계획에 따른 에너지 사용량 실측 개시' },
                          { date: '감축 확인 후', label: '성과보수 청구 개시 — 매월 M&V 데이터 공개' },
                        ].map((t, i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', whiteSpace: 'nowrap', paddingTop: 2, minWidth: 90 }}>{t.date}</div>
                            <div style={{ width: 1, background: '#e8e8e8', alignSelf: 'stretch', flexShrink: 0 }}/>
                            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{t.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* 분쟁 예방 */}
            <FadeIn delay={0.12}>
              <div style={{ marginTop: isMobile ? 14 : 20, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: isMobile ? '22px 20px' : '28px 32px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 18 }}>측정·검증(M&V) 투명성 및 분쟁 예방</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 12 : 16 }}>
                  {[
                    { title: 'IPMVP 기반 M&V 적용', desc: '국제성과측정검증프로토콜(IPMVP) 옵션 A·B·C를 준용합니다. 기준선 기간·시운전 기간·측정 기간·측정 경계(Boundary)·부하변동 보정 방법을 계약서에 사전 명시하여 분쟁 소지를 차단합니다.' },
                    { title: '제3자 독립 검증 가능', desc: '감축량 산정 수치에 이견이 발생할 경우, 양측이 합의하는 독립 검증기관(감정인)의 판단에 따릅니다. 매월 M&V 원시 데이터를 사업주와 공유하여 비용 투명성을 확보합니다.' },
                    { title: '보수적 기준선 설정', desc: '기준선을 보수적으로 산정하여 에너지 사용량 감축이 과대 계상되지 않도록 합니다. 모든 비용 항목은 계약서에 공개하며, 성과보증 불이행 시 이행보증금(Performance Bond) 조항을 적용합니다.' },
                  ].map((card, i) => (
                    <div key={i} style={{ background: '#fafafa', borderRadius: 10, padding: '16px 16px', border: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{card.title}</div>
                      <p style={{ fontSize: 12, color: '#888', lineHeight: 1.65 }}>{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ══════ SECTION 20 · 대상 산업 + 서비스 특징 ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>대상 산업 · 서비스 특징</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>이런 사업장에<br/><span style={{ fontWeight: 900 }}>바로 적용됩니다</span></h2>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 20 : 32, marginTop: isMobile ? 32 : 52 }}>
              <FadeIn delay={0.05}>
                <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 14, padding: '28px 24px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 18 }}>주요 대상 산업</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['식품 공장', '냉동·냉장 공장', '플라스틱·사출', '금속 가공', '물류 센터', '공조 설비 사업장', '제조업 전반'].map((tag, i) => (
                      <span key={i} style={{ fontSize: 12, fontWeight: 600, color: '#444', background: '#fff', border: '1px solid #ddd', borderRadius: 20, padding: '5px 13px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 14, padding: '28px 24px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 18 }}>서비스 4가지 특징</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { title: '초기 비용 부담 최소화', desc: '설비 투자 부담 없이 시작 가능' },
                      { title: '성과 기반 운영', desc: '절감 성과 발생 시에만 비용 발생' },
                      { title: '시설 및 안전 통합 관리', desc: '전력 절감과 산업 안전을 동시에 관리' },
                      { title: '데이터 기반 운영', desc: 'EMS 기반 전력 데이터 지속 분석' },
                    ].map((feat, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0, marginTop: 6 }}/>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 3 }}>{feat.title}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{feat.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ══════ SECTION 21 · 시설안전진단 (성과보수 포함 서비스) ══════ */}
        <section style={{ ...p.section, padding: isMobile ? '52px 20px' : '72px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={p.inner}>
            <FadeIn>
              <div style={p.sectionLabel}>성과보수에 포함된 서비스</div>
              <h2 style={{ ...p.sectionTitle, fontSize: isMobile ? 26 : 42 }}>법정 자격 전문인력이 직접 방문합니다<br/><span style={{ fontWeight: 900 }}>공식 점검부터 보고서·기관 제출까지 별도 비용 없이 지원합니다</span></h2>
              <p style={{ ...p.sectionSub, maxWidth: 640 }}>성과보수 40% 계약에 시설안전진단이 포함됩니다. 법정 자격을 보유한 전문인력이 사업장에 직접 방문하여 법정 의무 점검을 실시하고, 공식 보고서를 작성하며, 고용노동부·한국전기안전공사 등 관련 기관 제출에 이르는 모든 공식 절차를 별도 비용 없이 수행합니다. 계약 기간 동안 반복 실시되는 정기 점검 전체가 무상으로 제공됩니다.</p>
            </FadeIn>

            {/* 핵심 3카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 12 : 16, marginTop: isMobile ? 32 : 48 }}>
              {[
                { num: '01', title: '법정 자격 인력 현장 직접 파견', desc: '산업안전보건법 및 전기안전관리법상 법정 자격을 보유한 전문인력이 사업장에 직접 방문하여 점검을 실시합니다. 외부 진단기관에 별도 의뢰하거나 사업주가 인력을 섭외할 필요가 없습니다.' },
                { num: '02', title: '공식 보고서 작성 및 기관 제출 대행', desc: '현장 점검 결과를 바탕으로 법정 서식에 맞는 공식 보고서를 작성하고 고용노동부·한국전기안전공사 등 관련 기관에 직접 제출합니다. 사업주가 직접 처리해야 할 행정 절차가 없습니다.' },
                { num: '03', title: '계약 기간 전체 무상 반복 제공', desc: '법정 주기에 따른 정기 점검, 설비 변경 시 수시 점검, 관계기관 현장 조사 대응까지 성과보수 계약 기간 동안 추가 비용 없이 반복 수행합니다.' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '22px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#bbb', marginBottom: 10, letterSpacing: '0.04em' }}>{item.num}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{item.title}</div>
                    <p style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* 공식 절차 전 과정 흐름 */}
            <FadeIn delay={0.08}>
              <div style={{ marginTop: isMobile ? 16 : 20, background: '#1a1a1a', borderRadius: 14, padding: isMobile ? '24px 20px' : '32px 36px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>공식 절차 전 과정 무상 수행</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.7 }}>사업주는 일정 통보만 받으면 됩니다. 준비·현장 점검·보고서 작성·기관 제출·사후 관리까지 전부 당사가 처리합니다.</div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'stretch', gap: isMobile ? 8 : 0 }}>
                  {[
                    { step: '사전 준비', lines: ['점검 계획 수립', '필요 서류 취합', '자격 인력 배정'] },
                    { step: '현장 점검', lines: ['법정 자격 인력 파견', '5개 분야 실사', '위험요인 현장 도출'] },
                    { step: '보고서 작성', lines: ['법정 서식 공식 작성', '개선대책·우선순위', '근거 자료 정리'] },
                    { step: '기관 제출', lines: ['고용노동부', '한국전기안전공사', '관련 기관 직접 접수'] },
                    { step: '사후 관리', lines: ['개선 이행 확인', '차기 점검 일정 관리', '관계기관 조사 대응'] },
                  ].map((s, i, arr) => (
                    <div key={i} style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'row', alignItems: 'center', flex: 1 }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 14px' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{s.step}</div>
                        {s.lines.map((line, j) => (
                          <div key={j} style={{ fontSize: 11, color: '#777', lineHeight: 1.8 }}>{line}</div>
                        ))}
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ color: '#444', fontSize: 14, padding: isMobile ? '0 8px' : '0 6px', flexShrink: 0 }}>→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* 5개 분야 진단 범위 */}
            <FadeIn delay={0.1}>
              <div style={{ marginTop: isMobile ? 16 : 20, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: isMobile ? '24px 20px' : '36px 36px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' }}>5개 분야 법정 점검 범위</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 14 : 18 }}>
                  {[
                    { title: '관리분야', items: ['안전보건관리체제 점검', '안전관리규정·작업지시서 검토', '산업안전보건위원회 운영 점검', '안전보건교육 실시 적정성 검토', '위험성평가 실시 여부 검토', '보호구·안전보건장비 관리상태', '재해 현황 및 재발방지대책 분석'] },
                    { title: '기계안전분야', items: ['생산설비 안전조치 상태 점검', '방호장치 기능상태 점검', '하역운반기계 관리실태 점검', '유해위험기계기구 안전검사 현황', '기계설비 위험요인 분석', '필요 시 비파괴 검사 연계'] },
                    { title: '전기안전분야', items: ['전기설비 설치상태 적정성 점검', '주요 배선 접속·결선상태 점검', '분전반 내부 스위치·접촉기 이상 점검', '변압기·차단기 상태 점검', '열화상 측정 및 분석', '과부하·과열·용량 적정성 점검', '전기안전관리 직무고시 대응 항목'] },
                    { title: '화공안전분야', items: ['화학물질 보관·관리상태 점검', '배관 누설·균열·누수 점검', '인화성·가연성 물질 관리상태', 'PSM·유해위험방지계획서 대상 검토', 'MSDS 관리상태 점검', '보호구 착용 및 취급관리 점검'] },
                  ].map((field, i) => (
                    <div key={i} style={{ background: '#fafafa', borderRadius: 10, padding: '18px 18px', border: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #ebebeb' }}>{field.title}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {field.items.map((it, j) => (
                          <div key={j} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#bbb', flexShrink: 0, marginTop: 6 }}/>
                            <span style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{it}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, background: '#1a1a1a', borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 12 }}>전력·화재진단 연계</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                    {['전기 계통진단', '전력 케이블 진단', '보호계전 시스템 진단', '고조파 장애 진단', '화재 위험 진단', '소방설비·위험물 연계 점검'].map((it, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555', flexShrink: 0 }}/>
                        <span style={{ fontSize: 12, color: '#999' }}>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* 기대효과 + FAQ */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 14 : 18, marginTop: isMobile ? 14 : 18 }}>
              <FadeIn delay={0.05}>
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '24px 22px' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 18 }}>기대효과</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {[
                      '사업장 맞춤 안전보건관리체계 구축',
                      '생산설비·전기설비 잠재 위험요인 조기 발견',
                      '법정 의무 점검 누락·지연으로 인한 과태료·행정처분 예방',
                      '관계기관 현장 조사 대응력 확보',
                      '재해 예방을 위한 실질 개선대책 서면 확보',
                      '전기·화재·설비 이상 사전 예방체계 강화',
                    ].map((ef, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0, marginTop: 6 }}/>
                        <span style={{ fontSize: 13, color: '#555', lineHeight: 1.55 }}>{ef}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '24px 22px' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 18 }}>FAQ</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      { q: '점검 비용이 정말 없나요?', a: '성과보수 40% 계약 안에 포함된 서비스입니다. 현장 방문·보고서 작성·기관 제출 비용이 별도 발생하지 않습니다.' },
                      { q: '어떤 자격을 가진 인력이 오나요?', a: '산업안전보건법 및 전기안전관리법상 법정 자격을 보유한 전문인력이 직접 파견됩니다.' },
                      { q: '기관 제출 서류는 누가 처리하나요?', a: '고용노동부·한국전기안전공사 등 관련 기관 제출 서류 작성 및 접수까지 당사가 직접 처리합니다. 사업주가 직접 대응할 사항이 없습니다.' },
                      { q: '점검은 얼마나 자주 이뤄지나요?', a: '법정 주기에 따라 연 1회 이상 정기 실시하며, 설비 변경 또는 이상 이벤트 발생 시 수시 대응합니다.' },
                    ].map((faq, i, arr) => (
                      <div key={i} style={{ paddingBottom: i < arr.length - 1 ? 14 : 0, marginBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 5 }}>Q. {faq.q}</div>
                        <div style={{ fontSize: 12, color: '#888', lineHeight: 1.65 }}>{faq.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
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

        </>
)}

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