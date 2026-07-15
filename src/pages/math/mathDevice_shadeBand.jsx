// ===========================================================
// no:"11-2" "그래프에서 조건을 색칠한다" — window addEventListener + rAF 드래그
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme } from 'mafs';

const W = 320, H = 220, PAD = 20;
const X_MIN = -4, X_MAX = 4, Y_MIN = 0, Y_MAX = 9;
const sx = (x) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const sy = (y) => H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);

export function renderShadeBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const k = sharedXByLog?.[logIdx]?.k ?? 4;
  const setK = (kk) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), k: Math.min(9, Math.max(0, kk)) } }));
  const width = 2 * Math.sqrt(k);

  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const x = X_MIN + (i / 60) * (X_MAX - X_MIN);
    pts.push(`${sx(x)},${sy(Math.min(Y_MAX, x * x))}`);
  }
  const halfW = Math.sqrt(k);
  const shadeX1 = sx(-halfW), shadeX2 = sx(halfW);

  const onDown = (e) => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    let rafId = null, lastClientY = e.clientY;
    const apply = () => {
      rafId = null;
      const py = ((lastClientY - rect.top) / rect.height) * H;
      const yVal = Y_MIN + ((H - PAD - py) / (H - 2 * PAD)) * (Y_MAX - Y_MIN);
      setK(yVal);
    };
    const onMove = (ev) => { lastClientY = ev.clientY; if (rafId === null) rafId = requestAnimationFrame(apply); };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px', border: '1px solid #e5e0d3' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>초록 기준선</b>을 직접 위아래로 끌어보세요</div>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ touchAction: 'none', display: 'block' }}>
          <rect x={shadeX1} y={sy(k)} width={shadeX2 - shadeX1} height={sy(0) - sy(k)} fill="#c8e6c9" />
          <polyline points={pts.join(' ')} fill="none" stroke="#5a86c4" strokeWidth="2.5" />
          <line x1={sx(X_MIN)} y1={sy(k)} x2={sx(X_MAX)} y2={sy(k)} stroke="#2e7d32" strokeWidth="16" opacity="0.001"
            style={{ cursor: 'ns-resize', touchAction: 'none' }} onPointerDown={onDown} />
          <line x1={sx(X_MIN)} y1={sy(k)} x2={sx(X_MAX)} y2={sy(k)} stroke="#2e7d32" strokeWidth="2.5" pointerEvents="none" />
        </svg>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 9], y: [0, 7] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => 2 * Math.sqrt(Math.max(0, x))} color={Theme.orange} />
          <Point x={k} y={width} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=기준선 높이, 세로=만족 구간 폭 — <b>제곱근 곡선</b>으로 늘어납니다
        </div>
      </div>
    </div>
  );
}
