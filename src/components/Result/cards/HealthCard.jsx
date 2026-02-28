export default function HealthCard({ data }) {
  if (!data?.applicable) {
    return (
      <div style={s.naBox}>
        <div style={s.naIcon}>🩺</div>
        <div style={s.naTitle}>산업보건 위험요인 해당 없음</div>
        <div style={s.naDesc}>{data?.summary || '해당 작업에서 직업병 유발 유해인자가 식별되지 않았습니다.'}</div>
      </div>
    )
  }

  const colorOf = (lvl) => {
    if (lvl === '즉시조치') return '#c0392b'
    if (lvl === '고위험')   return '#e67e22'
    if (lvl === '중위험')   return '#c8960c'
    return '#1e8449'
  }

  return (
    <div>
      <div style={s.infoBar}>
        📋 화학물질·소음·분진·진동·방사선 등 직업병 유발 유해인자 평가 결과
      </div>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{...s.th, width:36, textAlign:'center'}}>No.</th>
            <th style={s.th}>유해인자</th>
            <th style={{...s.th, width:80}}>유해인자 종류</th>
            <th style={s.th}>예상 건강장해</th>
            <th style={s.th}>조치사항</th>
            <th style={{...s.th, width:72, textAlign:'center'}}>수준</th>
          </tr>
        </thead>
        <tbody>
          {data.items?.map((row, i) => {
            const c = colorOf(row.level)
            return (
              <tr key={i} style={i%2===1 ? {background:'#fafafa'} : {}}>
                <td style={{...s.td, textAlign:'center', color:'#999', fontFamily:'monospace'}}>
                  {String(i+1).padStart(2,'0')}
                </td>
                <td style={{...s.td, fontWeight:600}}>{row.factor}</td>
                <td style={{...s.td, color:'#555', fontSize:11}}>{row.type}</td>
                <td style={{...s.td, fontSize:11, color:'#7b1a1a'}}>{row.injury}</td>
                <td style={{...s.td, fontSize:11, color:'#1e5c37'}}>{row.measure}</td>
                <td style={{...s.td, textAlign:'center'}}>
                  <span style={{...s.badge, color: c, borderColor: c+'88', background: c+'11'}}>
                    {row.level}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const s = {
  naBox: {
    padding: '24px', textAlign:'center', border:'1px dashed #ccc', background:'#fafafa',
    display:'flex', flexDirection:'column', alignItems:'center', gap:8,
  },
  naIcon: { fontSize: 28 },
  naTitle: { fontSize:13, fontWeight:700, color:'#555' },
  naDesc: { fontSize:12, color:'#888', lineHeight:1.6, maxWidth:340 },
  infoBar: {
    padding:'7px 10px', background:'#f0f8f0',
    border:'1px solid #b2ddb2', fontSize:11, color:'#2d6a2d',
    marginBottom:8,
  },
  table: { width:'100%', borderCollapse:'collapse', border:'1px solid #ccc', fontSize:12 },
  th: { background:'#eef0f3', color:'#333', fontWeight:700, padding:'7px 8px', border:'1px solid #ccc', textAlign:'left', fontSize:11 },
  td: { padding:'7px 8px', border:'1px solid #ddd', color:'#1a1a1a', lineHeight:1.4, verticalAlign:'top' },
  badge: { display:'inline-block', padding:'2px 8px', border:'1px solid', fontSize:11, fontWeight:700 },
}