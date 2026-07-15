// ===========================================================
// no:"11-5" "겹침이 없을 수도 있다" — MovablePoint 기반(11-3과 동일 패턴).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint } from 'mafs';

const X_RANGE = [-6, 6], Y_RANGE = [-3, 3];

function CircleOverlay({ cx, cy, r, fill, stroke }) {
  const xr = X_RANGE[1] - X_RANGE[0], yr = Y_RANGE[1] - Y_RANGE[0];
  const leftPct = ((cx - r - X_RANGE[0]) / xr) * 100;
  const topPct = ((Y_RANGE[1] - (cy + r)) / yr) * 100;
  const wPct = ((2 * r) / xr) * 100;
  const hPct = ((2 * r) / yr) * 100;
  return (
    <div style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, width: `${wPct}%`, height: `${hPct}%`,
      borderRadius: '50%', background: fill, border: `2px solid ${stroke}`, pointerEvents: 'none' }} />
  );
}

export function renderEmptySet(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const R = 1.8;
  const cxA = -3.5;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? -0.5;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) } }));

  const dist = Math.abs(cxB - cxA);
  const hasOverlap = dist < 2 * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>빨간 점</b>을 멀리 끌어 두 원을 완전히 떨어뜨려보세요
        </div>
      </div>
      <div className="viz-box" style={{ position: 'relative' }}>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian xAxis={{ lines: false }} yAxis={{ lines: false }} />
          <MovablePoint point={[cxB, 0]} constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]}
            color={Theme.red} onMove={(pos) => setCxB(pos[0])} />
        </Mafs>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <CircleOverlay cx={cxA} cy={0} r={R} fill="#3b6d1133" stroke="#3b6d11" />
          <CircleOverlay cx={cxB} cy={0} r={R} fill="#d85a3033" stroke="#d85a30" />
        </div>
        <div style={{ fontSize: '13px', textAlign: 'center', fontWeight: 'bold', color: hasOverlap ? '#2e7d32' : '#c0392b', marginTop: '4px' }}>
          {hasOverlap ? '아직 겹침이 있습니다' : '겹침 없음 = 답 없음 (공집합)'}
        </div>
      </div>
    </div>
  );
}
