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
  { question: '대기업이랑 같은 시스템이라고요?',
    line1: '대기업 수억원. 중견기업 수천만원. 50인 미만 추천 사업장 0원.',
    line2: '시스템은 하나입니다. 도입하는 사람에 따라 가격이 다릅니다. 고용노동부 지정 안전관리 전문기관이 설계한 동일 체계입니다.',
    img: '/riskimage/건설분진.png' },

  { question: '어떻게 무료 공급이 가능한가요?',
    line1: '셰어웨어 모델은 공공기관·기업 등 특정 소비자 구간과 무료 구간이 다르게 시장가를 형성합니다.',
    line2: '대기업은 안전에 연간 10억을 투자합니다.  법 기준은 동일합니다.  이에 GRBlab이  50인 미만 사업장은, 무료로  보급 하고 있습니다 .',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80&fit=crop' },

  { question: '추천하면 저는 뭐가 좋아지나요?',
    line1: '소개만 했을 뿐인데, 우리 사업장 시스템이 무료가 됩니다.',
    line2: '복잡한 절차 없습니다. 추천인 코드만 전달했을 뿐입니다.\n\n"써보고 만족해서 추천했는데, 관리 시스템이 공짜가 됐습니다." — 인천, 제조업 대표',
    img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80&fit=crop' },


  { question: '추천받은 사업장은 얼마를 내나요?',
    line1: '50이 미만 사업체는 무료 입니다.',
    line2: '스마트안전 장비를 추가 선택하실 경우 월 1만 9천원대 가격으로 , 중견기업에 평균 4천5백만원대 공급하는  안전관리 체계를 운영합니다.',
    img: '/riskimage/밧데리.png' },



  { question: '추천받은 사람이 또 추천하면요?',
    line1: '추천받은 사업장이 또 누군가에게 전달했습니다.',
    line2: '그 순간, 처음 소개한 사장님도 다시 무료가 됩니다. 연결될수록, 모두의 부담이 줄어듭니다.',
    img: '/riskimage/천장.png' },

  { question: '저는 사업장이 없는데요?',
    line1: '사업장이 없어도, 50인 이상이어도 됩니다.',
    line2: '추천인 코드로 누군가 등록하면, 수수료로 돌아옵니다. 시스템 무료 대신, 현금입니다.',
    img: '/riskimage/식품.png' },

  { question: '어떻게 알리면 되나요?',
    line1: '어제 사장들 모임에 다녀왔습니다. 추천 코드 몇 개 돌렸습니다.',
    line2: '설명 길게 안 했습니다. "써봤는데 괜찮더라" 한마디면 충분했습니다. 코드 하나가 내 사업장 비용을 없앴습니다.',
    img: '/riskimage/전기.png' },

  { question: '이미 늦은 건 아닌가요?',
    line1: '카톡으로 코드 전달하려는데, 이미 전달된 분들로 떠 있었습니다.',
    line2: '무료라서 먼저 움직인 겁니다. 늦으면, 줄 사람이 없어집니다.',
    img: '/riskimage/컨베이어.png' },

  { question: '협회 단위로도 가능한가요?',
    line1: '협회 회원사 전체에 추천 코드 일괄 배포합니다.',
    line2: '담당자 한 명이 움직이면, 회원사 전체가 무료 구간에 들어옵니다. 협회가 회원사에게 줄 수 있는 가장 실질적인 혜택입니다.',
    img: '/riskimage/크레인.png' },

  { question: '사업단지 입주사들한테도 되나요?',
    line1: '관리소 공지 하나면 됩니다. 입주 사업장 전체가 대상입니다.',
    line2: '코드만 배포하면 됩니다. 도입은 각 사업장이 알아서 합니다. 단지 전체의 안전 수준이 공지 한 번으로 올라갑니다.',
    img: '/riskimage/패기물.png' },

  { question: '블로그 , 유튜브 채널로도 수익이 되나요?',
    line1: '안전관리 콘텐츠를 만드십니까. 구독자가 코드를 쓸 때마다 수수료가 발생합니다.',
    line2: '광고가 아닙니다. 실제로 무료로 쓰는 시스템을 소개하는 겁니다. 콘텐츠의 신뢰는 지키면서, 수익은 따라옵니다.',
    img: '/riskimage/프레스.png' },

  { question: '주변 사업장은 이미 준비했나요?',
    line1: '같은 규모의 사업장이 먼저 기준을 갖추고 있습니다.',
    line2: '준비한 사람 순서대로 격차가 벌어집니다.',
    img: '/riskimage/화학.png' },

  { question: '산업재해, 우리 현장 얘기인가요?',
    line1: '올해 산업재해 피해자 수, 142,771명.',
    line2: '숫자는 크지만, 현장에서는 늘 한 사람에서 시작됩니다.',
    img: '/riskimage/건설분진.png' },

  { question: '안 준비하면 얼마나 위험한가요?',
    line1: '법인 벌금 최대 50억. 보험료 영향은 사고 이후 3~5년.',
    line2: '준비 여부가 결국 "격차"로 남는 구간입니다.',
    img: '/riskimage/끼임.png' },
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
const COPY_PIPELINE = [
  {
    num: '01',
    title: '같은 규모의 사업장, 이미 “기준”을 갖추고 있습니다.',
    body: '아직 모르시는 사장님이 계시면, 이 한 줄만 전달해도 충분합니다.\n\n"요즘은 다들 준비하더라."\n\n그 말이 시작점이 됩니다.',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop',
  },
  {
    num: '02',
    title: '소개는 가볍게, 진행은 체계적으로.',
    body: '아는 사장님께 이 페이지 링크 하나만 전달해주시면 됩니다.\n\n첫 달 무료. 가입비 없음. 계약을 강요하지 않습니다.\n\n“좋은 정보가 있다” 한마디가 현장을 바꿉니다.',
    img: 'https://images.unsplash.com/photo-1581092160607-ee67df57d4a1?w=800&q=80&fit=crop',
  },
  {
    num: '03',
    title: '사고 한 번이 형사 책임으로 이어질 수 있습니다.',
    body: '중대재해처벌법 시행 이후 달라진 현실입니다.\n\n사망 사고 1건, 사업주 개인 형사 책임 최소 1년.\n\n이 사실을 아직 체감하지 못한 사장님이 많습니다. 먼저 알려주실수록 의미가 큽니다.',
    img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&fit=crop',
  },
  {
    num: '04',
    title: '법인 벌금 최대 50억. “모르면 손해”인 숫자입니다.',
    body: '사고 이후 법인에 부과될 수 있는 벌금, 최대 50억.\n\n사업장이 작아도 기준은 같습니다.\n\n이 숫자를 보는 순간, 사장님은 “우리 현장은 준비됐나”를 떠올립니다. 그 계기를 만들어주십시오.',
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85f?w=800&q=80&fit=crop',
  },
  {
    num: '05',
    title: '박성호 씨, 38세. 용접공. 두 아이의 아버지.',
    body: '그날도 평소처럼 출근했습니다.\n\n설비 이상 신호는 이전부터 있었습니다. 누구도 정리하지 않았고, 누구도 기록하지 않았습니다.\n\n이 문장이 “사람”으로 보이는 순간, 결정은 달라집니다. 주변에 전해주십시오.',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop',
  },
  {
    num: '06',
    title: '굳이 보지 않으셔도 됩니다. 다만, 이유는 분명해집니다.',
    body: '실제 산업재해 현장 기록입니다.\n\n이 자료를 확인한 뒤 “주변에 알려야겠다”고 말하는 분들이 많았습니다.\n\n알게 되면, 공유하고 싶어집니다. 그게 예방의 시작입니다.',
    img: 'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=800&q=80&fit=crop',
  },
  {
    num: '07',
    title: '대기업은 10억을 씁니다. 법 기준은 동일합니다.',
    body: '대기업과 소규모 사업장이 지는 법적 책임, 같습니다.\n\n하지만 준비 방식은 달라도 됩니다. 월 30만 원부터 시작할 수 있습니다.\n\n“이런 선택지가 있다”는 걸 모르는 사장님이 많습니다.',
    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&fit=crop',
  },
  {
    num: '08',
    title: '신뢰는 “근거”에서 나옵니다.',
    body: '산업안전보건법 제17조, 고용노동부 지정 안전관리 전문기관.\n\n“아는 분에게 부탁했다”가 아니라, 법이 인정한 자격으로 현장을 보는 방식입니다.\n\n소개하는 분의 신뢰를 지키기 위해, 근거부터 정리했습니다.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop',
  },
  {
    num: '09',
    title: '이번 달 무료 점검, 3곳만 남았습니다.',
    body: '매월 선착순 20곳만 진행합니다. 이번 달은 17곳이 마감됐습니다.\n\n필요한 사장님이 계시면 지금 전달해주시는 편이 낫습니다.\n\n다음 달은 다음 달의 순서가 필요합니다.',
    img: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&q=80&fit=crop',
  },
  {
    num: '10',
    title: '"처음엔 기대가 크지 않았습니다."',
    body: '경기도 시흥, 금속가공 사업장 대표.\n\n"점검을 받고 나서야 놓친 지점이 보였습니다. 개선 후엔 현장 분위기도 달라졌습니다."\n\n이런 경험은 혼자만 알기 아깝습니다. 주변에 전달해주십시오.',
    img: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80&fit=crop',
  },
  {
    num: '11',
    title: '자기 현장 위험 등급을 “정확히” 아는 곳은 많지 않습니다.',
    body: '진단을 시작했다가 결과 직전에 멈추는 분들이 많습니다.\n\n혼자 하기 어려운 분에게 “같이 확인해보자”고 전해주십시오.\n\n5분 자가진단 링크 하나면 충분합니다.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&fit=crop',
  },
  {
    num: '12',
    title: '알고 있는데, 시작이 어려운 사장님이 많습니다.',
    body: '사고가 한 번이면 끝이 아니라는 걸 모르는 분은 없습니다.\n\n문제는 “어디서부터”입니다.\n\n그 시작점을 정리해드렸습니다. 링크 하나면 됩니다.',
    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80&fit=crop',
  },
  {
    num: '13',
    title: '서류는 “있어야 한다”가 아니라 “되어 있어야” 합니다.',
    body: '위험성 평가, 작업표준서, 안전보건교육일지.\n\n무엇을 갖춰야 하는지 모르는 상태에서 점검이 나오면 흔들릴 수밖에 없습니다.\n\n처음부터 끝까지 흐름대로 정리해드립니다. 그 사실만 알려주셔도 됩니다.',
    img: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80&fit=crop',
  },
  {
    num: '14',
    title: '"이런 것까지 챙기는 줄 몰랐습니다."',
    body: '점검 이후 현장에서 자주 나오는 말입니다.\n\n안전은 통제가 아니라 신뢰를 만드는 장치입니다.\n\n좋은 사업장을 만드는 방법을, 주변에 소개해주십시오.',
    img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80&fit=crop',
  },
  {
    num: '15',
    title: '딱 한 가지만 전달하셔도 됩니다.',
    body: '이 링크 하나입니다.\n\n“이메일 하나만 남기면 체크리스트가 나온다”고만 전해주십시오.\n\n그걸로 충분합니다.',
    img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80&fit=crop',
  },
  {
    num: '16',
    title: '보험료 영향은 3~5년 이어질 수 있습니다.',
    body: '사고는 하루로 끝날 수 있습니다. 비용은 그렇지 않습니다.\n\n보험료 최대 40% 인상, 그 영향이 3~5년.\n\n이 사실을 “미리” 아는 것 자체가 방어가 됩니다. 주변에 알려주십시오.',
    img: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80&fit=crop',
  },
  {
    num: '17',
    title: '5분 자가진단, 링크 하나로 전달 가능합니다.',
    body: '사람은 직접 확인한 문제를 더 빠르게 해결합니다.\n\n“한 번만 확인해보자”는 한마디와 함께 링크를 보내주십시오.\n\n5분이 시작점이 됩니다.',
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80&fit=crop',
  },
  {
    num: '18',
    title: '142,771명. 숫자지만, 결국은 사람입니다.',
    body: '올해 산업재해 피해자 수로 언급되는 수치입니다.\n\n숫자 하나하나는 이름이 있고, 가족이 있고, 출근했던 사람입니다.\n\n이 사실을 알게 된 분은 주변에 알려주게 됩니다.',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop',
  },
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
  { num: '무료',  label: '추천한 사업장 무상 공급 — 추첨 받은 사업자 월 1만원대' },
  { num: '50억',  label: '법인 벌금 최대치 — 기준은 동일할 수 있습니다' },
  { num: '3~5년', label: '사고 이후 보험료 영향이 이어질 수 있는 기간' },
  { num: '15년형 ',   label: '사망사고가 발생 회사 CEO가 15년형 징역형을 선고' },
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
      <h2 style={{ ...ag.sectionTitle, fontSize: isMobile ? 24 : 36, fontWeight: 600, color: '#333', lineHeight: 1.55 }}>
        <span style={{ fontWeight: 900, color: '#888' }}>AI </span>안전관리시스템을<br/>
        50인 미만 사업장에 무상 공급합니다
      </h2>
      <p style={{ ...ag.sectionSub, maxWidth: 500 }}>추천인 사업장 무료 도입, 추천 받아 등록한 사업장 월 1만원대</p>
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

            {/* Q&A 버블만 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Q 버블 — 왼쪽 흰색 */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#555', flexShrink: 0 }}>Q</div>
                <div>
                  <div style={{ fontSize: 11, color: '#bbb', fontWeight: 600, marginBottom: 4 }}>질문</div>
                 <div style={{ background: '#f0f0f0', borderRadius: '0px 16px 16px 16px', padding: '12px 16px', fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#333', lineHeight: 1.55, maxWidth: isMobile ? '85%' : 320 }}>
  {item.question}
</div>
                </div>
              </div>

              {/* A 버블 — 오른쪽 노란색 */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: 'row-reverse' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FAE100', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#3C1E1E', flexShrink: 0 }}>A</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 11, color: '#bbb', fontWeight: 600, marginBottom: 4 }}>GRB AI</div>
            <div style={{ background: '#FAE100', borderRadius: '16px 0px 16px 16px', padding: '14px 18px', maxWidth: isMobile ? '85%' : 340 }}>
  <p style={{ fontSize: isMobile ? 16 : 19, fontWeight: 800, color: '#3C1E1E', lineHeight: 1.5, margin: '0 0 8px' }}>{item.line1}</p>
  <p style={{ fontSize: isMobile ? 14 : 15, color: 'rgba(60,30,30,0.7)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{item.line2}</p>
</div>
                </div>
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