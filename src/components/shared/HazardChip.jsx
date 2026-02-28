export default function HazardChip({ name, category }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.25)', color: '#FF7A00',
    }}>
      {name}
      {category && <span style={{ fontSize: 10, color: 'rgba(255,122,0,0.6)' }}>·{category}</span>}
    </span>
  )
}
