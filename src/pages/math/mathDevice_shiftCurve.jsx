// ===========================================================
// no:"7c" "위아래 이동 — 곡선을 옮기면 개수가 변한다" 전용 인터랙션. ★반전 (실근 세트 셋째 칸)
//
// [반전] 곡선 모양은 그대로인데 높이만 위아래로 옮겨도 바닥에 닿는 점이 2→1→0개로 바뀐다.
//   극대·극소(no:4)가 바닥에 딱 걸치는 순간이 개수가 바뀌는 경계다.
//
// [핵심] 슬라이더로 곡선을 위아래 평행이동. 그때마다 x축과의 교점(실근) 개수가 실시간으로 변함.
//   봉우리/골이 바닥(y=0)에 접하는 순간이 경계(중근).
//
// [모델 필드] curves[0].formula로 봉우리·골 있는 곡선. 세로 이동량 k를 더해 그린다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderShiftCurve(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.6*(x-2)*(x-2)*(x-5)+0';
  const base = safeCompile(formula, 'explicit');
  if (!base) return null;
  const g = (x) => { try { return base.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-6, 6]);
  const kMin = -4, kMax = 4;
  const k = sharedXByLog?.[logIdx] ?? 0;   // 세로 이동량
  const setK = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(kMax, Math.max(kMin, val)) }));

  const f = (x) => g(x) + k;               // 위아래로 k만큼 옮긴 곡선

  // 교점(실근) 개수
  const roots = [];
  const N = 500;
  let prev = f(xRange[0]);
  for (let i = 1; i <= N; i++) {
    const x = xRange[0] + (xRange[1] - xRange[0]) * (i / N);
    const y = f(x);
    if ((prev < 0) !== (y < 0)) {
      let lo = x - (xRange[1] - xRange[0]) / N, hi = x;
      for (let kk = 0; kk < 30; kk++) { const m = (lo + hi) / 2; if ((f(lo) < 0) !== (f(m) < 0)) hi = m; else lo = m; }
      roots.push((lo + hi) / 2);
    }
    prev = y;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          곡선을 <b>위아래로 옮겨</b> 보자 — 모양은 그대로인데 닿는 점 개수가 바뀔까?
        </div>
        <input type="range" min={kMin} max={kMax} step={0.1} value={k}
          onChange={(e) => setK(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '11px', color: '#8a8880', display: 'flex', justifyContent: 'space-between', width: '80%', margin: '0 auto' }}>
          <span>아래로 ↓</span><span>↑ 위로</span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2e7d32', marginTop: '2px' }}>
          지금 닿는 점(실근) {roots.length}개
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
          <span style={{ fontSize: '11px' }}>
            곡선을 위아래로 옮기면 봉우리·골이 바닥에 걸치는 순간을 경계로 실근 개수가 2→1→0처럼 바뀝니다.
          </span>
        </div>
      </div>
    </div>
  );
}
