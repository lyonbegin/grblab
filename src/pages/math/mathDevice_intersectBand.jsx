// ===========================================================
// no:"11-3" "겹치는 부분 = 교집합" — venn 스타일, 원을 직접 드래그.
// 슬라이더 대신 주황 원(조건2) 자체를 마우스/손가락으로 끌어 초록 원(조건1)과
// 겹치게 만든다. 순수 SVG라 mafs 없이 pointer 이벤트로 드래그 구현.
// ===========================================================
import React, { useRef, useCallback } from 'react';

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
          👉 <b>주황 원</b>을 손가락으로 끌어 초록 원과 겹쳐보세요
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
