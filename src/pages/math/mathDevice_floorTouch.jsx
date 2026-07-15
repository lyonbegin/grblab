// ===========================================================
// no:"7a" "바닥 닿기 — 곡선이 x축에 닿는 곳" 전용 인터랙션. (실근 세트 첫 칸)
//
// [핵심] 곡선이 바닥(x축)에 닿는 점을 짚는다. 그 x좌표가 방정식의 해. 반전 없음.
//
// [조작] 슬라이더로 점을 곡선 위 옮기며, 바닥(y=0)에 닿는 순간을 찾는다. 닿는 점 자동 표시.
//
// [모델 필드] curves[0].formula로 x축과 만나는 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderFloorTouch(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '(x-2)*(x-5)';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-3, 6]);
  const xMin = xRange[0] + 0.3, xMax = xRange[1] - 0.3;
  const px = sharedXByLog?.[logIdx] ?? xMin + 0.5;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  // x축과 만나는 점(부호 바뀌는 곳) 자동 검출
  const roots = [];
  const N = 400;
  let prev = f(xRange[0]);
  for (let i = 1; i <= N; i++) {
    const x = xRange[0] + (xRange[1] - xRange[0]) * (i / N);
    const y = f(x);
    if (prev === 0 || (prev < 0) !== (y < 0)) {
      // 이분법 근사
      let lo = x - (xRange[1] - xRange[0]) / N, hi = x;
      for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if ((f(lo) < 0) !== (f(m) < 0)) hi = m; else lo = m; }
      roots.push((lo + hi) / 2);
    }
    prev = y;
  }

  const onFloor = Math.abs(f(px)) < 0.15;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 옮겨 곡선이 <b>바닥(x축)에 닿는 곳</b>을 찾아 보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.02} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: onFloor ? '#2e7d32' : '#5f5e5a', marginTop: '2px' }}>
          {onFloor ? '바닥에 닿았습니다! 여기가 해입니다' : `지금 높이 ${f(px).toFixed(2)}`}
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          {/* 바닥선(x축 강조) */}
          <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color={Theme.orange} />
          <Plot.OfX y={f} color={Theme.blue} />
          {roots.map((r, i) => <Point key={i} x={r} y={0} color={Theme.green} />)}
          <Point x={px} y={f(px)} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#2e7d32' }}>초록 = 바닥에 닿는 점 {roots.length}개</b>
          <br />
          <span style={{ fontSize: '11px' }}>곡선이 바닥(x축)에 닿는 x좌표가 곧 방정식의 해입니다.</span>
        </div>
      </div>
    </div>
  );
}
