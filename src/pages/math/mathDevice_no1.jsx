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
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange, approxLimitAt } from './mathDeviceShared';

export const MATH_DEVICE_ITEM_NO1 = {
  part: "Ⅰ부",
  category: "도구 1. 미분",
  no: "1",
  title: "부정형 극한(0/0)",
  difficulty: "2.2 (하)",
  trend: "초반부 3점 계산 위주 출제",
  vizType: "mafs_function",
  deviceType: "limit_approach",
  graphRule: `부정형 극한(0/0) — 초등 선행 개념훈련, 6사건 서사판
수학 지식이 하나도 없다는 전제. 수학자가 실제로 부딪힌 벽을 여러 사건으로 되밟아 마지막에 '극한'에 도달한다. 사건마다 앞의 벽이 다음 사건을 낳는다.

사건 1 — 나눗셈이 막히는 순간 (수 감각만)
사탕 6개를 3명이 나누면 2개씩. 그럼 6개를 0명이 나누면? 나눠줄 사람이 없다. 답이 없다. → 첫 벽: "0으로 나누는 건 안 되는구나."

사건 2 — 그런데 0에 가까워지면?
6을 어떤 수로 나눈 값을, 나누는 수를 3→1→0.1로 0에 가까이 보내면 몫이 쑥쑥 커진다. → 첫 극한 감각: 다가가면 값이 어디로 가는지 보인다(여기선 무한대).

사건 3 — 위도 0, 아래도 0이면?
이번엔 위(나눠지는 수)도 같이 0으로 간다(움직이다 멈추는 순간: 걸린 시간 0, 간 거리도 0). 위도 0, 아래도 0 = 0/0. → 새 벽: "이번엔 위가 안 버텨주네. 막대는 커질까, 0이 될까, 아니면?"

사건 4 — 두 막대로 직접 조여보기 (핵심)
분자막대(위)와 분모막대(아래)를 나란히. 손잡이를 목표로 밀면 둘 다 동시에 짧아진다. 옆의 비율 숫자를 보게 한다. → 정답판별턴 질문: "둘 다 0으로 사라지는데 비율은?" 1) 0  2) 하나의 값으로 좁혀진다  3) 끝없이 커진다 → 정답 2).

사건 5 — 좌우가 만나는가
왼쪽에서 밀 때와 오른쪽에서 밀 때 비율이 같은 곳에서 만나는지 양쪽으로 조여본다. 만나면 그게 극한, 어긋나면 극한 없음.

사건 6 — 곡선으로 펼쳐 확인
막대 비율을 곡선으로 편다. 목표 지점엔 구멍(정의 안 됨), 좌우에서 곡선을 따라가면 그 구멍 자리로 좁혀진다. 사건 4~5에서 밀던 손잡이 위치가 그래프 빨간 점으로 넘어온다.

도달점 — "정확히 그 점은 못 밟아도, 좌우에서 다가가면 값이 하나로 정해진다" = 극한. '극한'이란 단어도 공식도 없이 개념을 몸으로 통과한다.

[실제 구현 규격 — 반드시 지켜라]
- visual.kind="mafs_function", curves는 정확히 1개.
- 그 curves[0]에는 세 가지 식을 모두 채워라:
  · formula: 합쳐진 분수 함수(그래프용). 예: "sin(x)/x"
  · numerFormula: 분자식만. 예: "sin(x)"
  · denomFormula: 분모식만. 예: "x"
  이 세 식이 다 있어야 두 막대(분자·분모)가 화면에 정확히 그려진다. numerFormula/denomFormula를 빠뜨리면 막대가 안 나온다.
- 기본 예: formula "sin(x)/x", numerFormula "sin(x)", denomFormula "x" (목표 x=0, 수렴값 1).
  다른 예: formula "(x^2-1)/(x-1)", numerFormula "x^2-1", denomFormula "x-1" (목표 x=1, 수렴값 2).
- 목표 지점(구멍)은 코드가 분모식이 0이 되는 곳을 자동으로 찾으므로 별도 필드 불필요.
- 아이는 손잡이(슬라이더/빨간 점)를 목표 지점으로 밀며, 두 막대가 함께 0으로 사라져도 비율은 한 값으로 좁혀지는 걸 직접 확인한다.`
};

// 분모식이 0이 되는 지점(=0/0 구멍의 x좌표)을 xRange 안에서 찾는다.
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
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;

  const c0 = curves[0];
  const compiled = safeCompile(c0.formula, c0.kind);
  if (!compiled) return null;

  const numerCompiled = c0.numerFormula ? safeCompile(c0.numerFormula, 'explicit') : null;
  const denomCompiled = c0.denomFormula ? safeCompile(c0.denomFormula, 'explicit') : null;
  const canDrawBars = !!(numerCompiled && denomCompiled);

  const xRange = toRange(v.xRange, [-10, 10]);
  const yRange = toRange(v.yRange, [-10, 10]);

  let target = null;
  if (denomCompiled) {
    target = findHoleByDenominator(denomCompiled, xRange[0], xRange[1]);
  }

  const { left, right } = target !== null ? approxLimitAt(compiled, target) : { left: NaN, right: NaN };
  const limitValue = (Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-2)
    ? (left + right) / 2
    : null;

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