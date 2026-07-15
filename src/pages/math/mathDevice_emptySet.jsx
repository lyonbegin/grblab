// ===========================================================
// no:"11-5" "겹침이 없을 수도 있다"
// x = 두 구간 사이 밀린 정도(s, 정수 단계), y = 겹치는 정수값의 개수(계단함수).
// 11-1(직선)·11-3(종형)과 달리 여기는 정수 단위로 뚝뚝 떨어지는 진짜 계단(스텝)그래프.
// [도형] 두 구간(띠)을 직접 드래그해서 밀어보는 것 — MovablePoint로 한쪽 띠를 이동.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme, MovablePoint } from 'mafs';

const W = 6; // 각 띠의 폭(정수 개수)

export function renderEmptySet(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const s = sharedXByLog?.[logIdx]?.s ?? 2; // 두 번째 띠가 첫 번째 띠 기준 오른쪽으로 밀린 칸 수
  const setS = (ss) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), s: Math.min(8, Math.max(0, Math.round(ss))) } }));
  const overlap = Math.max(0, W - s);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px', position: 'relative' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          👉 <b>주황 띠</b>를 오른쪽으로 밀어 겹침을 없애보세요
        </div>
        <div style={{ position: 'relative', height: '60px' }}>
          <div style={{ position: 'absolute', left: '0%', width: `${(W / 14) * 100}%`, top: '10px', height: '18px', background: '#3b6d1155', border: '2px solid #3b6d11', borderRadius: '4px' }} />
          <div style={{ position: 'absolute', left: `${(s / 14) * 100}%`, width: `${(W / 14) * 100}%`, top: '32px', height: '18px', background: '#d85a3055', border: '2px solid #d85a30', borderRadius: '4px' }} />
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>겹치는 정수 개수: <b>{overlap}</b></div>
        <div style={{ position: 'absolute', inset: 0, opacity: 0 }}>
          <Mafs viewBox={{ x: [0, 14], y: [-1, 1] }} preserveAspectRatio={false} height={100}>
            <MovablePoint point={[s, 0]} constrain={(pos) => [Math.min(8, Math.max(0, Math.round(pos[0]))), 0]} onMove={(pos) => setS(pos[0])} />
          </Mafs>
        </div>
      </div>

      {/* 그래프: x=밀린 칸 수, y=겹친 개수. 진짜 계단(스텝) 그래프 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 8], y: [0, 7] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          {Array.from({ length: 9 }).map((_, i) => {
            const y = Math.max(0, W - i);
            return <Line.Segment key={i} point1={[i, y]} point2={[i + 1, y]} color={Theme.orange} />;
          })}
          <Point x={s} y={overlap} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=밀린 칸 수, 세로=겹치는 개수 — <b>계단처럼 뚝뚝 떨어지다 0에서 멈춥니다</b>(공집합)
        </div>
      </div>
    </div>
  );
}
