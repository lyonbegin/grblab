// ===========================================================
// no:1 "부정형 극한(로피탈)" 전용 인터랙션 — 곡선 위의 점을 목표 지점(구멍)에
// 가깝게 끌어당기며, 그 점의 y값이 어디로 수렴하는지 실시간으로 관찰한다.
// 저울(no:8)과는 완전히 다른 상호작용이다 — "두 값을 맞추는" 게 아니라
// "한 점에 다가갈수록 값이 어디로 좁혀지는가"를 보는 것이라, 조작 대상도
// (곡선 위의 점 하나), 판정 기준도(좌우 극한이 같은 값으로 모이는가) 다르다.
// 목표 지점(구멍)은 모델 데이터에 의존하지 않고 수식 자체를 스캔해 자동 탐지한다.
// ===========================================================
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange, findSingularity, approxLimitAt } from './mathDeviceShared';

export const MATH_DEVICE_ITEM_NO1 = {
  part: "Ⅰ부",
  category: "도구 1. 미분",
  no: "1",
  title: "부정형 극한(로피탈)",
  difficulty: "2.2 (하)",
  trend: "초반부 3점 계산 위주 출제",
  vizType: "mafs_function",
  deviceType: "limit_approach",
  graphRule: `부정형 극한(로피탈) — 3단계 완성판
1단계 — 기원
뉴턴·라이프니츠가 순간속도(한 순간의 속력)를 구하려 할 때, "이동거리 ÷ 걸린시간"에 시간을 정확히 0으로 대입하면 0/0이 되어버려 계산이 막혔다. 이 막힘을 뚫는 정리를 요한 베르누이가 발견했고, 로피탈이 1696년 자신의 저서(최초의 미적분 교과서)에 처음 실었다.
2단계 — 시나리오
관측자가 어떤 값(특정 시각·위치)에 정확히 도달한 순간의 값을 알고 싶어 한다. 그런데 그 값을 그대로 대입해 계산하면 분자와 분모가 동시에 0이 되어 "정의되지 않음"이라는 벽에 부딪힌다. 정확히 그 지점에는 다가갈 수 없지만, 그 지점에 한없이 가까운 값들에서는 계산이 가능하다는 것을 깨닫고, 그 값들이 어디로 수렴하는지 쫓아가 본다.
3단계 — 그래프 매핑
- curves: 그 지점에서 0/0 형태가 되는 함수 곡선 1개(예: formula: "(x^2-1)/(x-1)")
- 핵심 질문: x가 특정 지점에 한없이 가까워질 때 함수값이 하나의 값으로 다가가는가?
- 판정 규칙: 그 지점 좌우에서 곡선을 따라간 값이 한 점으로 모이면 극한이 존재. 좌우 값이 다르면 극한이 존재하지 않음. 그 지점 자체는 정의되지 않으므로 구멍(빈 점)으로 표시한다.
[실제 구현 규격] visual — kind="mafs_function", curves는 정확히 1개(구멍이 생기는 분수 형태 함수). 목표 지점은 코드가 수식을 스캔해 자동으로 찾으므로 별도 필드 불필요.`
};

export function renderDevice_no1(log) {
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

  return (
    <div className="viz-box">
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
          // 목표 지점의 "빈 점"(정의되지 않지만 값이 수렴하는 자리)을 테두리만 있는 원으로 표시.
          <Point x={target} y={limitValue} color="white" />
        )}
        <MovablePoint
          point={[target !== null ? target + (xRange[1] - target) * 0.3 : (xRange[0] + xRange[1]) / 2, 0]}
          constrain={(pos) => {
            let y; try { y = compiled.evaluate({ x: pos[0] }); } catch (e) { y = NaN; }
            return [pos[0], Number.isFinite(y) ? y : pos[1]];
          }}
          color={Theme.red}
        />
      </Mafs>
      <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
        빨간 점을 곡선 위에서 목표 지점(구멍)에 가깝게 끌어당겨 보세요
        {target !== null && limitValue !== null && (
          <> — 다가갈수록 값이 <b>{limitValue.toFixed(2)}</b>로 좁혀집니다</>
        )}
      </div>
    </div>
  );
}
