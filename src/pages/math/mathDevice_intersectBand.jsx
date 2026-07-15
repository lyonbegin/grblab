// ===========================================================
// no:"11-3" "겹치는 부분 = 교집합" — venn 스타일, 원을 직접 드래그.
// [수정] 이 함수는 React 컴포넌트가 아니라 부모 렌더 중 호출되는 일반 함수라
// useRef/useCallback 같은 Hook을 쓰면 Hook 순서 위반(React #310)이 난다.
// 그래서 Hook 없이 pointer 이벤트 안에서 e.target.closest('svg')로 그때그때
// DOM을 찾는 방식으로 구현한다.
// ===========================================================
import React from 'react';

export function renderIntersectBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 230;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(300, Math.max(20, x)) } }));

  const R = 80;
  const cxA = 130, cy = 100;
  const dist = Math.abs(cxB - cxA);
  const overlapRatio = Math.max(0, Math.min(1, 1 - dist / (2 * R)));
  const hasOverlap = dist < 2 * R;

  let isDragging = false;
  const onPointerDown = (e) => { isDragging = true; e.target.setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e) => {
    if (!isDragging) return;
    const svg = e.target.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 320;
    setCxB(x);
  };
  const onPointerUp = () => { isDragging = false; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>주황 원</b>을 손가락으로 끌어 초록 원과 겹쳐보세요
        </div>
      </div>
      <div className="viz-box">
        <svg width="320" height="200" viewBox="0 0 320 200" style={{ touchAction: 'none' }}>
          <circle cx={cxA} cy={cy} r={R} fill="#3b6d1133" stroke="#3b6d11" strokeWidth="2" />
          <circle
            cx={cxB} cy={cy} r={R} fill="#d85a3033" stroke="#d85a30" strokeWidth="2"
            style={{ cursor: 'grab' }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          />
          <text x={cxA - 30} y="45" fontSize="14" fill="#3b6d11">조건1</text>
          <text x={cxB + 10} y="45" fontSize="14" fill="#d85a30">조건2</text>
          <text x="160" y="175" fontSize="15" textAnchor="middle" fontWeight="bold">
            {hasOverlap ? `겹침 ${(overlapRatio * 100).toFixed(0)}%` : '겹침 없음'}
          </text>
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          두 원이 <b>겹치는 부분(교집합)</b>이 '둘 다 만족'하는 답입니다
        </div>
      </div>
    </div>
  );
}
