// ===========================================================
// no:"11-7" ★ "겹침이 없으면 해가 없다" — venn 스타일 재구성(11-3/11-5와 자매).
// 기존 renderVenn 시각언어를 그대로 쓰되, 각 원 안에는 통과 값이 있음을
// 보여주면서도(각각은 해가 있음) 두 원이 물리적으로 떨어져 있어 "동시에는 불가능"을
// 강조한다. 11-5(공집합, 선행)와 달리 여기서는 "각각의 해는 있다"는 대비가 핵심.
// [조작] 두 원 사이 거리 슬라이더 [결과도형] 벤다이어그램 + 각 원 안의 예시값
// [그래프] 같은 벤다이어그램에서 "해 없음" 결론 배지
// ===========================================================
import React from 'react';

export function renderNoSolution(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const dist = sharedXByLog?.[logIdx]?.dist ?? 220;
  const setDist = (d) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), dist: Math.min(260, Math.max(0, d)) } }));

  const R = 70;
  const half = Math.min(dist / 2, 150);
  const cxA = 160 - half, cxB = 160 + half;
  const cy = 100;
  const hasOverlap = dist < 2 * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '8px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          두 조건을 서로 어긋나게 밀어보세요 — 각각은 답이 있어도 동시에는?
        </div>
        <input type="range" min={0} max={260} step={4} value={dist}
          onChange={(e) => setDist(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
      </div>
      <div className="viz-box">
        <svg width="320" height="200" viewBox="0 0 320 200">
          <circle cx={cxA} cy={cy} r={R} fill="#3b6d1133" stroke="#3b6d11" strokeWidth="2" />
          <circle cx={cxB} cy={cy} r={R} fill="#d85a3033" stroke="#d85a30" strokeWidth="2" />
          <text x={cxA} y={cy - 10} fontSize="13" textAnchor="middle" fill="#3b6d11">조건1 답 있음</text>
          <text x={cxA} y={cy + 15} fontSize="11" textAnchor="middle" fill="#3b6d11">(예: 2,3)</text>
          <text x={cxB} y={cy - 10} fontSize="13" textAnchor="middle" fill="#d85a30">조건2 답 있음</text>
          <text x={cxB} y={cy + 15} fontSize="11" textAnchor="middle" fill="#d85a30">(예: 7,8)</text>
        </svg>
        <div style={{ fontSize: '13px', textAlign: 'center', fontWeight: 'bold', color: hasOverlap ? '#2e7d32' : '#c0392b' }}>
          {hasOverlap ? '겹치는 부분이 있어 동시 만족 가능' : '겹치는 부분이 없어 동시에는 불가능 — 연립의 해는 없습니다'}
        </div>
      </div>
    </div>
  );
}
