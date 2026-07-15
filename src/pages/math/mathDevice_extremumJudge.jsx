// ===========================================================
// no:"4d" "극대·극소 판별" 전용 인터랙션. (극값 세트 최종 목표)
//
// [핵심] 주변보다 순간 가장 높으면 극대, 낮으면 극소. 증가↔감소 전환으로 판정.
//   "국소"임을 강조: 전체 최고가 아니어도 주변에서만 최고면 극대(다음 no:6과 구분).
//
// [조작] 후보점을 슬라이더로 골라 "이게 극대/극소/둘 다 아님"을 판정. 주변 창을 함께 표시해
//   전체 최고가 아니어도 주변에서만 최고면 극대임을 눈으로 확인.
//
// [모델 필드] curves[0].formula로 산-골 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderExtremumJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const curves = (v.curves || []).filter(c => c && c.formula);
  const formula = curves[0]?.formula || '0.15*x*x*x-1.2*x*x+2*x+3';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-1, 8]);
  const xMin = xRange[0] + 0.3, xMax = xRange[1] - 0.3;
  const px = sharedXByLog?.[logIdx] ?? (xMin + xMax) / 2;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  // 주변 창(±win)에서 현재 점이 최고/최저인지로 극대/극소 판정
  const win = 0.7;
  const y0 = f(px);
  let localMax = true, localMin = true;
  for (let x = px - win; x <= px + win; x += 0.05) {
    if (x < xRange[0] || x > xRange[1]) continue;
    if (f(x) > y0 + 1e-3) localMax = false;
    if (f(x) < y0 - 1e-3) localMin = false;
  }
  const word = localMax ? '극대 — 주변에서 순간 가장 높음' :
    localMin ? '극소 — 주변에서 순간 가장 낮음' : '극값 아님 — 비탈 위';
  const wc = localMax ? '#2e7d32' : localMin ? '#c0392b' : '#5f5e5a';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          후보점을 골라 <b>극대·극소</b>인지 판정하자 (주변 창 안에서만 비교합니다)
        </div>
        <input type="range" min={xMin} max={xMax} step={0.02} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          {/* 주변 창 표시(연한 세로선 두 개) */}
          <Line.Segment point1={[Math.max(xRange[0], px - win), yRange[0]]} point2={[Math.max(xRange[0], px - win), yRange[1]]} color={Theme.orange} opacity={0.3} />
          <Line.Segment point1={[Math.min(xRange[1], px + win), yRange[0]]} point2={[Math.min(xRange[1], px + win), yRange[1]]} color={Theme.orange} opacity={0.3} />
          <Plot.OfX y={f} color={Theme.blue} />
          <Point x={px} y={y0} color={localMax ? Theme.green : localMin ? Theme.red : Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: wc }}>{word}</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            주황 창 안(주변)에서만 비교합니다 — 전체에서 가장 높지 않아도 주변에서 최고면 극대입니다(국소).
          </span>
        </div>
      </div>
    </div>
  );
}
