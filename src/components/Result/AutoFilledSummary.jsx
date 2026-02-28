import { motion } from 'framer-motion'
import HazardChip from '../shared/HazardChip'

export default function AutoFilledSummary({ summary, hazards, overallLevel }) {
  const fields = [
    { label: '세부 공정',   value: summary?.processName },
    { label: '작업 단계',   value: summary?.workContent },
    { label: '산업군',      value: summary?.equipment },
    { label: '판단 근거',   value: summary?.location },
  ]

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }} style={s.card}>
      <div style={s.header}>
        <span style={s.badge}>KRAS 자동입력 완료</span>
        <span style={s.title}>현장 분석 정보</span>
      </div>
      <div style={s.grid}>
        {fields.map((f, i) => (
          <div key={i} style={s.field}>
            <span style={s.label}>{f.label}</span>
            <span style={s.value}>{f.value || '—'}</span>
          </div>
        ))}
      </div>
      <div style={s.hazardSection}>
        <span style={s.label}>식별된 유해·위험요인 ({hazards?.length || 0}건)</span>
        <div style={s.chips}>
          {hazards?.map((h, i) => <HazardChip key={i} name={h.name} category={h.category} />)}
        </div>
      </div>
      {overallLevel?.topHazard && (
        <div style={s.topHazard}>
          <span style={s.label}>최고위험 항목</span>
          <span style={{ ...s.topHazardValue, color: overallLevel.text }}>
            ⚠ {overallLevel.topHazard} (위험점수 {overallLevel.score}점)
          </span>
        </div>
      )}
    </motion.div>
  )
}

const s = {
  card:          { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 },
  header:        { display: 'flex', alignItems: 'center', gap: 10 },
  badge:         { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(255,77,0,0.2)', color: '#FF4D00', letterSpacing: '0.5px' },
  title:         { fontSize: 14, fontWeight: 700, color: '#fff' },
  grid:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' },
  field:         { display: 'flex', flexDirection: 'column', gap: 3 },
  label:         { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.3px' },
  value:         { fontSize: 12, color: '#fff', fontWeight: 500, lineHeight: 1.4 },
  hazardSection: { display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' },
  chips:         { display: 'flex', flexWrap: 'wrap', gap: 6 },
  topHazard:     { display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' },
  topHazardValue:{ fontSize: 12, fontWeight: 700 },
}
