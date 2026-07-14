// ===========================================================
// no:"10-5" "그릇을 위아래로 옮길 수 있다" (판별식 D의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 상하 슬라이더 (k)
//   - 결과도형: 그릇 전체가 통째로 위/아래로 이동 (모양은 그대로)
//   - 그래프: y=x^2+k 가 위아래로 평행이동
//   sharedXByLog[logIdx] = { k }.
//
// [핵심] 포물선을 통째로 위아래로 옮겨도 모양은 같다 — 판별식(담그기)의 준비.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderTranslate(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_translate 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-6, 10]);
  const k = sharedXByLog?.[logIdx]?.k ?? 0;
  const setK = (nk) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), k: Math.min(4, Math.max(-4, nk)) } }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          그릇을 통째로 위아래로 옮겨보세요 (모양은 그대로!) · 이동 = {k}
        </div>
        <input type="range" min={-4} max={4} step={0.5} value={k}
          onChange={(e) => setK(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => x * x + k} color={Theme.blue} />
          {/* 꼭짓점 표시(이동 확인용) */}
          <Point x={0} y={k} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          위아래로 옮겨도 <b>그릇 모양은 똑같습니다</b> — 꼭짓점만 함께 오르내립니다
        </div>
      </div>
    </div>
  );
}
