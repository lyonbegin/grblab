export default function CoreFactorsCard({ data }) {
  const colorOf = (lvl) => {
    if (lvl === '즉시조치') return '#c0392b'
    if (lvl === '고위험')   return '#e67e22'
    if (lvl === '중위험')   return '#c8960c'
    return '#1e8449'
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
      {data?.map((row, i) => {
        const c = colorOf(row.riskLevel)
        return (
          <table key={i} style={s.table}>
            <thead>
              <tr>
                {/* ✅ th 안에 div로 감싸야 flex 정상 작동 */}
                <th colSpan={4} style={s.factorHeader}>
                  <div style={s.factorHeaderInner}>
                    <span style={s.factorNum}>{String(i+1).padStart(2,'0')}</span>
                    <span style={s.factorName}>{row.factor}</span>
                    <span style={{...s.badge, color: c, borderColor: c + '88', background: c + '11'}}>
                      위험수준: {row.riskLevel}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Th w={80}>사고 시나리오</Th>
                <Td colSpan={3}>{row.scenario}</Td>
              </tr>
              <tr>
                <Th>직접 원인</Th>
                <Td>{row.directCause}</Td>
                <Th w={80}>예상 피해</Th>
                <Td>{row.expectedInjury}</Td>
              </tr>
              <tr>
                <Th>개선 조치</Th>
                <Td colSpan={3} style={{color:'#1e6440', fontWeight:500}}>{row.improvementMeasure}</Td>
              </tr>
            </tbody>
          </table>
        )
      })}
    </div>
  )
}

function Th({ children, w }) {
  return <th style={{
    background:'#eef0f3', color:'#333', fontWeight:700,
    padding:'7px 10px', border:'1px solid #ccc',
    textAlign:'left', fontSize:11, whiteSpace:'nowrap', width: w||'auto',
  }}>{children}</th>
}
function Td({ children, colSpan, style }) {
  return <td style={{
    padding:'7px 10px', border:'1px solid #ddd', color:'#1a1a1a',
    lineHeight:1.5, fontSize:12, ...style,
  }} colSpan={colSpan}>{children || '—'}</td>
}

const s = {
  table: { width:'100%', borderCollapse:'collapse', border:'1px solid #ccc', fontSize:12 },
  factorHeader: {
    background:'#1a1a2e', padding: 0,    // padding은 inner div에서
  },
  factorHeaderInner: {                   // ✅ flex는 여기에
    display:'flex', alignItems:'center', gap:8,
    padding:'8px 10px',
  },
  factorNum: { fontSize:11, fontFamily:'monospace', color:'rgba(255,255,255,0.4)', flexShrink:0 },
  factorName: { fontSize:13, fontWeight:700, color:'#fff', flex:1 },
  badge: { display:'inline-block', padding:'2px 8px', border:'1px solid', fontSize:11, fontWeight:700, whiteSpace:'nowrap', flexShrink:0 },
}