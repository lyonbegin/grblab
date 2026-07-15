// ===========================================================
// no:"7d" "실근 개수 판정 (+부등식은 위/아래 비교)" 전용 인터랙션. (실근 세트 최종 목표)
//
// [핵심] x축과 만나는 횟수 = 실근의 개수. (no:7 최종 판정 규칙)
//   부등식 증명은 "한 곡선이 다른 것보다 늘 위에 있다"로 확장 — 비교선(기준선)을 함께 둔다.
//
// [조작]
//   - 세로 이동 슬라이더(k): 곡선을 위아래로 옮겨 실근 개수 변화를 본다(7c 종합).
//   - 비교선 슬라이더(c): 가로 기준선 y=c 를 올리고 내려, 곡선이 그 선보다 늘 위/아래인지 판정.
//     (부등식 f(x) > c 가 성립하는지 = 곡선이 기준선 위에 늘 있는지)
//
// [모델 필드] curves[0].formula로 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderRootsJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.6*(x-2)*(x-2)*(x-5)';
  const base = safeCompile(formula, 'explicit');
  if (!base) return null;
  const g = (x) => { try { return base.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-6, 6]);

  const st = sharedXByLog?.[logIdx] || {};
  const k = st.k ?? 0;    // 곡선 세로 이동
  const c = st.c ?? -3;   // 비교 기준선 y=c
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || { k, c }), ...p } }));

  const f = (x) => g(x) + k;

  // 실근(=x축 교점) 개수
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

  // 부등식: 곡선이 기준선 y=c 보다 늘 위에 있는가?
  let alwaysAbove = true, minVal = Infinity;
  for (let x = xRange[0]; x <= xRange[1]; x += 0.02) {
    const y = f(x);
    if (y < minVal) minVal = y;
    if (y <= c) alwaysAbove = false;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a' }}>곡선 위아래 이동 (실근 개수 변화)</div>
        <input type="range" min={-4} max={4} step={0.1} value={k}
          onChange={(e) => patch({ k: parseFloat(e.target.value) })} style={{ width: '100%' }} />
        <div style={{ fontSize: '12px', color: '#5f5e5a', marginTop: '6px' }}>비교 기준선 y = {c.toFixed(1)} (부등식용)</div>
        <input type="range" min={-6} max={5} step={0.1} value={c}
          onChange={(e) => patch({ c: parseFloat(e.target.value) })} style={{ width: '100%' }} />
      </div>

      {/* 판정 배너 2개 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, background: '#e6f4ea', border: '2px solid #2e7d32', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
          <b style={{ color: '#2e7d32', fontSize: '14px' }}>실근 {roots.length}개</b>
          <div style={{ fontSize: '10px', color: '#5f5e5a' }}>x축과 만나는 횟수</div>
        </div>
        <div style={{
          flex: 1, background: alwaysAbove ? '#e6f4ea' : '#fdecea',
          border: `2px solid ${alwaysAbove ? '#2e7d32' : '#c0392b'}`, borderRadius: '8px', padding: '6px', textAlign: 'center'
        }}>
          <b style={{ color: alwaysAbove ? '#2e7d32' : '#c0392b', fontSize: '14px' }}>
            {alwaysAbove ? '늘 기준선 위 (부등식 성립)' : '기준선 아래로 내려감'}
          </b>
          <div style={{ fontSize: '10px', color: '#5f5e5a' }}>가장 낮은 값 {minVal.toFixed(2)}</div>
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          {/* 바닥(x축) */}
          <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color={Theme.orange} />
          {/* 비교 기준선 */}
          <Line.Segment point1={[xRange[0], c]} point2={[xRange[1], c]} color={Theme.violet} opacity={0.7} />
          <Plot.OfX y={f} color={Theme.blue} />
          {roots.map((r, i) => <Point key={i} x={r} y={0} color={Theme.green} />)}
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#b5701a' }}>주황=바닥(x축)</b> · <b style={{ color: '#7a3c99' }}>보라=비교 기준선</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            x축과 만나는 횟수가 실근 개수입니다. 곡선이 기준선보다 늘 위에 있으면 부등식이 성립합니다.
          </span>
        </div>
      </div>
    </div>
  );
}
