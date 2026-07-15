// ===========================================================
// no:"5d" "변곡점 — 휨이 바뀌는 지점" 전용 인터랙션. (오목볼록 세트 최종 목표)
//
// [핵심] 볼록 방향이 ∩↔∪로 바뀌는 지점이 변곡점. (no:5 최종 판정 규칙)
//   곡선 전체를 위로 볼록 구간·아래로 볼록 구간으로 칠하고 경계(변곡점)를 표시.
//
// [조작] 슬라이더로 확인점을 옮기며 지금 구간의 볼록 방향을 표시. 변곡점 자동 검출.
//
// [모델 필드] curves[0].formula로 오목·볼록이 바뀌는 곡선(3차식).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderInflectionPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.15*x*x*x-1.1*x*x+2*x+2';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-1, 8]);
  const xMin = xRange[0] + 0.3, xMax = xRange[1] - 0.3;
  const px = sharedXByLog?.[logIdx] ?? (xMin + xMax) / 2;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  // 둘째 미분 부호로 볼록 방향 판정. 부호 바뀌는 곳 = 변곡점.
  const h = 0.05;
  const secondDeriv = (x) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
  const concaveUpAt = (x) => secondDeriv(x) > 0;  // ∪(아래로 볼록)

  const N = 300;
  const inflections = [];
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const x = xRange[0] + (xRange[1] - xRange[0]) * (i / N);
    const up = concaveUpAt(x);
    if (prev !== null && up !== prev) inflections.push(x);
    prev = up;
  }
  const bounds = [xRange[0], ...inflections, xRange[1]];
  const segs = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const mid = (bounds[i] + bounds[i + 1]) / 2;
    segs.push({ x1: bounds[i], x2: bounds[i + 1], up: concaveUpAt(mid) });
  }
  const curUp = concaveUpAt(px);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          곡선을 <b style={{ color: '#2f5a99' }}>아래로 볼록(∪)</b>과 <b style={{ color: '#b5701a' }}>위로 볼록(∩)</b>으로 나눠 보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.03} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: curUp ? '#2f5a99' : '#b5701a', marginTop: '2px' }}>
          지금 점: {curUp ? '아래로 볼록 (∪)' : '위로 볼록 (∩)'}
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          {segs.map((s, si) => {
            const strips = [];
            const step = (s.x2 - s.x1) / 14;
            for (let x = s.x1; x < s.x2; x += step) {
              strips.push(<Line.Segment key={`${si}-${x}`} point1={[x, yRange[0]]} point2={[x, yRange[1]]}
                color={s.up ? Theme.blue : Theme.orange} opacity={0.06} />);
            }
            return strips;
          })}
          {inflections.map((tx, i) => (
            <Line.Segment key={`i${i}`} point1={[tx, yRange[0]]} point2={[tx, yRange[1]]} color={Theme.violet} opacity={0.7} />
          ))}
          <Plot.OfX y={f} color={Theme.blue} />
          {inflections.map((tx, i) => <Point key={`ip${i}`} x={tx} y={f(tx)} color={Theme.violet} />)}
          <Point x={px} y={f(px)} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#7a3c99' }}>보라 점·선 = 변곡점 {inflections.length}개</b>
          <br />
          <span style={{ fontSize: '11px' }}>볼록 방향(∪↔∩)이 바뀌는 지점이 변곡점입니다.</span>
        </div>
      </div>
    </div>
  );
}
