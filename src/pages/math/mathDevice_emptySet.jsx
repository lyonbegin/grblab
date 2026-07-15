// ===========================================================
// no:"11-5" "겹침이 없을 수도 있다" — venn 스타일, 원을 직접 드래그(11-3 자매).
// ===========================================================
import React, { useRef, useCallback } from 'react';

export function renderEmptySet(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 300;
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
          👉 <b>주황 원</b>을 멀리 끌어 초록 원과 완전히 떨어뜨려보세요
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
          <text x={cxA - 25} y="45" fontSize="13" fill="#3b6d11">조건1</text>
          <text x={Math.min(280, cxB + 10)} y="45" fontSize="13" fill="#d85a30">조건2</text>
          {!hasOverlap && <text x="160" y="175" fontSize="14" textAnchor="middle" fontWeight="bold" fill="#c0392b">겹침 없음 = 답 없음</text>}
        </svg>
        <div style={{ fontSize: '12px', color: hasOverlap ? '#5f5e5a' : '#c0392b', textAlign: 'center', fontWeight: hasOverlap ? 'normal' : 'bold' }}>
          {hasOverlap ? '아직 겹침이 있습니다' : '두 조건을 동시에 만족하는 값이 하나도 없습니다(공집합)'}
        </div>
      </div>
    </div>
  );
}
