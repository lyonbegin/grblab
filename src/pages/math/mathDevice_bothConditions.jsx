// ===========================================================
// no:"11-6" ★ "두 조건 동시 만족은 겹친 구간뿐" — matrix 스타일 재구성.
// 기존 renderMatrix(HTML table 격자)의 시각언어를 그대로 쓰되, 각 칸을 버튼으로
// 토글 가능하게 만든다. 행=값 후보, 열=[조건1, 조건2, 둘다]. 이 표현은 no:8~11
// 전체에서 처음 쓰는 "논리곱 표" 방식이라 앞의 벤다이어그램·막대와 확실히 다르다.
// [조작] 각 값의 조건1/조건2 통과 여부 토글 [결과도형] O/X 격자표
// [그래프] 같은 표에서 '둘다' 열이 강조되어 그래프 역할(만족값 목록)
// ===========================================================
import React from 'react';

export function renderBothConditions(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const values = [1, 2, 3, 4, 5, 6];
  const st = sharedXByLog?.[logIdx] || {};
  // 기본값: 조건1은 3~6 통과, 조건2는 1~4 통과 → 겹침 3~4
  const cond1 = st.cond1 ?? [0, 0, 1, 1, 1, 1];
  const cond2 = st.cond2 ?? [1, 1, 1, 1, 0, 0];
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { cond1, cond2, ...(prev?.[logIdx] || {}), ...p } }));

  const toggle = (arr, key, i) => {
    const next = arr.slice(); next[i] = next[i] ? 0 : 1;
    patch({ [key]: next });
  };

  const bothList = values.filter((val, i) => cond1[i] && cond2[i]);

  const cellStyle = (on, color) => ({
    width: '34px', height: '34px', borderRadius: '6px', cursor: 'pointer',
    border: on ? `2px solid ${color}` : '1px solid #ccc',
    background: on ? color + '33' : '#fff', color: on ? color : '#999',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '6px' }}>
          👉 <b>칸을 손가락으로 눌러</b> 조건1·조건2 통과(O/X)를 직접 바꿔보세요
        </div>
        <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px', fontSize: '12px', color: '#5f5e5a' }}>값</td>
              {values.map(val => <td key={val} style={{ padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{val}</td>)}
            </tr>
            <tr>
              <td style={{ padding: '4px', fontSize: '12px', color: '#2f5a99' }}>조건1</td>
              {values.map((val, i) => (
                <td key={val} style={{ padding: '3px' }}>
                  <div style={cellStyle(!!cond1[i], '#2f5a99')} onClick={() => toggle(cond1, 'cond1', i)}>{cond1[i] ? 'O' : 'X'}</div>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '4px', fontSize: '12px', color: '#b5701a' }}>조건2</td>
              {values.map((val, i) => (
                <td key={val} style={{ padding: '3px' }}>
                  <div style={cellStyle(!!cond2[i], '#b5701a')} onClick={() => toggle(cond2, 'cond2', i)}>{cond2[i] ? 'O' : 'X'}</div>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '4px', fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>둘다</td>
              {values.map((val, i) => {
                const both = cond1[i] && cond2[i];
                return (
                  <td key={val} style={{ padding: '3px' }}>
                    <div style={{ ...cellStyle(both, '#2e7d32'), cursor: 'default' }}>{both ? '✓' : ''}</div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="viz-box">
        <div style={{ fontSize: '14px', textAlign: 'center', fontWeight: 'bold', color: '#2e7d32' }}>
          두 조건을 동시에 만족하는 값: {bothList.length > 0 ? bothList.join(', ') : '없음'}
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          '조건1 O' 그리고 '조건2 O'인 <b>칸만</b> 답에 들어갑니다 — 겹친 구간뿐
        </div>
      </div>
    </div>
  );
}
