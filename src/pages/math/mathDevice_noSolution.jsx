// ===========================================================
// no:"11-7" ★ "겹침이 없으면 해가 없다"
// x = 두 원 중심거리(d), y = 동시만족 가능 여부(1=가능, 0=불가능). 이진 계단(단일 점프).
//
// [수정 요지 — 인터랙션 복구]
//   기존: 원을 HTML div 오버레이(pointerEvents:'none')로 그리고 드래그점을
//     color="transparent"로 숨겨 잡을 요소가 전혀 없었다. 좌표계도 어긋났다.
//   수정: 원을 Mafs Circle로 좌표계 안에 그리고, 이동 원 중심에 빨간 드래그점을 노출.
//     라벨은 Mafs 밖 텍스트로 표시. 슬라이더 병행.
//
// [도형] Mafs: 조건1 원(초록, 고정) + 조건2 원(주황, 드래그) + 빨간 드래그점.
// [그래프] x=중심거리, y=가능(1)/불가능(0). 이진 계단.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Circle, Theme, MovablePoint } from 'mafs';

const R = 1.7;
const X_RANGE = [-6, 6], Y_RANGE = [-3, 3];

export function renderNoSolution(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const cxA = -3.2;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? -0.3;
  const setCxB = (x) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(6, Math.max(-6, x)) }
  }));
  const d = Math.abs(cxB - cxA);
  const possible = d < 2 * R ? 1 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>빨간 점</b>을 끌어 두 원을 떨어뜨려보세요 — 동시 만족이 가능할까요?
        </div>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={220}>
          <Circle center={[cxA, 0]} radius={R} color={Theme.green} />
          <Circle center={[cxB, 0]} radius={R} color={Theme.orange} />
          <Point x={cxA} y={0} color={Theme.green} />
          <MovablePoint
            point={[cxB, 0]}
            constrain={(pos) => [Math.min(6, Math.max(-6, pos[0])), 0]}
            color={Theme.red}
            onMove={(pos) => setCxB(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          <span style={{ color: '#3b6d11', fontWeight: 'bold' }}>초록=조건1</span>
          {' · '}
          <span style={{ color: '#b5701a', fontWeight: 'bold' }}>주황=조건2</span>
          {' · 중심거리 '}<b>{d.toFixed(2)}</b>
        </div>
        <div style={{
          fontSize: '13px', textAlign: 'center', fontWeight: 'bold',
          color: possible ? '#2e7d32' : '#c0392b'
        }}>
          {possible ? '겹칩니다 — 동시 만족 가능(해 있음)' : '떨어졌습니다 — 동시 만족 불가(해 없음)'}
        </div>
        <input type="range" min={-6} max={6} step={0.1} value={cxB}
          onChange={(e) => setCxB(parseFloat(e.target.value))}
          style={{ width: '90%', display: 'block', margin: '4px auto 0' }} />
      </div>

      {/* 그래프: 이진 계단(참/거짓) */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 8], y: [-0.5, 1.5] }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[0, 1]} point2={[2 * R, 1]} color={Theme.green} />
          <Line.Segment point1={[2 * R, 0]} point2={[8, 0]} color={Theme.red} />
          <Point x={d} y={possible} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=중심거리, 세로=동시만족 가능(1)/불가능(0) — <b>딱 한 번 뚝 떨어지는 계단</b>입니다
        </div>
      </div>
    </div>
  );
}
