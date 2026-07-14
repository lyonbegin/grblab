// ===========================================================
// no:"10-3" "제곱은 항상 0 이상이다" (판별식 D의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 값 슬라이더 (음수도 포함)
//   - 결과도형: 값이 음수여도 제곱한 막대는 항상 위로만 자란다(아래로 안 감)
//   - 그래프: y=x^2 곡선 위의 점 — x가 음수여도 y는 0 이상
//   sharedXByLog[logIdx] = { x }.
//
// [핵심] 어떤 수든 제곱하면 0보다 작아지지 않는다 — 판별식의 부호 판단의 뿌리.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderSquarePositive(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_squarePositive 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-2, 16]);
  const x = sharedXByLog?.[logIdx]?.x ?? -3;
  const setX = (nx) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), x: Math.min(4, Math.max(-4, nx)) } }));
  const sq = x * x;

  // 결과도형: 값 막대(음수면 아래) + 제곱 막대(항상 위)
  const W = 220, H = 170, mid = 90;
  const scale = 8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          값을 음수까지 밀어보세요 — 제곱하면 어떻게 되나요? (값 = {x})
        </div>
        <input type="range" min={-4} max={4} step={0.5} value={x}
          onChange={(e) => setX(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '4px auto 0' }}>
          <line x1={0} y1={mid} x2={W} y2={mid} stroke="#999" strokeWidth="1.5" />
          {/* 값 막대: 음수면 아래로 */}
          <rect x={45} y={x >= 0 ? mid - x * scale : mid} width={40} height={Math.abs(x) * scale}
            fill={x >= 0 ? '#5a86c4' : '#c0392b'} stroke="#333" strokeWidth="1" />
          <text x={65} y={mid + (x >= 0 ? 16 : -6)} fontSize="11" textAnchor="middle" fill="#333">값 {x}</text>
          {/* 제곱 막대: 항상 위 */}
          <rect x={135} y={mid - sq * scale} width={40} height={sq * scale}
            fill="#2e7d32" stroke="#333" strokeWidth="1" />
          <text x={155} y={mid + 16} fontSize="11" textAnchor="middle" fill="#2e7d32">제곱 {sq}</text>
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          값이 음수여도 <b>제곱은 항상 위(0 이상)</b>입니다
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={240}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(t) => t * t} color={Theme.green} />
          <MovablePoint
            point={[x, sq]}
            constrain={(pos) => { const cx = Math.min(4, Math.max(-4, pos[0])); return [cx, cx * cx]; }}
            color={Theme.red}
            onMove={(pos) => setX(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          제곱 그래프는 <b>x축 아래로 절대 안 내려갑니다</b> — 제곱은 0 이상
        </div>
      </div>
    </div>
  );
}
