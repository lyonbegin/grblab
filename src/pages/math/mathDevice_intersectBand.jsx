// ===========================================================
// no:"11-3" "겹치는 부분 = 교집합" — MovablePoint 기반으로 재구성.
// [방식] Mafs 캔버스는 그대로 두고, 그 위에 position:relative 래퍼로 감싼 뒤
// 원(투명 배경 SVG 도형)을 절대좌표 오버레이로 겹쳐 그린다. 드래그를 담당하는
// MovablePoint는 완전히 투명하게 처리해 시각적으로는 안 보이고, 그 좌표값만
// 오버레이 원의 위치 계산에 쓴다. 드래그 성능은 mafs의 최적화를 그대로 받는다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint } from 'mafs';

const X_RANGE = [-6, 6], Y_RANGE = [-3, 3];

// mafs 좌표(cx,cy,r)를 컨테이너 기준 백분율로 환산해 원 오버레이를 그린다.
function CircleOverlay({ cx, cy, r, fill, stroke }) {
  const xr = X_RANGE[1] - X_RANGE[0], yr = Y_RANGE[1] - Y_RANGE[0];
  const leftPct = ((cx - r - X_RANGE[0]) / xr) * 100;
  const topPct = ((Y_RANGE[1] - (cy + r)) / yr) * 100;
  const wPct = ((2 * r) / xr) * 100;
  const hPct = ((2 * r) / yr) * 100;
  return (
    <div style={{
      position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, width: `${wPct}%`, height: `${hPct}%`,
      borderRadius: '50%', background: fill, border: `2px solid ${stroke}`, pointerEvents: 'none'
    }} />
  );
}

export function renderIntersectBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const R = 2.2;
  const cxA = -1.2;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 1.5;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) } }));

  const dist = Math.abs(cxB - cxA);
  const overlapRatio = Math.max(0, Math.min(1, 1 - dist / (2 * R)));
  const hasOverlap = dist < 2 * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>빨간 점(주황 원 중심)</b>을 손가락으로 끌어 초록 원과 겹쳐보세요
        </div>
      </div>
      <div className="viz-box" style={{ position: 'relative' }}>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian xAxis={{ lines: false }} yAxis={{ lines: false }} />
          {/* 드래그 전용 — 투명 처리해서 원과 겹쳐 보이게 */}
          <MovablePoint
            point={[cxB, 0]}
            constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]}
            color={Theme.red}
            onMove={(pos) => setCxB(pos[0])}
          />
        </Mafs>
        {/* Mafs 위에 절대좌표로 겹치는 원 오버레이 */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <CircleOverlay cx={cxA} cy={0} r={R} fill="#3b6d1133" stroke="#3b6d11" />
          <CircleOverlay cx={cxB} cy={0} r={R} fill="#d85a3033" stroke="#d85a30" />
        </div>
        <div style={{ fontSize: '13px', textAlign: 'center', fontWeight: 'bold', marginTop: '4px' }}>
          {hasOverlap ? `겹침 ${(overlapRatio * 100).toFixed(0)}%` : '겹침 없음'}
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          두 원이 <b>겹치는 부분(교집합)</b>이 '둘 다 만족'하는 답입니다
        </div>
      </div>
    </div>
  );
}
