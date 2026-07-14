// ===========================================================
// no:"8-2" "식 하나 = 선 하나" (방정식 해=교점의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: x 슬라이더 (x를 여러 값으로 밀기)
//   - 결과도형: "계산기" 그림 — x가 들어가면 formula로 계산한 값이 나온다
//   - 그래프: 지금까지 뱉은 (x, 값) 점들이 찍히고, 슬라이더로 훑으면 선이 드러난다
//   sharedXByLog[logIdx] = { x } 로 연동.
//
// [핵심] 식이 뱉는 값들을 모으면 선이 된다.
// [모델 필드] visual.curves[0].formula (예: "2*x+1") 실제로 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderFormulaMachine(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_formulaMachine 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} 중단: kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) { console.log(`${DEBUG} 중단: formula 없음`); return null; }
  const c0 = curves[0];
  const compiled = safeCompile(c0.formula, c0.kind);
  if (!compiled) { console.log(`${DEBUG} 중단: 컴파일 실패 ${c0.formula}`); return null; }

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [-1, 13]);
  const x = sharedXByLog?.[logIdx]?.x ?? xRange[0];
  const setX = (nx) => {
    const cx = Math.min(xRange[1], Math.max(xRange[0], nx));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), x: cx } }));
  };
  let y; try { y = compiled.evaluate({ x }); } catch (e) { y = NaN; }

  // 슬라이더가 지금 위치까지 훑은 만큼만 선을 보여준다(자취가 드러나는 느낌)
  const revealTo = x;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 도형: 조작(x 슬라이더) + 결과도형(계산기) */}
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <input type="range" min={xRange[0]} max={xRange[1]} step={0.5} value={x}
            onChange={(e) => setX(parseFloat(e.target.value))} style={{ width: '70%' }} />
        </div>
        {/* 계산기 그림: [x] → (식) → [값] */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ padding: '8px 14px', background: '#fff', border: '2px solid #b5701a', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', color: '#b5701a' }}>
            x = {x}
          </div>
          <div style={{ fontSize: '20px', color: '#5f5e5a' }}>→</div>
          <div style={{ padding: '8px 14px', background: '#efe9db', border: '2px dashed #8a7f6a', borderRadius: '8px', fontSize: '14px', color: '#5f5e5a' }}>
            {c0.formula}
          </div>
          <div style={{ fontSize: '20px', color: '#5f5e5a' }}>→</div>
          <div style={{ padding: '8px 14px', background: '#fff', border: '2px solid #2f5a99', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', color: '#2f5a99' }}>
            값 = {Number.isFinite(y) ? y : '?'}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          x를 밀 때마다 계산기가 값 하나를 뱉습니다 → 그 (x, 값)이 아래 그래프에 점으로 찍힙니다
        </div>
      </div>

      {/* 그래프: 훑은 만큼 선이 드러남 + 현재 점 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          {/* 지금까지 훑은 구간만 선으로 */}
          <Plot.OfX y={(t) => {
            if (t > revealTo) return NaN;
            try { return compiled.evaluate({ x: t }); } catch (e) { return NaN; }
          }} color={Theme.blue} />
          <MovablePoint
            point={[x, Number.isFinite(y) ? y : 0]}
            constrain={(pos) => {
              const cx = Math.min(xRange[1], Math.max(xRange[0], pos[0]));
              let ny; try { ny = compiled.evaluate({ x: cx }); } catch (e) { ny = NaN; }
              return [cx, Number.isFinite(ny) ? ny : pos[1]];
            }}
            color={Theme.red}
            onMove={(pos) => setX(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          점들이 모이면 <b>하나의 선</b>이 됩니다 — 이 선이 곧 식 "{c0.formula}"입니다
        </div>
      </div>
    </div>
  );
}
