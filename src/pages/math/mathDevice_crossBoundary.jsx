// ===========================================================
// no:"9-7" ★ "교점이 대소가 뒤바뀌는 경계다" (부등식=위/아래의 핵심개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: x 슬라이더를 교점 좌우로 미세하게 밀기
//   - 결과도형: 교점 바로 왼쪽은 A가 위, 바로 오른쪽은 B가 위 — 딱 그 지점에서 뒤집힘
//   - 그래프: 교점에 세로 경계선. 좌우 색이 반대(A위/B위)로 갈림
//   sharedXByLog[logIdx] = { x }.
//
// [핵심] 두 선의 교점은 대소관계가 뒤바뀌는 '유일한 경계'다 — 부등식 해의 경계.
// [모델 필드] visual.curves 2개(교차하는 직선) 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderCrossBoundary(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_crossBoundary 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 2) return null;
  const A = safeCompile(curves[0].formula, curves[0].kind);
  const B = safeCompile(curves[1].formula, curves[1].kind);
  if (!A || !B) return null;

  const xRange = toRange(v.xRange, [0, 8]);
  const yRange = toRange(v.yRange, [0, 16]);
  const x = sharedXByLog?.[logIdx]?.x ?? (xRange[0] + xRange[1]) / 2;
  const setX = (nx) => {
    const cx = Math.min(xRange[1], Math.max(xRange[0], nx));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), x: cx } }));
  };

  // 교점 찾기
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

  let ya, yb; try { ya = A.evaluate({ x }); } catch (e) { ya = NaN; }
  try { yb = B.evaluate({ x }); } catch (e) { yb = NaN; }
  const side = cross === null ? '?' : (x < cross ? 'left' : x > cross ? 'right' : 'on');
  const aAbove = ya > yb;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          x를 교점 좌우로 밀어보세요 — 딱 그 지점에서 순위가 뒤집힙니다
        </div>
        <input type="range" min={xRange[0]} max={xRange[1]} step={0.25} value={x}
          onChange={(e) => setX(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        {/* 좌/경계/우 상태 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
          <div style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            background: side === 'left' ? '#d0e2f5' : '#f0eee8', color: '#2f5a99',
            outline: side === 'left' ? '2px solid #2f5a99' : 'none' }}>
            왼쪽: A가 위
          </div>
          <div style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            background: side === 'on' ? '#e5d5f0' : '#f0eee8', color: '#7b3fa0',
            outline: side === 'on' ? '2px solid #7b3fa0' : 'none' }}>
            경계: 딱 같음
          </div>
          <div style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            background: side === 'right' ? '#f5e2d0' : '#f0eee8', color: '#b5701a',
            outline: side === 'right' ? '2px solid #b5701a' : 'none' }}>
            오른쪽: B가 위
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          교점 {cross !== null ? `(x≈${cross.toFixed(1)})` : ''} 을 경계로 <b>순위가 뒤바뀝니다</b>
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(t) => { try { return A.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.blue} />
          <Plot.OfX y={(t) => { try { return B.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.orange} />
          {/* 교점 경계선 */}
          {cross !== null && <Line.Segment point1={[cross, 0]} point2={[cross, yRange[1]]} color={Theme.green} />}
          {cross !== null && (() => { let cy; try { cy = A.evaluate({ x: cross }); } catch (e) { cy = 0; } return <Point x={cross} y={Number.isFinite(cy) ? cy : 0} color={Theme.green} />; })()}
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
          교점은 <b>대소가 뒤바뀌는 단 하나의 경계</b> — 이래서 부등식 해가 교점을 기준으로 갈립니다
        </div>
      </div>
    </div>
  );
}
