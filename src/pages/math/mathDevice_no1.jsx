// ===========================================================
// no:1 "부정형 극한(0/0)" 전용 인터랙션 — 재설계판.
//
// [이전 설계를 버린 이유] 분자막대·분모막대를 그리려고 모델에게 numerFormula/denomFormula를
// formula와 별도로 또 쓰라고 시켰더니, 같은 내용을 문자열로 재진술하는 과정에서 모델이
// 무의미한 항(x*x/x*x/...)을 수백 번 반복하며 폭주하는 사고가 여러 번 재현됐다(함수를
// 바꿔도 재현됨 — 특정 함수의 문제가 아니라 "formula와 겹치는 내용을 또 쓰게 하는 구조"
// 자체가 문제였다).
//
// [새 설계] 막대 장치를 아예 없앴다. 이제 모델에게는:
//   - curves[0].formula: 원래 함수 하나 (이미 다른 모든 mafs_function 항목과 동일하게 요구됨)
//   - curves[0].targetX: 그 함수가 정의되지 않는 지점의 x좌표, 숫자 하나
// 이 둘만 받는다. targetX는 숫자라 반복 폭주가 구조적으로 불가능하다.
//
// 화면에는 그래프 하나만 그리고, 그 위에 드래그 가능한 점 하나를 둔다. 아이가 이 점을
// targetX 쪽으로 직접 끌어당기면서, 곡선이 정의 안 되는 그 지점 근처에서 y값이 실제로
// 어떤 값에 다가가는지(또는 안 다가가는지) 실시간으로 확인한다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange, approxLimitAt } from './mathDeviceShared';

export function renderDevice_no1(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_no1 디버그]';
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

  const xRange = toRange(v.xRange, [-10, 10]);
  const yRange = toRange(v.yRange, [-10, 10]);

  // target(구멍의 x좌표): 모델이 targetX(숫자)를 직접 주면 그걸 그대로 쓴다.
  // 안 주면 xRange 중앙을 기본값으로 삼는다(그래도 그래프+드래그는 정상 작동).
  const target = typeof c0.targetX === 'number' && Number.isFinite(c0.targetX)
    ? c0.targetX
    : (xRange[0] + xRange[1]) / 2;
  console.log(`${DEBUG} formula="${c0.formula}" targetX=${c0.targetX ?? '(없음, 기본값 사용)'} → target=${target}`);

  const { left, right } = approxLimitAt(compiled, target);
  const limitValue = (Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-2)
    ? (left + right) / 2
    : null;
  console.log(`${DEBUG} left=${left} right=${right} limitValue=${limitValue}`);

  const defaultX = target + (xRange[1] - target) * 0.3;
  const currentX = sharedXByLog?.[logIdx] ?? defaultX;
  const setCurrentX = (x) => {
    const clamped = Math.min(xRange[1], Math.max(xRange[0], x));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };
  let currentY;
  try { currentY = compiled.evaluate({ x: currentX }); } catch (e) { currentY = NaN; }

  const distance = Math.abs(currentX - target);

  return (
    <div className="viz-box">
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={360}>
        <Coordinates.Cartesian />
        <Plot.OfX
          y={(x) => {
            if (Math.abs(x - target) < 1e-6) return NaN; // 목표 지점은 정의되지 않음(구멍)
            try { return compiled.evaluate({ x }); } catch (e) { return NaN; }
          }}
          color={Theme.blue}
        />
        {limitValue !== null && (
          // 목표 지점의 "빈 점"(정의되지 않지만 값이 수렴하는 자리)을 표시.
          <Point x={target} y={limitValue} color="white" />
        )}
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
        빨간 점을 곡선 위에서 목표 지점(구멍, x = {target.toFixed(2)})에 가깝게 끌어당겨 보세요
        <br />
        지금 x = {currentX.toFixed(2)}(목표까지 거리 {distance.toFixed(2)}) · f(x) = {Number.isFinite(currentY) ? currentY.toFixed(3) : '정의 안 됨'}
        {limitValue !== null && <> · 다가갈수록 <b>{limitValue.toFixed(3)}</b>로 좁혀집니다</>}
      </div>
    </div>
  );
}