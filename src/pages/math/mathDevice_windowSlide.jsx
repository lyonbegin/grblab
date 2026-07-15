// ===========================================================
// no:"6b" "구간 창문 — 보는 범위에 따라 최고가 바뀐다" 전용 인터랙션. ★반전 (최대최소 세트 둘째 칸)
//   ※ 이 device(window_slide)는 6c(끝점 후보)에서도 재사용한다.
//
// [반전] 곡선은 그대로인데, 보는 구간(창문)을 옮기면 그 안의 최고점이 바뀐다.
//   "어디까지 보느냐"가 최대를 결정한다.
//
// [조작] 슬라이더로 창문(구간)의 위치를 좌우로 옮긴다. 창문 안에서의 최고/최저점이 강조된다.
//
// [모델 필드] curves[0].formula로 오르내림 곡선. windowWidth(선택)로 창 너비.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderWindowSlide(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.15*x*x*x-1.2*x*x+2*x+3';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 8]);
  const yRange = toRange(v.yRange, [-1, 9]);
  const winW = typeof v.windowWidth === 'number' ? v.windowWidth : 2.5;

  const wMin = xRange[0], wMax = xRange[1] - winW;
  const wStart = sharedXByLog?.[logIdx] ?? (wMin + (wMax - wMin) * 0.15);
  const setWStart = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(wMax, Math.max(wMin, val)) }));
  const wEnd = wStart + winW;

  // 창 안에서 최고/최저점 찾기(끝점 포함해 훑기)
  let maxX = wStart, minX = wStart;
  for (let x = wStart; x <= wEnd; x += 0.02) {
    if (f(x) > f(maxX)) maxX = x;
    if (f(x) < f(minX)) minX = x;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          <b>보는 창문(구간)</b>을 좌우로 옮겨 보자 — 곡선은 그대로인데 최고점이 바뀔까?
        </div>
        <input type="range" min={wMin} max={wMax} step={0.05} value={wStart}
          onChange={(e) => setWStart(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2e7d32', marginTop: '2px' }}>
          창 [{wStart.toFixed(1)}, {wEnd.toFixed(1)}] 안 최고점: x={maxX.toFixed(1)}, 높이 {f(maxX).toFixed(1)}
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          {/* 창문 범위(양 끝 세로선) */}
          <Line.Segment point1={[wStart, yRange[0]]} point2={[wStart, yRange[1]]} color={Theme.orange} opacity={0.5} />
          <Line.Segment point1={[wEnd, yRange[0]]} point2={[wEnd, yRange[1]]} color={Theme.orange} opacity={0.5} />
          {/* 창 안 곡선 강조를 위한 얕은 음영 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const x = wStart + (winW * i) / 12;
            return <Line.Segment key={i} point1={[x, yRange[0]]} point2={[x, yRange[1]]} color={Theme.orange} opacity={0.04} />;
          })}
          <Plot.OfX y={f} color={Theme.blue} />
          <Point x={maxX} y={f(maxX)} color={Theme.green} />
          <Point x={minX} y={f(minX)} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#2e7d32' }}>초록=창 안 최고</b> · <b style={{ color: '#c0392b' }}>빨강=창 안 최저</b>
          <br />
          <span style={{ fontSize: '11px' }}>곡선은 그대로인데 창문을 옮기면 최고·최저 지점이 달라집니다.</span>
        </div>
      </div>
    </div>
  );
}
