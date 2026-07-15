// ===========================================================
// no:"11-6" ★ "두 조건 동시 만족은 겹친 구간뿐"
// x = 조건1의 경계값(b1, x>=b1), y = 교집합 구간의 폭(조건2는 [3,7] 고정).
// 꺾인 절선(piecewise linear) — 평평(고원) → 기울기 -1 직선 → 0(평평), 세 구간이 이어진
// 절선그래프. 11-1의 순수 직선, 11-5의 계단과 또 다른 그래프 언어.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme, MovablePoint } from 'mafs';

const LO2 = 3, HI2 = 7;

export function renderBothConditions(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const b1 = sharedXByLog?.[logIdx]?.b1 ?? 1;
  const setB1 = (b) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b1: Math.min(9, Math.max(0, b)) } }));
  const width = Math.max(0, HI2 - Math.max(b1, LO2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px', position: 'relative' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          👉 <b>조건1 경계(파랑 화살표)</b>를 밀어보세요 — 조건2(노랑, 3~7)는 고정입니다
        </div>
        <div style={{ position: 'relative', height: '60px' }}>
          <div style={{ position: 'absolute', left: `${(b1 / 10) * 100}%`, width: `${((10 - b1) / 10) * 100}%`, top: '8px', height: '16px', background: '#5a86c455', border: '2px solid #2f5a99' }} />
          <div style={{ position: 'absolute', left: `${(LO2 / 10) * 100}%`, width: `${((HI2 - LO2) / 10) * 100}%`, top: '30px', height: '16px', background: '#e8a13a55', border: '2px solid #b5701a' }} />
          {width > 0 && <div style={{ position: 'absolute', left: `${(Math.max(b1, LO2) / 10) * 100}%`, width: `${(width / 10) * 100}%`, top: '52px', height: '8px', background: '#2e7d32' }} />}
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>겹친 폭: <b>{width}</b></div>
        <div style={{ position: 'absolute', inset: 0, opacity: 0 }}>
          <Mafs viewBox={{ x: [0, 10], y: [-1, 1] }} preserveAspectRatio={false} height={100}>
            <MovablePoint point={[b1, 0]} constrain={(pos) => [Math.min(9, Math.max(0, pos[0])), 0]} onMove={(pos) => setB1(pos[0])} />
          </Mafs>
        </div>
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
