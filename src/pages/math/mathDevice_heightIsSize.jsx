// ===========================================================
// no:"9-2" "크다 = 위에 있다" (부등식=위/아래의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 두 값 슬라이더
//   - 결과도형: 두 물기둥 높이 — 값이 클수록 높이 올라감
//   - 그래프: 두 점의 y높이. 큰 값이 위에 있음을 확인
//   sharedXByLog[logIdx] = { a, b }.
//
// [핵심] "크다"를 "위에 있다"로 나타낸다 — 부등식을 그래프의 위/아래로 읽는 토대.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Point, Line, Theme } from 'mafs';

export function renderHeightIsSize(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_heightIsSize 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const st = sharedXByLog?.[logIdx] || {};
  const a = st.a ?? 4;
  const b = st.b ?? 7;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { a, b, ...(prev?.[logIdx] || {}), ...p } }));

  const higher = a > b ? 'A' : b > a ? 'B' : '같음';

  // 결과도형: 두 물기둥
  const W = 200, H = 170, base = 150, colW = 44;
  const scale = 13;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>A 물의 양</div>
            <input type="range" min={0} max={10} step={1} value={a}
              onChange={(e) => patch({ a: parseInt(e.target.value, 10) })} style={{ width: '120px' }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2f5a99' }}>A = {a}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>B 물의 양</div>
            <input type="range" min={0} max={10} step={1} value={b}
              onChange={(e) => patch({ b: parseInt(e.target.value, 10) })} style={{ width: '120px' }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b5701a' }}>B = {b}</div>
          </div>
        </div>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '4px auto 0' }}>
          <line x1={0} y1={base} x2={W} y2={base} stroke="#999" strokeWidth="1.5" />
          <rect x={45} y={base - a * scale} width={colW} height={a * scale} fill="#5a86c4" stroke="#2f5a99" strokeWidth="1.5" />
          <rect x={115} y={base - b * scale} width={colW} height={b * scale} fill="#e8a13a" stroke="#b5701a" strokeWidth="1.5" />
          <text x={67} y={base + 15} fontSize="12" textAnchor="middle" fill="#2f5a99">A</text>
          <text x={137} y={base + 15} fontSize="12" textAnchor="middle" fill="#b5701a">B</text>
        </svg>
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
          {higher === '같음' ? '높이가 같습니다' : `${higher}가 더 높습니다 = ${higher}가 더 큽니다`}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, 4], y: [-1, 11] }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          <Point x={1} y={a} color={Theme.blue} />
          <Point x={3} y={b} color={Theme.orange} />
          <Line.Segment point1={[1, 0]} point2={[1, a]} color="#5a86c4" />
          <Line.Segment point1={[3, 0]} point2={[3, b]} color="#e8a13a" />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          그래프에서도 <b>큰 값이 위에</b> 있습니다 — "크다"를 "위에 있다"로 봅니다
        </div>
      </div>
    </div>
  );
}
