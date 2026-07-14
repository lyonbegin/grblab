// ===========================================================
// no:"10-4" "그릇의 가장 낮은 점 = 꼭짓점" (판별식 D의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 꼭짓점 좌우 슬라이더 (h)
//   - 결과도형: 그릇의 바닥(가장 낮은 점)에 표시가 붙어 좌우로 이동
//   - 그래프: y=(x-h)^2 의 꼭짓점이 이동
//   sharedXByLog[logIdx] = { h }.
//
// [핵심] 포물선에는 가장 낮은(또는 높은) 딱 한 점, 꼭짓점이 있다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme, MovablePoint } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderVertex(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_vertex 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const xRange = toRange(v.xRange, [-5, 5]);
  const yRange = toRange(v.yRange, [-1, 10]);
  const h = sharedXByLog?.[logIdx]?.h ?? 0;
  const setH = (nh) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), h: Math.min(3, Math.max(-3, nh)) } }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          그릇을 좌우로 옮겨보세요 — 가장 낮은 점(바닥)이 함께 움직입니다
        </div>
        <input type="range" min={-3} max={3} step={0.5} value={h}
          onChange={(e) => setH(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#b5701a', marginTop: '4px' }}>
          바닥(꼭짓점) 위치 = {h}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={250}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => (x - h) * (x - h)} color={Theme.blue} />
          {/* 꼭짓점(가장 낮은 점) */}
          <MovablePoint
            point={[h, 0]}
            constrain={(pos) => [Math.min(3, Math.max(-3, pos[0])), 0]}
            color={Theme.red}
            onMove={(pos) => setH(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          빨간 점이 <b>꼭짓점(가장 낮은 점)</b> — 포물선에 딱 하나뿐입니다
        </div>
      </div>
    </div>
  );
}
