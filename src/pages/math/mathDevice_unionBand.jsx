// ===========================================================
// no:"11-4" "합치는 부분 = 합집합" — window addEventListener + rAF 드래그(11-3와 동일 근본수정)
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme } from 'mafs';

const R = 45;
function lensArea(d, r) {
  const dd = Math.abs(d);
  if (dd >= 2 * r) return 0;
  if (dd <= 0) return Math.PI * r * r;
  return 2 * r * r * Math.acos(dd / (2 * r)) - (dd / 2) * Math.sqrt(Math.max(0, 4 * r * r - dd * dd));
}
function unionArea(d, r) { return 2 * Math.PI * r * r - lensArea(d, r); }

export function renderUnionBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const cxA = 90;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 160;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(300, Math.max(20, x)) } }));
  const d = Math.abs(cxB - cxA);
  const area = unionArea(d, R);
  const maxArea = 2 * Math.PI * R * R;
  const dGraph = d / 25;

  const onDown = (e) => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    let rafId = null, lastClientX = e.clientX;
    const apply = () => { rafId = null; setCxB(((lastClientX - rect.left) / rect.width) * 320); };
    const onMove = (ev) => { lastClientX = ev.clientX; if (rafId === null) rafId = requestAnimationFrame(apply); };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px', border: '1px solid #e5e0d3' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>주황 원</b>을 직접 끌어 두 원의 합쳐진 크기를 바꿔보세요</div>
        <svg width="100%" height="200" viewBox="0 0 320 200" style={{ touchAction: 'none', display: 'block' }}>
          <circle cx={cxA} cy={100} r={R} fill="#5a86c433" stroke="#2f5a99" strokeWidth="2" />
          <circle cx={cxB} cy={100} r={R} fill="#e8a13a55" stroke="#b5701a" strokeWidth="2"
            style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={onDown} />
        </svg>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 5], y: [0, maxArea + 500] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => unionArea(x * 25, R)} color={Theme.green} />
          <Point x={dGraph} y={area} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=중심거리, 세로=합친 넓이 — 처음엔 빠르게 늘다가 <b>완전히 갈라지면 평평해집니다</b>
        </div>
      </div>
    </div>
  );
}
