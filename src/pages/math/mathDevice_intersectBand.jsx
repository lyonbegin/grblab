// ===========================================================
// no:"11-3" "겹치는 부분 = 교집합"
// [근본 수정] 드래그 상태를 지역변수(let isDragging)로 관리하면, 드래그 도중
// setState로 부모가 리렌더될 때마다 이 함수가 다시 호출되며 변수가 초기화되어
// 드래그가 끊겼다. window에 직접 addEventListener를 걸어(리렌더와 무관하게 유지)
// pointerup까지 살아있게 하고, requestAnimationFrame으로 state 반영을 쓰로틀링해
// 정확성과 속도를 동시에 확보한다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme } from 'mafs';

const R = 55;
function lensArea(d, r) {
  const dd = Math.abs(d);
  if (dd >= 2 * r) return 0;
  if (dd <= 0) return Math.PI * r * r;
  return 2 * r * r * Math.acos(dd / (2 * r)) - (dd / 2) * Math.sqrt(Math.max(0, 4 * r * r - dd * dd));
}

export function renderIntersectBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const cxA = 90;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 190;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(300, Math.max(20, x)) } }));
  const d = Math.abs(cxB - cxA);
  const area = lensArea(d, R);
  const maxArea = Math.PI * R * R;
  const dGraph = d / 25;

  const onDown = (e) => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    let rafId = null, lastClientX = e.clientX;
    const apply = () => {
      rafId = null;
      setCxB(((lastClientX - rect.left) / rect.width) * 320);
    };
    const onMove = (ev) => {
      lastClientX = ev.clientX;
      if (rafId === null) rafId = requestAnimationFrame(apply);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px', border: '1px solid #e5e0d3' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>주황 원</b>을 손가락으로 직접 끌어 초록 원과 겹쳐보세요</div>
        <svg width="100%" height="200" viewBox="0 0 320 200" style={{ touchAction: 'none', display: 'block' }}>
          <circle cx={cxA} cy={100} r={R} fill="#3b6d1133" stroke="#3b6d11" strokeWidth="2" />
          <circle cx={cxB} cy={100} r={R} fill="#d85a3055" stroke="#d85a30" strokeWidth="2"
            style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={onDown} />
          <text x={cxA} y="40" fontSize="13" textAnchor="middle" fill="#3b6d11">조건1</text>
          <text x={cxB} y="40" fontSize="13" textAnchor="middle" fill="#d85a30">조건2</text>
        </svg>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 5], y: [0, maxArea + 500] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => lensArea(x * 25, R)} color={Theme.blue} />
          <Point x={dGraph} y={area} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=원 중심 사이 거리, 세로=겹친 넓이 — <b>종 모양 곡선</b>으로 완만하다 급격히 0이 됩니다
        </div>
      </div>
    </div>
  );
}
