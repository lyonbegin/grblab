// ===========================================================
// no:"div1" "1보다 큰 수로 나누면 작아진다" 전용 인터랙션.
//
// [이 파일의 위치] 0으로 나누기(폭발) → 0/0(줄다리기)로 가는 계단의 첫 칸.
// 여기서는 가장 기본 직관만 세운다: 무언가를 여러 개로 나눌수록(나누는 수 d가 커질수록)
// 한 몫은 작아진다. 반전 없음 — "나누면 작아진다"는 당연한 믿음을 확실히 세워야
// 다음 파일(1보다 작은 수로 나누면 오히려 커진다)의 반전이 충격을 준다.
//
// [no:1-1 렌더러와의 구조 차이]
//   no:1-1은 [도형 장치(1파트: 선분+드래그점)] + [그래프] 였다.
//   이 파일은 도형 장치가 2파트로 쪼개진다:
//     파트 A — 슬라이더: 나누는 개수 d를 조절 (2 ~ dMax)
//     파트 B — 피자 부채꼴 SVG: d가 바뀌면 한 조각(360°/d)이 실시간으로 좁아짐
//   그 아래에 [그래프](기존과 동일: 1/x, x>1 구간, 드래그점)가 붙는다.
//   슬라이더 d = 그래프 x = 부채꼴 몫. 세 요소가 sharedX 하나로 전부 연동된다.
//
// [모델에게서 받는 필드] no:1-1과 동일하게 curves[0].formula / curves[0].targetX 만 받는다.
//   - formula: "1/x" (한 몫의 크기. x=d명이 나눠 가지면 1/d)
//   - targetX: (선택) 없어도 됨. 이 항목은 "구멍"이 핵심이 아니라 슬라이더 조작이 핵심.
//     xRange는 [1, dMax] 처럼 1보다 큰 구간만 쓴다(부호 혼란·폭발 없음).
// 부채꼴은 Mafs로 못 그리므로 SVG path로 직접 그린다. 그래프만 Mafs를 유지한다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

// 중심(cx,cy), 반지름 r, 조각 각도 angleDeg 인 부채꼴 SVG path 문자열.
// 위쪽(12시 방향)을 중심으로 좌우 대칭으로 벌어진다.
function wedgePath(cx, cy, r, angleDeg) {
  const a = (Math.min(359.999, Math.max(0, angleDeg)) * Math.PI) / 180;
  const start = -Math.PI / 2 - a / 2;
  const end = -Math.PI / 2 + a / 2;
  const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
  const largeArc = angleDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export function renderDivGt1(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_div_gt1 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
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

  // 이 항목은 1보다 큰 수로 나누는 구간만 본다. xRange가 안 오면 [1, 8] 기본.
  const xRange = toRange(v.xRange, [1, 8]);
  const dMin = Math.max(1.0001, xRange[0]); // d는 1보다 커야 "여러 조각"이 됨
  const dMax = xRange[1];
  const yRange = toRange(v.yRange, [0, 1.1]); // 한 몫 크기 1/d 는 0~1 사이

  const defaultD = Math.min(dMax, Math.max(dMin, 2));
  const d = sharedXByLog?.[logIdx] ?? defaultD;
  const setD = (val) => {
    const clamped = Math.min(dMax, Math.max(dMin, val));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  let sliceSize; // 한 몫의 크기 = 1/d
  try { sliceSize = compiled.evaluate({ x: d }); } catch (e) { sliceSize = 1 / d; }

  // 부채꼴 한 조각의 각도 = 360/d. d가 커질수록 좁아진다.
  const wedgeAngle = 360 / d;

  // SVG 캔버스 설정
  const SVG_W = 220, SVG_H = 200, CX = 110, CY = 105, R = 80;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* ===== 도형 장치 (2파트: 슬라이더 + 부채꼴) ===== */}
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* 파트 A — 슬라이더 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '160px' }}>
            <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
              몇 조각으로 나눌까?
            </div>
            <input
              type="range"
              min={dMin}
              max={dMax}
              step={1}
              value={Math.round(d)}
              onChange={(e) => setD(parseFloat(e.target.value))}
              style={{ width: '150px' }}
            />
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#b5701a', marginTop: '4px' }}>
              {Math.round(d)}조각
            </div>
          </div>
          {/* 파트 B — 피자 부채꼴 */}
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* 전체 피자(연한 점선 테두리) — 원래 한 판의 크기 기준 */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ccc" strokeDasharray="4 4" strokeWidth="1.5" />
            {/* 나눈 조각들의 경계선(옅게) */}
            {Array.from({ length: Math.round(d) }).map((_, i) => {
              const ang = (-90 + (360 / d) * i) * Math.PI / 180;
              return (
                <line key={i} x1={CX} y1={CY}
                  x2={CX + R * Math.cos(ang)} y2={CY + R * Math.sin(ang)}
                  stroke="#e0d8c4" strokeWidth="1" />
              );
            })}
            {/* 강조된 "한 조각" 부채꼴 */}
            <path d={wedgePath(CX, CY, R, wedgeAngle)} fill="#e8a13a" stroke="#b5701a" strokeWidth="2" />
          </svg>
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          많이 나눌수록(조각 수가 커질수록) 한 조각은 <b>작아집니다</b> · 지금 한 조각 = 전체의 {sliceSize.toFixed(3)}
        </div>
      </div>

      {/* ===== 그래프 (기존 구조 유지: 1/x, 드래그점, 도형과 연동) ===== */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX
            y={(x) => {
              try { return compiled.evaluate({ x }); } catch (e) { return NaN; }
            }}
            color={Theme.blue}
          />
          <MovablePoint
            point={[d, Number.isFinite(sliceSize) ? sliceSize : 0]}
            constrain={(pos) => {
              const cx = Math.min(dMax, Math.max(dMin, pos[0]));
              let y; try { y = compiled.evaluate({ x: cx }); } catch (e) { y = NaN; }
              return [cx, Number.isFinite(y) ? y : pos[1]];
            }}
            color={Theme.red}
            onMove={(pos) => setD(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로 = 나누는 조각 수, 세로 = 한 조각 크기 · 조각 수가 커질수록 곡선이 아래로 내려갑니다(작아짐)
        </div>
      </div>
    </div>
  );
}
