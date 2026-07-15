// ===========================================================
// no:"7b" "개수 세기 — 닿는 곳이 곧 답의 개수" 전용 인터랙션. (실근 세트 둘째 칸)
//
// [핵심] 바닥에 닿는 점이 1개면 답 1개, 2개면 답 2개. 교점 수 = 근 개수.
//
// [조작] 여러 곡선 예시를 버튼으로 바꿔가며 닿는 점 개수를 센다.
//
// [모델 필드] curves[0].formula로 곡선. 닿는 점 개수를 자동으로 센다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderCountRoots(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 여러 예시 곡선(닿는 점 0/1/2/3개)
  const presets = (Array.isArray(v.curves) && v.curves.length > 1)
    ? v.curves.map(c => c.formula)
    : ['(x-3)*(x-3)+1', '(x-3)*(x-3)', '(x-2)*(x-5)', '(x-1.5)*(x-3.5)*(x-5.5)*0.6'];

  const idx = sharedXByLog?.[logIdx] ?? 2;
  const setIdx = (i) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: i }));
  const formula = presets[idx] || presets[0];
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-3, 6]);

  // 근 검출
  const roots = [];
  const N = 500;
  let prev = f(xRange[0]);
  for (let i = 1; i <= N; i++) {
    const x = xRange[0] + (xRange[1] - xRange[0]) * (i / N);
    const y = f(x);
    if ((prev < 0) !== (y < 0)) {
      let lo = x - (xRange[1] - xRange[0]) / N, hi = x;
      for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if ((f(lo) < 0) !== (f(m) < 0)) hi = m; else lo = m; }
      roots.push((lo + hi) / 2);
    }
    // 접점(부호 안 바뀌고 0 근처) 대략 검출
    else if (Math.abs(y) < 0.02 && Math.abs(prev) > Math.abs(y)) roots.push(x);
    prev = y;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '6px' }}>
          여러 곡선을 바꿔가며 <b>바닥에 닿는 점의 개수</b>를 세어 보자
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {presets.map((_, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              style={{ padding: '3px 10px', borderRadius: '6px', cursor: 'pointer',
                border: idx === i ? '2px solid #2f5a99' : '1px solid #ccc',
                background: idx === i ? '#dbe6f5' : '#fff', fontWeight: idx === i ? 'bold' : 'normal' }}>예시 {i + 1}</button>
          ))}
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2e7d32', marginTop: '6px' }}>
          닿는 점 {roots.length}개 → 답(실근) {roots.length}개
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color={Theme.orange} />
          <Plot.OfX y={f} color={Theme.blue} />
          {roots.map((r, i) => <Point key={i} x={r} y={0} color={Theme.green} />)}
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <span style={{ fontSize: '11px' }}>곡선이 바닥에 닿는(x축과 만나는) 횟수가 곧 방정식 해(실근)의 개수입니다.</span>
        </div>
      </div>
    </div>
  );
}
