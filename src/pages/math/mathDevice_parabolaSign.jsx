// ===========================================================
// no:"10-2" "그릇은 위로도 아래로도 열린다" (판별식 D의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: "위로 열림 / 아래로 열림" 토글 (a의 부호)
//   - 결과도형: 그릇이 뒤집혀 엎어진 그릇이 됨
//   - 그래프: y = ±a*x^2 이 위/아래로 뒤집힘
//   sharedXByLog[logIdx] = { up }.
//
// [핵심] a가 양수면 위로 열린 그릇, 음수면 아래로 엎어진 그릇.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderParabolaSign(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_parabolaSign 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-8, 8]);
  const up = sharedXByLog?.[logIdx]?.up ?? true;
  const setUp = (u) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), up: u } }));

  const W = 200, H = 120, cx = 100;
  const bowl = up
    ? `M 30 30 Q 100 150 170 30`   // 위로 열림
    : `M 30 90 Q 100 -30 170 90`;  // 아래로 엎어짐

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '4px' }}>
          <button type="button" onClick={() => setUp(true)}
            style={{ padding: '5px 14px', borderRadius: '6px', cursor: 'pointer',
              border: up ? '2px solid #2f5a99' : '1px solid #ccc', background: up ? '#d0e2f5' : '#fff', fontWeight: up ? 'bold' : 'normal' }}>
            위로 열림 (a &gt; 0)
          </button>
          <button type="button" onClick={() => setUp(false)}
            style={{ padding: '5px 14px', borderRadius: '6px', cursor: 'pointer',
              border: !up ? '2px solid #b5701a' : '1px solid #ccc', background: !up ? '#f5e2d0' : '#fff', fontWeight: !up ? 'bold' : 'normal' }}>
            아래로 엎어짐 (a &lt; 0)
          </button>
        </div>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
          <path d={bowl} fill="none" stroke={up ? '#2f5a99' : '#b5701a'} strokeWidth="3" />
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          {up ? '위로 열린 그릇 — 바닥이 가장 낮음' : '아래로 엎어진 그릇 — 꼭대기가 가장 높음'}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={240}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => (up ? 1 : -1) * x * x} color={up ? Theme.blue : Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          앞의 수(a) 부호가 <b>열리는 방향</b>을 정합니다 — 양수는 위, 음수는 아래
        </div>
      </div>
    </div>
  );
}
