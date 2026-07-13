// ===========================================================
// no:"div2" "1보다 작은 수로 나누면 갯수가 늘어난다" 전용 인터랙션.
//
// [이 파일의 위치] div1(1보다 큰 수로 나누면 작아진다)의 반전 단계.
// div1에서 "나누면 작아진다"는 믿음을 세웠다면, 여기서 그 믿음이 뒤집힌다:
// 자르는 크기(d)가 1보다 작아지면, 나온 도막의 "개수"는 오히려 늘어난다.
// d가 0에 가까울수록 도막 개수가 폭발 → 다음 단계(0으로 나누기=폭발)로 이어진다.
//
// [div1과의 은유 차이]
//   div1: 부채꼴(한 조각의 크기). d>1에서만 성립(360° 벽 때문에 d<1 불가).
//   div2: 막대 자르기(도막의 개수). d<1에서 도막이 늘어나는 걸 칼금으로 보여준다.
//         "1을 d 크기로 자르면 도막 수 = 1/d개"라는 포함제(나눗셈의 다른 뜻)를 쓴다.
//
// [모델에게서 받는 필드] div1과 동일하게 curves[0].formula 만 받는다.
//   - formula: "1/x" (x=자르는 크기 d, 1/x=도막 개수)
//   - xRange: [0.1, 1] 처럼 1보다 작은(0 초과) 구간. 여기서 도막 폭발이 보인다.
// 막대·칼금은 SVG로 직접 그린다. 그래프만 Mafs를 유지한다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderDivLt1(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_div_lt1 디버그]';
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

  // 이 항목은 1보다 작은 수로 자르는 구간을 본다. xRange가 안 오면 [0.1, 1] 기본.
  const xRange = toRange(v.xRange, [0.1, 1]);
  const dMin = Math.max(0.05, xRange[0]); // d는 0보다 커야 자르기가 성립
  const dMax = Math.min(1, xRange[1]);    // 이 단계는 1 이하만(1보다 크면 div1의 영역)
  const yRange = toRange(v.yRange, [0, 12]); // 도막 개수 1/d 는 d=0.1일 때 10까지 치솟음

  const defaultD = Math.min(dMax, Math.max(dMin, 0.5));
  const d = sharedXByLog?.[logIdx] ?? defaultD;
  const setD = (val) => {
    const clamped = Math.min(dMax, Math.max(dMin, val));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  let pieceCount; // 도막 개수 = 1/d
  try { pieceCount = compiled.evaluate({ x: d }); } catch (e) { pieceCount = 1 / d; }
  const nPieces = Math.max(1, Math.round(pieceCount));

  // SVG 막대 캔버스
  const SVG_W = 300, SVG_H = 70, PAD = 10;
  const barW = SVG_W - PAD * 2, barH = 34, barY = 18;
  // 도막 경계 칼금: 막대를 nPieces개로 나눈 위치들
  const cutXs = [];
  for (let i = 1; i < nPieces; i++) {
    cutXs.push(PAD + (barW * i) / nPieces);
  }
  // 도막마다 살짝 색을 번갈아 칠해 "개수"가 눈에 들어오게
  const pieceRects = [];
  for (let i = 0; i < nPieces; i++) {
    const x = PAD + (barW * i) / nPieces;
    const w = barW / nPieces;
    pieceRects.push(
      <rect key={i} x={x} y={barY} width={w} height={barH}
        fill={i % 2 === 0 ? '#e8a13a' : '#f0c070'} stroke="#b5701a" strokeWidth="0.8" />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* ===== 도형 장치 (2파트: 슬라이더 + 막대자르기) ===== */}
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {/* 파트 A — 슬라이더 (자르는 크기 d, 1 이하) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px' }}>
            <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
              얼마나 작게 자를까? (자르는 크기)
            </div>
            <input
              type="range"
              min={dMin}
              max={dMax}
              step={0.05}
              value={d}
              onChange={(e) => setD(parseFloat(e.target.value))}
              style={{ width: '200px' }}
            />
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#b5701a', marginTop: '4px' }}>
              자르는 크기 {d.toFixed(2)}
            </div>
          </div>
          {/* 파트 B — 막대 + 도막 칼금 */}
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {pieceRects}
            {/* 도막 경계 칼금(진하게) */}
            {cutXs.map((cx, i) => (
              <line key={i} x1={cx} y1={barY - 4} x2={cx} y2={barY + barH + 4} stroke="#7a4a10" strokeWidth="1.5" />
            ))}
            {/* 막대 바깥 테두리 */}
            <rect x={PAD} y={barY} width={barW} height={barH} fill="none" stroke="#7a4a10" strokeWidth="1.5" />
          </svg>
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          작게 자를수록(자르는 크기가 작아질수록) 도막 <b>개수는 늘어납니다</b> · 지금 <b>{nPieces}도막</b>
        </div>
      </div>

      {/* ===== 그래프 (1/x, x<1 구간, 도형과 연동) ===== */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, dMax], y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX
            y={(x) => {
              if (x <= 0) return NaN;
              try { return compiled.evaluate({ x }); } catch (e) { return NaN; }
            }}
            color={Theme.blue}
          />
          <MovablePoint
            point={[d, Number.isFinite(pieceCount) ? pieceCount : 0]}
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
          가로 = 자르는 크기, 세로 = 도막 개수 · 자르는 크기가 작아질수록 곡선이 위로 치솟습니다(개수 늘어남)
        </div>
      </div>
    </div>
  );
}
