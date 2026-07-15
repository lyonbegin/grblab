// ===========================================================
// no:"11-1" "한 조건은 하나의 띠를 만든다"
// x = 왼끝 위치(lo, 오른끝 hi=8 고정), y = 띠 길이(hi-lo). 1차 직선(감소).
//
// [수정 요지 — 인터랙션 복구]
//   기존: 띠를 HTML div로 그리고 그 위에 opacity:0 Mafs를 덮어 MovablePoint를 숨김.
//     → 잡을 점이 안 보이고, div 좌표와 Mafs 좌표가 어긋나 드래그가 사실상 불가능했다.
//   수정: 띠를 Mafs 좌표계 안에 Line.Segment(굵은 선)로 직접 그리고, 그 왼끝에
//     보이는 MovablePoint를 얹었다. 보이는 것과 잡히는 것이 같은 좌표계라 정확히 동작한다.
//   보조로 슬라이더도 함께 제공(모바일/접근성).
//
// [도형] 위쪽 Mafs: 수평 띠 + 왼끝 드래그점.
// [그래프] 아래쪽 Mafs: x=왼끝, y=띠 길이. 직선 y=HI-x 위를 점이 미끄러진다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme, MovablePoint } from 'mafs';

const HI = 8;

export function renderOneBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const lo = sharedXByLog?.[logIdx]?.lo ?? 2;
  const setLo = (l) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), lo: Math.min(HI, Math.max(0, Math.round(l))) }
  }));
  const length = HI - lo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 도형: 띠를 Mafs 안에 직접 그린다 — 드래그점이 보이고 좌표가 정확히 일치 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '2px' }}>
          👉 <b>빨간 점(왼쪽 끝)</b>을 좌우로 끌어 띠 길이를 바꿔보세요
        </div>
        <Mafs viewBox={{ x: [-0.5, 10], y: [-1.2, 1.2] }} preserveAspectRatio={false} height={120}>
          {/* 전체 자(눈금) 역할의 회색 선 */}
          <Line.Segment point1={[0, 0]} point2={[10, 0]} color="#ddd8ca" />
          {/* 실제 띠: lo ~ HI */}
          <Line.Segment point1={[lo, 0]} point2={[HI, 0]} color={Theme.blue} />
          {/* 오른끝(고정) 표시 */}
          <Point x={HI} y={0} color={Theme.blue} />
          {/* 왼끝: 드래그 가능 — 보이는 점 */}
          <MovablePoint
            point={[lo, 0]}
            constrain={(pos) => [Math.min(HI, Math.max(0, Math.round(pos[0]))), 0]}
            color={Theme.red}
            onMove={(pos) => setLo(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          구간: {lo} ~ {HI} · 길이 <b>{length}</b>
        </div>
        {/* 보조 슬라이더 */}
        <input type="range" min={0} max={HI} step={1} value={lo}
          onChange={(e) => setLo(parseInt(e.target.value, 10))}
          style={{ width: '90%', display: 'block', margin: '4px auto 0' }} />
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
