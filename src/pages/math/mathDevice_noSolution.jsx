// ===========================================================
// no:"11-7" ★ "겹침이 없으면 해가 없다" — venn 스타일, 원을 직접 드래그(11-3/11-5 자매).
// ===========================================================
import React, { useRef, useCallback } from 'react';

export function renderNoSolution(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 290;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(310, Math.max(30, x)) } }));

  const R = 65;
  const cxA = 90, cy = 100;
  const dist = Math.abs(cxB - cxA);
  const hasOverlap = dist < 2 * R;

  const svgRef = useRef(null);
  const dragging = useRef(false);
  const toSvgX = useCallback((clientX) => {
    const rect = svgRef.current.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 320;
  }, []);
  const onPointerDown = (e) => { dragging.current = true; e.target.setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e) => { if (!dragging.current) return; setCxB(toSvgX(e.clientX)); };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 두 원을 각각 <b>손가락으로 끌어</b> 서로 떨어뜨려보세요 — 각각은 답이 있어도 동시에는?
        </div>
      </div>
      <div className="viz-box">
        <svg ref={svgRef} width="320" height="200" viewBox="0 0 320 200" style={{ touchAction: 'none' }}>
          <circle cx={cxA} cy={cy} r={R} fill="#3b6d1133" stroke="#3b6d11" strokeWidth="2" />
          <circle
            cx={cxB} cy={cy} r={R} fill="#d85a3033" stroke="#d85a30" strokeWidth="2"
            style={{ cursor: 'grab' }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          />
          <text x={cxA} y={cy - 5} fontSize="12" textAnchor="middle" fill="#3b6d11">조건1 답</text>
          <text x={cxA} y={cy + 15} fontSize="10" textAnchor="middle" fill="#3b6d11">(예: 2,3)</text>
          <text x={cxB} y={cy - 5} fontSize="12" textAnchor="middle" fill="#d85a30">조건2 답</text>
          <text x={cxB} y={cy + 15} fontSize="10" textAnchor="middle" fill="#d85a30">(예: 7,8)</text>
        </svg>
        <div style={{ fontSize: '13px', textAlign: 'center', fontWeight: 'bold', color: hasOverlap ? '#2e7d32' : '#c0392b' }}>
          {hasOverlap ? '겹치는 부분이 있어 동시 만족 가능' : '겹치는 부분이 없어 동시에는 불가능 — 연립의 해는 없습니다'}
        </div>
      </div>
    </div>
  );
}
