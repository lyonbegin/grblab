// ===========================================================
// no:"11-7" ★ "겹침이 없으면 해가 없다" (연립부등식의 핵심개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 두 조건의 기준선을 서로 어긋나게 미는 슬라이더
//   - 결과도형: 겹침이 사라지는 순간 "해 없음" 경고가 켜짐
//   - 그래프: 두 조건 구간이 서로 떨어져 음영이 완전히 사라짐
//   sharedXByLog[logIdx] = { l1, l2 }.
//
// [핵심] 각 조건은 만족하는 값이 있어도, 동시에 만족하는 값은 없을 수 있다.
// [모델 필드] visual.curves 2개 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderNoSolution(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_noSolution 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 2) return null;
  const f1 = safeCompile(curves[0].formula, curves[0].kind);
  const f2 = safeCompile(curves[1].formula, curves[1].kind);
  if (!f1 || !f2) return null;

  const xRange = toRange(v.xRange, [-5, 5]);
  const yRange = toRange(v.yRange, [-2, 12]);
  const st = sharedXByLog?.[logIdx] || {};
  const l1 = st.l1 ?? 3;
  const l2 = st.l2 ?? 3;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { l1, l2, ...(prev?.[logIdx] || {}), ...p } }));

  const ok1 = (x) => { let y; try { y = f1.evaluate({ x }); } catch (e) { return false; } return Number.isFinite(y) && y < l1; };
  const ok2 = (x) => { let y; try { y = f2.evaluate({ x }); } catch (e) { return false; } return Number.isFinite(y) && y < l2; };

  const steps = 300;
  let c1 = 0, c2 = 0, cBoth = 0;
  for (let i = 0; i <= steps; i++) {
    const x = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    const a = ok1(x), b = ok2(x);
    if (a) c1++; if (b) c2++; if (a && b) cBoth++;
  }
  const noSol = cBoth === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#5f5e5a', marginBottom: '4px' }}>
          두 조건을 서로 어긋나게 만들어보세요 — 겹침이 사라지면?
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: '#2f5a99' }}>조건1 기준</div>
            <input type="range" min={0} max={yRange[1]} step={0.5} value={l1}
              onChange={(e) => patch({ l1: parseFloat(e.target.value) })} style={{ width: '110px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: '#b5701a' }}>조건2 기준</div>
            <input type="range" min={0} max={yRange[1]} step={0.5} value={l2}
              onChange={(e) => patch({ l2: parseFloat(e.target.value) })} style={{ width: '110px' }} />
          </div>
        </div>
        {/* 상태 표시 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px', fontSize: '12px' }}>
          <div style={{ padding: '4px 10px', borderRadius: '5px', background: c1 > 0 ? '#d0e2f5' : '#eee', color: '#2f5a99' }}>
            조건1만: {c1 > 0 ? '있음' : '없음'}
          </div>
          <div style={{ padding: '4px 10px', borderRadius: '5px', background: c2 > 0 ? '#f5e2d0' : '#eee', color: '#b5701a' }}>
            조건2만: {c2 > 0 ? '있음' : '없음'}
          </div>
          <div style={{ padding: '4px 10px', borderRadius: '5px', fontWeight: 'bold',
            background: noSol ? '#f3d9d9' : '#d7ecd7', color: noSol ? '#c0392b' : '#2e7d32' }}>
            둘 다: {noSol ? '없음 (해 없음!)' : '있음'}
          </div>
        </div>
        {noSol && <div style={{ fontSize: '12px', color: '#c0392b', textAlign: 'center', marginTop: '4px' }}>
          각각은 만족하는 값이 있어도 <b>동시에는 하나도 없습니다</b>
        </div>}
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => (ok1(x) && ok2(x)) ? yRange[1] : NaN} color="#c8e6c9" style="dashed" />
          <Line.Segment point1={[xRange[0], l1]} point2={[xRange[1], l1]} color="#8fb0dd" />
          <Line.Segment point1={[xRange[0], l2]} point2={[xRange[1], l2]} color="#f0c070" />
          <Plot.OfX y={(x) => { try { return f1.evaluate({ x }); } catch (e) { return NaN; } }} color={Theme.blue} />
          <Plot.OfX y={(x) => { try { return f2.evaluate({ x }); } catch (e) { return NaN; } }} color={Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          겹치는 구간이 없으면 <b>연립부등식의 해는 없습니다</b>
        </div>
      </div>
    </div>
  );
}
