// ===========================================================
// no:"2b" "할선 — 두 점을 이으면 기울기가 나온다" 전용 인터랙션. (접선 세트 둘째 칸)
//
// [이 파일의 위치] 2a(직선의 기울기)를 곡선으로 확장. 곡선 위 두 점을 이은 직선(할선)의
//   기울기 = 그 사이 "평균 가파름". 아직 접선(한 점)이 아니라 두 점의 평균이다.
//   다음 칸 2c에서 이 두 점 간격을 0으로 붙여 접선으로 수렴시킨다.
//
// [핵심 직관] 할선 기울기 = (세로 차이)/(가로 차이) = (f(x2)-f(x1))/(x2-x1).
//   곡선은 자리마다 가파름이 다르므로, 두 점을 어디에 잡느냐로 평균 기울기가 달라진다.
//
// [조작] 슬라이더 1개(두 점 사이 간격 h): 고정된 기준점 x0에서 오른쪽으로 h 떨어진 둘째 점.
//   h를 키우면 두 점이 멀어지고, 줄이면 가까워진다(단 2b에선 0까지는 안 감 — 그건 2c).
//
// [상태] logIdx별 숫자 하나(h, 두 점 간격). 기본 2.
//
// [모델 필드] curves[0].formula 로 곡선을 받는다(기본 "0.25*x*x"). 2a와 달리 곡선이 필요.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Line, Point, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderSecant(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_secant 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }
  const curves = (v.curves || []).filter(c => c && c.formula);
  const formula = curves[0]?.formula || '0.25*x*x';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) {
    console.log(`${DEBUG} 중단: formula "${formula}" 컴파일 실패.`);
    return null;
  }
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [0, 9]);

  const x0 = 1;                     // 기준점(고정)
  const hMin = 0.5, hMax = 4;       // 2b: 두 점을 0까지 붙이진 않는다(그건 2c)
  const h = sharedXByLog?.[logIdx] ?? 2;
  const setH = (val) => {
    const clamped = Math.min(hMax, Math.max(hMin, val));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  const x1 = x0, x2 = x0 + h;
  const y1 = f(x1), y2 = f(x2);
  const slope = (y2 - y1) / (x2 - x1);   // 할선 기울기 = 평균 가파름

  // 할선을 화면 양쪽 끝까지 연장
  const extend = (xa) => y1 + slope * (xa - x1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 슬라이더 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          곡선 위 <b>두 점 사이 간격</b>을 바꿔 보자 (두 점을 잇는 직선 = 할선)
        </div>
        <input type="range" min={hMin} max={hMax} step={0.1} value={h}
          onChange={(e) => setH(parseFloat(e.target.value))}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b5701a', marginTop: '2px' }}>
          간격 {h.toFixed(1)}
        </div>
      </div>

      {/* 그래프 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          {/* 곡선 */}
          <Plot.OfX y={f} color={Theme.blue} />
          {/* 할선(두 점을 잇는 직선, 양끝 연장) */}
          <Line.Segment point1={[xRange[0], extend(xRange[0])]}
            point2={[xRange[1], extend(xRange[1])]} color={Theme.green} />
          {/* 두 점 */}
          <Point x={x1} y={y1} color={Theme.red} />
          {/* 둘째 점은 드래그로도 간격 조절 */}
          <MovablePoint
            point={[x2, y2]}
            constrain={(pos) => {
              const nx = Math.min(x0 + hMax, Math.max(x0 + hMin, pos[0]));
              return [nx, f(nx)];
            }}
            color={Theme.red}
            onMove={(pos) => setH(pos[0] - x0)}
          />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          두 점 사이 평균 가파름(할선 기울기) = <b style={{ color: '#2e7d32' }}>{Number.isFinite(slope) ? slope.toFixed(2) : '-'}</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            두 점을 멀리 잡으면 그 사이 넓은 구간의 평균, 가까이 잡으면 좁은 구간의 평균입니다.
          </span>
        </div>
      </div>
    </div>
  );
}
