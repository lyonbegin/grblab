// ===========================================================
// no:"4b" ★ "기울기 0 — 꼭대기에선 잠깐 평평하다"  (극값 세트 반전 칸)
//
// [재설계 요지 — 11번 세트 형식에 맞춤]
//   기존: 접선 화살표만 있고 "기울기 0"이 글자로만 떴다. x→y 함수 그래프가 없었다.
//   수정: 아래에 도함수 그래프(x=점 위치, y=접선 기울기)를 추가.
//     → "기울기 0"이 아래 그래프에서 x축과 만나는 교점으로 보인다.
//     이 언어는 7c(곡선 상하 이동 → x축 교점 개수)와 같아서 나중에 곧바로 연결된다.
//
// [반전] 가장 가파르게 오르던 길이 봉우리에선 순간 평평해진다(기울기 0). 골도 마찬가지.
//
// [시각언어] mafs_function 2단 — 위=원래 곡선+접선 화살표, 아래=도함수 곡선.
// [조작] 슬라이더로 점 이동 → 위 화살표가 기울고, 아래 도함수 점이 위아래로 움직인다.
// [그래프] x=점 위치, y=접선 기울기. 위로 열린 2차 포물선. x축 교점 2개 = 극값 2개.
//
// [검증 완료] 0.12x³-1.05x²+2.1x+2.5 → f'(x)=0.36x²-2.1x+2.1, 근 x=1.28(극대), 4.55(극소)
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Vector, Line, Theme } from 'mafs';
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
  const df = (x) => (f(x + eps) - f(x - eps)) / (2 * eps);   // 도함수(수치미분)
  const slope = df(px);
  const isFlat = Math.abs(slope) < 0.06;
  const word = isFlat ? '기울기 0 — 평평! 극값입니다'
    : slope > 0 ? '기울기 + (오르막)' : '기울기 − (내리막)';
  const wc = isFlat ? '#b5701a' : slope > 0 ? '#2e7d32' : '#c0392b';
  const arrowColor = isFlat ? Theme.orange : slope > 0 ? Theme.green : Theme.red;

  const dx = 0.9, y0 = f(px);

  // 도함수 그래프의 y범위(자동)
  let dMin = Infinity, dMax = -Infinity;
  for (let x = xRange[0]; x <= xRange[1]; x += 0.05) {
    const d = df(x); if (d < dMin) dMin = d; if (d > dMax) dMax = d;
  }
  const dPad = (dMax - dMin) * 0.15;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 조작 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 옮겨 접선 화살표가 <b>수평(기울기 0)</b>이 되는 순간을 찾아보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.02} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>

      {/* 도형: 원래 곡선 + 접선 화살표 */}
      <div className="viz-box">
        <div style={{ fontSize: '11px', color: '#5f5e5a', textAlign: 'center' }}>원래 곡선과 접선</div>
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          <Vector tail={[px, y0]} tip={[px + dx, y0 + slope * dx]} color={arrowColor} />
          {isFlat && <Line.Segment point1={[px - dx, y0]} point2={[px + dx, y0]} color={Theme.orange} />}
          <Point x={px} y={y0} color={Theme.red} />
        </Mafs>
      </div>

      {/* 그래프: x=점 위치, y=접선 기울기 (도함수) */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: [dMin - dPad, dMax + dPad] }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          {/* y=0 강조선 — 이 선과 만나는 곳이 극값 */}
          <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color={Theme.orange} />
          <Plot.OfX y={df} color={Theme.violet} />
          <Point x={px} y={slope} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=점 위치, 세로=접선 기울기 — <b>기울기 그래프가 0선(주황)과 만나는 곳이 극값</b>입니다
          <br />
          <span style={{ fontSize: '11px' }}>
            위 화살표가 수평이 될 때, 아래 점이 정확히 0선 위에 얹힙니다.
          </span>
        </div>
      </div>
    </div>
  );
}
