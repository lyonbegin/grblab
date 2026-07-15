// ===========================================================
// no:"11-5" "겹침이 없을 수도 있다"
// x = 두 구간 사이 밀린 정도(s, 정수 단계), y = 겹치는 정수값의 개수(계단함수).
//
// [수정 요지 — 인터랙션 복구]
//   기존: 띠를 HTML div로 그리고 그 위에 opacity:0 Mafs를 덮어 MovablePoint를 숨김.
//     → 잡을 점이 보이지 않고 div/Mafs 좌표가 어긋나 드래그가 사실상 불가능했다.
//   수정: 두 띠를 Mafs 좌표계 안에 Line.Segment로 그리고, 주황 띠에 보이는 드래그점을
//     얹었다. 슬라이더도 병행.
//
// [도형] Mafs: 초록 띠(고정) + 주황 띠(드래그로 좌우 이동) + 겹침 표시.
// [그래프] x=밀린 칸 수, y=겹친 개수. 진짜 계단(스텝) 그래프.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme, MovablePoint } from 'mafs';

const W = 6; // 각 띠의 폭(정수 개수)

export function renderEmptySet(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const s = sharedXByLog?.[logIdx]?.s ?? 2; // 두 번째 띠가 오른쪽으로 밀린 칸 수
  const setS = (ss) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), s: Math.min(8, Math.max(0, Math.round(ss))) }
  }));
  const overlap = Math.max(0, W - s);
  // 겹치는 구간: [s, W] (s < W 일 때)
  const ovLo = s, ovHi = W;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>빨간 점</b>을 끌어 주황 띠를 오른쪽으로 밀어 겹침을 없애보세요
        </div>
        <Mafs viewBox={{ x: [-0.5, 14.5], y: [-1.5, 1.5] }} preserveAspectRatio={false} height={140}>
          {/* 자 역할 */}
          <Line.Segment point1={[0, 0]} point2={[14, 0]} color="#ddd8ca" />
          {/* 초록 띠(고정): 0 ~ W, 위쪽 */}
          <Line.Segment point1={[0, 0.6]} point2={[W, 0.6]} color={Theme.green} />
          {/* 주황 띠(이동): s ~ s+W, 아래쪽 */}
          <Line.Segment point1={[s, -0.6]} point2={[s + W, -0.6]} color={Theme.orange} />
          {/* 겹치는 구간 강조(가운데) */}
          {overlap > 0 && (
            <Line.Segment point1={[ovLo, 0]} point2={[ovHi, 0]} color={Theme.blue} />
          )}
          {/* 드래그점: 주황 띠 왼끝 */}
          <MovablePoint
            point={[s, -0.6]}
            constrain={(pos) => [Math.min(8, Math.max(0, Math.round(pos[0]))), -0.6]}
            color={Theme.red}
            onMove={(pos) => setS(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          밀린 칸 <b>{s}</b> · 겹치는 정수 개수 <b>{overlap}</b>
          {overlap === 0 && <span style={{ color: '#c0392b', fontWeight: 'bold' }}> — 공집합!</span>}
        </div>
        <input type="range" min={0} max={8} step={1} value={s}
          onChange={(e) => setS(parseInt(e.target.value, 10))}
          style={{ width: '90%', display: 'block', margin: '4px auto 0' }} />
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
