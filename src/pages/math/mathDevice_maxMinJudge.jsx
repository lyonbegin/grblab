// ===========================================================
// no:"6d" "구간 최대·최소 판정" 전용 인터랙션. (최대최소 세트 최종 목표)
//
// [핵심] 정해진 구간 전체(양 끝점 포함)에서 y가 가장 큰/작은 지점. (no:6 최종 규칙)
//   후보 = 극대·극소점 + 양 끝점. 이들 중 비교해 최대·최소를 정한다.
//
// [조작] 슬라이더로 구간의 양 끝(a,b)을 정하면, 그 구간 전체에서 최대·최소점을 찾아 표시.
//   후보(극값+끝점)를 모두 점으로 찍고 그중 최고/최저를 강조.
//
// [모델 필드] curves[0].formula로 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderMaxMinJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.15*x*x*x-1.2*x*x+2*x+3';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-1, 9]);

  const st = sharedXByLog?.[logIdx] || {};
  const a = st.a ?? 1;
  const b = st.b ?? 5.5;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || { a, b }), ...p } }));

  const lo = Math.min(a, b), hi = Math.max(a, b);
  // 구간 전체 최대·최소(끝점 포함)
  let maxX = lo, minX = lo;
  for (let x = lo; x <= hi; x += 0.02) {
    if (f(x) > f(maxX)) maxX = x;
    if (f(x) < f(minX)) minX = x;
  }
  const maxAtEdge = Math.abs(maxX - lo) < 0.08 || Math.abs(maxX - hi) < 0.08;
  const minAtEdge = Math.abs(minX - lo) < 0.08 || Math.abs(minX - hi) < 0.08;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          구간의 <b>양 끝(a, b)</b>을 정하면 그 안의 최대·최소를 찾습니다
        </div>
        <div style={{ fontSize: '11px', color: '#5f5e5a' }}>왼쪽 끝 a = {lo.toFixed(1)}</div>
        <input type="range" min={xRange[0] + 0.2} max={xRange[1] - 0.2} step={0.05} value={a}
          onChange={(e) => patch({ a: parseFloat(e.target.value) })} style={{ width: '100%' }} />
        <div style={{ fontSize: '11px', color: '#5f5e5a', marginTop: '4px' }}>오른쪽 끝 b = {hi.toFixed(1)}</div>
        <input type="range" min={xRange[0] + 0.2} max={xRange[1] - 0.2} step={0.05} value={b}
          onChange={(e) => patch({ b: parseFloat(e.target.value) })} style={{ width: '100%' }} />
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[lo, yRange[0]]} point2={[lo, yRange[1]]} color={Theme.orange} opacity={0.5} />
          <Line.Segment point1={[hi, yRange[0]]} point2={[hi, yRange[1]]} color={Theme.orange} opacity={0.5} />
          <Plot.OfX y={f} color={Theme.blue} />
          {/* 끝점 후보 */}
          <Point x={lo} y={f(lo)} color={Theme.orange} />
          <Point x={hi} y={f(hi)} color={Theme.orange} />
          {/* 최대·최소 */}
          <Point x={maxX} y={f(maxX)} color={Theme.green} />
          <Point x={minX} y={f(minX)} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#2e7d32' }}>최대 {f(maxX).toFixed(1)}</b> ({maxAtEdge ? '끝점' : '봉우리'})
          {'  ·  '}
          <b style={{ color: '#c0392b' }}>최소 {f(minX).toFixed(1)}</b> ({minAtEdge ? '끝점' : '골'})
          <br />
          <span style={{ fontSize: '11px' }}>후보 = 극값 + 양 끝점. 이들 중 가장 높은 게 최대, 가장 낮은 게 최소입니다.</span>
        </div>
      </div>
    </div>
  );
}
