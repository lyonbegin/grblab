import { useState } from 'react'
import FrequencySeverityCard from './cards/FrequencySeverityCard'
import ChecklistCard from './cards/ChecklistCard'
import CoreFactorsCard from './cards/CoreFactorsCard'
import ThreeLevelCard from './cards/ThreeLevelCard'
import HealthCard from './cards/HealthCard'

const METHODS = [
  { key: 'frequencySeverity', label: '빈도·강도법',    desc: '가능성×중대성 매트릭스' },
  { key: 'checklist',         label: '체크리스트법',   desc: '항목별 위험 해당 여부' },
  { key: 'coreFactors',       label: '핵심요인기술법', desc: '시나리오 서술형 분석' },
  { key: 'threeLevel',        label: '3단계판단법',    desc: '허용·개선·불가 3등급' },
  { key: 'health',            label: '산업보건평가',   desc: '직업병 유발 유해인자' },
]

const CARD_COMPONENTS = {
  frequencySeverity: FrequencySeverityCard,
  checklist: ChecklistCard,
  coreFactors: CoreFactorsCard,
  threeLevel: ThreeLevelCard,
  health: HealthCard,
}

const OVERALL_KEY = {
  frequencySeverity: (d) => {
    const max = Math.max(...(d?.map(r => r.score) || [0]))
    if (max >= 17) return { label: '즉시조치', color: '#c0392b' }
    if (max >= 10) return { label: '고위험',   color: '#e67e22' }
    if (max >= 5)  return { label: '중위험',   color: '#c8960c' }
    return              { label: '저위험',   color: '#1e8449' }
  },
  checklist: (d) => {
    if (d?.some(r => r.judgment === '즉시조치')) return { label: '즉시조치', color: '#c0392b' }
    if (d?.some(r => r.judgment === '고위험'))   return { label: '고위험',   color: '#e67e22' }
    if (d?.some(r => r.judgment === '중위험'))   return { label: '중위험',   color: '#c8960c' }
    return { label: '저위험', color: '#1e8449' }
  },
  coreFactors: (d) => {
    if (d?.some(r => r.riskLevel === '즉시조치')) return { label: '즉시조치', color: '#c0392b' }
    if (d?.some(r => r.riskLevel === '고위험'))   return { label: '고위험',   color: '#e67e22' }
    if (d?.some(r => r.riskLevel === '중위험'))   return { label: '중위험',   color: '#c8960c' }
    return { label: '저위험', color: '#1e8449' }
  },
  threeLevel: (d) => {
    if (d?.some(r => r.judgment === '허용불가능')) return { label: '허용불가능', color: '#c0392b' }
    if (d?.some(r => r.judgment === '개선필요'))   return { label: '개선필요',   color: '#c8960c' }
    return { label: '허용가능', color: '#1e8449' }
  },
  health: (d) => !d?.applicable
    ? { label: '해당없음', color: '#888' }
    : d?.items?.some(r => r.level === '즉시조치' || r.level === '고위험')
      ? { label: '관리필요', color: '#e67e22' }
      : { label: '저위험', color: '#1e8449' },
}

export default function MethodCarousel({ data }) {
  const [current, setCurrent] = useState(0)
  const method = METHODS[current]
  const CardComponent = CARD_COMPONENTS[method.key]
  const cardData = data?.[method.key]
  const overall = OVERALL_KEY[method.key]?.(cardData)

  return (
    <div style={s.wrap}>
      {/* 탭 헤더 — 서류 탭 스타일 */}
      <div style={s.tabBar}>
        {METHODS.map((m, i) => (
          <button
            key={m.key}
            onClick={() => setCurrent(i)}
            style={{
              ...s.tab,
              ...(i === current ? s.tabActive : {}),
            }}
          >
            <div style={s.tabNum}>0{i+1}</div>
            <div style={s.tabLabel}>{m.label}</div>
          </button>
        ))}
      </div>

      {/* 평가방식 헤더 */}
      <div style={s.cardHeader}>
        <div>
          <div style={s.methodTitle}>{method.label}</div>
          <div style={s.methodDesc}>{method.desc}</div>
        </div>
        {overall && (
          <div style={{
            ...s.overallBadge,
            color: overall.color,
            borderColor: overall.color,
          }}>
            <div style={s.badgeLabel}>평가결과</div>
            <div style={s.badgeValue}>{overall.label}</div>
          </div>
        )}
      </div>

      {/* 카드 본문 */}
      <div style={s.cardBody}>
        {CardComponent && <CardComponent data={cardData} />}
      </div>

      {/* 하단 네비게이션 */}
      <div style={s.navRow}>
        <button
          onClick={() => current > 0 && setCurrent(current - 1)}
          disabled={current === 0}
          style={{...s.navBtn, opacity: current === 0 ? 0.3 : 1}}
        >
          ◀ 이전
        </button>
        <div style={s.navDots}>
          {METHODS.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              ...s.dot, ...(i === current ? s.dotActive : {})
            }} />
          ))}
        </div>
        <button
          onClick={() => current < METHODS.length-1 && setCurrent(current+1)}
          disabled={current === METHODS.length-1}
          style={{...s.navBtn, opacity: current === METHODS.length-1 ? 0.3 : 1}}
        >
          다음 ▶
        </button>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    border: '1px solid #c0c0c0',
    marginBottom: 4,
  },
  tabBar: {
    display: 'flex',
    borderBottom: '2px solid #1a1a2e',
    background: '#f8f9fa',
    overflowX: 'auto',
  },
  tab: {
    flex: 1, minWidth: 80,
    padding: '8px 6px',
    background: 'transparent', border: 'none',
    borderRight: '1px solid #ddd',
    cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    transition: 'background 0.15s',
  },
  tabActive: {
    background: '#1a1a2e',
  },
  tabNum: {
    fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.0)',
  },
  tabLabel: {
    fontSize: 11, fontWeight: 600, color: '#555', whiteSpace: 'nowrap',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px',
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
  },
  methodTitle: { fontSize: 14, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.3px' },
  methodDesc:  { fontSize: 11, color: '#888', marginTop: 2 },
  overallBadge: {
    border: '2px solid', padding: '4px 12px',
    textAlign: 'center', minWidth: 80,
  },
  badgeLabel: { fontSize: 10, color: '#888' },
  badgeValue: { fontSize: 15, fontWeight: 900, letterSpacing: '-0.3px' },
  cardBody: {
    padding: '14px 16px',
    background: '#fff',
    minHeight: 120,
  },
  navRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 16px',
    background: '#f0f0f0',
    borderTop: '1px solid #ddd',
  },
  navBtn: {
    background: '#fff', border: '1px solid #ccc',
    color: '#333', fontSize: 12, padding: '4px 12px',
    cursor: 'pointer',
  },
  navDots: { display: 'flex', gap: 6, alignItems: 'center' },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#ccc', border: 'none', cursor: 'pointer', padding: 0,
  },
  dotActive: { background: '#1a1a2e', width: 20, borderRadius: 3 },
}