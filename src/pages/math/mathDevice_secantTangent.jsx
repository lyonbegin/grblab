// ===========================================================
// no:"2c" "접선으로 — 두 점을 붙이면" 전용 인터랙션. ★반전 계단 (접선 세트 셋째 칸)
//
// [이 파일의 위치] 2b(할선=두 점 평균)의 두 점 간격을 0으로 붙인다. 로피탈에서 배운
//   "0으로 밀기"의 접선 버전. 간격 h→0 이면 할선이 한 점에서의 접선으로 수렴한다.
//   이 계단이 미분 파트 전체(3c·4b·5c)가 딛고 올라가는 주춧돌이다.
//
// [반전] 두 점이 겹치면 기울기가 사라질 것 같지만(0/0처럼 보임), 오히려 '그 점만의
//   가파름'으로 딱 정해진다. 두 점을 붙일수록 할선 기울기가 접선 기울기로 수렴한다.
//
// [핵심 직관] 간격 h가 0에 가까워질수록 할선(초록)과 접선(빨강)이 포개진다.
//   접선 기울기 = 곡선의 그 점에서의 순간 가파름(도함수의 씨앗).
//
// [조작] 슬라이더 1개(간격 h): 2b와 달리 아주 작은 값(≈0)까지 밀 수 있다. h를 0쪽으로
//   밀면 둘째 점이 기준점으로 빨려들며 할선이 접선에 포개진다.
//
// [상태] logIdx별 숫자 하나(h). 기본 2. 0 근처까지 감.
//
// [모델 필드] curves[0].formula로 곡선(기본 "0.25*x*x"). 그 점 접선 기울기는 수치미분으로.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Line, Point, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderSecantTangent(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_secantTangent 디버그]';
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

  const x0 = 2;                       // 접점(고정) — 이 점의 접선을 찾는다
  const hMin = 0.02, hMax = 3;        // 2c: 0 근처까지 붙일 수 있다
  const h = sharedXByLog?.[logIdx] ?? 2;
  const setH = (val) => {
    const clamped = Math.min(hMax, Math.max(hMin, val));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  const x1 = x0, x2 = x0 + h;
  const y1 = f(x1), y2 = f(x2);
  const secSlope = (y2 - y1) / (x2 - x1);        // 할선 기울기(간격 h에 따라 변함)

  // 접점에서의 접선 기울기(수치미분, 아주 작은 간격으로)
  const eps = 1e-4;
  const tanSlope = (f(x0 + eps) - f(x0 - eps)) / (2 * eps);

  const secExt = (xa) => y1 + secSlope * (xa - x1);
  const tanExt = (xa) => y1 + tanSlope * (xa - x1);

  const nearlyTangent = h <= 0.15;               // 거의 접선에 포개진 상태

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 슬라이더 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          두 점 사이 <b>간격을 0으로</b> 밀어 보자 — 할선이 <b>접선</b>으로 빨려듭니다
        </div>
        <input type="range" min={hMin} max={hMax} step={0.01} value={h}
          onChange={(e) => setH(parseFloat(e.target.value))}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '11px', color: '#8a8880', display: 'flex', justifyContent: 'space-between', width: '80%', margin: '0 auto' }}>
          <span>← 간격 0 (접선)</span><span>간격 큼 (할선) →</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b5701a', marginTop: '2px' }}>
          간격 {h.toFixed(2)}
        </div>
      </div>

      {/* 그래프 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          {/* 곡선 */}
          <Plot.OfX y={f} color={Theme.blue} />
          {/* 접선(항상 표시, 목표 위치) */}
          <Line.Segment point1={[xRange[0], tanExt(xRange[0])]}
            point2={[xRange[1], tanExt(xRange[1])]} color={Theme.red} />
          {/* 할선(간격에 따라 움직임) */}
          <Line.Segment point1={[xRange[0], secExt(xRange[0])]}
            point2={[xRange[1], secExt(xRange[1])]} color={Theme.green} />
          {/* 접점 + 둘째 점 */}
          <Point x={x1} y={y1} color={Theme.red} />
          <Point x={x2} y={y2} color={Theme.green} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <span style={{ color: '#2e7d32' }}>할선 기울기 {Number.isFinite(secSlope) ? secSlope.toFixed(2) : '-'}</span>
          {'  →  '}
          <span style={{ color: '#c0392b' }}>접선 기울기 {tanSlope.toFixed(2)}</span>
          <br />
          <b style={{ color: nearlyTangent ? '#2e7d32' : '#8a8880', fontSize: '13px' }}>
            {nearlyTangent
              ? '거의 포개졌습니다 — 두 점이 붙으니 그 점만의 가파름 하나로 정해집니다!'
              : '간격을 더 0쪽으로 밀면 초록 할선이 빨강 접선에 포개집니다.'}
          </b>
        </div>
      </div>
    </div>
  );
}
