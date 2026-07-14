// ===========================================================
// no:"8-3" "대입 = 점 찍기" (방정식 해=교점의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: x 슬라이더 하나
//   - 결과도형: x가 식의 빈칸에 쏙 들어가 y가 튀어나오는 대입 장면(빈칸 채우기)
//   - 그래프: 그 (x, y) 한 점이 선 위에 반짝 찍힘
//   sharedXByLog[logIdx] = { x }.
//
// [핵심] 값 하나 넣으면 점 하나가 정해진다.
// [모델 필드] visual.curves[0].formula 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderSubstitute(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_substitute 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const c0 = curves[0];
  const compiled = safeCompile(c0.formula, c0.kind);
  if (!compiled) return null;

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [-1, 13]);
  const x = sharedXByLog?.[logIdx]?.x ?? 2;
  const setX = (nx) => {
    const cx = Math.min(xRange[1], Math.max(xRange[0], nx));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), x: cx } }));
  };
  let y; try { y = compiled.evaluate({ x }); } catch (e) { y = NaN; }

  // formula의 x를 [x]로 시각적으로 바꿔 "빈칸에 넣기"를 보여준다
  const filled = c0.formula.replace(/x/g, `(${x})`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#5f5e5a' }}>넣을 값 x 고르기</span><br />
          <input type="range" min={xRange[0]} max={xRange[1]} step={1} value={x}
            onChange={(e) => setX(parseFloat(e.target.value))} style={{ width: '70%' }} />
        </div>
        {/* 대입 장면 */}
        <div style={{ textAlign: 'center', fontSize: '15px', color: '#333' }}>
          <span style={{ color: '#b5701a', fontWeight: 'bold' }}>x = {x}</span>
          <span style={{ margin: '0 8px' }}>를 넣으면</span>
          <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #ccc' }}>{filled}</span>
          <span style={{ margin: '0 8px' }}>=</span>
          <span style={{ color: '#2f5a99', fontWeight: 'bold', fontSize: '17px' }}>{Number.isFinite(y) ? y : '?'}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          값 x를 식의 빈칸에 넣으면 결과 y가 나옵니다 → 점 <b>({x}, {Number.isFinite(y) ? y : '?'})</b> 하나
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(t) => { try { return compiled.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.blue} />
          {/* 대입 위치 안내선 */}
          {Number.isFinite(y) && <Point x={x} y={y} color={Theme.red} />}
          <MovablePoint
            point={[x, Number.isFinite(y) ? y : 0]}
            constrain={(pos) => {
              const cx = Math.round(Math.min(xRange[1], Math.max(xRange[0], pos[0])));
              let ny; try { ny = compiled.evaluate({ x: cx }); } catch (e) { ny = NaN; }
              return [cx, Number.isFinite(ny) ? ny : pos[1]];
            }}
            color={Theme.red}
            onMove={(pos) => setX(Math.round(pos[0]))}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          넣은 값 하나가 선 위의 <b>점 하나</b>로 딱 정해집니다
        </div>
      </div>
    </div>
  );
}
