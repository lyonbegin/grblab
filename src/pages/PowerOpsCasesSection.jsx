/**
 * PowerOpsCasesSection.jsx
 * 9개 세부 페이지 실제 내용 100% 반영
 * - 금액 표기 없음 (% 기준)
 * - 실제 이미지 URL (eco-saving.com)
 * - 카드 클릭 → 우측 슬라이드 상세 패널
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CASES = [
  // ── 압축기 ──────────────────────────────────────────
  {
    id: 'c1',
    category: 'compressor',
    categoryLabel: '압축기',
    title: '노후 대수 제어반 교체로 압축기 전력 최대 9.3% 절감',
    metric: '최대 9.3%',
    metricSub: '전력 절감률',
    date: '2023.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2022/02/20-470x290.png',
    summary:
      '이미 대수 제어반을 도입한 공장이라도 일반 제어반으로는 구현할 수 없는 제어가 있어 추가 절감의 여지가 남아 있습니다. 기존 제어반을 특수 대수 제어반으로 교체한 것만으로 추가 에너지 절감을 실현한 사례입니다.',
    situation:
      '압축기 메이커의 일반 대수 제어반은 메이커·기종·용량에 따라 제어 가능한 범위에 제한이 있습니다. 증설을 반복한 결과 여러 메이커의 압축기가 혼재하게 되었고, 일부 기기를 통합 제어하지 못하는 상황이었습니다.',
    solution:
      '국내외 주요 메이커에 대응하는 특수 대수 제어반으로 교체. 메이커·기종·용량에 무관하게 일괄 제어가 가능하며, 인버터 회전수를 읽어 더욱 정밀한 최적 운전을 실현합니다. 압력 상·하한을 세밀하게 설정해 마치 사람이 상시 조작하는 듯한 추종성 높은 제어도 구현합니다.',
    result: [
      { label: 'A 사업장 (16대, 인버터기 4대)', value: '9.3% 절감', sub: 'CO₂ 107t 감축' },
      { label: 'B 사업장 (12대, 인버터기 0대)', value: '7.2% 절감', sub: 'CO₂ 148t 감축' },
    ],
    point:
      '기존 대수 제어반이 있어도 「제어반 설치 후 압축기를 추가 증설한 경우」「여러 메이커 기기가 혼재하는 경우」「인버터 탑재기 비율이 30% 미만인 경우」 등은 교체만으로 추가 절감이 기대됩니다.',
  },
  {
    id: 'c2',
    category: 'compressor',
    categoryLabel: '압축기',
    title: '대수 제어 신규 도입으로 최대 33.8% 전력 절감 달성',
    metric: '최대 33.8%',
    metricSub: '전력 절감률',
    date: '2022.12',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2022/08/%E3%82%B3%E3%83%B3%E3%83%97%E3%83%AC%E3%83%83%E3%82%B5%E7%9C%81%E3%82%A8%E3%83%8D%E8%A8%BA%E6%96%AD%E3%82%B7%E3%83%BC%E3%83%88-470x290.png',
    summary:
      '공장 전체 전력 사용량의 20~25%를 차지하는 압축기. 대수 제어반을 처음 도입한 4개 사업장에서 모두 약 20% 이상의 전력 절감 효과를 실현한 실적을 수치와 함께 소개합니다.',
    situation:
      '압축기 사용량 절감에 관심은 있지만 어디서부터 시작해야 할지 모르거나, 압축기 증설을 검토 중인 사업장에서 대수 제어반 미도입 상태로 각 기기를 개별 관리하고 있었습니다.',
    solution:
      '메이커·기종·용량이 다른 압축기도 한꺼번에 제어하고, 분산 설치된 원격지 기기도 통합 제어하는 특수 대수 제어반을 신규 도입. 인버터 회전수까지 고려한 최적 운전으로 일반 제어반보다 큰 절감 효과를 실현합니다.',
    result: [
      { label: 'A 사업장 (12대, 인버터기 3대)', value: '19.2% 절감' },
      { label: 'B 사업장 (10대, 인버터기 3대)', value: '18.5% 절감' },
      { label: 'C 사업장 (8대, 인버터기 2대)', value: '20.4% 절감' },
      { label: 'D 사업장 (6대, 인버터기 1대)', value: '33.8% 절감' },
    ],
    point:
      '대수 제어반을 도입한 적 없는 공장은 최대 약 40%의 절감 효과를 기대할 수 있습니다. 「설비 신설 15년 이상 경과」「이기종 기기 혼재」「3대 이상」「인버터 탑재기 30% 미만」에 해당하면 특히 큰 효과가 예상됩니다.',
  },
  {
    id: 'c3',
    category: 'compressor',
    categoryLabel: '압축기',
    title: '24시간 가동 제조 공장에서 압축기 소비전력 30% 절감',
    metric: '30%',
    metricSub: '소비전력 절감',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2022/08/%E3%82%B3%E3%83%B3%E3%83%97%E3%83%AC%E3%83%83%E3%82%B5%E7%9C%81%E3%82%A8%E3%83%8D%E8%A8%BA%E6%96%AD%E3%82%B7%E3%83%BC%E3%83%88-470x290.png',
    summary:
      '24시간 가동하는 제조 공장에서 현황 파악부터 시작해 개선책 제시, 실제 시공까지 진행하여 당초 소비전력의 30% 절감을 실현했습니다. 37kW~70kW급 이기종 압축기 6대를 운용 중이던 현장입니다.',
    situation:
      '압축기 가동 상황이 전혀 가시화되지 않아 지금까지의 운용은 경험치에만 의존해 왔습니다. 주·야 생산량 차이에 따라 에어 사용량도 달라지는데, 실제 사용량조차 파악하지 못한 채 생산 라인 가동 현황과 에어 사용량 수치 취득부터 시작해야 하는 상황이었습니다.',
    solution:
      '① 원격지에서도 일괄 제어 가능한 대수 제어반을 설치해 에어 소비량과 생산량을 실시간으로 가시화. 최적값을 명확히 도출.\n② 가시화 과정에서 에어 생산량과 소비량 사이에 명백한 괴리 발견 → 에어 누설 감지 장치로 누설 지점을 특정, 순차 보수 진행.',
    result: [
      { label: '소비전력 절감', value: '30% 달성' },
      { label: '에어 소비량', value: '목표치로 감소' },
      { label: '에어 설정 압력', value: '최적값으로 저감 성공' },
    ],
    point:
      '현황 가시화 없이 진행하는 에너지 절약은 효과를 측정할 수 없습니다. 「계측 → 분석 → 시공」 순서가 30% 절감의 핵심입니다. 에어 누설도 일정 수준은 어쩔 수 없다고 생각했지만, 예상을 훨씬 초과하는 누설이 있었습니다.',
  },
  {
    id: 'c4',
    category: 'compressor',
    categoryLabel: '압축기',
    title: '분산 설치 압축기 네트워크 일괄 제어로 13% 절감',
    metric: '13%',
    metricSub: '에너지 절감률',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/02/iStock-10720737180001-470x290.jpg',
    summary:
      '금속 부품 제조 공장에서 분산 설치된 압축기의 사용 상황과 생산 설비가 필요로 하는 에어량·압력을 파악한 뒤 최적 설정을 적용한 결과, 소비전력 13% 절감을 실현했습니다.',
    situation:
      '집중 설치로 시작했지만 장기 운영 중 생산 설비 이전·건물 증축 등으로 인해 여러 구역에 압축기가 분산 배치되었습니다. 그때마다 임기응변식으로 설정 압력을 변경해 온 결과 무엇이 올바른 설정인지 알 수 없는 상태가 되었습니다.',
    solution:
      '① 압축기 소비전력·토출 공기량·압력 조사, 에어 소비량이 큰 설비의 사용 상황도 동시에 확인해 현황 정리.\n② 네트워크로 원격지를 일괄 제어하는 대수 제어반을 설치해 압축기 가동 최적화 실시.',
    result: [
      { label: '소비전력 절감', value: '13% 달성' },
      { label: '전 구역 가동 현황', value: '실시간 가시화' },
      { label: '설정 압력', value: '최적값으로 통일' },
    ],
    point:
      '"에어가 부족한 곳 근처에 새 압축기를 설치했던" 경위는 나름 합리적이었습니다. 관리를 제대로 함으로써 분산 배치 상태에서도 절감 효과를 만들어낼 수 있습니다.',
  },
  {
    id: 'c5',
    category: 'compressor',
    categoryLabel: '압축기',
    title: '에어 배관 전자밸브 자동 개폐만으로 4% 전력 절감',
    metric: '4%',
    metricSub: '에너지 절감률',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/11/pixta_60889457_M-470x290.jpg',
    summary:
      '공장 내 배관을 통해 에어를 공급하는 수지 성형 제조 공장에서, 에어 배관에 전자밸브를 설치하고 가동 설비에 맞게 자동 개폐하는 절감 방안을 적용한 결과 4%의 에너지 절감을 실현했습니다.',
    situation:
      '당일 생산 계획에 따라 가동 설비가 다름에도 불구하고, 전체 배관이 연결되어 있어 1대만 가동해도 전체 배관 내압을 높여야 했습니다. 또한 여러 곳에서 에어 누설이 발생해 설비가 멈춰 있어도 배관 내압이 떨어지면서 압축기가 계속 작동했습니다.',
    solution:
      '대수 제어반을 커스터마이즈해 전자밸브 개폐 전기 신호를 출력하는 사양으로 구성. 당일 생산 계획에 맞춰 제어반에서 개폐할 밸브를 지정함으로써 불필요한 에어 생성과 누설을 제거했습니다. 에어를 공급하는 계통과 그렇지 않은 계통을 분리함으로써 누설이 많은 계통도 명확히 식별해 별도 보수했습니다.',
    result: [
      { label: '에너지 절감률', value: '4% 달성' },
      { label: '기계 정지 시 배관 내압 저하', value: '크게 개선' },
      { label: '에어 누설량', value: '별도 보수로 추가 감소' },
    ],
    point:
      '「이미 다른 절감 수단을 모두 적용했다」는 공장에서도 유효한 추가 수단입니다. 공사 규모가 작고 투자 회수가 빠른 점도 장점입니다.',
  },

  // ── 공조 ──────────────────────────────────────────
  {
    id: 'c6',
    category: 'hvac',
    categoryLabel: '공조',
    title: '중앙 공조 펌프 유량 제어 최적화로 전력 80% 이상 절감',
    metric: '80%+',
    metricSub: '공조 전력 절감',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/02/iStock-1858915970016-470x290.jpg',
    summary:
      '중앙 공조의 단점인 피크 시에 맞춘 용량으로 운용하면 낭비 에너지가 발생합니다. 온도 관리를 통해 펌프 동작을 제어하는 방법으로 연간 80% 이상, 월간 최대 98.3%의 전력 절감을 실현했습니다.',
    situation:
      '정격 운전 중인 펌프와 실내 온도 설정 관리만으로는 전력 절감에 거의 기여하지 못했습니다. 에너지를 낭비하고 있다는 것은 알았지만 대응이 어려웠고, 에너지 절약형 펌프로의 교체는 비용 대비 효과가 맞지 않아 사내 예산 확보가 어려운 상황이었습니다.',
    solution:
      '온도 관리를 통해 펌프 유량을 제어하는 방식을 적용. 실제 소비전력은 유량 제어율의 세제곱에 비례해 감소합니다. 예를 들어 유량을 1/2로 줄이면 송수에 필요한 전력은 1/8이 되어 87.5% 감소합니다. 설정 온도와 압력 설정을 자동으로 최적 운용함으로써 환경을 바꾸지 않고도 대폭적인 전력 절감을 실현합니다.',
    result: [
      { label: '연간 전력 절감률', value: '80% 이상' },
      { label: '월간 최대 절감률', value: '98.3%' },
      { label: '공조·펌프 가동 현황', value: '실시간 가시화' },
      { label: '열원 가스 사용량', value: '함께 감소' },
    ],
    point:
      '펌프 교체 없이 제어 방식만 바꾸는 방식이므로 초기 투자가 적습니다. 실내 온도 환경은 그대로 유지되며, 가동 현황 가시화도 함께 실현됩니다.',
  },
  {
    id: 'c7',
    category: 'hvac',
    categoryLabel: '공조',
    title: '공조 간헐 운전 후부착 디바이스로 온도 유지 + 15% 절감',
    metric: '15%',
    metricSub: '공조 전력 절감',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/02/iStock-8536602940011-470x290.jpg',
    summary:
      '10여 년 동안 에너지 절약을 추진해 온 제조 공장에서, 더 이상의 방법이 없어 고민하던 중 기존 공조 설비에 후부착으로 적용 가능한 특수 제어 방식을 도입해 전기 사용량 15% 절감과 가동 현황 가시화를 실현했습니다.',
    situation:
      '이미 10수 년에 걸쳐 에너지 절약을 추진해 설비 갱신도 일통 마친 공장에서 다음 수단을 찾지 못하고 있었습니다. 비용 대비 효과를 생각하면 할 수 있는 것이 적은 상황에서, 수고 없이 절감을 실현할 수 있는 방법이 요구되고 있었습니다.',
    solution:
      '실외기에 후부착으로 설치 가능한 에너지 절약 디바이스를 적용해 특수 제어를 구현. 기존 공조 설비를 교체하지 않고도 간헐 운전에 의한 절감이 가능합니다.',
    result: [
      { label: '공조 단독 전력 절감', value: '15% 달성' },
      { label: '실내 온도', value: '변화 없음' },
      { label: '공조 가동 현황', value: '가시화 실현' },
    ],
    point:
      '공장에서 공조 전기 사용량 비중은 낮지만, ISO14001 등 기업 차원의 지속가능성 목표 달성을 위해 「할 수 있는 것은 해야 한다」는 현장에 유효합니다. 후부착이므로 설비 교체 없이 도입 가능합니다.',
  },

  // ── 조명 ──────────────────────────────────────────
  {
    id: 'c8',
    category: 'lighting',
    categoryLabel: '조명',
    title: '초기비용 0원 LED 전환으로 전력·유지관리비 대폭 절감',
    metric: '초기비용 0원',
    metricSub: 'LED 전환',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/11/3s1-470x290.jpg',
    summary:
      '조명 LED 전환을 추진하는 보조금이 해마다 줄고 있어 현실적으로 활용이 어려운 상황에서, 「밝기 제공 서비스」 방식을 활용해 초기비용 0원으로 LED 전환에 성공한 사례입니다.',
    situation:
      '투자 회수 기간이 길어 사내 품의 통과가 어렵고, 수은등·형광등 제조 중단 시기가 되어서야 LED로 전환해야 한다는 것을 알면서도 갱신 비용이 고액이라 사내 예산 확보가 필요한 상황이었습니다.',
    solution:
      '「밝기 제공 서비스」 방식 도입. 조명 기기 비용과 공사비는 0원으로 처리하고, 밝기 제공에 대한 서비스료를 납부하는 방식으로 LED 전환을 완료했습니다.',
    result: [
      { label: '초기비용', value: '0원' },
      { label: '조명 트러블 대응', value: '불필요 (무상 처리)' },
      { label: '자산 관리', value: '불필요' },
      { label: '재고 관리·업체 조율', value: '불필요, 관리 공수 대폭 감소' },
    ],
    point:
      '가장 높은 평가를 받은 것은 「조명 기기 관리를 직접 하지 않아도 된다」는 점입니다. 재고 관리, 업체 조율 등 눈에 보이지 않는 수고가 사라진 것이 전력 절감 못지않게 큰 성과였습니다.',
  },
  {
    id: 'c9',
    category: 'lighting',
    categoryLabel: '조명',
    title: '열원 설비 상부 LED 반복 단선 문제 해결, 보수 공수 제로화',
    metric: '단선 제로',
    metricSub: '트러블 해결',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2020/12/1965152_m-e1612625315353-470x290.jpg',
    summary:
      'LED 조명은 열에 약하다는 특성이 있어 열원 설비 상부에서는 고열 대응 제품도 구면 단선이 반복되었습니다. 세미오더 타입 LED 조명을 설치함으로써 고온 환경에서도 구면 단선 없이 운용하게 된 사례입니다.',
    situation:
      'LED 가격이 안정된 시점에 고온 환경 대응 LED를 설치했지만, 여름철에는 지붕 열과 열원 설비 열이 복합적으로 작용해 구면 단선이 반복 발생했습니다. 설치 장소가 고천장이라 보수 시 비계가 필요해 큰 비용이 발생했습니다.',
    solution:
      '세미오더 타입 LED 조명을 설치. 고온 환경에서도 구면 단선이 발생하지 않도록 설계된 제품으로 교체해, 단선 트러블 자체를 없앴습니다.',
    result: [
      { label: 'LED 구면 단선', value: '발생 없음' },
      { label: '고천장 보수 비계 설치', value: '불필요' },
      { label: '보수 비용·공수', value: '대폭 절감' },
    ],
    point:
      '「어쩔 수 없다」고 체념했던 문제도, 설치 환경에 맞는 제품 선정으로 해결됩니다. 열원 근처의 LED는 카탈로그 스펙만 믿지 말고 실제 환경 온도를 계측한 뒤 제품을 선정하는 것이 핵심입니다.',
  },
]

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'compressor', label: '압축기' },
  { key: 'hvac', label: '공조' },
  { key: 'lighting', label: '조명' },
]

const CAT_COLOR = {
  compressor: '#1a1a1a',
  hvac: '#2563eb',
  lighting: '#d97706',
}

// ── 상세 패널 ──────────────────────────────────────
function DetailPanel({ item, onClose }) {
  const accent = CAT_COLOR[item.category] || '#1a1a1a'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540, height: '100%',
          background: '#fff', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
        }}
      >
        {/* 이미지 헤더 */}
        <div style={{ position: 'relative', height: 200, flexShrink: 0, background: '#eee', overflow: 'hidden' }}>
          <img src={item.img} alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
          }} />
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', border: 'none',
            color: '#fff', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
          <span style={{
            position: 'absolute', top: 14, left: 14,
            fontSize: 11, fontWeight: 700, color: '#fff',
            background: accent, padding: '3px 10px', borderRadius: 20,
          }}>{item.categoryLabel}</span>
          <div style={{ position: 'absolute', bottom: 16, left: 20, color: '#fff' }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>{item.metric}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>{item.metricSub}</div>
          </div>
        </div>

        {/* 본문 */}
        <div style={{ padding: '24px 24px 52px', flex: 1 }}>
          <p style={{ fontSize: 11, color: '#bbb', marginBottom: 8 }}>{item.date}</p>
          <h2 style={{
            fontSize: 18, fontWeight: 900, color: '#1a1a1a',
            lineHeight: 1.45, letterSpacing: '-0.4px', marginBottom: 16,
          }}>{item.title}</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85, marginBottom: 28 }}>{item.summary}</p>

          <DSection title="도입 배경 · 과제" accent={accent}>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.85 }}>{item.situation}</p>
          </DSection>

          <DSection title="도입 내용" accent={accent}>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{item.solution}</p>
          </DSection>

          <DSection title="도입 효과" accent={accent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {item.result.map((r, i) => (
                <div key={i} style={{
                  background: '#f8f8f8', borderRadius: 8,
                  padding: '10px 14px', display: 'flex',
                  alignItems: 'flex-start', gap: 10, flexWrap: 'wrap',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: accent, flexShrink: 0, marginTop: 5,
                  }} />
                  <span style={{ fontSize: 12, color: '#888', flex: '0 0 auto', minWidth: 120 }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{r.value}</span>
                  {r.sub && <span style={{ fontSize: 11, color: '#aaa', width: '100%', paddingLeft: 16 }}>{r.sub}</span>}
                </div>
              ))}
            </div>
          </DSection>

          <div style={{
            marginTop: 24, padding: '14px 16px',
            borderLeft: `3px solid ${accent}`,
            background: '#f8f8f8', borderRadius: '0 8px 8px 0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 5, letterSpacing: '0.07em' }}>POINT</div>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.75 }}>{item.point}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DSection({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        letterSpacing: '0.07em', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 16, height: 2, background: accent, display: 'block' }} />
        {title}
      </div>
      {children}
    </div>
  )
}

// ── 카드 ──────────────────────────────────────────
function CaseCard({ item, onClick }) {
  const accent = CAT_COLOR[item.category] || '#1a1a1a'
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(item)}
      style={{
        background: '#fff', border: '1px solid #ebebeb',
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#f0f0f0', overflow: 'hidden' }}>
        <img src={item.img} alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, transparent 55%)',
        }} />
        <span style={{
          position: 'absolute', top: 10, left: 10,
          fontSize: 10, fontWeight: 700, color: '#fff',
          background: accent, padding: '2px 8px', borderRadius: 20,
        }}>{item.categoryLabel}</span>
        <div style={{ position: 'absolute', bottom: 10, left: 12, color: '#fff' }}>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>{item.metric}</span>
          <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 5 }}>{item.metricSub}</span>
        </div>
      </div>

      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: '#1a1a1a',
          lineHeight: 1.5, letterSpacing: '-0.2px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.title}</p>
        <p style={{
          fontSize: 11, color: '#999', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1,
        }}>{item.summary}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#ccc' }}>{item.date}</span>
          <span style={{ fontSize: 11, color: accent, fontWeight: 700 }}>상세 보기 →</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── 메인 ──────────────────────────────────────────
export default function PowerOpsCasesSection() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedCase, setSelectedCase] = useState(null)

  const filtered = activeCategory === 'all'
    ? CASES
    : CASES.filter(c => c.category === activeCategory)

  return (
    <>
     <section style={{
  padding: '56px 40px 64px',
  fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
}}>
  <div style={{ maxWidth: 1200, margin: '0 auto' }}> 
        {/* 헤더 */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#bbb',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
          }}>CASE STUDIES</div>
          <h2 style={{
            fontSize: 28, fontWeight: 900, color: '#1a1a1a',
            letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 10,
          }}>에너지 절약 시공 사례</h2>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, maxWidth: 560 }}>
            압축기·공조·조명 분야의 실제 시공 사례입니다.
            각 카드를 클릭하면 도입 배경, 시공 내용, 절감 효과를 확인하실 수 있습니다.
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid #f0f0f0' }}>
          {CATEGORIES.map(cat => {
            const count = cat.key === 'all' ? CASES.length : CASES.filter(c => c.category === cat.key).length
            const active = activeCategory === cat.key
            return (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
                background: 'none', border: 'none',
                borderBottom: active ? '2px solid #1a1a1a' : '2px solid transparent',
                padding: '8px 16px', marginBottom: -1,
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? '#1a1a1a' : '#aaa',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {cat.label}
                <span style={{
                  fontSize: 10, padding: '1px 5px', borderRadius: 10, fontWeight: 600,
                  background: active ? '#1a1a1a' : '#f0f0f0',
                  color: active ? '#fff' : '#aaa',
                  transition: 'all 0.15s',
                }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* 카드 그리드 */}
        <motion.div layout style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20, alignItems: 'start',
        }}>
          <AnimatePresence>
            {filtered.map(item => (
              <motion.div key={item.id} layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}>
                <CaseCard item={item} onClick={setSelectedCase} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        </div> 
      </section>

      {/* 상세 슬라이드 패널 */}
      <AnimatePresence>
        {selectedCase && (
          <DetailPanel item={selectedCase} onClose={() => setSelectedCase(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
