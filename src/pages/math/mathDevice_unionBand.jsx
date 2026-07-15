// ===========================================================
// no:"11-4" "합치는 부분 = 합집합"
// x = 두 원 중심거리(d), y = 합친 전체 넓이(2πR² - 겹침넓이). 포화곡선.
//
// [수정 요지 — 인터랙션 복구]
//   기존: 원을 HTML div 오버레이로 그리고 드래그점을 color="transparent"로 숨겨
//     잡을 수 있는 요소가 없었고, div/Mafs 좌표가 어긋났다.
//   수정: 원을 Mafs Circle로 좌표계 안에 그리고 드래그점을 빨간색으로 노출. 슬라이더 병행.
//
// [도형] Mafs: 고정 원(파랑) + 이동 원(주황) + 빨간 드래그점.
// [그래프] x=중심거리, y=합친 넓이. 포화곡선(완전분리 후 상수).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Circle, Theme, MovablePoint } from 'mafs';

const R = 1.8;
const X_RANGE = [-6, 6], Y_RANGE = [-3, 3];

function lensArea(d) {
  const dd = Math.abs(d);
  if (dd >= 2 * R) return 0;
  if (dd <= 0) return Math.PI * R * R;
  return 2 * R * R * Math.acos(dd / (2 * R)) - (dd / 2) * Math.sqrt(Math.max(0, 4 * R * R - dd * dd));
}
function unionArea(d) { return 2 * Math.PI * R * R - lensArea(d); }

export function renderUnionBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const cxA = -1.0;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 0.5;
  const setCxB = (x) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) }
  }));
  const d = Math.abs(cxB - cxA);
  const area = unionArea(d);
  const maxArea = 2 * Math.PI * R * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>빨간 점</b>을 끌어 두 원의 합쳐진 크기를 바꿔보세요
        </div>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={220}>
          <Circle center={[cxA, 0]} radius={R} color={Theme.blue} />
          <Circle center={[cxB, 0]} radius={R} color={Theme.orange} />
          <Point x={cxA} y={0} color={Theme.blue} />
          <MovablePoint
            point={[cxB, 0]}
            constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]}
            color={Theme.red}
            onMove={(pos) => setCxB(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          중심거리 <b>{d.toFixed(2)}</b> · 합친 넓이 <b>{area.toFixed(2)}</b>
        </div>
        <input type="range" min={-6} max={6} step={0.1} value={cxB}
          onChange={(e) => setCxB(parseFloat(e.target.value))}
          style={{ width: '90%', display: 'block', margin: '4px auto 0' }} />
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
