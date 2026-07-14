// ===========================================================
// no:"8-7" ★ "만나는 횟수 = 해의 개수" (방정식 해=교점의 핵심개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 곡선(포물선)을 위아래로 미는 슬라이더
//   - 결과도형: 기준선과 만나는 점이 2개→1개→0개로 바뀌는 걸 큰 숫자·불빛으로
//   - 그래프: 곡선과 기준선을 겹쳐 그려 교점을 실제로 보여주고 개수 카운트
//   sharedXByLog[logIdx] = { shift } (곡선 상하 이동량).
//
// [핵심] 두 그래프가 만나는 점의 개수 = 방정식의 해의 개수.
// [모델 필드] visual.curves[0].formula (곡선, 예 "x^2") 씀. 기준선은 y=0(가로축)으로 본다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderCountCross(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_countCross 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const c0 = curves[0];
  const base = safeCompile(c0.formula, c0.kind);
  if (!base) return null;

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-5, 10]);
  const shift = sharedXByLog?.[logIdx]?.shift ?? 0;
  const setShift = (s) => {
    const cs = Math.min(6, Math.max(-6, s));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), shift: cs } }));
  };

  // 이동된 곡선 = base(x) + shift. 가로축(y=0)과의 교점 개수를 부호변화로 센다.
  const f = (x) => { try { return base.evaluate({ x }) + shift; } catch (e) { return NaN; } };
  let crossings = 0;
  const roots = [];
  const steps = 400;
  let prevX = null, prevV = null;
  for (let i = 0; i <= steps; i++) {
    const x = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    const val = f(x);
    if (Number.isFinite(val) && prevV !== null && Number.isFinite(prevV)) {
      if ((prevV < 0) !== (val < 0)) {
        crossings++;
        const t = prevV / (prevV - val);
        roots.push(prevX + t * (x - prevX));
      }
    }
    prevX = x; prevV = val;
  }

  const countColor = crossings === 0 ? '#c0392b' : crossings === 1 ? '#b5701a' : '#2e7d32';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          곡선을 위아래로 밀어 가로선과 만나는 점의 개수를 바꿔보세요
        </div>
        <input type="range" min={-6} max={6} step={0.5} value={shift}
          onChange={(e) => setShift(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <div style={{ textAlign: 'center', marginTop: '6px' }}>
          <span style={{ fontSize: '13px', color: '#5f5e5a' }}>만나는 점 </span>
          <span style={{ fontSize: '26px', fontWeight: 'bold', color: countColor }}>{crossings}</span>
          <span style={{ fontSize: '13px', color: '#5f5e5a' }}>개 = 답 {crossings}개</span>
          {crossings === 0 && <div style={{ fontSize: '12px', color: '#c0392b' }}>안 만나면 답이 없습니다</div>}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={280}>
          <Coordinates.Cartesian />
          {/* 기준선 = 가로축(y=0) 강조 */}
          <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#888" />
          {/* 이동된 곡선 */}
          <Plot.OfX y={f} color={Theme.blue} />
          {/* 교점들 */}
          {roots.map((rx, i) => { const ry = 0; return <Point key={i} x={rx} y={ry} color={Theme.red} />; })}
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          곡선이 가로선과 만나는 <b>점의 개수</b>가 그대로 <b>답(해)의 개수</b>입니다
        </div>
      </div>
    </div>
  );
}
