// ===========================================================
// no:"9-1" "대소 — 어느 쪽이 큰가" (부등식=위/아래의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 두 값 A, B 슬라이더
//   - 결과도형: 두 공(또는 막대)의 크기가 실시간 비교되고 큰 쪽에 표시
//   - 그래프: 수직선 위에 A, B 두 점이 찍혀 오른쪽에 있는 게 큰 값
//   sharedXByLog[logIdx] = { a, b }.
//
// [핵심] 두 수는 크거나, 작거나, 같다 — 셋 중 하나.
// [모델 필드] visual.kind === 'mafs_function'만 확인.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Point, Line, Theme } from 'mafs';

export function renderCompare(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_compare 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const st = sharedXByLog?.[logIdx] || {};
  const a = st.a ?? 3;
  const b = st.b ?? 5;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { a, b, ...(prev?.[logIdx] || {}), ...p } }));

  const bigger = a > b ? 'A' : b > a ? 'B' : '같음';
  const relColor = a > b ? '#2f5a99' : b > a ? '#b5701a' : '#7b3fa0';

  // 결과도형: 두 원 크기 비교
  const W = 220, H = 130;
  const rA = 12 + a * 5, rB = 12 + b * 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>A 값</div>
            <input type="range" min={0} max={10} step={1} value={a}
              onChange={(e) => patch({ a: parseInt(e.target.value, 10) })} style={{ width: '120px' }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2f5a99' }}>A = {a}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>B 값</div>
            <input type="range" min={0} max={10} step={1} value={b}
              onChange={(e) => patch({ b: parseInt(e.target.value, 10) })} style={{ width: '120px' }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b5701a' }}>B = {b}</div>
          </div>
        </div>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '6px auto 0' }}>
          <circle cx={65} cy={70} r={rA} fill="#5a86c4" stroke="#2f5a99" strokeWidth="1.5" />
          <circle cx={160} cy={70} r={rB} fill="#e8a13a" stroke="#b5701a" strokeWidth="1.5" />
          <text x={65} y={120} fontSize="12" textAnchor="middle" fill="#2f5a99">A</text>
          <text x={160} y={120} fontSize="12" textAnchor="middle" fill="#b5701a">B</text>
        </svg>
        <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: relColor }}>
          {bigger === '같음' ? 'A와 B가 같습니다' : `${bigger}가 더 큽니다`}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, 11], y: [-2, 2] }} preserveAspectRatio={false} height={140}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          <Point x={a} y={0} color={Theme.blue} />
          <Point x={b} y={0} color={Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          수직선에서 <b>오른쪽에 있는 수가 더 큽니다</b> — 두 수는 크거나·작거나·같거나 셋 중 하나
        </div>
      </div>
    </div>
  );
}
