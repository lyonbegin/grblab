// ===========================================================
// no:"11-7" ★ "겹침이 없으면 해가 없다"
// x = 두 원 중심거리(d), y = 동시만족 가능 여부(1=가능,0=불가능). 이진 계단(단일 점프) —
// 11-5(다단 계단)와 달리 딱 한 번만 뚝 떨어지는 참/거짓 그래프.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme, MovablePoint } from 'mafs';

const R = 1.7;
const X_RANGE = [-6, 6], Y_RANGE = [-3, 3];

function CircleOverlay({ cx, cy, r, fill, stroke, tag }) {
  const xr = X_RANGE[1] - X_RANGE[0], yr = Y_RANGE[1] - Y_RANGE[0];
  const leftPct = ((cx - r - X_RANGE[0]) / xr) * 100;
  const topPct = ((Y_RANGE[1] - (cy + r)) / yr) * 100;
  const wPct = ((2 * r) / xr) * 100, hPct = ((2 * r) / yr) * 100;
  return (
    <div style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, width: `${wPct}%`, height: `${hPct}%`, borderRadius: '50%', background: fill, border: `2px solid ${stroke}`, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '10px', color: stroke, fontWeight: 'bold' }}>{tag}</span>
    </div>
  );
}

export function renderNoSolution(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const cxA = -3.2;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? -0.3;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) } }));
  const d = Math.abs(cxB - cxA);
  const possible = d < 2 * R ? 1 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>원(빨간 점)</b>을 끌어 떨어뜨려보세요 — 동시 만족이 가능할까요?</div>
      </div>
      <div className="viz-box" style={{ position: 'relative' }}>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian xAxis={{ lines: false }} yAxis={{ lines: false }} />
          <MovablePoint point={[cxB, 0]} constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]} color="transparent" onMove={(pos) => setCxB(pos[0])} />
        </Mafs>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <CircleOverlay cx={cxA} cy={0} r={R} fill="#3b6d1133" stroke="#3b6d11" tag="조건1" />
          <CircleOverlay cx={cxB} cy={0} r={R} fill="#d85a3033" stroke="#d85a30" tag="조건2" />
        </div>
      </div>

      {/* 그래프: 이진 계단(참/거짓) */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 8], y: [-0.5, 1.5] }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[0, 1]} point2={[2 * R, 1]} color={Theme.green} />
          <Line.Segment point1={[2 * R, 0]} point2={[8, 0]} color={Theme.red} />
          <Point x={d} y={possible} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=중심거리, 세로=동시만족 가능(1)/불가능(0) — <b>딱 한 번 뚝 떨어지는 계단</b>입니다
        </div>
      </div>
    </div>
  );
}
