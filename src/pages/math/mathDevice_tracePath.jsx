// ===========================================================
// no:"8-4" "점의 자취" (방정식 해=교점의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: x를 천천히 쭉 미는 스캔 슬라이더
//   - 결과도형: 점이 지나간 자리에 발자국(작은 점들)이 남는다
//   - 그래프: 그 발자국이 모여 연속된 선이 드러난다
//   sharedXByLog[logIdx] = { scan } (0~1, 얼마나 훑었나).
//
// [핵심] 점들의 발자국이 곧 그래프다.
// [모델 필드] visual.curves[0].formula 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderTracePath(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_tracePath 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const c0 = curves[0];
  const compiled = safeCompile(c0.formula, c0.kind);
  if (!compiled) return null;

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [-1, 13]);
  const scan = sharedXByLog?.[logIdx]?.scan ?? 0.15; // 0~1
  const setScan = (s) => {
    const cs = Math.min(1, Math.max(0, s));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), scan: cs } }));
  };

  const currentX = xRange[0] + (xRange[1] - xRange[0]) * scan;
  let currentY; try { currentY = compiled.evaluate({ x: currentX }); } catch (e) { currentY = NaN; }

  // 지나온 발자국 점들
  const footprints = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    if (t > scan) break;
    const xi = xRange[0] + (xRange[1] - xRange[0]) * t;
    let yi; try { yi = compiled.evaluate({ x: xi }); } catch (e) { continue; }
    if (Number.isFinite(yi)) footprints.push([xi, yi]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          점을 왼쪽부터 오른쪽으로 천천히 밀어보세요 (스캔)
        </div>
        <input type="range" min={0} max={1} step={0.02} value={scan}
          onChange={(e) => setScan(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '4px' }}>
          지금 점: (약 {currentX.toFixed(1)}, {Number.isFinite(currentY) ? currentY.toFixed(1) : '?'}) · 지나온 발자국 {footprints.length}개
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          {/* 발자국들 */}
          {footprints.map(([px, py], i) => <Point key={i} x={px} y={py} color={Theme.blue} />)}
          {/* 현재 움직이는 점(크게, 빨강) */}
          {Number.isFinite(currentY) && <Point x={currentX} y={currentY} color={Theme.red} />}
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          발자국이 촘촘히 모이면 <b>끊김 없는 선</b>이 됩니다 — 이 자취가 곧 그래프입니다
        </div>
      </div>
    </div>
  );
}
