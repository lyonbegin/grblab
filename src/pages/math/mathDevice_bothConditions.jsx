// ===========================================================
// no:"11-6" ★ "두 조건 동시 만족은 겹친 구간뿐"
// x = 조건1의 경계값(b1, x>=b1), y = 교집합 구간의 폭(조건2는 [3,7] 고정).
// 꺾인 절선(piecewise linear) — 평평(고원) → 기울기 -1 직선 → 0(평평).
//
// [수정 요지 — 인터랙션 복구]
//   기존: 띠 3개를 HTML div로 그리고 그 위에 opacity:0 Mafs를 덮어 MovablePoint를 숨김.
//     → 잡을 점이 안 보이고 좌표가 어긋나 드래그가 사실상 불가능했다.
//   수정: 세 띠(조건1·조건2·교집합)를 Mafs 좌표계 안에 Line.Segment로 그리고,
//     조건1 경계에 보이는 빨간 드래그점을 얹었다. 슬라이더 병행.
//
// [도형] Mafs: 조건1 띠(파랑, b1~10) + 조건2 띠(주황, 3~7 고정) + 교집합(초록).
// [그래프] x=조건1 경계, y=겹친 폭. 꺾인 절선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme, MovablePoint } from 'mafs';

const LO2 = 3, HI2 = 7;

export function renderBothConditions(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const b1 = sharedXByLog?.[logIdx]?.b1 ?? 1;
  const setB1 = (b) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b1: Math.min(9, Math.max(0, b)) }
  }));
  const width = Math.max(0, HI2 - Math.max(b1, LO2));
  const ovLo = Math.max(b1, LO2), ovHi = HI2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>빨간 점(조건1 경계)</b>을 밀어보세요 — 조건2(주황, 3~7)는 고정입니다
        </div>
        <Mafs viewBox={{ x: [-0.5, 10.5], y: [-1.8, 1.8] }} preserveAspectRatio={false} height={150}>
          {/* 자 역할 */}
          <Line.Segment point1={[0, 0]} point2={[10, 0]} color="#ddd8ca" />
          {/* 조건1: x >= b1 (파랑, 위) */}
          <Line.Segment point1={[b1, 1.0]} point2={[10, 1.0]} color={Theme.blue} />
          {/* 조건2: 3 ~ 7 (주황, 아래) */}
          <Line.Segment point1={[LO2, -1.0]} point2={[HI2, -1.0]} color={Theme.orange} />
          {/* 교집합(초록, 가운데) */}
          {width > 0 && <Line.Segment point1={[ovLo, 0]} point2={[ovHi, 0]} color={Theme.green} />}
          {/* 드래그점: 조건1 경계 */}
          <MovablePoint
            point={[b1, 1.0]}
            constrain={(pos) => [Math.min(9, Math.max(0, pos[0])), 1.0]}
            color={Theme.red}
            onMove={(pos) => setB1(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          조건1 경계 <b>{b1.toFixed(1)}</b> · 겹친 폭 <b>{width.toFixed(1)}</b>
          {width === 0 && <span style={{ color: '#c0392b', fontWeight: 'bold' }}> — 동시 만족 불가!</span>}
        </div>
        <input type="range" min={0} max={9} step={0.1} value={b1}
          onChange={(e) => setB1(parseFloat(e.target.value))}
          style={{ width: '90%', display: 'block', margin: '4px auto 0' }} />
      </div>

      {/* 그래프: 꺾인 절선 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 9], y: [0, 5] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[0, HI2 - LO2]} point2={[LO2, HI2 - LO2]} color={Theme.green} />
          <Line.Segment point1={[LO2, HI2 - LO2]} point2={[HI2, 0]} color={Theme.green} />
          <Line.Segment point1={[HI2, 0]} point2={[9, 0]} color={Theme.green} />
          <Point x={b1} y={width} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=조건1 경계, 세로=겹친 폭 — <b>꺾인 직선(절선)</b>으로 평평하다가 줄어들고 다시 평평해집니다
        </div>
      </div>
    </div>
  );
}
