// ===========================================================
// no:"11-7" ★ "겹침이 없으면 해가 없다" — MovablePoint 기반(11-3/11-5 자매).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint } from 'mafs';

const X_RANGE = [-6, 6], Y_RANGE = [-3, 3];

function CircleOverlay({ cx, cy, r, fill, stroke, tag, tagColor }) {
  const xr = X_RANGE[1] - X_RANGE[0], yr = Y_RANGE[1] - Y_RANGE[0];
  const leftPct = ((cx - r - X_RANGE[0]) / xr) * 100;
  const topPct = ((Y_RANGE[1] - (cy + r)) / yr) * 100;
  const wPct = ((2 * r) / xr) * 100;
  const hPct = ((2 * r) / yr) * 100;
  return (
    <div style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, width: `${wPct}%`, height: `${hPct}%`,
      borderRadius: '50%', background: fill, border: `2px solid ${stroke}`, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <span style={{ fontSize: '11px', color: tagColor, fontWeight: 'bold' }}>{tag}</span>
    </div>
  );
}

export function renderNoSolution(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const R = 1.7;
  const cxA = -3.2;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? -0.3;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) } }));

  const dist = Math.abs(cxB - cxA);
  const hasOverlap = dist < 2 * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>빨간 점</b>을 끌어 두 원을 떨어뜨려보세요 — 각각은 답이 있어도 동시에는?
        </div>
      </div>
      <div className="viz-box" style={{ position: 'relative' }}>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian xAxis={{ lines: false }} yAxis={{ lines: false }} />
          <MovablePoint point={[cxB, 0]} constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]}
            color={Theme.red} onMove={(pos) => setCxB(pos[0])} />
        </Mafs>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <CircleOverlay cx={cxA} cy={0} r={R} fill="#3b6d1133" stroke="#3b6d11" tag="조건1 답 있음" tagColor="#3b6d11" />
          <CircleOverlay cx={cxB} cy={0} r={R} fill="#d85a3033" stroke="#d85a30" tag="조건2 답 있음" tagColor="#d85a30" />
        </div>
        <div style={{ fontSize: '13px', textAlign: 'center', fontWeight: 'bold', color: hasOverlap ? '#2e7d32' : '#c0392b', marginTop: '4px' }}>
          {hasOverlap ? '겹치는 부분이 있어 동시 만족 가능' : '겹치는 부분이 없어 동시에는 불가능 — 연립의 해는 없습니다'}
        </div>
      </div>
    </div>
  );
}
