// ===========================================================
// no:"4c" "전환점 — 오르다 내려가면 봉우리, 내리다 오르면 골" 전용 인터랙션. (극값 세트 셋째 칸)
//   ※ 3b(roll_point)의 굴리기 로직을 재사용하되, 전환의 종류(극대/극소)를 가린다.
//
// [핵심] 앞뒤로 오르막→내리막이면 그 지점이 극대(봉우리), 내리막→오르막이면 극소(골).
//   3d의 증가·감소 전환을 극값의 정의로 승격시킨다.
//
// [조작] 슬라이더로 점을 굴리며 전환점 직전·직후 방향을 함께 보여준다. 전환 종류 판정.
//
// [모델 필드] curves[0].formula로 산-골 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderExtremumTurn(log, logIdx, sharedXByLog, setSharedXByLog) {
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
  const px = sharedXByLog?.[logIdx] ?? (xMin + 0.5);
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  const eps = 1e-3, N = 300;
  const peaks = [], valleys = [];
  let prevUp = null;
  for (let i = 0; i <= N; i++) {
    const x = xRange[0] + (xRange[1] - xRange[0]) * (i / N);
    const up = f(x + eps) > f(x - eps);
    if (prevUp !== null && up !== prevUp) { (prevUp && !up ? peaks : valleys).push(x); }
    prevUp = up;
  }

  // 현재 점 앞뒤 방향
  const d = 0.35;
  const leftUp = f(px) > f(px - d);
  const rightUp = f(px + d) > f(px);
  const near = (arr) => arr.find(tx => Math.abs(tx - px) < 0.25);
  const onPeak = near(peaks) != null, onValley = near(valleys) != null;
  let word, wc;
  if (onPeak) { word = '극대 (봉우리) — 오르다 내려간다'; wc = '#2e7d32'; }
  else if (onValley) { word = '극소 (골) — 내리다 올라간다'; wc = '#c0392b'; }
  else { word = `앞: ${leftUp ? '오르막' : '내리막'} · 뒤: ${rightUp ? '오르막' : '내리막'}`; wc = '#5f5e5a'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 굴리며 앞뒤 방향을 보자 — <b>오르다 내려가면 극대</b>, <b>내리다 오르면 극소</b>
        </div>
        <input type="range" min={xMin} max={xMax} step={0.02} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          {peaks.map((tx, i) => <Line.Segment key={`p${i}`} point1={[tx, yRange[0]]} point2={[tx, yRange[1]]} color={Theme.green} opacity={0.4} />)}
          {valleys.map((tx, i) => <Line.Segment key={`v${i}`} point1={[tx, yRange[0]]} point2={[tx, yRange[1]]} color={Theme.red} opacity={0.4} />)}
          <Point x={px} y={f(px)} color={Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#2e7d32' }}>극대 {peaks.length}개</b> · <b style={{ color: '#c0392b' }}>극소 {valleys.length}개</b>
          <br />
          <span style={{ fontSize: '11px' }}>전환의 방향으로 극대·극소가 갈립니다: 오르다 내려가면 극대, 내리다 오르면 극소.</span>
        </div>
      </div>
    </div>
  );
}
