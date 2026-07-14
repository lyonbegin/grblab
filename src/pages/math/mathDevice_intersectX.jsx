// ===========================================================
// no:"8-6" ★ "교점의 x = 방정식의 해" (방정식 해=교점의 핵심개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: x(사용량) 슬라이더
//   - 결과도형: 두 요금 막대(A/B)가 x에 따라 자라며, 높이가 딱 같아지는 순간을 찾는다
//   - 그래프: 두 직선의 교점 + 그 아래 가로축에 x값 강조 (답은 가로다, 높이가 아니다)
//   sharedXByLog[logIdx] = { x }.
//
// [핵심] 두 값이 같아지는 자리의 '가로(x)'가 방정식의 해다. 만난 '높이(y)'는 답이 아니다.
// [모델 필드] visual.curves 2개(A, B) 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderIntersectX(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_intersectX 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 2) { console.log(`${DEBUG} 중단: curves 2개 필요`); return null; }
  const A = safeCompile(curves[0].formula, curves[0].kind);
  const B = safeCompile(curves[1].formula, curves[1].kind);
  if (!A || !B) return null;

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [0, 14]);
  const x = sharedXByLog?.[logIdx]?.x ?? xRange[0];
  const setX = (nx) => {
    const cx = Math.min(xRange[1], Math.max(xRange[0], nx));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), x: cx } }));
  };
  let ya, yb; try { ya = A.evaluate({ x }); } catch (e) { ya = NaN; }
  try { yb = B.evaluate({ x }); } catch (e) { yb = NaN; }
  const matched = Number.isFinite(ya) && Number.isFinite(yb) && Math.abs(ya - yb) < 0.15;

  // 결과도형(두 막대) SVG
  const W = 200, H = 180, base = 150, barW = 46;
  const scale = (H - 30) / (yRange[1] || 14);
  const hA = Math.max(0, (Number.isFinite(ya) ? ya : 0) * scale);
  const hB = Math.max(0, (Number.isFinite(yb) ? yb : 0) * scale);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          사용량 x를 밀어 두 요금 막대의 <b>높이가 같아지는</b> 순간을 찾으세요
        </div>
        <input type="range" min={xRange[0]} max={xRange[1]} step={0.5} value={x}
          onChange={(e) => setX(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '4px auto 0' }}>
          <line x1={0} y1={base} x2={W} y2={base} stroke="#999" strokeWidth="1.5" />
          <rect x={40} y={base - hA} width={barW} height={hA} fill="#5a86c4" stroke="#2f5a99" strokeWidth="1.5" />
          <rect x={114} y={base - hB} width={barW} height={hB} fill="#e8a13a" stroke="#b5701a" strokeWidth="1.5" />
          <text x={63} y={base + 16} fontSize="12" textAnchor="middle" fill="#2f5a99">A={Number.isFinite(ya) ? ya : '?'}</text>
          <text x={137} y={base + 16} fontSize="12" textAnchor="middle" fill="#b5701a">B={Number.isFinite(yb) ? yb : '?'}</text>
          {matched && <text x={W / 2} y={16} fontSize="14" textAnchor="middle" fill="#2e7d32" fontWeight="bold">높이가 같아졌어요!</text>}
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          지금 사용량 x = <b>{x}</b> {matched ? '← 이때 두 요금이 같습니다!' : ''}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={280}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(t) => { try { return A.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.blue} />
          <Plot.OfX y={(t) => { try { return B.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.orange} />
          {/* 현재 x에서 세로 안내선 — "답은 가로다"를 강조 */}
          <Line.Segment point1={[x, 0]} point2={[x, Math.max(Number.isFinite(ya) ? ya : 0, Number.isFinite(yb) ? yb : 0)]}
            color={matched ? Theme.green : '#bbb'} />
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
          두 선이 만나는 곳에서 답은 <b>가로 자리(x = {x})</b>입니다 — 만난 높이가 아니라 그 아래 가로가 방정식의 해!
        </div>
      </div>
    </div>
  );
}
