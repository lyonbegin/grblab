// ===========================================================
// no:"4b" ★ "기울기 0 — 꼭대기에선 잠깐 평평하다"  (극값 세트 반전 칸)
//
// [v3 수정 — 슬라이더 제거, 직접 드래그로]
//   곡선 위 빨간 점을 직접 끌면(constrain으로 곡선에 달라붙음) 접선 화살표가 즉시 기울고,
//   아래 도함수 그래프의 점도 같은 x로 함께 움직인다. 두 그래프가 한 손동작으로 연동된다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Vector, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderExtremumZeroSlope(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [0, 8]);
  const xMin = xRange[0] + 0.2, xMax = xRange[1] - 0.2;
  const px = sharedXByLog?.[logIdx] ?? 0.4;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  const eps = 1e-4;
  const df = (x) => (f(x + eps) - f(x - eps)) / (2 * eps);
  const slope = df(px);
  const isFlat = Math.abs(slope) < 0.06;
  const word = isFlat ? '기울기 0 — 평평! 극값입니다'
    : slope > 0 ? '기울기 + (오르막)' : '기울기 − (내리막)';
  const wc = isFlat ? '#b5701a' : slope > 0 ? '#2e7d32' : '#c0392b';
  const arrowColor = isFlat ? Theme.orange : slope > 0 ? Theme.green : Theme.red;
  const dx = 0.9, y0 = f(px);

  let dMin = Infinity, dMax = -Infinity;
  for (let x = xRange[0]; x <= xRange[1]; x += 0.05) {
    const d = df(x); if (d < dMin) dMin = d; if (d > dMax) dMax = d;
  }
  const dPad = (dMax - dMin) * 0.15;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a' }}>
          👉 <b>빨간 점을 곡선 위에서 직접 끌어</b> 접선 화살표가 수평이 되는 순간을 찾아보자
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>

      {/* 도형: 곡선 위 직접 드래그 + 접선 화살표 */}
      <div className="viz-box">
        <div style={{ fontSize: '11px', color: '#5f5e5a', textAlign: 'center' }}>원래 곡선과 접선</div>
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          <Vector tail={[px, y0]} tip={[px + dx, y0 + slope * dx]} color={arrowColor} />
          {isFlat && <Line.Segment point1={[px - dx, y0]} point2={[px + dx, y0]} color={Theme.orange} />}
          <MovablePoint
            point={[px, y0]}
            constrain={(pos) => {
              const cx = Math.min(xMax, Math.max(xMin, pos[0]));
              return [cx, f(cx)];
            }}
            color={Theme.red}
            onMove={(pos) => setPx(pos[0])}
          />
        </Mafs>
      </div>

      {/* 그래프: 도함수 (직접 드래그 가능하게 여기도 점 배치) */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: [dMin - dPad, dMax + dPad] }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color={Theme.orange} />
          <Plot.OfX y={df} color={Theme.violet} />
          <MovablePoint
            point={[px, slope]}
            constrain={(pos) => {
              const cx = Math.min(xMax, Math.max(xMin, pos[0]));
              return [cx, df(cx)];
            }}
            color={Theme.red}
            onMove={(pos) => setPx(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=점 위치, 세로=접선 기울기 — <b>이 점도 직접 끌 수 있습니다</b>(위와 같은 위치로 연동)
          <br />
          <span style={{ fontSize: '11px' }}>기울기 그래프가 0선(주황)과 만나는 곳이 극값입니다.</span>
        </div>
      </div>
    </div>
  );
}
