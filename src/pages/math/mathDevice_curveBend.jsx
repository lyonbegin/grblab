// ===========================================================
// no:"5b" "휘는 속도 — 같이 올라가도 휘는 모양이 다르다" 전용 인터랙션. ★반전 (오목볼록 세트 둘째 칸)
//
// [반전] 둘 다 왼→오른쪽 올라가는(증가) 곡선인데, 하나는 점점 더 가파르게(∪, 아래로 볼록),
//   하나는 점점 완만하게(∩, 위로 볼록) 올라간다. 증가·감소만으론 구분 못 하는 2차 성질.
//
// [핵심] 슬라이더로 점을 옮기며 두 곡선의 '접선이 세워지는 속도(가팔라지는 속도)'를 비교.
//   ∪는 접선이 점점 서고, ∩은 점점 눕는다.
//
// [모델 필드] curves[0].formula(∪형 증가), curves[1].formula(∩형 증가).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Vector, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderCurveBend(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const fA = (v.curves || [])[0]?.formula || '0.25*x*x+0.3*x+0.5';   // ∪형(점점 가파르게 증가)
  const fB = (v.curves || [])[1]?.formula || '2.2*sqrt(x+0.2)'; // ∩형(점점 완만하게 증가)
  const cA = safeCompile(fA, 'explicit');
  const cB = safeCompile(fB, 'explicit');
  if (!cA || !cB) return null;
  const gA = (x) => { try { return cA.evaluate({ x }); } catch (e) { return NaN; } };
  const gB = (x) => { try { return cB.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [0, 9]);
  const xMin = xRange[0] + 0.3, xMax = xRange[1] - 0.3;
  const px = sharedXByLog?.[logIdx] ?? (xMin + 0.5);
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  const eps = 1e-4;
  const slopeA = (gA(px + eps) - gA(px - eps)) / (2 * eps);
  const slopeB = (gB(px + eps) - gB(px - eps)) / (2 * eps);
  const dx = 0.8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          <b>둘 다 올라가는</b> 곡선인데 — 올라가는 <b>속도가 빨라지나 느려지나</b>?
        </div>
        <input type="range" min={xMin} max={xMax} step={0.03} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          <span style={{ color: '#2f5a99', fontWeight: 'bold' }}>파랑 ∪: 기울기 {slopeA.toFixed(2)} (점점 커짐=가팔라짐)</span>
          {'  ·  '}
          <span style={{ color: '#b5701a', fontWeight: 'bold' }}>주황 ∩: 기울기 {slopeB.toFixed(2)} (점점 작아짐=완만해짐)</span>
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={gA} color={Theme.blue} />
          <Plot.OfX y={gB} color={Theme.orange} />
          <Vector tail={[px, gA(px)]} tip={[px + dx, gA(px) + slopeA * dx]} color={Theme.blue} />
          <Vector tail={[px, gB(px)]} tip={[px + dx, gB(px) + slopeB * dx]} color={Theme.orange} />
          <Point x={px} y={gA(px)} color={Theme.blue} />
          <Point x={px} y={gB(px)} color={Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <span style={{ fontSize: '11px' }}>
            둘 다 올라가지만, 파랑(∪)은 접선이 점점 <b>서고</b>(아래로 볼록), 주황(∩)은 점점 <b>눕습니다</b>(위로 볼록).
            증가·감소만으론 이 차이를 구분할 수 없습니다.
          </span>
        </div>
      </div>
    </div>
  );
}
