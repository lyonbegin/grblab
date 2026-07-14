// ===========================================================
// no:"3c" "기울기 부호 — 접선 화살표 위/아래" 전용 인터랙션. (증가감소 세트 셋째 칸)
//   ※ 2c(접선)의 기울기 계산 로직을 재사용한다. 또 4b(극값에서 기울기 0)에서도 재사용.
//
// [이 파일의 위치] 3b에서 방향이 바뀐다는 걸 봤으니, 여기서 판별 도구를 손에 쥔다.
//   각 점에 그 점의 접선(2c에서 배운 것)을 화살표로 얹는다. 화살표가 위를 향하면(기울기+)
//   오르막=증가, 아래를 향하면(기울기−) 내리막=감소. 굴려보지 않아도 한눈에 가린다.
//
// [핵심 직관] 접선 기울기의 부호가 곧 증가/감소. + 이면 증가, − 이면 감소, 0 이면 전환점.
//
// [조작] 슬라이더로 점을 곡선 위 좌우로. 그 점의 접선 화살표가 색과 방향으로 부호를 보여준다.
//
// [상태] logIdx별 숫자 하나(점의 x).
//
// [모델 필드] curves[0].formula로 오르내림 곡선(기본 "-(x-3)*(x-3)+6").
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Vector, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderTangentArrow(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_tangentArrow 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }
  const curves = (v.curves || []).filter(c => c && c.formula);
  const formula = curves[0]?.formula || '-(x-3)*(x-3)+6';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) {
    console.log(`${DEBUG} 중단: formula "${formula}" 컴파일 실패.`);
    return null;
  }
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [0, 8]);

  const xMin = xRange[0] + 0.3, xMax = xRange[1] - 0.3;
  const px = sharedXByLog?.[logIdx] ?? (xMin + 0.5);
  const setPx = (val) => {
    const clamped = Math.min(xMax, Math.max(xMin, val));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  // 접선 기울기(2c와 같은 수치미분)
  const eps = 1e-4;
  const slope = (f(px + eps) - f(px - eps)) / (2 * eps);
  const sign = slope > 0.05 ? 'plus' : slope < -0.05 ? 'minus' : 'zero';
  const signWord = sign === 'plus' ? '기울기 + → 증가(오르막)'
    : sign === 'minus' ? '기울기 − → 감소(내리막)'
    : '기울기 0 → 전환점(봉우리·골)';
  const signColor = sign === 'plus' ? '#2e7d32' : sign === 'minus' ? '#c0392b' : '#b5701a';

  // 접선 화살표(tail→tip): 그 점에서 오른쪽으로 dx, 위/아래로 slope*dx 만큼.
  const dx = 0.9;
  const y0 = f(px);
  const tipX = px + dx, tipY = y0 + slope * dx;
  const arrowColor = sign === 'plus' ? Theme.green : sign === 'minus' ? Theme.red : Theme.orange;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 슬라이더 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점의 <b>접선 화살표</b>를 보자 — 위를 향하면 증가, 아래를 향하면 감소
        </div>
        <input type="range" min={xMin} max={xMax} step={0.03} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: signColor, marginTop: '2px' }}>
          {signWord}
        </div>
      </div>

      {/* 그래프 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          {/* 접선 화살표 */}
          <Vector tail={[px, y0]} tip={[tipX, tipY]} color={arrowColor} />
          <Point x={px} y={y0} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          접선 기울기 = <b style={{ color: signColor }}>{slope.toFixed(2)}</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            화살표가 위로 뻗으면(+) 증가, 아래로 뻗으면(−) 감소, 수평(0)이면 방향이 바뀌는 전환점입니다.
          </span>
        </div>
      </div>
    </div>
  );
}
