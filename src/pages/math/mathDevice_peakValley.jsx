// ===========================================================
// no:"4a" "봉우리와 골 — 언덕 꼭대기와 골짜기 바닥" 전용 인터랙션. (극값 세트 첫 칸)
//
// [이 파일의 위치] 극대·극소(no:4)로 가는 첫 칸. 반전 없음. 산-골 곡선에서 눈으로
//   봉우리(주변보다 높은 곳)와 골(주변보다 낮은 곳)을 짚는다. "국소"의 씨앗.
//
// [핵심 직관] 봉우리 = 주변보다 순간 가장 높은 곳. 골 = 주변보다 순간 가장 낮은 곳.
//   전체 최고/최저(no:6)와는 다르다 — 어디까지나 '주변에서만'.
//
// [조작] 슬라이더로 점을 옮기며 봉우리/골 후보에 다가가면 강조. 곡선의 봉우리·골을 자동 표시.
//
// [모델 필드] curves[0].formula로 산-골 곡선(기본 3차식).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderPeakValley(log, logIdx, sharedXByLog, setSharedXByLog) {
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

  // 봉우리(극대)·골(극소) 자동 검출: 기울기 부호가 +→−(봉우리), −→+(골)
  const eps = 1e-3, N = 300;
  const peaks = [], valleys = [];
  let prevUp = null;
  for (let i = 0; i <= N; i++) {
    const x = xRange[0] + (xRange[1] - xRange[0]) * (i / N);
    const up = f(x + eps) > f(x - eps);
    if (prevUp !== null && up !== prevUp) {
      if (prevUp && !up) peaks.push(x);   // 오르막→내리막 = 봉우리
      else valleys.push(x);               // 내리막→오르막 = 골
    }
    prevUp = up;
  }

  // 현재 점이 봉우리/골에 가까운지
  const near = (arr) => arr.some(tx => Math.abs(tx - px) < 0.25);
  const onPeak = near(peaks), onValley = near(valleys);
  const word = onPeak ? '봉우리 (주변보다 높은 곳)' : onValley ? '골 (주변보다 낮은 곳)' : '비탈 (오르막·내리막 중)';
  const wc = onPeak ? '#2e7d32' : onValley ? '#c0392b' : '#5f5e5a';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 옮겨 <b>봉우리</b>(주변보다 높은 곳)와 <b>골</b>(주변보다 낮은 곳)을 찾아 보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.03} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          {peaks.map((tx, i) => <Point key={`p${i}`} x={tx} y={f(tx)} color={Theme.green} />)}
          {valleys.map((tx, i) => <Point key={`v${i}`} x={tx} y={f(tx)} color={Theme.red} />)}
          <Point x={px} y={f(px)} color={Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#2e7d32' }}>초록=봉우리 {peaks.length}개</b> · <b style={{ color: '#c0392b' }}>빨강=골 {valleys.length}개</b>
          <br />
          <span style={{ fontSize: '11px' }}>봉우리와 골은 어디까지나 '주변에서만' 높고 낮은 곳입니다(국소).</span>
        </div>
      </div>
    </div>
  );
}
