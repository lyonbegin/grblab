// ===========================================================
// no:"4b" "기울기 0 — 꼭대기에선 잠깐 평평하다" 전용 인터랙션. ★반전 (극값 세트 둘째 칸)
//   ※ 3c(tangent_arrow)의 접선 화살표 로직을 재사용하되, 극값 맥락으로 래핑한다.
//
// [반전] 가장 가파르게 오르던 길이 봉우리에선 순간 평평해진다(기울기 0). 골도 마찬가지.
//   봉우리·골에서 접선이 수평이 된다는 것이 극값을 찾는 열쇠.
//
// [핵심] 접선 화살표를 얹어, 봉우리·골에 정확히 오면 화살표가 수평(기울기 0)이 됨을 강조.
//
// [모델 필드] curves[0].formula로 산-골 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Vector, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderExtremumZeroSlope(log, logIdx, sharedXByLog, setSharedXByLog) {
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

  const eps = 1e-4;
  const slope = (f(px + eps) - f(px - eps)) / (2 * eps);
  const isFlat = Math.abs(slope) < 0.08;
  const word = isFlat ? '기울기 0 — 평평! 봉우리 또는 골입니다' :
    slope > 0 ? '기울기 + (오르막) — 아직 꼭대기 아님' : '기울기 − (내리막) — 아직 골 아님';
  const wc = isFlat ? '#b5701a' : slope > 0 ? '#2e7d32' : '#c0392b';

  const dx = 0.9, y0 = f(px);
  const arrowColor = isFlat ? Theme.orange : slope > 0 ? Theme.green : Theme.red;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 봉우리·골로 옮겨 접선이 <b>수평(기울기 0)</b>이 되는 순간을 찾아 보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.02} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          <Vector tail={[px, y0]} tip={[px + dx, y0 + slope * dx]} color={arrowColor} />
          {isFlat && <Line.Segment point1={[px - dx, y0]} point2={[px + dx, y0]} color={Theme.orange} />}
          <Point x={px} y={y0} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          접선 기울기 = <b style={{ color: wc }}>{slope.toFixed(2)}</b>
          <br />
          <span style={{ fontSize: '11px' }}>봉우리·골에서는 접선이 수평(기울기 0)이 됩니다 — 이것이 극값을 찾는 열쇠입니다.</span>
        </div>
      </div>
    </div>
  );
}
