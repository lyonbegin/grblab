// ===========================================================
// no:1 "부정형 극한(0/0)" 전용 인터랙션 — 초등 선행 개념훈련용.
// 수학 지식 0을 전제로, 수학자가 실제로 부딪힌 벽을 여러 사건으로 되밟아
// 마지막에 '극한' 개념에 도달시킨다.
//
// 이 장치는 두 개의 상호작용 층을 가진다:
//   (A) 도형 조작 — 분자막대·분모막대 두 개를 손잡이로 목표 지점에 밀어붙이며,
//       둘 다 0으로 사라지는데 그 "비율"은 한 값으로 좁혀지는 걸 눈으로 본다.
//   (B) 그래프 검증 — (A)의 비율을 곡선 하나로 펼쳐, 목표 지점의 구멍(정의 안 됨)으로
//       좌우에서 값이 좁혀지는 걸 재확인한다.
//   (A)의 손잡이 위치(x)와 (B)의 빨간 점 위치는 같은 state로 연동된다.
//
// [중요] 두 막대를 "진짜" 분자·분모 길이로 그리려면 분자식과 분모식을 각각 알아야 한다.
// 그래서 이 항목의 visual.curves[0]은 formula(합쳐진 함수, 그래프용)에 더해
// numerFormula(분자식)·denomFormula(분모식)를 함께 받는다. 이 둘이 있으면 막대는
// 정확히 |분자|, |분모|가 되어 목표 지점에서 둘 다 0으로 수렴하고 비율은 극한값으로 좁혀진다.
// (만약 모델이 numer/denom을 안 보내면, 막대 층은 생략하고 곡선+드래그만 보여준다 —
//  억지 역산으로 엉뚱한 막대를 그리느니 아예 안 그리는 게 낫다.)
//
// 기본 함수는 sin(x)/x, 목표 x=0, 수렴값 1 (0/0의 원조 사례, 순간속도에서 뉴턴이 막힌 그 형태).
// ===========================================================
// ===========================================================
// 참고: 이 장치가 기대하는 데이터 모양(vizType/deviceType/graphRule)의 실제 정본은
// constantsbase.ts의 GOALS_DATA.math 배열(no:"1" 항목)이다 — 여기엔 중복해서 두지 않는다.
// 이 파일은 오직 렌더링 함수(renderDevice_no1)만 export한다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange, approxLimitAt } from './mathDeviceShared';
function findHoleByDenominator(denomCompiled, xMin, xMax, steps = 2000) {
  const dx = (xMax - xMin) / steps;
  let prevX = null, prevV = null;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    let val;
    try { val = denomCompiled.evaluate({ x }); } catch (e) { val = NaN; }
    if (!Number.isFinite(val)) { prevX = x; prevV = val; continue; }
    if (Math.abs(val) < 1e-9) return x;
    if (prevV !== null && Number.isFinite(prevV) && (prevV < 0) !== (val < 0)) {
      const t = prevV / (prevV - val);
      return prevX + t * (x - prevX);
    }
    prevX = x; prevV = val;
  }
  return null;
}

function TwoBarsDevice({ numerCompiled, denomCompiled, currentX, limitValue }) {
  let numerVal, denomVal;
  try { numerVal = numerCompiled.evaluate({ x: currentX }); } catch (e) { numerVal = NaN; }
  try { denomVal = denomCompiled.evaluate({ x: currentX }); } catch (e) { denomVal = NaN; }

  const numerLen = Number.isFinite(numerVal) ? Math.abs(numerVal) : NaN;
  const denomLen = Number.isFinite(denomVal) ? Math.abs(denomVal) : NaN;
  const ratio = (Number.isFinite(numerVal) && Number.isFinite(denomVal) && Math.abs(denomVal) > 1e-9)
    ? numerVal / denomVal
    : NaN;

  const maxLen = Math.max(numerLen || 0, denomLen || 0, 1e-6);
  const scale = 120 / maxLen;
  const numerH = Number.isFinite(numerLen) ? Math.min(120, numerLen * scale) : 0;
  const denomH = Number.isFinite(denomLen) ? Math.min(120, denomLen * scale) : 0;

  const barBox = { display: 'inline-flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: 130, margin: '0 14px' };
  const bar = (h, color) => ({ width: 34, height: Math.max(2, h), background: color, borderRadius: 4, transition: 'height 0.08s linear' });

  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
        <div style={barBox}>
          <div style={bar(numerH, Theme.blue)} />
          <div style={{ fontSize: 11, color: '#5f5e5a', marginTop: 4 }}>분자(위) {Number.isFinite(numerVal) ? numerVal.toFixed(2) : '?'}</div>
        </div>
        <div style={{ fontSize: 22, color: '#5f5e5a', alignSelf: 'center', margin: '0 2px' }}>÷</div>
        <div style={barBox}>
          <div style={bar(denomH, Theme.red)} />
          <div style={{ fontSize: 11, color: '#5f5e5a', marginTop: 4 }}>분모(아래) {Number.isFinite(denomVal) ? denomVal.toFixed(2) : '?'}</div>
        </div>
        <div style={{ fontSize: 22, color: '#5f5e5a', alignSelf: 'center', margin: '0 8px' }}>=</div>
        <div style={{ alignSelf: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#5f5e5a' }}>비율</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#2a2a28' }}>
            {Number.isFinite(ratio) ? ratio.toFixed(2) : '?'}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#5f5e5a', marginTop: 6 }}>
        아래 손잡이를 목표 지점으로 밀어 보세요 — 두 막대가 함께 0으로 사라져도
        {limitValue !== null && <> 비율은 <b>{limitValue.toFixed(2)}</b> 근처로 좁혀집니다</>}
      </div>
    </div>
  );
}

export function renderDevice_no1(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_no1 디버그]';
  const v = log.visual;

  if (!v) {
    console.log(`${DEBUG} 중단: log.visual 자체가 없다(null/undefined). 서버가 이번 턴에 visual을 아예 안 보냈거나, 검증 실패로 null 처리됐을 가능성이 크다. log 전체:`, log);
    return null;
  }
  if (v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 "mafs_function"이 아니라 "${v.kind}"다. 모델이 vizType 지시를 안 따랐다. visual 전체:`, v);
    return null;
  }

  const rawCurves = Array.isArray(v.curves) ? v.curves : [];
  const curves = rawCurves.filter(c => c && c.formula);
  console.log(`${DEBUG} visual.curves 원본(필터 전, ${rawCurves.length}개):`, JSON.stringify(rawCurves));
  if (curves.length < 1) {
    console.log(`${DEBUG} 중단: formula가 있는 curve가 하나도 없다(필터 후 0개). 서버가 curves는 보냈지만 formula 필드가 비어있거나 curves 자체가 빈 배열이다.`);
    return null;
  }

  const c0 = curves[0];
  console.log(`${DEBUG} curves[0] 사용할 항목:`, JSON.stringify(c0));
  const compiled = safeCompile(c0.formula, c0.kind);
  if (!compiled) {
    console.log(`${DEBUG} 중단: formula "${c0.formula}"(kind=${c0.kind})가 mathjs로 컴파일 실패했다. 수식 문법 오류일 가능성이 크다.`);
    return null;
  }
  console.log(`${DEBUG} ✅ 여기까지 통과 — 메인 곡선(formula="${c0.formula}") 컴파일 성공. 아래부터는 막대(선택)와 그래프를 그린다.`);

  const numerCompiled = c0.numerFormula ? safeCompile(c0.numerFormula, 'explicit') : null;
  const denomCompiled = c0.denomFormula ? safeCompile(c0.denomFormula, 'explicit') : null;
  const canDrawBars = !!(numerCompiled && denomCompiled);
  console.log(`${DEBUG} numerFormula="${c0.numerFormula ?? '(없음)'}" denomFormula="${c0.denomFormula ?? '(없음)'}" → canDrawBars=${canDrawBars}${canDrawBars ? '' : ' (막대 장치는 생략되고 그래프만 표시됨 — 이건 정상 동작이다, numer/denom을 안 보냈을 때의 의도된 폴백)'}`);

  const xRange = toRange(v.xRange, [-10, 10]);
  const yRange = toRange(v.yRange, [-10, 10]);
  console.log(`${DEBUG} xRange=${JSON.stringify(xRange)} yRange=${JSON.stringify(yRange)}`);

  let target = null;
  if (denomCompiled) {
    target = findHoleByDenominator(denomCompiled, xRange[0], xRange[1]);
  }
  console.log(`${DEBUG} target(구멍 x좌표)=${target} (denomCompiled 있음=${!!denomCompiled})`);

  const { left, right } = target !== null ? approxLimitAt(compiled, target) : { left: NaN, right: NaN };
  const limitValue = (Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-2)
    ? (left + right) / 2
    : null;
  console.log(`${DEBUG} left=${left} right=${right} limitValue=${limitValue}`);

  const defaultX = target !== null ? target + (xRange[1] - target) * 0.3 : (xRange[0] + xRange[1]) / 2;
  const currentX = sharedXByLog?.[logIdx] ?? defaultX;
  const setCurrentX = (x) => {
    const clamped = Math.min(xRange[1], Math.max(xRange[0], x));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };
  let currentY;
  try { currentY = compiled.evaluate({ x: currentX }); } catch (e) { currentY = NaN; }

  return (
    <div className="viz-box">
      {canDrawBars && (
        <TwoBarsDevice
          numerCompiled={numerCompiled}
          denomCompiled={denomCompiled}
          currentX={currentX}
          limitValue={limitValue}
        />
      )}

      <input
        type="range"
        min={xRange[0]}
        max={xRange[1]}
        step={(xRange[1] - xRange[0]) / 400}
        value={currentX}
        onChange={(e) => setCurrentX(parseFloat(e.target.value))}
        style={{ width: '80%', display: 'block', margin: '2px auto 12px' }}
      />

      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={340}>
        <Coordinates.Cartesian />
        <Plot.OfX
          y={(x) => {
            if (target !== null && Math.abs(x - target) < 1e-6) return NaN;
            try { return compiled.evaluate({ x }); } catch (e) { return NaN; }
          }}
          color={Theme.blue}
        />
        {target !== null && limitValue !== null && (
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
        빨간 점을 곡선 위에서 목표 지점(구멍)에 가깝게 끌어당겨 보세요
        {target !== null && (
          <> — 지금 x = {currentX.toFixed(2)}, f(x) = {Number.isFinite(currentY) ? currentY.toFixed(2) : '정의 안 됨'}
          {limitValue !== null && <> · 다가갈수록 <b>{limitValue.toFixed(2)}</b>로 좁혀집니다</>}</>
        )}
      </div>
    </div>
  );
}