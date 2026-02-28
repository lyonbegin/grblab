export default function FrequencySeverityCard({ data }) {
  const colorOf = (score) => {
    if (score >= 17) return '#c0392b'
    if (score >= 10) return '#e67e22'
    if (score >= 5)  return '#c8960c'
    return '#1e8449'
  }

  return (
    <div>
      {/* 범례 */}
      <div style={s.legend}>
        {[['1–4','저위험','#1e8449'],['5–9','중위험','#c8960c'],['10–16','고위험','#e67e22'],['17–25','즉시조치','#c0392b']].map(([r,l,c]) => (
          <div key={l} style={s.legendItem}>
            <span style={{...s.legendDot, background: c}} />
            <span style={{color: c, fontSize: 11, fontWeight: 700}}>{r}</span>
            <span style={s.legendName}>{l}</span>
          </div>
        ))}
      </div>

      {/* ✅ 테이블(깨짐 방지: 가로 스크롤 래퍼) */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{...s.th, ...s.colFactor}}>위험요인</th>
              <th style={{...s.th, ...s.colCategory}}>분류</th>
              <th style={{...s.th, ...s.colNum}}>가능성</th>
              <th style={{...s.th, ...s.colNum}}>중대성</th>
              <th style={{...s.th, ...s.colScore}}>점수</th>
              <th style={{...s.th, ...s.colLevel}}>위험등급</th>
            </tr>
          </thead>

          <tbody>
            {data?.map((row, i) => {
              const c = colorOf(row.score)
              return (
                <tr key={i} style={i%2===1 ? {background:'#fafafa'} : {}}>
                  {/* ✅ 첫 컬럼 말줄임 + 최소폭 */}
                  <td style={{...s.td, ...s.factorCell}} title={row.factor}>
                    {row.factor}
                  </td>

                  <td style={{...s.td, ...s.categoryCell}}>{row.category}</td>

                  <td style={{...s.td, ...s.numCell}}>{row.probability}</td>
                  <td style={{...s.td, ...s.numCell}}>{row.severity}</td>

                  <td style={{...s.td, ...s.scoreCell, color: c}}>{row.score}</td>

                  <td style={{...s.td, ...s.levelCell}}>
                    <span style={{...s.badge, color: c, borderColor: c + '88', background: c + '11'}}>
                      {row.level}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const s = {
  legend: {
    display: 'flex',
    gap: 14,
    marginBottom: 8,
    padding: '6px 10px',
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    flexWrap: 'wrap',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: '50%' },
  legendName: { fontSize: 11, color: '#666' },

  /* ✅ 테이블 깨짐 방지 핵심: wrap + minWidth */
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },

  table: {
    width: '100%',
    minWidth: 520,              // ✅ 카드가 좁아지면 스크롤로 전환
    borderCollapse: 'collapse',
    border: '1px solid #ccc',
    fontSize: 12,
    tableLayout: 'fixed',       // ✅ 열 너비 안정화
  },

  th: {
    background: '#eef0f3',
    color: '#333',
    fontWeight: 700,
    padding: '7px 8px',
    border: '1px solid #ccc',
    textAlign: 'center',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },

  td: {
    padding: '7px 8px',
    border: '1px solid #ddd',
    color: '#1a1a1a',
    lineHeight: 1.4,
    verticalAlign: 'middle',
  },

  /* ✅ 컬럼 너비를 “고정값”으로 통일 (width 숫자 주면 tableLayout fixed에서 안정적) */
  colFactor:   { width: 220, textAlign: 'left' },  // 위험요인
  colCategory: { width: 60 },
  colNum:      { width: 60 },
  colScore:    { width: 56 },
  colLevel:    { width: 86 },

  /* ✅ 셀 스타일 */
  factorCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  categoryCell: { color: '#666', fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap' },
  numCell: { textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' },
  scoreCell: { textAlign: 'center', fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap' },
  levelCell: { textAlign: 'center', whiteSpace: 'nowrap' },

  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    border: '1px solid',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    borderRadius: 6,
  },
}