export default function ChecklistCard({ data }) {
  const colorOf = (j) => {
    if (j === '즉시조치') return '#c0392b'
    if (j === '고위험')   return '#e67e22'
    if (j === '중위험')   return '#c8960c'
    return '#1e8449'
  }

  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, ...s.colNo }}>No.</th>
            <th style={{ ...s.th, ...s.colFactor }}>점검 항목 (위험요인)</th>
            <th style={{ ...s.th, ...s.colCategory }}>분류</th>
            <th style={{ ...s.th, ...s.colCause }}>직접 원인</th>
            <th style={{ ...s.th, ...s.colJudge }}>위험판정</th>
          </tr>
        </thead>

        <tbody>
          {data?.map((row, i) => {
            const c = colorOf(row.judgment)
            return (
              <tr key={i} style={i % 2 === 1 ? { background: '#fafafa' } : {}}>
                <td style={{ ...s.td, ...s.noCell }}>
                  {String(i + 1).padStart(2, '0')}
                </td>

                {/* ✅ 긴 텍스트: 1줄 말줄임(원하시면 2줄로 바꿔드리겠습니다) */}
                <td style={{ ...s.td, ...s.factorCell }} title={row.factor}>
                  {row.factor}
                </td>

                <td style={{ ...s.td, ...s.categoryCell }}>
                  {row.category}
                </td>

                {/* ✅ 긴 텍스트: 2줄까지만 보여주고 말줄임 */}
                <td style={{ ...s.td, ...s.causeCell }} title={row.directCause}>
                  {row.directCause}
                </td>

                <td style={{ ...s.td, ...s.judgeCell }}>
                  <span style={{ ...s.badge, color: c, borderColor: c + '88', background: c + '11' }}>
                    {row.judgment}
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
  /* ✅ 모바일 깨짐 방지 핵심: 가로 스크롤 래퍼 */
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },

  table: {
    width: '100%',
    minWidth: 720,           // ✅ 모바일이면 스크롤로 보고, 찌그러지지 않게
    borderCollapse: 'collapse',
    border: '1px solid #ccc',
    fontSize: 12,
    tableLayout: 'fixed',    // ✅ 열 너비 안정화
  },

  th: {
    background: '#eef0f3',
    color: '#333',
    fontWeight: 700,
    padding: '7px 8px',
    border: '1px solid #ccc',
    textAlign: 'left',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },

  td: {
    padding: '7px 8px',
    border: '1px solid #ddd',
    color: '#1a1a1a',
    lineHeight: 1.4,
    verticalAlign: 'top',
  },

  /* ✅ 컬럼 너비(고정) */
  colNo: { width: 44, textAlign: 'center' },
  colFactor: { width: 230 },
  colCategory: { width: 90, textAlign: 'center' },
  colCause: { width: 270 },
  colJudge: { width: 90, textAlign: 'center' },

  /* ✅ 셀 스타일 */
  noCell: {
    textAlign: 'center',
    color: '#999',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
  },

  factorCell: {
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  categoryCell: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },

  /* ✅ directCause는 보통 길어서 2줄 clamp */
  causeCell: {
    color: '#444',
    fontSize: 11,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
  },

  judgeCell: {
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },

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