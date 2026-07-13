// ===========================================================
// 항목별 장치 파일들이 공유하는 최소 유틸리티.
// 렌더링 로직은 절대 여기 두지 않는다 — 그건 항목마다 다르므로 각자의 mathDevice_noN.jsx에 있다.
// 여기 있는 건 "수식을 안전하게 컴파일한다" 같은, 어떤 장치든 다 필요한 범용 계산 함수뿐이다.
// ===========================================================
import * as math from 'mathjs';

export function normalizeFormula(formula) {
  if (!formula || !formula.includes('=')) return formula;
  const [lhs, rhs] = formula.split('=');
  return `(${lhs.trim()}) - (${rhs.trim()})`;
}

export function safeCompile(formula, kind) {
  const target = kind === 'implicit' ? normalizeFormula(formula) : formula;
  try { return math.compile(target); } catch (e) { return null; }
}

export function toRange(range, fallback) {
  return Array.isArray(range) && range.length === 2 ? range : fallback;
}

// "A(x)-B(x) = target" 이 되는 x를 xRange 안에서 찾는다(부호가 바뀌는 구간을 선형보간).
// 저울류(두 곡선의 차이를 목표값에 맞추는) 장치에서 쓴다.
export function findXForDiff(compiledA, compiledB, xMin, xMax, target, steps = 400) {
  let bestX = (xMin + xMax) / 2;
  let bestErr = Infinity;
  let prevX = null, prevVal = null;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    let a, b;
    try { a = compiledA.evaluate({ x }); b = compiledB.evaluate({ x }); } catch (e) { continue; }
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    const val = a - b;
    if (prevVal !== null && ((prevVal - target) < 0) !== ((val - target) < 0)) {
      const t = (target - prevVal) / (val - prevVal);
      return prevX + t * (x - prevX);
    }
    const err = Math.abs(val - target);
    if (err < bestErr) { bestErr = err; bestX = x; }
    prevX = x; prevVal = val;
  }
  return bestX;
}

// 곡선 하나를 xRange 안에서 촘촘히 스캔해, 계산이 막히는(NaN/Infinity가 나는) 지점을 찾는다.
// 극한류(한 점에 다가갈수록 수렴하는가) 장치에서, "목표 지점(구멍)"을 모델 데이터 없이
// 수식만으로 자동 탐지할 때 쓴다.
export function findSingularity(compiled, xMin, xMax, steps = 2000) {
  const dx = (xMax - xMin) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    let y;
    try { y = compiled.evaluate({ x }); } catch (e) { y = NaN; }
    if (!Number.isFinite(y)) return x;
  }
  return null; // 이 구간엔 특이점이 없음
}

// x0 근처 아주 가까운 값에서 좌극한/우극한을 근사한다(수치적 극한 근사).
export function approxLimitAt(compiled, x0, epsilon = 1e-4) {
  let left = NaN, right = NaN;
  try { left = compiled.evaluate({ x: x0 - epsilon }); } catch (e) { /* 무시 */ }
  try { right = compiled.evaluate({ x: x0 + epsilon }); } catch (e) { /* 무시 */ }
  return { left, right };
}
