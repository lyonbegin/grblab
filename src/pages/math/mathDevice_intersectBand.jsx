// ===========================================================
// no:"11-3" "겹치는 부분 = 교집합"
// x = 두 원 중심거리(d), y = 겹친 넓이(렌즈 공식). 종형(bell) 비선형 곡선.
//
// [수정 요지 — 인터랙션 복구]
//   기존: 원을 HTML div(CircleOverlay)로 그리고 pointerEvents:'none' 처리,
//     드래그점은 color="transparent" 로 숨김 → "빨간 점을 끌어보세요"라고 안내했지만
//     화면에 잡을 수 있는 요소가 하나도 없었다. 또 div 좌표와 Mafs 좌표가 어긋났다.
//   수정: 원을 Mafs의 Circle 컴포넌트로 좌표계 안에 직접 그리고, 드래그점을 빨간색으로
//     보이게 했다. 보이는 것과 잡히는 것이 같은 좌표계라 정확히 동작한다.
//
// [도형] Mafs: 고정 원(초록) + 이동 원(주황) + 이동 원 중심의 빨간 드래그점.
// [그래프] x=중심거리, y=겹침넓이. 렌즈함수 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Circle, Theme, MovablePoint } from 'mafs';

const R = 2.2;
const X_RANGE = [-6, 6], Y_RANGE = [-3.2, 3.2];

function lensArea(d) {
  const dd = Math.abs(d);
  if (dd >= 2 * R) return 0;
  if (dd <= 0) return Math.PI * R * R;
  return 2 * R * R * Math.acos(dd / (2 * R)) - (dd / 2) * Math.sqrt(Math.max(0, 4 * R * R - dd * dd));
}

export function renderIntersectBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const cxA = -1.2;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 1.5;
  const setCxB = (x) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) }
  }));
  const d = Math.abs(cxB - cxA);
  const area = lensArea(d);
  const maxArea = Math.PI * R * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>빨간 점</b>을 끌어 주황 원을 움직여 겹쳐보세요
        </div>
        {/* 원을 Mafs 안에 직접 그린다 — 드래그점과 좌표계가 일치 */}
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={220}>
          <Circle center={[cxA, 0]} radius={R} color={Theme.green} />
          <Circle center={[cxB, 0]} radius={R} color={Theme.orange} />
          <Point x={cxA} y={0} color={Theme.green} />
          <MovablePoint
            point={[cxB, 0]}
            constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]}
            color={Theme.red}
            onMove={(pos) => setCxB(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          중심거리 <b>{d.toFixed(2)}</b> · 겹친 넓이 <b>{area.toFixed(2)}</b>
        </div>
        <input type="range" min={-6} max={6} step={0.1} value={cxB}
          onChange={(e) => setCxB(parseFloat(e.target.value))}
          style={{ width: '90%', display: 'block', margin: '4px auto 0' }} />
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
