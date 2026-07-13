// ===========================================================
// 개별 학습목표 전용 인터랙티브 장치 파일(예: renderDevice_no1.jsx)들이 공유하는
// 순수 함수 모음. AntiageTab.jsx 내부의 동명 함수와 로직이 동일하다 —
// 컴포넌트 바깥에서도 쓸 수 있도록 모듈로 분리해뒀다.
// ===========================================================
import * as math from 'mathjs';

// 모델이 "formula=0" 지시를 안 지키고 "x^2 + y^2 = 25"처럼 등호로 방정식을 쓰는 경우를 방어한다.
// mathjs 표현식 파서는 "="를 대입 연산자로 취급해서 이런 문자열을 그대로 컴파일하지 못하므로,
// "좌변 = 우변"을 "(좌변)-(우변)"으로 자동 변환해 implicit(=0) 형태로 맞춰준다.
export function normalizeFormula(formula) {
  if (typeof formula !== 'string') return formula;
  const eqMatch = formula.match(/^([^=<>!]*[^=<>!\s])\s*=\s*(?!=)([^=].*)$/);
  if (eqMatch) {
    return `(${eqMatch[1].trim()})-(${eqMatch[2].trim()})`;
  }
  return formula;
}

export function safeCompile(formula, kind) {
  const target = kind === 'implicit' ? normalizeFormula(formula) : formula;
  try { return math.compile(target); } catch (e) { return null; }
}

export function toRange(range, fallback) {
  return Array.isArray(range) && range.length === 2 ? range : fallback;
}

// target 지점 바로 좌우(epsilon)에서의 함숫값을 각각 구해 좌극한·우극한을 근사한다.
// (target 자체는 정의되지 않는 지점일 수 있으므로 target을 직접 대입하지 않는다.)
export function approxLimitAt(compiled, target, epsilon = 1e-4) {
  let left = NaN, right = NaN;
  try { left = compiled.evaluate({ x: target - epsilon }); } catch (e) { /* 무시 */ }
  try { right = compiled.evaluate({ x: target + epsilon }); } catch (e) { /* 무시 */ }
  return { left, right };
}