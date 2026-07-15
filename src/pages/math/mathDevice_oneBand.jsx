// ===========================================================
// no:"11-1" "한 조건은 하나의 띠를 만든다" — MovablePoint 기반(기존과 동일, 유지).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme, MovablePoint } from 'mafs';

export function renderOneBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const XMAX = 10;
  const st = sharedXByLog?.[logIdx] || {};
  const lo = st.lo ?? 2, hi = st.hi ?? 7;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { lo, hi, ...(prev?.[logIdx] || {}), ...p } }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '8px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          👉 <b>빨간 점 두 개</b>를 손가락으로 양옆으로 끌어 띠(구간)를 만드세요
        </div>
        <Mafs viewBox={{ x: [-1, XMAX + 1], y: [-1, 3] }} preserveAspectRatio={false} height={160}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          <Line.Segment point1={[lo, 0]} point2={[hi, 0]} color={Theme.indigo} />
          <MovablePoint point={[lo, 0]} constrain={(pos) => [Math.min(hi, Math.max(0, Math.round(pos[0]))), 0]}
            color={Theme.red} onMove={(pos) => patch({ lo: Math.min(hi, Math.max(0, Math.round(pos[0]))) })} />
          <MovablePoint point={[hi, 0]} constrain={(pos) => [Math.max(lo, Math.min(XMAX, Math.round(pos[0]))), 0]}
            color={Theme.red} onMove={(pos) => patch({ hi: Math.max(lo, Math.min(XMAX, Math.round(pos[0]))) })} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>구간: {lo} ~ {hi}</div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, XMAX + 1], y: [-1, 3] }} preserveAspectRatio={false} height={140}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          <Line.Segment point1={[lo, 0]} point2={[hi, 0]} color={Theme.blue} />
          <Point x={lo} y={0} color={Theme.red} />
          <Point x={hi} y={0} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          하나의 조건 = 수직선 위 <b>하나의 띠</b>
        </div>
      </div>
    </div>
  );
}
