// ===========================================================
// no:"11-2" "그래프에서 조건을 색칠한다"
// x = 기준선 높이(k), y = 만족 구간의 폭(=2*sqrt(k), 곡선 y=x^2 기준).
// 제곱근 곡선(휘어지는 증가) — 11-1의 직선과 다른 그래프 언어.
// [도형] 실제 곡선(y=x^2)+기준선+음영 (이미 좌표계가 있어야 하는 개념이라 도형 자체가 좌표평면)
// [그래프] 별도로 x=k, y=폭 인 진짜 함수그래프(제곱근 곡선)
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, MovablePoint, Theme } from 'mafs';

export function renderShadeBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const k = sharedXByLog?.[logIdx]?.k ?? 4;
  const setK = (kk) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), k: Math.min(9, Math.max(0, kk)) } }));
  const width = 2 * Math.sqrt(k);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 도형: 곡선 y=x^2 + 기준선(드래그) + 음영 */}
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>초록 기준선 점</b>을 위아래로 끌어보세요
        </div>
        <Mafs viewBox={{ x: [-4, 4], y: [0, 9] }} preserveAspectRatio={false} height={240}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => x * x} color={Theme.blue} />
          <Plot.Inequality y={{ '<=': (x) => (x * x < k ? k : 0), '>': () => 1e9 }} color="#c8e6c9" />
          <MovablePoint point={[-3.5, k]} constrain={(pos) => [-3.5, Math.min(9, Math.max(0, pos[1]))]} color={Theme.green} onMove={(pos) => setK(pos[1])} />
        </Mafs>
      </div>

      {/* 그래프: x=기준높이 k, y=만족구간 폭. 제곱근 곡선 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 9], y: [0, 7] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => 2 * Math.sqrt(Math.max(0, x))} color={Theme.orange} />
          <Point x={k} y={width} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=기준선 높이, 세로=만족 구간 폭 — <b>제곱근 곡선</b>으로 늘어납니다(처음엔 빠르게, 나중엔 느리게)
        </div>
      </div>
    </div>
  );
}
