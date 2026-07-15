// ===========================================================
// no:"11-2" "그래프에서 조건을 색칠한다" (연립부등식의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 기준선 높이 슬라이더
//   - 결과도형: 곡선이 기준선보다 아래인 x들이 띠로 켜짐
//   - 그래프: 곡선 + 기준선 + 만족하는 x구간 음영
//   sharedXByLog[logIdx] = { level }.
//
// [핵심] 부등식 조건을 그래프 위 x구간의 색칠(음영)로 나타낸다.
// [모델 필드] visual.curves[0].formula (곡선, 예 "x^2") 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderShadeBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_shadeBand 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const f = safeCompile(curves[0].formula, curves[0].kind);
  if (!f) return null;

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-2, 12]);
  const level = sharedXByLog?.[logIdx]?.level ?? 4;
  const setLevel = (l) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), level: Math.min(yRange[1], Math.max(0, l)) } }));

  // 곡선 < level 인 x구간(들)
  const steps = 300;
  const inside = [];
  for (let i = 0; i <= steps; i++) {
    const x = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    let y; try { y = f.evaluate({ x }); } catch (e) { y = NaN; }
    inside.push(Number.isFinite(y) && y < level);
  }
  // 구간 경계 찾기
  let lo = null, hi = null;
  for (let i = 0; i < inside.length; i++) {
    const x = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    if (inside[i]) { if (lo === null) lo = x; hi = x; }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          기준선 높이를 정하세요 — 곡선이 그보다 <b>낮은</b> 자리가 색칠됩니다 (기준 = {level})
        </div>
        <input type="range" min={0} max={yRange[1]} step={0.5} value={level}
          onChange={(e) => setLevel(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '4px' }}>
          {lo !== null ? `색칠된 구간: 약 ${lo.toFixed(1)} ~ ${hi.toFixed(1)}` : '색칠된 구간 없음'}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={250}>
          <Coordinates.Cartesian />
          {/* 음영: 조건 만족 x구간 */}
          <Plot.OfX y={(x) => { let y; try { y = f.evaluate({ x }); } catch (e) { return NaN; } return (Number.isFinite(y) && y < level) ? yRange[1] : NaN; }} color="#c8e0f5" style="dashed" />
          {/* 기준선 */}
          <Line.Segment point1={[xRange[0], level]} point2={[xRange[1], level]} color="#888" />
          <Plot.OfX y={(x) => { try { return f.evaluate({ x }); } catch (e) { return NaN; } }} color={Theme.blue} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          조건을 만족하는 x가 <b>색칠된 띠</b>로 보입니다
        </div>
      </div>
    </div>
  );
}
