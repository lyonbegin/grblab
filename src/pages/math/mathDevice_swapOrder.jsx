// ===========================================================
// no:"9-3" "순위가 뒤바뀐다" (부등식=위/아래의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 사용량 x 슬라이더
//   - 결과도형: 두 요금 막대 — 처음엔 A가 큰데 밀다 보면 B가 커지는 순위 반전
//   - 그래프: 두 선 교점 전엔 A가 위, 후엔 B가 위
//   sharedXByLog[logIdx] = { x }.
//
// [핵심] 항상 A가 큰 게 아니다 — 어느 지점을 지나면 순위가 뒤바뀐다(직관 배신).
// [모델 필드] visual.curves 2개(A,B, 서로 교차하는 직선) 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderSwapOrder(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_swapOrder 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 2) { console.log(`${DEBUG} 중단: curves 2개 필요`); return null; }
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
  const winner = ya > yb ? 'A' : yb > ya ? 'B' : '같음';
  const winColor = ya > yb ? '#2f5a99' : yb > ya ? '#b5701a' : '#7b3fa0';

  const W = 200, H = 160, base = 140, barW = 46;
  const scale = (H - 30) / (yRange[1] || 16);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          사용량 x를 조금씩 밀며 어느 쪽이 큰지 지켜보세요
        </div>
        <input type="range" min={xRange[0]} max={xRange[1]} step={0.5} value={x}
          onChange={(e) => setX(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '4px auto 0' }}>
          <line x1={0} y1={base} x2={W} y2={base} stroke="#999" strokeWidth="1.5" />
          <rect x={40} y={base - (Number.isFinite(ya) ? ya : 0) * scale} width={barW} height={(Number.isFinite(ya) ? ya : 0) * scale} fill="#5a86c4" stroke="#2f5a99" strokeWidth="1.5" />
          <rect x={114} y={base - (Number.isFinite(yb) ? yb : 0) * scale} width={barW} height={(Number.isFinite(yb) ? yb : 0) * scale} fill="#e8a13a" stroke="#b5701a" strokeWidth="1.5" />
          <text x={63} y={base + 15} fontSize="12" textAnchor="middle" fill="#2f5a99">A</text>
          <text x={137} y={base + 15} fontSize="12" textAnchor="middle" fill="#b5701a">B</text>
        </svg>
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: winColor }}>
          지금 (x={x}) 은 {winner === '같음' ? '둘이 같습니다 (경계!)' : `${winner}가 더 큽니다`}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(t) => { try { return A.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.blue} />
          <Plot.OfX y={(t) => { try { return B.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.orange} />
          <Line.Segment point1={[x, 0]} point2={[x, Math.max(Number.isFinite(ya) ? ya : 0, Number.isFinite(yb) ? yb : 0)]} color="#bbb" />
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
          "언제나 A가 크다"는 <b>틀렸습니다</b> — 어떤 지점을 지나면 순위가 뒤바뀝니다
        </div>
      </div>
    </div>
  );
}
