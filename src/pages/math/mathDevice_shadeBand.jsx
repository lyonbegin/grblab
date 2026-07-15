// ===========================================================
// no:"11-2" "그래프에서 조건을 색칠한다" — mafs_area 스타일, 드래그로 조작.
// 슬라이더 대신 음영 경계 자체를 MovablePoint로 만들어 손가락/마우스로 직접 끈다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
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
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>초록 경계점</b>을 손가락으로 좌우로 끌어보세요 — 색칠 범위가 함께 움직입니다
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={280}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => { try { return f.evaluate({ x }); } catch (e) { return NaN; } }} color={Theme.blue} />
          <Plot.Inequality
            y={{ '<=': (x) => (x >= xRange[0] && x <= shadeMax) ? yRange[1] : 0, '>': (x) => (x >= xRange[0] && x <= shadeMax) ? 0 : 1e9 }}
            color={Theme.green}
          />
          {/* 경계점을 직접 드래그 */}
          <MovablePoint
            point={[shadeMax, yRange[0] + (yRange[1] - yRange[0]) * 0.08]}
            constrain={(pos) => [Math.min(xRange[1], Math.max(xRange[0], pos[0])), yRange[0] + (yRange[1] - yRange[0]) * 0.08]}
            color={Theme.green}
            onMove={(pos) => setShadeMax(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          조건을 만족하는 x가 <b>색칠된 구간(음영)</b>으로 보입니다
        </div>
      </div>
    </div>
  );
}
