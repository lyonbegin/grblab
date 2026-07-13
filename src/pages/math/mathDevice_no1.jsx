// ===========================================================
// no:1 "부정형 극한(0/0)" 전용 인터랙션 — 초등 선행 개념훈련용.
// 수학 지식 0을 전제로, 수학자가 실제로 부딪힌 벽을 여러 사건으로 되밟아
// 마지막에 '극한' 개념에 도달시킨다. 3단계 뚝딱이 아니라 6개의 작은 사건이
// 앞의 벽이 다음 사건을 낳는 식으로 이어진다.
//
// 이 장치는 두 개의 상호작용 층을 가진다:
//   (A) 도형 조작 — 분자막대·분모막대 두 개를 손잡이로 0에 밀어붙이며,
//       둘 다 0으로 사라지는데 그 "비율"은 한 값으로 좁혀지는 걸 눈으로 본다.
//   (B) 그래프 검증 — (A)에서 만든 비율을 곡선 하나로 펼쳐, 목표 지점의
//       구멍(정의 안 됨)으로 좌우에서 값이 좁혀지는 걸 재확인한다.
//   (A)의 손잡이 위치(x)와 (B)의 빨간 점 위치는 같은 state로 연동된다.
//
// 함수는 sin(x)/x, 목표 x=0, 수렴값 1.
//   - 0/0의 원조 사례(순간속도에서 뉴턴이 막힌 바로 그 형태)라 서사와 일치.
//   - 분자막대=|sin(x)|, 분모막대=|x| 둘 다 0으로 가는데 비율은 1로 안정.
//   - 좌우 대칭이라 "좌우가 한 점에서 만난다"는 판정이 선명하다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange, findSingularity, approxLimitAt } from './mathDeviceShared';

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

사건 1 — 나눗셈이 막히는 순간 (수 감각만, 도형·그래프 없음)
사탕 6개를 3명이 나누면 2개씩. 그럼 6개를 0명이 나누면? 나눠줄 사람이 없다. 답이 없다. → 첫 벽: "0으로 나누는 건 안 되는구나." (아직 극한 아님. "0으로 나누기 금지"만 심는다.)

사건 2 — 그런데 0에 가까워지면? (도형 조작 ①)
막대 하나. 6을 어떤 수로 나눈 값을 막대 높이로 보여준다. 나누는 수를 3→2→1→0.5→0.1로 손잡이로 줄이면 막대가 쑥쑥 커진다. → 관찰: "0에 가까이 갈수록 끝없이 커지네." → 첫 극한 감각: 다가가면 어디로 가는지 보인다(여기선 무한대).

사건 3 — 위도 0, 아래도 0이면? (사건 제시)
이번엔 위(나눠지는 수)도 같이 0으로 간다. 예: 움직이다 멈추는 순간 — 걸린 시간이 0으로 갈 때 간 거리도 0으로 간다. 위도 0, 아래도 0. 0÷0. → 사건 2와 다른 새 벽: "이번엔 위가 6으로 안 버텨주네. 막대는 커질까, 0이 될까, 아니면?"

사건 4 — 두 막대로 직접 조여보기 (도형 조작 ②, 핵심)
분자막대(위, |sin(x)|)와 분모막대(아래, |x|) 둘을 나란히. 손잡이를 0으로 밀면 둘 다 동시에 짧아진다. 옆의 비율 숫자를 보게 한다. → 정답판별턴 질문: "둘 다 0으로 사라지는데 비율은?" 1) 0  2) 1  3) 끝없이 커진다 → 정답 2).

사건 5 — 좌우가 만나는가 (도형 조작 ③)
왼쪽에서 밀 때와 오른쪽에서 밀 때 비율이 같은 곳에서 만나는지 양쪽으로 조여본다. 만나면 "그 값이 답", 어긋나면 "답 없음". → 여기서 만난다(1).

사건 6 — 곡선으로 펼쳐 확인 (그래프, 앞 사건들과 연동)
막대 비율을 곡선으로 편다. 목표 지점엔 구멍(정의 안 됨), 좌우에서 곡선을 따라가면 그 구멍 자리(1)로 좁혀진다. 사건 4~5에서 밀던 손잡이 위치가 그래프 빨간 점으로 그대로 넘어온다.

도달점 — "정확히 그 점은 못 밟아도, 좌우에서 다가가면 값이 하나로 정해진다" = 극한. 아이는 사건 2에서 '다가가기', 사건 4에서 '0/0의 긴장', 사건 5에서 '좌우 일치'를 각각 따로 통과한 뒤 사건 6에서 합친다. '극한'이란 단어도, 공식도 없이 개념을 몸으로 통과한다.

[실제 구현 규격]
- visual.kind="mafs_function", curves는 정확히 1개. 기본 함수 formula: "sin(x)/x" (목표 x=0, 수렴값 1).
- 목표 지점(구멍)은 코드가 수식을 스캔해 자동으로 찾으므로 별도 필드 불필요.
- 렌더는 두 부분: (A) 분자·분모 막대 도형 + 비율 표시(사건 4~5), (B) 곡선 그래프 + 드래그 점(사건 6). 손잡이 x는 sharedXByLog로 두 부분이 공유·연동된다.`
};

// 사건 4~5용 "두 막대" 도형. 손잡이(x)에 따라 분자막대·분모막대 길이가 함께
// 변하고, 비율(분자÷분모)을 숫자로 보여준다. 목표(0)에 밀수록 둘 다 0으로 가지만
// 비율은 수렴값으로 좁혀지는 걸 눈으로 확인시키는 게 목적이다.
function TwoBarsDevice({ compiled, target, currentX, limitValue }) {
  // 분자/분모를 수식에서 직접 못 떼어내므로(문자열 파싱 없이), 목표 지점 기준의
  // "위 길이"와 "아래 길이"를 대리값으로 구성한다. 아래막대 = |x - target|,
  // 위막대 = |f(x)| * |x - target| (= 비율 f(x)를 곱으로 되돌린 위 길이).
  // 이렇게 하면 위/아래 모두 target에서 0이 되고, 위÷아래 = f(x) = 비율이 된다.
  let fx;
  try { fx = compiled.evaluate({ x: currentX }); } catch (e) { fx = NaN; }
  const denom = Math.abs(currentX - (target ?? 0));           // 분모막대 길이(아래)
  const numer = Number.isFinite(fx) ? Math.abs(fx) * denom : NaN; // 분자막대 길이(위)
  const ratio = Number.isFinite(fx) ? fx : NaN;                // 비율 = f(x)

  // 화면 표시용 정규화(최대 막대 높이 120px). 목표 근처에서 둘 다 0으로 수렴.
  const scale = 120 / Math.max(denom, numer, 1e-6, 1);
  const numerH = Number.isFinite(numer) ? Math.min(120, numer * scale) : 0;
  const denomH = Number.isFinite(denom) ? Math.min(120, denom * scale) : 0;

  const barBox = { display: 'inline-flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: 130, margin: '0 14px' };
  const bar = (h, color) => ({ width: 34, height: Math.max(2, h), background: color, borderRadius: 4, transition: 'height 0.08s linear' });

  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
        <div style={barBox}>
          <div style={bar(numerH, Theme.blue)} />
          <div style={{ fontSize: 11, color: '#5f5e5a', marginTop: 4 }}>분자(위)</div>
        </div>
        <div style={{ fontSize: 22, color: '#5f5e5a', alignSelf: 'center', margin: '0 2px' }}>÷</div>
        <div style={barBox}>
          <div style={bar(denomH, Theme.red)} />
          <div style={{ fontSize: 11, color: '#5f5e5a', marginTop: 4 }}>분모(아래)</div>
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
        아래 손잡이를 목표(x=0)로 밀어 보세요 — 두 막대가 함께 0으로 사라져도
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
  const compiled = safeCompile(curves[0].formula, curves[0].kind);
  if (!compiled) return null;

  const xRange = toRange(v.xRange, [-10, 10]);
  const yRange = toRange(v.yRange, [-10, 10]);

  const target = findSingularity(compiled, xRange[0], xRange[1]);
  const { left, right } = target !== null ? approxLimitAt(compiled, target) : { left: NaN, right: NaN };
  const limitValue = (Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-2)
    ? (left + right) / 2
    : null;

  // 드래그한 x 위치를 로그(장면 턴)별 공유 state에 저장한다. 이게 없으면 매 렌더링마다
  // point 좌표가 초기값으로 다시 계산되어 드래그가 "저장"되지 않고 즉시 되돌아간다.
  // 이 x는 (A) 막대 손잡이와 (B) 그래프 빨간 점이 함께 쓰는 연동 축이다.
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
      {/* (A) 사건 4~5 — 두 막대 도형. 손잡이(x)에 따라 분자·분모가 함께 0으로 가고 비율을 관찰 */}
      <TwoBarsDevice compiled={compiled} target={target} currentX={currentX} limitValue={limitValue} />

      {/* 손잡이 슬라이더 — 막대와 그래프 빨간 점을 동시에 움직이는 하나의 축 */}
      <input
        type="range"
        min={xRange[0]}
        max={xRange[1]}
        step={(xRange[1] - xRange[0]) / 400}
        value={currentX}
        onChange={(e) => setCurrentX(parseFloat(e.target.value))}
        style={{ width: '80%', display: 'block', margin: '2px auto 12px' }}
      />

      {/* (B) 사건 6 — 곡선으로 펼쳐 확인. 빨간 점은 위 손잡이와 같은 x를 공유 */}
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={340}>
        <Coordinates.Cartesian />
        <Plot.OfX
          y={(x) => {
            if (target !== null && Math.abs(x - target) < 1e-6) return NaN; // 목표 지점은 정의되지 않음(구멍)
            try { return compiled.evaluate({ x }); } catch (e) { return NaN; }
          }}
          color={Theme.blue}
        />
        {target !== null && limitValue !== null && (
          // 목표 지점의 "빈 점"(정의되지 않지만 값이 수렴하는 자리)을 흰 점으로 표시.
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