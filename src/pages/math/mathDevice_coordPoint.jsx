// ===========================================================
// no:"8-1" "점 = 가로·세로 두 수" (방정식 해=교점의 선행개념)
//
// [규칙] 도형 부분(조작 + 결과도형) + 그래프 부분 + 셋 다 인터랙티브 연동.
//   - 조작: 가로 슬라이더 + 세로 슬라이더 2개
//   - 결과도형: 격자판 위에서 점 하나가 (가로, 세로)로 실시간 이동
//   - 그래프: 좌표평면에 같은 점이 찍힘 (도형의 점과 동일 위치)
//   셋이 sharedXByLog[logIdx] = {gx, gy} 하나로 연동된다.
//
// [핵심] 두 수를 정하면 자리 하나가 딱 정해진다.
// [모델 필드] visual.kind === 'mafs_function'만 확인(formula는 안 씀).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Point, Line, Theme, MovablePoint } from 'mafs';

export function renderCoordPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_coordPoint 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }

  const GMAX = 6; // 격자 0~6
  const st = sharedXByLog?.[logIdx] || {};
  const gx = st.gx ?? 3;
  const gy = st.gy ?? 2;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { gx, gy, ...(prev?.[logIdx] || {}), ...p } }));

  // 결과도형(격자판) SVG
  const CELL = 34, PAD = 20;
  const W = PAD * 2 + GMAX * CELL, H = PAD * 2 + GMAX * CELL;
  const sx = (x) => PAD + x * CELL;
  const sy = (y) => H - PAD - y * CELL; // 아래가 0

  const gridLines = [];
  for (let i = 0; i <= GMAX; i++) {
    gridLines.push(<line key={`v${i}`} x1={sx(i)} y1={sy(0)} x2={sx(i)} y2={sy(GMAX)} stroke="#e0d8c4" strokeWidth="1" />);
    gridLines.push(<line key={`h${i}`} x1={sx(0)} y1={sy(i)} x2={sx(GMAX)} y2={sy(i)} stroke="#e0d8c4" strokeWidth="1" />);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* ── 도형 부분: 조작(슬라이더 2개) + 결과도형(격자판 위 점) ── */}
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>가로 (오른쪽으로)</div>
            <input type="range" min={0} max={GMAX} step={1} value={gx}
              onChange={(e) => patch({ gx: parseInt(e.target.value, 10) })} style={{ width: '140px' }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b5701a' }}>가로 = {gx}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>세로 (위로)</div>
            <input type="range" min={0} max={GMAX} step={1} value={gy}
              onChange={(e) => patch({ gy: parseInt(e.target.value, 10) })} style={{ width: '140px' }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2f5a99' }}>세로 = {gy}</div>
          </div>
        </div>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto' }}>
          {gridLines}
          {/* 가로·세로 안내선 */}
          <line x1={sx(0)} y1={sy(gy)} x2={sx(gx)} y2={sy(gy)} stroke="#2f5a99" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1={sx(gx)} y1={sy(0)} x2={sx(gx)} y2={sy(gy)} stroke="#b5701a" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* 점 */}
          <circle cx={sx(gx)} cy={sy(gy)} r="7" fill="#d64545" stroke="#fff" strokeWidth="2" />
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '4px' }}>
          가로 {gx}칸, 세로 {gy}칸 → 점의 자리는 <b>({gx}, {gy})</b> 하나로 정해집니다
        </div>
      </div>

      {/* ── 그래프 부분: 같은 점을 좌표평면에 ── */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, GMAX + 1], y: [-1, GMAX + 1] }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          <MovablePoint
            point={[gx, gy]}
            constrain={(pos) => [
              Math.round(Math.min(GMAX, Math.max(0, pos[0]))),
              Math.round(Math.min(GMAX, Math.max(0, pos[1])))
            ]}
            color={Theme.red}
            onMove={(pos) => patch({ gx: Math.round(Math.min(GMAX, Math.max(0, pos[0]))), gy: Math.round(Math.min(GMAX, Math.max(0, pos[1]))) })}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          그래프의 점 = 격자판의 점. 가로·세로 두 수가 자리 하나를 정합니다. (점을 직접 끌어도 됩니다)
        </div>
      </div>
    </div>
  );
}
