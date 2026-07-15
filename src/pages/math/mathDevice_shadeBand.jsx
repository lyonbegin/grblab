// ===========================================================
// no:"11-2" "그래프에서 조건을 색칠한다" — mafs_area 스타일 재구성.
// 기존 renderMafsArea(Plot.OfX + Plot.Inequality 음영)의 시각언어를 그대로 쓰되,
// shadeXMax를 슬라이더로 조절해 음영 범위가 실시간으로 넓어지고 좁아지게 한다.
// [조작] 색칠 오른쪽 경계 슬라이더 [결과도형] 진짜 Plot.Inequality 음영
// [그래프] 같은 화면(장치=그래프 동일 — mafs_area는 원래 정적이라 장치를 그 위에 얹음)
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderShadeBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const f = safeCompile(curves[0].formula, curves[0].kind);
  if (!f) return null;

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-2, 12]);
  const shadeMax = sharedXByLog?.[logIdx]?.shadeMax ?? 0;
  const setShadeMax = (s) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), shadeMax: Math.min(xRange[1], Math.max(xRange[0], s)) } }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '8px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          색칠 경계를 밀어보세요 (여기까지가 조건을 만족하는 x)
        </div>
        <input type="range" min={xRange[0]} max={xRange[1]} step={0.2} value={shadeMax}
          onChange={(e) => setShadeMax(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => { try { return f.evaluate({ x }); } catch (e) { return NaN; } }} color={Theme.blue} />
          <Plot.Inequality
            y={{ '<=': (x) => (x >= xRange[0] && x <= shadeMax) ? yRange[1] : 0, '>': (x) => (x >= xRange[0] && x <= shadeMax) ? 0 : 1e9 }}
            color={Theme.green}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          조건을 만족하는 x가 <b>색칠된 구간(음영)</b>으로 보입니다
        </div>
      </div>
    </div>
  );
}
