// ===========================================================
// no:"11-3" "겹치는 부분 = 교집합"
// x = 두 원 중심거리(d), y = 겹친 넓이(렌즈 공식). 종형(bell) 비선형 곡선 —
// d=0에서 최대, d=2R에서 정확히 0으로 완만하게 떨어짐. 11-1(직선)·11-2(제곱근)와 다른 곡률.
// [도형] 투명 배경 두 원(오버레이) — MovablePoint(투명)로 한쪽 원의 중심을 직접 끈다.
// [그래프] x=중심거리, y=겹침넓이. 렌즈함수 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';

const R = 2.2;
const X_RANGE = [-6, 6], Y_RANGE = [-3, 3];

function lensArea(d) {
  const dd = Math.abs(d);
  if (dd >= 2 * R) return 0;
  if (dd <= 0) return Math.PI * R * R;
  return 2 * R * R * Math.acos(dd / (2 * R)) - (dd / 2) * Math.sqrt(Math.max(0, 4 * R * R - dd * dd));
}

function CircleOverlay({ cx, cy, r, fill, stroke }) {
  const xr = X_RANGE[1] - X_RANGE[0], yr = Y_RANGE[1] - Y_RANGE[0];
  const leftPct = ((cx - r - X_RANGE[0]) / xr) * 100;
  const topPct = ((Y_RANGE[1] - (cy + r)) / yr) * 100;
  const wPct = ((2 * r) / xr) * 100, hPct = ((2 * r) / yr) * 100;
  return <div style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, width: `${wPct}%`, height: `${hPct}%`, borderRadius: '50%', background: fill, border: `2px solid ${stroke}`, pointerEvents: 'none' }} />;
}

export function renderIntersectBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const cxA = -1.2;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 1.5;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) } }));
  const d = Math.abs(cxB - cxA);
  const area = lensArea(d);
  const maxArea = Math.PI * R * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>원(빨간 점)</b>을 손가락으로 끌어 겹쳐보세요</div>
      </div>
      <div className="viz-box" style={{ position: 'relative' }}>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian xAxis={{ lines: false }} yAxis={{ lines: false }} />
          <MovablePoint point={[cxB, 0]} constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]} color="transparent" onMove={(pos) => setCxB(pos[0])} />
        </Mafs>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <CircleOverlay cx={cxA} cy={0} r={R} fill="#3b6d1133" stroke="#3b6d11" />
          <CircleOverlay cx={cxB} cy={0} r={R} fill="#d85a3033" stroke="#d85a30" />
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 5], y: [0, maxArea + 2] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => lensArea(x)} color={Theme.blue} />
          <Point x={d} y={area} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=원 중심 사이 거리, 세로=겹친 넓이 — <b>종 모양 곡선</b>으로 완만하다 급격히 0이 됩니다
        </div>
      </div>
    </div>
  );
}
