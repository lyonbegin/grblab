// ===========================================================
// no:"11-6" ★ "두 조건 동시 만족은 겹친 구간뿐" (연립부등식의 핵심개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 두 조건의 기준선 높이 슬라이더 2개
//   - 결과도형: 조건1 만족 띠, 조건2 만족 띠, 그리고 겹친 띠(=답)
//   - 그래프: 두 곡선 + 두 기준선 + 겹친 x구간 음영
//   sharedXByLog[logIdx] = { l1, l2 }.
//
// [핵심] 두 부등식을 동시에 만족하는 x는 두 구간이 겹치는 부분뿐이다.
// [모델 필드] visual.curves 2개(두 조건 곡선) 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderBothConditions(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_bothConditions 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 2) { console.log(`${DEBUG} 중단: curves 2개 필요`); return null; }
  const f1 = safeCompile(curves[0].formula, curves[0].kind);
  const f2 = safeCompile(curves[1].formula, curves[1].kind);
  if (!f1 || !f2) return null;

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-2, 12]);
  const st = sharedXByLog?.[logIdx] || {};
  const l1 = st.l1 ?? 5;
  const l2 = st.l2 ?? 5;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { l1, l2, ...(prev?.[logIdx] || {}), ...p } }));

  const ok1 = (x) => { let y; try { y = f1.evaluate({ x }); } catch (e) { return false; } return Number.isFinite(y) && y < l1; };
  const ok2 = (x) => { let y; try { y = f2.evaluate({ x }); } catch (e) { return false; } return Number.isFinite(y) && y < l2; };

  // 각 구간·겹침 구간 범위 계산
  const steps = 300;
  let both = [];
  for (let i = 0; i <= steps; i++) {
    const x = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    if (ok1(x) && ok2(x)) both.push(x);
  }
  const bLo = both.length ? both[0] : null;
  const bHi = both.length ? both[both.length - 1] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#2f5a99' }}>조건1 기준</div>
            <input type="range" min={0} max={yRange[1]} step={0.5} value={l1}
              onChange={(e) => patch({ l1: parseFloat(e.target.value) })} style={{ width: '120px' }} />
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2f5a99' }}>{l1}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#b5701a' }}>조건2 기준</div>
            <input type="range" min={0} max={yRange[1]} step={0.5} value={l2}
              onChange={(e) => patch({ l2: parseFloat(e.target.value) })} style={{ width: '120px' }} />
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b5701a' }}>{l2}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', fontWeight: 'bold', color: bLo !== null ? '#2e7d32' : '#c0392b' }}>
          {bLo !== null ? `둘 다 만족: 약 ${bLo.toFixed(1)} ~ ${bHi.toFixed(1)}` : '둘 다 만족하는 곳이 없습니다'}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          {/* 겹친 구간만 음영 */}
          <Plot.OfX y={(x) => (ok1(x) && ok2(x)) ? yRange[1] : NaN} color="#c8e6c9" style="dashed" />
          <Line.Segment point1={[xRange[0], l1]} point2={[xRange[1], l1]} color="#8fb0dd" />
          <Line.Segment point1={[xRange[0], l2]} point2={[xRange[1], l2]} color="#f0c070" />
          <Plot.OfX y={(x) => { try { return f1.evaluate({ x }); } catch (e) { return NaN; } }} color={Theme.blue} />
          <Plot.OfX y={(x) => { try { return f2.evaluate({ x }); } catch (e) { return NaN; } }} color={Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          두 조건을 <b>동시에</b> 만족하는 x는 <b>겹친 구간뿐</b>입니다
        </div>
      </div>
    </div>
  );
}
