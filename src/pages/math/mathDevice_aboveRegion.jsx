// ===========================================================
// no:"9-6" ★ "위인 구간이 부등식의 해다" (부등식=위/아래의 핵심개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 사용량 x 슬라이더
//   - 결과도형: 두 물기둥 중 어느 게 높은지 실시간 표시
//   - 그래프: 두 선을 겹쳐 그리고, A가 B보다 위인 x구간 전체를 음영으로 강조
//   sharedXByLog[logIdx] = { x }.
//
// [핵심] "A > B"의 해는 A선이 B선보다 위에 있는 x구간 전체다.
// [모델 필드] visual.curves 2개(A,B) 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderAboveRegion(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_aboveRegion 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 2) { console.log(`${DEBUG} 중단: curves 2개`); return null; }
  const A = safeCompile(curves[0].formula, curves[0].kind);
  const B = safeCompile(curves[1].formula, curves[1].kind);
  if (!A || !B) return null;

  const xRange = toRange(v.xRange, [0, 8]);
  const yRange = toRange(v.yRange, [0, 16]);
  const x = sharedXByLog?.[logIdx]?.x ?? xRange[0];
  const setX = (nx) => {
    const cx = Math.min(xRange[1], Math.max(xRange[0], nx));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), x: cx } }));
  };
  let ya, yb; try { ya = A.evaluate({ x }); } catch (e) { ya = NaN; }
  try { yb = B.evaluate({ x }); } catch (e) { yb = NaN; }
  const aAbove = ya > yb;

  // A가 B보다 위인 구간 경계(교점) 찾기
  const steps = 400;
  let cross = null, prevX = null, prevD = null;
  for (let i = 0; i <= steps; i++) {
    const xi = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    let d; try { d = A.evaluate({ x: xi }) - B.evaluate({ x: xi }); } catch (e) { d = NaN; }
    if (Number.isFinite(d) && prevD !== null && Number.isFinite(prevD) && (prevD < 0) !== (d < 0)) {
      const t = prevD / (prevD - d); cross = prevX + t * (xi - prevX); break;
    }
    prevX = xi; prevD = d;
  }
  // A가 위인 구간 [aLo, aHi] 결정(직선 가정: 교점 한쪽)
  let aLo = xRange[0], aHi = xRange[1];
  if (cross !== null) {
    // 교점 왼쪽/오른쪽 중 A가 위인 쪽
    const midLeft = (xRange[0] + cross) / 2;
    let dLeft; try { dLeft = A.evaluate({ x: midLeft }) - B.evaluate({ x: midLeft }); } catch (e) { dLeft = 0; }
    if (dLeft > 0) { aLo = xRange[0]; aHi = cross; } else { aLo = cross; aHi = xRange[1]; }
  }

  const W = 180, H = 150, base = 130, barW = 40;
  const scale = (H - 25) / (yRange[1] || 16);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          사용량 x를 밀며 A가 B보다 큰(위인) 구간을 찾으세요
        </div>
        <input type="range" min={xRange[0]} max={xRange[1]} step={0.5} value={x}
          onChange={(e) => setX(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '4px auto 0' }}>
          <line x1={0} y1={base} x2={W} y2={base} stroke="#999" strokeWidth="1.5" />
          <rect x={36} y={base - (Number.isFinite(ya) ? ya : 0) * scale} width={barW} height={(Number.isFinite(ya) ? ya : 0) * scale} fill="#5a86c4" stroke="#2f5a99" strokeWidth="1.5" />
          <rect x={104} y={base - (Number.isFinite(yb) ? yb : 0) * scale} width={barW} height={(Number.isFinite(yb) ? yb : 0) * scale} fill="#e8a13a" stroke="#b5701a" strokeWidth="1.5" />
          <text x={56} y={base + 14} fontSize="11" textAnchor="middle" fill="#2f5a99">A</text>
          <text x={124} y={base + 14} fontSize="11" textAnchor="middle" fill="#b5701a">B</text>
        </svg>
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: aAbove ? '#2e7d32' : '#c0392b' }}>
          지금 (x={x}) 은 {aAbove ? 'A가 위 (A>B, 해에 포함!)' : 'B가 위 (A<B, 해 아님)'}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          {/* A가 위인 구간 음영(초록 막대들) */}
          <Plot.OfX y={(t) => (t >= aLo && t <= aHi) ? yRange[1] : NaN} color="#c8e6c9" style="dashed" />
          <Plot.OfX y={(t) => { try { return A.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.blue} />
          <Plot.OfX y={(t) => { try { return B.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.orange} />
          {cross !== null && <Line.Segment point1={[cross, 0]} point2={[cross, yRange[1]]} color={Theme.green} />}
          <MovablePoint
            point={[x, Number.isFinite(ya) ? ya : 0]}
            constrain={(pos) => {
              const cx = Math.min(xRange[1], Math.max(xRange[0], pos[0]));
              let y; try { y = A.evaluate({ x: cx }); } catch (e) { y = NaN; }
              return [cx, Number.isFinite(y) ? y : pos[1]];
            }}
            color={Theme.red}
            onMove={(pos) => setX(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          A선이 B선보다 <b>위에 있는 x구간 전체</b>가 "A&gt;B"의 해입니다 (초록 경계 기준)
        </div>
      </div>
    </div>
  );
}
