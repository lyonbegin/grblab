// ===========================================================
// no:"11-4" "합치는 부분 = 합집합"
// x = 두 원 중심거리(d), y = 합친 전체 넓이(2πR² - 겹침넓이). 포화곡선 —
// 처음엔 빠르게 늘다가 완전분리(d≥2R) 이후 상수(2πR²)로 평평해짐. 11-3의 종형과 대비되는 모양.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';

const R = 1.8;
const X_RANGE = [-6, 6], Y_RANGE = [-3, 3];

function lensArea(d) {
  const dd = Math.abs(d);
  if (dd >= 2 * R) return 0;
  if (dd <= 0) return Math.PI * R * R;
  return 2 * R * R * Math.acos(dd / (2 * R)) - (dd / 2) * Math.sqrt(Math.max(0, 4 * R * R - dd * dd));
}
function unionArea(d) { return 2 * Math.PI * R * R - lensArea(d); }

function CircleOverlay({ cx, cy, r, fill, stroke }) {
  const xr = X_RANGE[1] - X_RANGE[0], yr = Y_RANGE[1] - Y_RANGE[0];
  const leftPct = ((cx - r - X_RANGE[0]) / xr) * 100;
  const topPct = ((Y_RANGE[1] - (cy + r)) / yr) * 100;
  const wPct = ((2 * r) / xr) * 100, hPct = ((2 * r) / yr) * 100;
  return <div style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, width: `${wPct}%`, height: `${hPct}%`, borderRadius: '50%', background: fill, border: `2px solid ${stroke}`, pointerEvents: 'none' }} />;
}

export function renderUnionBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const cxA = -1.0;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 0.5;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) } }));
  const d = Math.abs(cxB - cxA);
  const area = unionArea(d);
  const maxArea = 2 * Math.PI * R * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>원(빨간 점)</b>을 끌어 두 원의 합쳐진 크기를 바꿔보세요</div>
      </div>
      <div className="viz-box" style={{ position: 'relative' }}>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={200}>
          <MovablePoint point={[cxB, 0]} constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]} color="transparent" onMove={(pos) => setCxB(pos[0])} />
        </Mafs>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <CircleOverlay cx={cxA} cy={0} r={R} fill="#5a86c433" stroke="#2f5a99" />
          <CircleOverlay cx={cxB} cy={0} r={R} fill="#e8a13a33" stroke="#b5701a" />
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 5], y: [0, maxArea + 2] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => unionArea(x)} color={Theme.green} />
          <Point x={d} y={area} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=중심거리, 세로=합친 넓이 — 처음엔 빠르게 늘다가 <b>완전히 갈라지면 평평해집니다</b>(포화곡선)
        </div>
      </div>
    </div>
  );
}
