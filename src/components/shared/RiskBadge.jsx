export default function RiskBadge({ level, size = 'default' }) {
  const config = {
    HIGH:   { label: '높음',   bg: 'rgba(255,77,79,0.15)',  border: 'rgba(255,77,79,0.4)',  color: '#FF4D4F', icon: '🔴' },
    MEDIUM: { label: '중간',   bg: 'rgba(250,173,20,0.15)', border: 'rgba(250,173,20,0.4)', color: '#FAAD14', icon: '🟡' },
    LOW:    { label: '낮음',   bg: 'rgba(82,196,26,0.15)',  border: 'rgba(82,196,26,0.4)',  color: '#52C41A', icon: '🟢' },
    허용불가능: { label: '허용불가능', bg: 'rgba(255,77,79,0.15)', border: 'rgba(255,77,79,0.4)', color: '#FF4D4F', icon: '⛔' },
    개선필요: { label: '개선필요', bg: 'rgba(250,173,20,0.15)', border: 'rgba(250,173,20,0.4)', color: '#FAAD14', icon: '⚠️' },
    허용가능: { label: '허용가능', bg: 'rgba(82,196,26,0.15)', border: 'rgba(82,196,26,0.4)', color: '#52C41A', icon: '✅' },
    높음:   { label: '높음',   bg: 'rgba(255,77,79,0.15)',  border: 'rgba(255,77,79,0.4)',  color: '#FF4D4F', icon: '🔴' },
    중간:   { label: '중간',   bg: 'rgba(250,173,20,0.15)', border: 'rgba(250,173,20,0.4)', color: '#FAAD14', icon: '🟡' },
    낮음:   { label: '낮음',   bg: 'rgba(82,196,26,0.15)',  border: 'rgba(82,196,26,0.4)',  color: '#52C41A', icon: '🟢' },
    위험:   { label: '위험',   bg: 'rgba(255,77,79,0.15)',  border: 'rgba(255,77,79,0.4)',  color: '#FF4D4F', icon: '🔴' },
    보통:   { label: '보통',   bg: 'rgba(250,173,20,0.15)', border: 'rgba(250,173,20,0.4)', color: '#FAAD14', icon: '🟡' },
    해당없음: { label: '해당없음', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', icon: '—' },
    관리필요: { label: '관리필요', bg: 'rgba(250,173,20,0.15)', border: 'rgba(250,173,20,0.4)', color: '#FAAD14', icon: '⚠️' },
  }

  const cfg = config[level] || config['낮음']
  const small = size === 'small'

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: small ? '2px 8px' : '4px 10px',
      borderRadius: 20,
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: small ? 9 : 10 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}
