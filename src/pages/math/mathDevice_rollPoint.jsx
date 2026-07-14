// ===========================================================
// no:"3b" "한 곡선 안 반전 — 오르막과 내리막이 같이 있다" 전용 인터랙션. ★반전 (증가감소 세트 둘째 칸)
//   ※ 이 device(roll_point)는 4c(극대·극소 전환점)에서도 deviceType만 바꿔 재사용한다.
//
// [이 파일의 위치] 3a(한 방향 곡선)의 믿음을 뒤집는다. 언덕/골 모양 곡선에서는
//   같은 곡선인데도 자리에 따라 오르막이었다가 내리막이 된다. 이 반전을 겪어야
//   3c(기울기 부호로 판별)와 4c(전환점=극값)가 자연스럽다.
//
// [반전] "한 곡선이면 방향도 하나"라는 3a식 믿음이 깨진다 — 한 곡선 안에 둘 다 있다.
//
// [핵심 직관] 점을 왼→오른쪽으로 굴리며 진행 방향의 높이 변화를 본다. 봉우리/골을
//   지나는 순간 오르막↔내리막이 뒤바뀐다. 전환 지점을 세로 점선으로 표시.
//
// [조작] 슬라이더로 점을 곡선 위 좌우로 굴린다. 지금 위치가 오르막인지 내리막인지 실시간 표시.
//
// [상태] logIdx별 숫자 하나(점의 x). 기본은 곡선 왼쪽.
//
// [모델 필드] curves[0].formula로 오르내림이 있는 곡선(기본 "-(x-3)*(x-3)+6" 언덕).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderRollPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_rollPoint 디버그]';
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

  const eps = 0.03;
  const goingUp = f(px + eps) > f(px);
  const dirWord = goingUp ? '오르막 (올라가는 중)' : '내리막 (내려가는 중)';
  const dirColor = goingUp ? '#2e7d32' : '#c0392b';

  // 전환 지점(봉우리/골) 찾기: 곡선을 훑어 기울기 부호가 바뀌는 x를 모은다.
  const turns = [];
  const N = 200;
  let prevUp = null;
  for (let i = 0; i <= N; i++) {
    const x = xRange[0] + (xRange[1] - xRange[0]) * (i / N);
    const up = f(x + eps) > f(x);
    if (prevUp !== null && up !== prevUp) turns.push(x);
    prevUp = up;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 슬라이더 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 곡선 위에서 <b>굴려</b> 보자 — 같은 곡선인데 방향이 바뀔까?
        </div>
        <input type="range" min={xMin} max={xMax} step={0.03} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: dirColor, marginTop: '2px' }}>
          {dirWord}
        </div>
      </div>

      {/* 그래프 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          {/* 전환 지점(봉우리/골) 세로 점선 */}
          {turns.map((tx, i) => (
            <Line.Segment key={i} point1={[tx, yRange[0]]} point2={[tx, yRange[1]]} color={Theme.orange} opacity={0.5} />
          ))}
          <Point x={px} y={f(px)} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#b5701a' }}>주황 점선</b> = 방향이 뒤바뀌는 지점(봉우리·골)
          <br />
          <span style={{ fontSize: '11px' }}>
            같은 곡선인데 이 지점을 지나면 오르막↔내리막이 뒤바뀝니다 — 한 곡선 안에 둘 다 있습니다.
          </span>
        </div>
      </div>
    </div>
  );
}
