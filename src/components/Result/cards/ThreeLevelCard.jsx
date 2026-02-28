export default function ThreeLevelCard({ data }) {
  const colorOf = (j) => {
    if (j === '허용불가능') return '#c0392b'
    if (j === '개선필요')   return '#c8960c'
    return '#1e8449'
  }

  return (
    <div>
      {/* 판정기준 설명 */}
      <table style={{...s.table, marginBottom: 10}}>
        <thead>
          <tr>
            <th style={s.th}>판정</th>
            <th style={s.th}>의미</th>
            <th style={s.th}>조치사항</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['허용불가능', '#c0392b', '즉시 작업중지 및 위험요인 제거 검토'],
            ['개선필요',   '#c8960c', '단기 개선계획 수립 및 지속 모니터링'],
            ['허용가능',   '#1e8449', '현재 안전조치 유지 및 정기 점검'],
          ].map(([label, color, desc]) => (
            <tr key={label}>
              <td style={{...s.td, width:90, textAlign:'center'}}>
                <span style={{...s.badge, color, borderColor: color+'88', background: color+'11'}}>
                  {label}
                </span>
              </td>
              <td style={{...s.td, color:'#555', fontSize:11}}>{desc}</td>
              <td style={{...s.td}} />
            </tr>
          ))}
        </tbody>
      </table>

      {/* 평가 결과 */}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{...s.th, width:36, textAlign:'center'}}>No.</th>
            <th style={s.th}>위험요인</th>
            <th style={{...s.th, width:90, textAlign:'center'}}>판정</th>
            <th style={s.th}>조치 내용</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((row, i) => {
            const c = colorOf(row.judgment)
            return (
              <tr key={i} style={i%2===1 ? {background:'#fafafa'} : {}}>
                <td style={{...s.td, textAlign:'center', color:'#999', fontFamily:'monospace'}}>
                  {String(i+1).padStart(2,'0')}
                </td>
                <td style={{...s.td, fontWeight:600}}>{row.factor}</td>
                <td style={{...s.td, textAlign:'center'}}>
                  <span style={{...s.badge, color: c, borderColor: c+'88', background: c+'11'}}>
                    {row.judgment}
                  </span>
                </td>
                <td style={{...s.td, fontSize:11, color:'#444', lineHeight:1.5}}>{row.measure}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const s = {
  table: { width:'100%', borderCollapse:'collapse', border:'1px solid #ccc', fontSize:12 },
  th: { background:'#eef0f3', color:'#333', fontWeight:700, padding:'7px 8px', border:'1px solid #ccc', textAlign:'left', fontSize:11 },
  td: { padding:'7px 8px', border:'1px solid #ddd', color:'#1a1a1a', lineHeight:1.4, verticalAlign:'middle' },
  badge: { display:'inline-block', padding:'2px 8px', border:'1px solid', fontSize:11, fontWeight:700 },
}