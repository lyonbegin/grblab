// ===========================================================
// no:"5c" "접선 위/아래 — 곡선이 접선의 어디에 있나" 전용 인터랙션. (오목볼록 세트 셋째 칸)
//   ※ 2c/3c의 접선 로직을 재사용해, 접선을 긋고 곡선이 그 위/아래 어디 있는지 판정.
//
// [핵심] 곡선이 접선보다 아래에 있으면 위로 볼록(∩), 위에 있으면 아래로 볼록(∪).
//   (no:5 최종 판정 규칙 전반부)
//
// [조작] 슬라이더로 접점을 옮긴다. 그 점 접선을 긋고, 접점 양옆에서 곡선이 접선의 위/아래
//   어디 있는지를 색으로 판정.
//
// [모델 필드] curves[0].formula로 오목·볼록이 섞인 곡선(3차식 권장).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderTangentSide(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.15*x*x*x-1.1*x*x+2*x+2';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-1, 8]);
  const xMin = xRange[0] + 0.5, xMax = xRange[1] - 0.5;
  const px = sharedXByLog?.[logIdx] ?? (xMin + xMax) / 2;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  const eps = 1e-4;
  const slope = (f(px + eps) - f(px - eps)) / (2 * eps);
  const y0 = f(px);
  const tanY = (x) => y0 + slope * (x - px);

  // 접점 양옆에서 곡선이 접선의 위/아래 어디 있는지(둘째 미분 근사로 판정)
  const test = 0.5;
  const aboveLeft = f(px - test) > tanY(px - test);
  const aboveRight = f(px + test) > tanY(px + test);
  const curveAbove = aboveLeft && aboveRight;   // 양옆 다 위 → 아래로 볼록(∪)
  const curveBelow = !aboveLeft && !aboveRight; // 양옆 다 아래 → 위로 볼록(∩)
  let word, wc;
  if (curveAbove) { word = '곡선이 접선 위 → 아래로 볼록 (∪)'; wc = '#2f5a99'; }
  else if (curveBelow) { word = '곡선이 접선 아래 → 위로 볼록 (∩)'; wc = '#b5701a'; }
  else { word = '변곡점 근처 — 접선이 곡선을 관통'; wc = '#7a3c99'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          접점을 옮기며 <b>곡선이 접선의 위인지 아래인지</b> 보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.03} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          <Line.Segment point1={[xRange[0], tanY(xRange[0])]} point2={[xRange[1], tanY(xRange[1])]} color={Theme.green} />
          <Point x={px} y={y0} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: wc }}>{word}</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            곡선이 초록 접선보다 위면 아래로 볼록(∪), 아래면 위로 볼록(∩)입니다.
          </span>
        </div>
      </div>
    </div>
  );
}
