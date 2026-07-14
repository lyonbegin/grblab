// ===========================================================
// no:"2d" "진짜 접선 판별 + 접선의 방정식" 전용 인터랙션. (접선 세트 마지막=최종 목표)
//
// [이 파일의 위치] 2c에서 접선의 정체를 잡았으니, 여기서 실제 판별력을 기른다.
//   곡선 위 한 점에서 그은 직선이 그 점 근처에서 곡선과 거의 겹치면 접선,
//   관통하듯 벌어지면 할선. + 접점 좌표와 기울기로 접선의 방정식까지.
//   (원래 no:2 최종 학습목표 3.1의 판정 규칙을 그대로 구현)
//
// [조작]
//   - 접점 위치 슬라이더(x0): 곡선 위 접점을 좌우로 옮긴다.
//   - 직선 기울기 슬라이더(m): 그 점을 지나는 직선의 기울기를 바꾼다.
//   기울기 m이 그 점의 진짜 접선 기울기와 가까우면 "접선", 어긋나면 "할선(관통)"으로 판정.
//
// [핵심] 접선 방정식 y = m(x - x0) + f(x0). m이 접선 기울기와 일치할 때 참접선.
//
// [상태] logIdx별 { x0, m }. x0=접점, m=직선 기울기.
//
// [모델 필드] curves[0].formula로 곡선(기본 "0.2*x*x").
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Line, Point, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderTangentJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_tangentJudge 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }
  const curves = (v.curves || []).filter(c => c && c.formula);
  const formula = curves[0]?.formula || '0.2*x*x';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) {
    console.log(`${DEBUG} 중단: formula "${formula}" 컴파일 실패.`);
    return null;
  }
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [-1, 6]);
  const yRange = toRange(v.yRange, [-1, 9]);

  const st = sharedXByLog?.[logIdx] || {};
  const x0 = st.x0 ?? 2.5;            // 접점 위치
  const mMin = -3, mMax = 5;

  // 그 점의 진짜 접선 기울기(수치미분)
  const eps = 1e-4;
  const trueSlope = (f(x0 + eps) - f(x0 - eps)) / (2 * eps);
  const m = st.m ?? Number(trueSlope.toFixed(1));   // 직선 기울기(기본은 참접선)

  const patch = (p) => {
    setSharedXByLog?.(prev => {
      const cur = prev?.[logIdx] || { x0, m };
      return { ...prev, [logIdx]: { ...cur, ...p } };
    });
  };

  const y0 = f(x0);
  const lineY = (xa) => m * (xa - x0) + y0;          // 그 점 지나는 직선

  // 판정: 직선 기울기가 참접선 기울기와 충분히 가까우면 접선
  const diff = Math.abs(m - trueSlope);
  const isTangent = diff < 0.25;

  // 접선 방정식 문자열(접점 기준)
  const bSign = (m * -x0 + y0) >= 0 ? '+' : '−';
  const bAbs = Math.abs(m * -x0 + y0).toFixed(2);
  const eqStr = `y = ${m.toFixed(2)}·x ${bSign} ${bAbs}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 슬라이더 2개 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', marginBottom: '2px' }}>접점 위치 (곡선 위에서 좌우로)</div>
        <input type="range" min={xRange[0] + 0.5} max={xRange[1] - 0.5} step={0.1} value={x0}
          onChange={(e) => patch({ x0: parseFloat(e.target.value), m: undefined })}
          style={{ width: '100%' }} />
        <div style={{ fontSize: '12px', color: '#5f5e5a', margin: '6px 0 2px' }}>직선 기울기 (이 점을 지나는 직선을 기울여 보자)</div>
        <input type="range" min={mMin} max={mMax} step={0.05} value={m}
          onChange={(e) => patch({ m: parseFloat(e.target.value) })}
          style={{ width: '100%' }} />
      </div>

      {/* 판정 배너 */}
      <div style={{
        background: isTangent ? '#e6f4ea' : '#fdecea',
        border: `2px solid ${isTangent ? '#2e7d32' : '#c0392b'}`,
        borderRadius: '10px', padding: '8px', textAlign: 'center'
      }}>
        <b style={{ color: isTangent ? '#2e7d32' : '#c0392b', fontSize: '15px' }}>
          {isTangent ? '접선입니다 — 그 점 근처에서 곡선과 거의 겹칩니다' : '할선입니다 — 곡선을 관통하듯 벌어집니다'}
        </b>
      </div>

      {/* 그래프 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          <Line.Segment point1={[xRange[0], lineY(xRange[0])]}
            point2={[xRange[1], lineY(xRange[1])]} color={isTangent ? Theme.green : Theme.red} />
          <Point x={x0} y={y0} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          접점 ({x0.toFixed(1)}, {y0.toFixed(1)}) · 이 점의 참접선 기울기 = <b>{trueSlope.toFixed(2)}</b>
          <br />
          <b style={{ color: isTangent ? '#2e7d32' : '#8a8880' }}>접선의 방정식: {eqStr}</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            직선 기울기를 참접선 기울기({trueSlope.toFixed(2)})에 맞추면 곡선과 포개져 접선이 됩니다.
          </span>
        </div>
      </div>
    </div>
  );
}
