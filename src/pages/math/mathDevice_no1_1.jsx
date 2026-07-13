// ===========================================================
// no:1-1 "0으로 나누기 — 값의 폭발" 전용 인터랙션.
//
// [이 파일의 위치] no:1(0/0, 값이 하나로 좁혀짐)의 선행 단계다. 여기서는 반대로,
// targetX(나누는 값이 0이 되는 자리) 근처에서 y값이 좁혀지지 않고 위로 폭발하는 것을
// 아이가 눈으로 확인한다. no:1과 대조되는 "안 좁혀지는" 경험을 주는 게 목적이다.
//
// [no:1 렌더러와의 차이]
//   - no:1은 좌우 극한이 같으면 그 수렴값 위치에 흰 "빈 점"을 그린다.
//     1-1은 수렴값이 없으므로(폭발) 그 빈 점을 절대 그리지 않는다.
//   - 대신 targetX에 세로 점근선(빨간 파선)을 그려 "이 자리로 갈수록 치솟는다"를 강조한다.
//   - 하단 안내문도 "좁혀집니다" 대신 "치솟습니다(폭발)"로 바뀐다.
//
// 모델에게서 받는 필드는 no:1과 완전히 동일하다:
//   - curves[0].formula: 원래 함수 하나 (1-1에서는 "1/x^2")
//   - curves[0].targetX: 정의되지 않는 지점의 x좌표, 숫자 하나 (1-1에서는 0)
// targetX는 숫자라 반복 폭주가 구조적으로 불가능하다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange, approxLimitAt } from './mathDeviceShared';

// device_visual(점 2개: 목표 지점 + 다가가는 이, mafs_shape) + visual(mafs_function, curves 1개
// + targetX)을 같은 화면에 그리고 sharedX 하나로 연동한다. no:1의 renderLimitApproachLinked와
// 동일한 선분-드래그 원리. AntiageTab.jsx의 renderMathVisualArea가 device_visual이 있을 때 이
// 함수를 먼저 시도하고, 실패하면 아래 renderDevice_no1_1(그래프만)로 폴백한다.
export function renderLimitApproachLinked_no1_1(log, logIdx, sharedXByLog, setSharedXByLog) {
  const dv = log.deviceVisual;
  const v = log.visual;
  if (!dv || dv.kind !== 'mafs_shape' || !v || v.kind !== 'mafs_function') return null;
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const c0 = curves[0];
  const compiled = safeCompile(c0.formula, c0.kind);
  if (!compiled) return null;
  const dPoints = Array.isArray(dv.points) ? dv.points : [];
  if (dPoints.length < 2) return null;

  const xRange = toRange(v.xRange, [-5, 5]);
  const yRange = toRange(v.yRange, [-2, 20]); // 폭발을 보여주려면 위쪽을 넉넉히
  const target = typeof c0.targetX === 'number' && Number.isFinite(c0.targetX)
    ? c0.targetX
    : (xRange[0] + xRange[1]) / 2;

  const landmark = dPoints[0];        // 목표 지점(고정)
  const approacherStart = dPoints[1]; // 다가가는 이의 "가장 먼" 초기 위치(고정 기준점)

  const initialX = target + (xRange[1] - target) * 0.5;
  const sign = Math.sign(initialX - target) || 1;
  const maxDist = Math.max(Math.abs(xRange[0] - target), Math.abs(xRange[1] - target), 1e-6);

  const sharedX = sharedXByLog?.[logIdx] ?? initialX;
  const setSharedX = (x) => {
    const clamped = Math.min(xRange[1], Math.max(xRange[0], x));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  const dist = Math.abs(sharedX - target);
  const t = Math.min(1, Math.max(0, 1 - dist / maxDist)); // 0=멀다, 1=거의 도착

  const liveX = approacherStart.x + (landmark.x - approacherStart.x) * t;
  const liveY = approacherStart.y + (landmark.y - approacherStart.y) * t;

  const dXRange = toRange(dv.xRange, [Math.min(landmark.x, approacherStart.x) - 2, Math.max(landmark.x, approacherStart.x) + 2]);
  const dYRange = toRange(dv.yRange, [Math.min(landmark.y, approacherStart.y) - 2, Math.max(landmark.y, approacherStart.y) + 2]);

  let currentY;
  try { currentY = compiled.evaluate({ x: sharedX }); } catch (e) { currentY = NaN; }

  const projectOntoSegment = (pos) => {
    const dx = approacherStart.x - landmark.x, dy = approacherStart.y - landmark.y;
    const len2 = dx * dx + dy * dy || 1e-9;
    let tt = ((pos[0] - landmark.x) * dx + (pos[1] - landmark.y) * dy) / len2;
    tt = Math.min(1, Math.max(0, tt));
    return { point: [landmark.x + dx * tt, landmark.y + dy * tt], tt };
  };

  // y가 폭발 중인지(화면 위로 벗어났는지) 판정 — 안내문 강조용
  const isExploding = Number.isFinite(currentY) && currentY > yRange[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <Mafs viewBox={{ x: dXRange, y: dYRange }} preserveAspectRatio={false} height={220}>
          <Line.Segment point1={[landmark.x, landmark.y]} point2={[approacherStart.x, approacherStart.y]} color="#bbb" />
          <Point x={landmark.x} y={landmark.y} color={Theme.blue} />
          <MovablePoint
            point={[liveX, liveY]}
            constrain={(pos) => projectOntoSegment(pos).point}
            color={Theme.red}
            onMove={(pos) => {
              const { tt } = projectOntoSegment(pos);
              const newDist = tt * maxDist;
              setSharedX(target + sign * newDist);
            }}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          빨간 점을 목표 지점(파란 점) 쪽으로 끌어보세요
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={320}>
          <Coordinates.Cartesian />
          {/* 폭발 지점: 수렴값 빈 점 대신 세로 점근선을 그린다 */}
          <Line.Segment point1={[target, yRange[0]]} point2={[target, yRange[1]]} color={Theme.red} style="dashed" />
          <Plot.OfX
            y={(x) => {
              if (Math.abs(x - target) < 1e-6) return NaN;
              try { return compiled.evaluate({ x }); } catch (e) { return NaN; }
            }}
            color={Theme.blue}
          />
          <MovablePoint
            point={[sharedX, Number.isFinite(currentY) ? currentY : 0]}
            constrain={(pos) => {
              const clampedX = Math.min(xRange[1], Math.max(xRange[0], pos[0]));
              let y; try { y = compiled.evaluate({ x: clampedX }); } catch (e) { y = NaN; }
              return [clampedX, Number.isFinite(y) ? y : pos[1]];
            }}
            color={Theme.green}
            onMove={(pos) => setSharedX(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          지금 x = {sharedX.toFixed(2)} · f(x) = {Number.isFinite(currentY) ? currentY.toFixed(3) : '정의 안 됨'}
          {isExploding && <> · <b style={{ color: '#c0392b' }}>화면 위로 치솟는 중!</b></>}
        </div>
      </div>
    </div>
  );
}

export function renderDevice_no1_1(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_no1_1 디버그]';
  const v = log.visual;

  if (!v) {
    console.log(`${DEBUG} 중단: log.visual이 없다. log:`, log);
    return null;
  }
  if (v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 "mafs_function"이 아니라 "${v.kind}"다.`);
    return null;
  }

  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) {
    console.log(`${DEBUG} 중단: formula가 있는 curve가 없다.`);
    return null;
  }

  const c0 = curves[0];
  const compiled = safeCompile(c0.formula, c0.kind);
  if (!compiled) {
    console.log(`${DEBUG} 중단: formula "${c0.formula}" 컴파일 실패.`);
    return null;
  }

  const xRange = toRange(v.xRange, [-5, 5]);
  const yRange = toRange(v.yRange, [-2, 20]); // 폭발이 보이도록 위쪽을 넉넉히

  const target = typeof c0.targetX === 'number' && Number.isFinite(c0.targetX)
    ? c0.targetX
    : (xRange[0] + xRange[1]) / 2;
  console.log(`${DEBUG} formula="${c0.formula}" targetX=${c0.targetX ?? '(없음, 기본값 사용)'} → target=${target}`);

  // 이 항목은 "폭발"이 정답이므로 좌우 극한이 유한하게 일치하지 않는 게 정상이다.
  // approxLimitAt은 진단 로그용으로만 쓰고, no:1과 달리 수렴값 빈 점은 그리지 않는다.
  const { left, right } = approxLimitAt(compiled, target);
  console.log(`${DEBUG} left=${left} right=${right} (폭발 예상 — 둘 다 매우 커야 정상)`);

  const defaultX = target + (xRange[1] - target) * 0.5;
  const currentX = sharedXByLog?.[logIdx] ?? defaultX;
  const setCurrentX = (x) => {
    const clamped = Math.min(xRange[1], Math.max(xRange[0], x));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };
  let currentY;
  try { currentY = compiled.evaluate({ x: currentX }); } catch (e) { currentY = NaN; }

  const distance = Math.abs(currentX - target);
  const isExploding = Number.isFinite(currentY) && currentY > yRange[1];

  return (
    <div className="viz-box">
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={360}>
        <Coordinates.Cartesian />
        {/* 폭발 지점에 세로 점근선(빨간 파선). no:1의 수렴값 흰 점과 대비되는 시각 신호. */}
        <Line.Segment point1={[target, yRange[0]]} point2={[target, yRange[1]]} color={Theme.red} style="dashed" />
        <Plot.OfX
          y={(x) => {
            if (Math.abs(x - target) < 1e-6) return NaN; // 목표 지점은 정의되지 않음
            try { return compiled.evaluate({ x }); } catch (e) { return NaN; }
          }}
          color={Theme.blue}
        />
        <MovablePoint
          point={[currentX, Number.isFinite(currentY) ? currentY : 0]}
          constrain={(pos) => {
            const clampedX = Math.min(xRange[1], Math.max(xRange[0], pos[0]));
            let y; try { y = compiled.evaluate({ x: clampedX }); } catch (e) { y = NaN; }
            return [clampedX, Number.isFinite(y) ? y : pos[1]];
          }}
          color={Theme.red}
          onMove={(pos) => setCurrentX(pos[0])}
        />
      </Mafs>
      <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
        빨간 점을 곡선 위에서 목표 지점(x = {target.toFixed(2)})에 가깝게 끌어당겨 보세요
        <br />
        지금 x = {currentX.toFixed(2)}(목표까지 거리 {distance.toFixed(2)}) · f(x) = {Number.isFinite(currentY) ? currentY.toFixed(3) : '정의 안 됨'}
        {isExploding
          ? <> · <b style={{ color: '#c0392b' }}>다가갈수록 감당 못 하게 치솟습니다(폭발)</b></>
          : <> · 목표에 다가갈수록 값이 위로 치솟습니다</>}
      </div>
    </div>
  );
}
