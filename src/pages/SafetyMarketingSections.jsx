import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '-60px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* 히어로 슬라이더 */
const HERO_SLIDES = [
  {
    question: '왜 일부 사업장은 무료 도입이 가능한가요?',
    line1: '협회, 노무법인, 안전진단기관, 산업재해 예방기관 등 전문기관 추천 사업장은 무료 도입 구조로 운영됩니다.',
    line2: '산업안전 및 전기안전 관리가 필요한 사업장을 전문기관이 추천하면, 당사가 시스템 구축과 운영을 지원합니다.',
    img: '/riskimage/전기.png'
  },
  {
    question: '무엇을 관리하는 시스템인가요?',
    line1: '전기 안전, 전력 비용, 설비 상태를 하나의 체계로 통합 관리합니다.',
    line2: '카메라 AI 판독, CT 전류 측정, 전력 분석, 전기설비 점검, 산업안전진단을 연결하여 현장 운영 리스크와 비용을 동시에 관리합니다.',
    img: '/riskimage/컨베이어.png'
  },
  {
    question: '어떤 사업장이 대상인가요?',
    line1: '제조업, 식품공장, 냉동·냉장 설비 사업장, 산업단지 입주사, 노후 설비 사업장이 우선 대상입니다.',
    line2: '컴프레셔, 냉동기, 팬·펌프, 전기실, 분전반, 생산설비를 보유한 사업장에서 전기 안전과 전력 절감 효과를 동시에 기대할 수 있습니다.',
    img: '/riskimage/식품.png'
  },
  {
    question: '기존 설비를 모두 바꿔야 하나요?',
    line1: '기존 계기와 설비를 최대한 유지한 상태에서 적용합니다.',
    line2: '배선 공사와 설비 개조를 최소화하고, 카메라와 CT 기반으로 데이터를 수집해 기존 공장 환경에 맞춰 도입할 수 있습니다.',
    img: '/riskimage/프레스.png'
  },
  {
    question: '단순 모니터링 시스템인가요?',
    line1: '아닙니다. 전기 안전 감시, 전력 진단, 절감 솔루션, 법정 점검 대응까지 포함하는 운영 서비스입니다.',
    line2: '전기설비 상태 점검, 열화상 진단, 산업안전진단, 전력 절감 실행, 성과 측정·검증까지 연결되는 구조입니다.',
    img: '/riskimage/크레인.png'
  },
  {
    question: '전문기관은 어떤 방식으로 연계되나요?',
    line1: '협회, 노무법인, 산업안전진단기관, 산업재해 예방기관, 산업단지 관리조직이 추천기관이 됩니다.',
    line2: '전문기관은 관리가 필요한 사업장을 추천하고, 당사는 시스템 도입·현장 진단·운영·보고 체계를 제공하는 구조입니다.',
    img: '/riskimage/화학.png'
  },
  {
    question: '비용은 어떻게 정산되나요?',
    line1: '성과기반 에너지계약 구조에서는 절감이 검증된 경우에만 성과보수를 청구 합니다',
    line2: '기준선 대비 절감량을 측정·검증한 후 절감액의 계약 비율로 정산하며, 전문기관 추천 무료 도입 사업장은 별도 구조로 운영합니다.',
    img: '/riskimage/건설분진.png'
  },
  {
    question: '법정 점검도 포함되나요?',
    line1: '산업안전진단, 전기안전진단, 전력·화재진단, 공식 보고서 및 기관 제출까지 계약 범위에 포함됩니다.',
    line2: '법정 자격 전문인력이 직접 방문해 현장 점검, 보고서 작성, 관계기관 제출, 사후 관리까지 수행합니다.',
    img: '/riskimage/천장.png'
  },
  {
  question: '50인 미만 사업장은 추가 지원이 있나요?',
  line1: '협회, 노무법인, 안전진단기관 등 전문기관 추천 사업장은 무료 도입 구조로 운영됩니다.',
  line2: '또한 50인 미만 사업장의 경우 정부의 산업안전 및 에너지 관련 지원사업 대상에 해당할 수 있으며, 적용 가능 여부를 함께 검토합니다.',
  img: '/riskimage/전기.png'
}
]
/* 파이프라인 3개 */
const PIPELINE_ITEMS = [
  {
    num: '01',
    title: '점검 결과는 생각보다 구체적입니다.',
    body: '점검 이전에는 “우리 현장은 괜찮다”고 판단하는 경우가 많습니다.\n\n그러나 실제 현장 점검을 진행하면 평균 2~3건의 관리 누락이 확인됩니다.\n\n최근 6개월, 점검 사업장 10곳 중 8곳에서 유사한 결과가 반복되었습니다.',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop',
  },
  {
    num: '02',
    title: '사고 이후의 비용은 숫자로 남습니다.',
    body: '사망 사고 1건, 형사 책임 최소 1년.\n\n법인 벌금 최대 50억.\n보험료 인상 최대 40%, 영향은 3~5년 지속될 수 있습니다.\n\n사고는 하루지만, 비용은 수년입니다.',
    img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80&fit=crop',
  },
  {
    num: '03',
    title: '같은 법 기준, 다른 준비 수준.',
    body: '대기업은 안전에 연간 5억~10억을 투자합니다.\n\n그러나 50인 미만 사업장은 전담 인력 없이 같은 법 기준을 적용받고 있습니다.\n\n',
    img: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80&fit=crop',
  },
]
/* 18개 카피 파이프라인 */
/* 산업 안전 · 전력 관리 메시지 파이프라인 */
const COPY_PIPELINE = [
{
num: '01',
title: '같은 규모의 사업장, 이미 관리 체계를 갖추고 있습니다.',
body: '최근 산업 현장에서는 전기 안전과 설비 관리 체계를 동시에 구축하는 흐름이 빠르게 확산되고 있습니다.\n\n특히 제조업과 산업단지 사업장을 중심으로 안전관리 시스템 도입이 표준처럼 자리 잡고 있습니다.',
img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop'
},

{
num: '02',
title: '전문기관 추천 사업장은 도입 절차가 단순합니다.',
body: '협회, 노무법인, 산업안전진단기관 등 전문기관 추천 사업장은 별도 복잡한 절차 없이 시스템 도입 상담을 진행할 수 있습니다.\n\n추천 기관을 통해 현장 상황에 맞는 관리 체계를 안내받을 수 있습니다.',
img: 'https://images.unsplash.com/photo-1581092160607-ee67df57d4a1?w=800&q=80&fit=crop'
},

{
num: '03',
title: '산업재해 이후 책임 구조는 크게 달라졌습니다.',
body: '중대재해처벌법 시행 이후 산업재해는 단순 사고가 아니라 경영 책임 문제로 이어질 수 있습니다.\n\n현장의 안전관리 체계가 실제로 운영되고 있는지 확인하는 것이 중요해졌습니다.',
img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&fit=crop'
},

{
num: '04',
title: '사업장 규모와 관계없이 법적 기준은 동일합니다.',
body: '대기업과 중소 사업장 모두 동일한 산업안전보건법 기준이 적용됩니다.\n\n사업장 규모가 작더라도 안전관리 체계는 동일한 기준에서 요구됩니다.',
img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85f?w=800&q=80&fit=crop'
},

{
num: '05',
title: '대부분의 사고는 작은 이상 신호에서 시작됩니다.',
body: '설비 이상, 과전류, 과열, 누설 등 작은 신호가 누적되면서 사고로 이어지는 경우가 많습니다.\n\n초기 단계에서 이상을 감지하고 관리하는 체계가 중요한 이유입니다.',
img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop'
},

{
num: '06',
title: '현장을 기록하고 관리하는 체계가 필요합니다.',
body: '많은 사업장에서 설비 상태와 전력 사용 상태를 동시에 기록하는 체계를 구축하고 있습니다.\n\n이 데이터는 안전 관리뿐 아니라 운영 개선에도 활용됩니다.',
img: 'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=800&q=80&fit=crop'
},

{
num: '07',
title: '대기업은 이미 전력·안전 통합 관리 체계를 운영합니다.',
body: '대기업은 전기 안전, 설비 상태, 전력 사용 데이터를 함께 관리하는 시스템을 구축하고 있습니다.\n\n최근에는 중소 사업장에서도 같은 방식의 관리 체계를 적용하는 사례가 늘고 있습니다.',
img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&fit=crop'
},

{
num: '08',
title: '신뢰는 전문기관의 기준에서 시작됩니다.',
body: '산업안전보건법 기준에 따라 고용노동부 지정 안전관리 전문기관이 현장을 진단하고 관리 체계를 구축합니다.\n\n현장의 위험 요소를 법적 기준에 맞춰 분석합니다.',
img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop'
},

{
num: '09',
title: '현장 점검은 일정 범위 내에서 진행됩니다.',
body: '현장 점검과 진단은 일정 수의 사업장을 기준으로 순차적으로 진행됩니다.\n\n사업장 규모와 설비 상태에 따라 진단 일정이 조정됩니다.',
img: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&q=80&fit=crop'
},

{
num: '10',
title: '현장 점검 이후 운영 방식이 달라집니다.',
body: '설비 상태를 데이터로 확인하면서 현장의 관리 방식이 바뀌는 사례가 많습니다.\n\n이상 징후를 사전에 확인하고 대응할 수 있기 때문입니다.',
img: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80&fit=crop'
},

{
num: '11',
title: '사업장 위험 수준을 정확히 파악하는 것이 중요합니다.',
body: '많은 사업장이 실제 위험 수준을 정확히 파악하지 못한 상태에서 운영됩니다.\n\n전문 진단을 통해 설비와 전력 상태를 함께 확인하는 것이 필요합니다.',
img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&fit=crop'
},

{
num: '12',
title: '문제는 대부분 시작점이 없습니다.',
body: '안전 관리가 필요하다는 것은 대부분 알고 있습니다.\n\n하지만 어디서부터 시작해야 할지 모르는 경우가 많습니다.',
img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80&fit=crop'
},

{
num: '13',
title: '안전 서류는 형식이 아니라 운영 체계입니다.',
body: '위험성 평가, 작업 표준서, 교육 기록 등은 단순 문서가 아니라 실제 관리 체계입니다.\n\n현장에서 실제로 운영되는 구조가 중요합니다.',
img: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80&fit=crop'
},

{
num: '14',
title: '안전 관리 체계는 현장 문화를 바꿉니다.',
body: '안전 관리 체계가 도입된 현장은 작업 방식과 현장 분위기가 달라지는 경우가 많습니다.\n\n사전 예방 중심의 관리 방식이 자리 잡기 때문입니다.',
img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80&fit=crop'
},

{
num: '15',
title: '현장 진단은 간단한 절차로 시작할 수 있습니다.',
body: '사업장 기본 정보와 설비 현황을 기반으로 초기 진단을 진행할 수 있습니다.\n\n이 과정을 통해 현장 상황을 먼저 확인합니다.',
img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80&fit=crop'
},

{
num: '16',
title: '사고 이후 비용 영향은 장기간 이어질 수 있습니다.',
body: '산업재해는 사고 이후에도 보험료와 운영 비용에 장기간 영향을 줄 수 있습니다.\n\n사전 예방 관리가 중요한 이유입니다.',
img: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80&fit=crop'
},

{
num: '17',
title: '현장 점검은 짧은 진단으로 시작됩니다.',
body: '초기 진단을 통해 설비 상태와 관리 수준을 확인할 수 있습니다.\n\n필요한 경우 추가 점검과 개선 방안을 안내합니다.',
img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80&fit=crop'
},

{
num: '18',
title: '산업재해는 결국 사람의 문제입니다.',
body: '산업재해 통계는 숫자로 보이지만 결국 현장의 사람에게 발생하는 일입니다.\n\n안전 관리 체계를 구축하는 이유도 여기에 있습니다.',
img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop'
}
]


const DATA_FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2L3 6v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V6L11 2z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M8 11l2 2 4-4" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '형사 책임 최소 1년',
    desc: '사망 사고 1건이 형사 책임으로 이어질 수 있습니다. 주변 사장님께 “이 숫자만은 확인하시라”고 전해보십시오.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#1a1a1a" strokeWidth="1.6"/>
        <path d="M11 7v4l3 2" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    title: '보험료 영향 3~5년',
    desc: '사고의 영향은 하루로 끝나지 않습니다. 3~5년 이어질 수 있는 구조를 미리 아는 것이 방어가 됩니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 6h14M4 11h14M4 16h14" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="18" cy="6" r="3" fill="#fff" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '같은 규모의 “선행”',
    desc: '같은 규모의 사업장이 먼저 대비하고 있습니다. “요즘은 다들 한다더라”는 한마디가 시작점이 됩니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 16l4-6 4 4 3-5 5 7H3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="16" cy="5" r="2" stroke="#1a1a1a" strokeWidth="1.4"/>
      </svg>
    ),
    title: '흐름은 바뀌지 않았습니다',
    desc: '소규모 사업장 사망자 10.4% 증가. “잘될 것”이 아니라, “막아야 할 것”으로 접근해야 합니다.',
  },
]

const STATS = [
  { num: '3축', label: '전기 안전 · 전력 운영 · 설비 상태 통합 관리' },
  { num: '24/7', label: '카메라 AI + CT 기반 상시 모니터링' },
  { num: '5분야', label: '관리 · 기계 · 전기 · 화공 · 전력·화재진단 연계' },
  { num: 'M&V', label: '성과 측정·검증 기반 절감량 산정' },
]

const ag = {
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

export default function SafetyMarketingSections({ isMobile }) {
  const [activeCopy, setActiveCopy] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveCopy(p => (p + 1) % HERO_SLIDES.length), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ background: '#fff', fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif" }}>

      {/* ── SECTION 1 · 히어로 ── */}
   {/* ── SECTION 1 · 히어로 ── */}
<section style={{ width: '100%', padding: isMobile ? '48px 20px 52px' : '72px 40px 80px', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
  <div style={ag.inner}>
    <FadeIn>
      <div style={{ ...ag.eyebrow, fontSize: isMobile ? 11 : 12 }}>산업 안전 · 중대재해처벌법 대응</div>

      <h2 style={{ ...ag.heroTitle, fontSize: isMobile ? 26 : 40, letterSpacing: isMobile ? '-0.5px' : '-1.5px', lineHeight: 0.85, marginBottom: isMobile ? 24 : 32 }}>
        <span style={{ fontWeight: 900, display: 'block', marginBottom: isMobile ? 12 : 18 }}>
          50인 미만 사업장도
        </span>
        <span style={{ fontWeight: 400, fontSize: isMobile ? 20 : 24, color: '#777', letterSpacing: '-0.3px' }}>
          중대재해처벌법의 처벌을 알고 있습니다.
        </span>
      </h2>

      <h2 style={{ ...ag.heroTitle, fontSize: isMobile ? 26 : 40, letterSpacing: isMobile ? '-0.5px' : '-1.5px', lineHeight: 1.05, marginBottom: isMobile ? 24 : 32 }}>
        <span style={{ fontWeight: 900, display: 'block', marginBottom: isMobile ? 12 : 18 }}>
          인력도 , 예산도 없는 상태에서
        </span>
        <span style={{ fontWeight: 500, fontSize: isMobile ? 20 : 24, color: '#777', letterSpacing: '-0.3px' }}>
          같은 기준을 요구받는 구조 
          이 여건의 차이가 리스크로 이어집니다
        </span>
      </h2>

      {/* <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <motion.button style={ag.ctaPrimary} whileTap={{ scale: 0.97 }} whileHover={{ background: '#333' }}>무료 현장 점검 신청</motion.button>
        <motion.button style={ag.ctaSecondary} whileTap={{ scale: 0.97 }}>5분 자가진단 →</motion.button>
      </div> */}
    </FadeIn>
  </div>
</section>

      {/* ── SECTION 2 · 통계 바 ── */}
      <section style={{ background: '#1a1a1a', padding: isMobile ? '32px 20px' : '36px 40px' }}>
        <div style={{ ...ag.inner, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
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

 {/* ── SECTION 3 · 중대재해처벌법 양형기준 대법원 논의 ── */}
{/* 위치: SECTION 2 (통계 바) 바로 아래에 삽입 */}

<section style={{ width: '100%', padding: isMobile ? '52px 20px' : '80px 40px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
  <div style={ag.inner}>

    {/* 상단 헤더 */}
    <FadeIn>
      <div style={ag.sectionLabel}>대법원 양형위원회 논의</div>
   <h2 style={{ ...ag.sectionTitle, fontSize: isMobile ? 26 : 42, marginTop: isMobile ? 16 : 24, marginBottom: isMobile ? 16 : 24 }}>
        <span style={{ display: 'block', marginBottom: isMobile ? 10 : 16 }}>양형기준이 생기면</span>
        <span style={{ fontWeight: 400, color: '#888' }}>무엇이 달라지나요</span>
      </h2>
      <p style={{ ...ag.sectionSub, maxWidth: 520 }}>
        대법원 양형위원회가 중대재해처벌법 전담 양형기준 논의를 본격화하고 있습니다.
        지금까지는 법관 재량이었던 형량이, 기준이 생기는 순간 예측 가능하고
        더 엄격해집니다.
      </p>
    </FadeIn>

    {/* 컨텍스트 카드 3종 */}


    {/* 구분선 */}
    <FadeIn delay={0.15}>
      <div style={{ borderTop: '1px solid #e8e8e8', margin: isMobile ? '44px 0 36px' : '64px 0 52px' }} />
    </FadeIn>

    {/* 실무 체크포인트 */}
    <FadeIn delay={0.1}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: '#1a1a1a' }}>실무 체크포인트</div>
        <div style={{ fontSize: 18 }}>✅</div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#bbb', fontWeight: 600 }}>감경 사유로 논의 중인 항목</div>
      </div>
    </FadeIn>

    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 12 }}>
      {[
        { num: '01', text: '안전보건관리체계가 실제로 작동했는지', sub: '형식적 서류가 아닌 실제 운영 증거가 필요합니다' },
        { num: '02', text: '교육·점검·개선 기록이 남아 있는지', sub: '날짜·서명·결과가 남은 기록이 법정 증거가 됩니다' },
        { num: '03', text: '사고 후 재발방지 조치가 이행됐는지', sub: '조치 완료와 후속 확인까지 기록되어야 합니다' },
        { num: '04', text: '현장 위험요인 보고→조치→확인 프로세스가 있는지', sub: '흐름이 끊기지 않고 전 단계가 추적 가능해야 합니다' },
      ].map((item, i) => (
        <FadeIn key={i} delay={i * 0.07}>
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? 14 : 20,
            padding: isMobile ? '18px 20px' : '20px 28px',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #ebebeb',
            transition: 'box-shadow 0.2s',
          }}>
            <div style={{
              width: isMobile ? 32 : 36,
              height: isMobile ? 32 : 36,
              borderRadius: '50%',
              background: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
            }}>{item.num}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4 }}>{item.text}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4, lineHeight: 1.5 }}>{item.sub}</div>
            </div>
            {/* 체크 아이콘 */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, opacity: 0.25 }}>
              <circle cx="9" cy="9" r="8" stroke="#1a1a1a" strokeWidth="1.5"/>
              <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </FadeIn>
      ))}
    </div>

    {/* 한 줄 정리 */}
    <FadeIn delay={0.2}>
      <div style={{
        marginTop: isMobile ? 36 : 52,
        background: '#1a1a1a',
        borderRadius: 16,
        padding: isMobile ? '28px 24px' : '36px 40px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 14 : 28,
      }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>한 줄 정리</div>
          <div style={{ width: 36, height: 2, background: '#FAE100', borderRadius: 2 }} />
        </div>
        <p style={{
          fontSize: isMobile ? 16 : 20,
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.65,
          margin: 0,
          letterSpacing: '-0.3px',
        }}>
          양형기준 논의가 본격화됩니다.
          결국 승부는{' '}
          <span style={{ color: '#FAE100', fontWeight: 900 }}>'안전보건 체계와 기록'</span>
          에서 갈립니다.
        </p>
      </div>
    </FadeIn>

  </div>
</section>

<section style={{ width: '100%', padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
  <div style={ag.inner}>
    <FadeIn>
      <div style={ag.sectionLabel}>하나씩 확인하세요</div>
      <h2 style={{ ...ag.sectionTitle, fontSize: isMobile ? 24 : 36, fontWeight: 400, color: '#333', lineHeight: 1.55 }}>
    안전부터
전력 비용까지
<br/>

      <span style={{ fontWeight:900 }}>무료</span> 로 도입하고 <br/>   산업 전기료 최대 50%까지<span style={{ fontWeight:900 }}> 낮춥니다</span>    <br/>
      </h2>
      {/* <p style={{ ...ag.sectionSub, maxWidth: 500 }}>전력 운영 최적화를 통해 산업 전기료 최대 절반 수준까지 낮출 수 있습니다</p> */}
    </FadeIn>

    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 64 : 96, marginTop: isMobile ? 36 : 60 }}>
      {HERO_SLIDES.map((item, i) => (
        <FadeIn key={i} delay={0.05}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : (i % 2 === 0 ? 'row' : 'row-reverse'), gap: isMobile ? 24 : 72, alignItems: 'center' }}>

            {/* 이미지 */}
            <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '46%' }}>
              <div style={{ borderRadius: 18, overflow: 'hidden', aspectRatio: '4/3', position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>
                <img src={item.img} alt={item.question} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }}/>
                <div style={{ position: 'absolute', bottom: 18, left: 18 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em' }}>POINT {String(i + 1).padStart(2, '0')}</div>
                </div>
              </div>
            </div>
{/* 설명형 브리핑 블록 */}
<div style={{ flex: 1 }}>
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: isMobile ? '4px 0' : '8px 0',
    }}
  >
    <div
      style={{
        fontSize: 11,
        color: '#bbb',
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      POINT {String(i + 1).padStart(2, '0')}
    </div>

    <h3
      style={{
        fontSize: isMobile ? 20 : 28,
        fontWeight: 800,
        color: '#1a1a1a',
        lineHeight: 1.35,
        letterSpacing: '-0.6px',
        margin: 0,
      }}
    >
      {item.question}
    </h3>

    <div
      style={{
        width: 40,
        height: 2,
        background: '#1a1a1a',
        borderRadius: 2,
      }}
    />

    <p
      style={{
        fontSize: isMobile ? 16 : 19,
        fontWeight: 700,
        color: '#1a1a1a',
        lineHeight: 1.6,
        margin: 0,
        letterSpacing: '-0.2px',
      }}
    >
      {item.line1}
    </p>

    <p
      style={{
        fontSize: isMobile ? 14 : 15,
        color: '#666',
        lineHeight: 1.85,
        margin: 0,
        whiteSpace: 'pre-line',
      }}
    >
      {item.line2}
    </p>
  </div>
</div>




          </div>
        </FadeIn>
      ))}
    </div>
  </div>
</section>

      {/* ── SECTION 5 · 특징 4종 ── */}
      <section style={{ width: '100%', padding: isMobile ? '52px 20px' : '80px 40px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={ag.inner}>
          <FadeIn>
            <div style={ag.sectionLabel}>핵심 리스크</div>
            <h2 style={{ ...ag.sectionTitle, fontSize: isMobile ? 26 : 42 }}>
              더 적은 준비로<br/>더 큰 위험이 옵니다
            </h2>
            <p style={{ ...ag.sectionSub, maxWidth: 480 }}>각 리스크는 독립적으로 작동합니다. 하나만 몰라도 치명적입니다.</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 12 : 18, marginTop: isMobile ? 28 : 48 }}>
            {DATA_FEATURES.map((feat, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={ag.featureCard}>
                  <div style={ag.featureIcon}>{feat.icon}</div>
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

      {/* ── SECTION 6 · CTA ── */}
      <section style={{ width: '100%', padding: isMobile ? '52px 20px 60px' : '80px 40px 96px' }}>
        <div style={{ ...ag.inner, textAlign: 'center' }}>
          <FadeIn>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f6f6f6', borderRadius: 24, padding: '8px 18px', marginBottom: 40 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L2 3.5v4C2 10.3 4.2 12.8 7 13c2.8-.2 5-2.7 5-5.5v-4L7 1z" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M4.5 7l1.5 1.5 3-3" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>고용노동부 지정 안전관리 전문기관 · 산업안전보건법 제17조</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ ...ag.sectionLabel, textAlign: 'center', marginBottom: 16 }}>준비됐습니까?</div>
            {/* <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, color: '#1a1a1a', letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.1, marginBottom: 18 }}>
              275명.<br/>숫자 하나가 사람 하나입니다
            </h2> */}
            <p style={{ color: '#999', fontSize: 15, maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.65 }}>
              통계는 이미 예고했습니다.<br/>
              지금 당장 확인하세요.
            </p>
            {/* <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button style={ag.ctaPrimary} whileTap={{ scale: 0.97 }} whileHover={{ background: '#333' }}>무료 현장 점검 신청하기</motion.button>
              <motion.button style={ag.ctaSecondary} whileTap={{ scale: 0.97 }}>전문가 상담 →</motion.button>
            </div> */}
          </FadeIn>
        </div>
      </section>

    </div>
  )
}