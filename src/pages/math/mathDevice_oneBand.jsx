// ===========================================================
// no:"11-1" "한 조건은 하나의 띠를 만든다"
// x = 왼끝 위치(lo, 오른끝 hi=8 고정), y = 띠 길이(hi-lo). 1차 직선(감소).
// [도형] 투명 배경 위 실제 띠(막대) — MovablePoint로 왼끝을 직접 끈다.
// [그래프] x,y 진짜 좌표축 있는 그래프. lo를 밀 때 점이 y=hi-lo 직선을 따라 움직인다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme, MovablePoint } from 'mafs';

const HI = 8;

export function renderOneBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const lo = sharedXByLog?.[logIdx]?.lo ?? 2;
  const setLo = (l) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), lo: Math.min(HI, Math.max(0, l)) } }));
  const length = HI - lo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 도형: 실제 띠, 좌표축 없이 순수 배경 */}
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px', position: 'relative' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          👉 <b>왼쪽 끝</b>을 손가락으로 밀어 띠 길이를 바꿔보세요
        </div>
        <div style={{ position: 'relative', height: '50px' }}>
          <div style={{ position: 'absolute', left: `${(lo / 10) * 100}%`, width: `${(length / 10) * 100}%`, top: '15px', height: '20px', background: '#5a86c4', opacity: 0.8, borderRadius: '4px' }} />
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>구간: {lo} ~ {HI} · 길이 {length}</div>
        {/* 조작용 MovablePoint (숨겨진 mafs, 실제 조작은 이 위에서) */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0 }}>
          <Mafs viewBox={{ x: [0, 10], y: [-1, 1] }} preserveAspectRatio={false} height={80}>
            <MovablePoint point={[lo, 0]} constrain={(pos) => [Math.min(HI, Math.max(0, Math.round(pos[0]))), 0]} onMove={(pos) => setLo(Math.min(HI, Math.max(0, Math.round(pos[0]))))} />
          </Mafs>
        </div>
      </div>

      {/* 그래프: x=왼끝, y=길이. 진짜 직선 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 10], y: [0, 10] }} preserveAspectRatio={false} height={240}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[0, HI]} point2={[HI, 0]} color={Theme.blue} />
          <Point x={lo} y={length} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=왼끝 위치, 세로=띠 길이 — 왼끝이 커질수록 길이는 <b>직선으로 줄어듭니다</b>
        </div>
      </div>
    </div>
  );
}
