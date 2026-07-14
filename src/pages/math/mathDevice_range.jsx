// ===========================================================
// no:"9-4" "부등식은 하나가 아니라 범위다" (부등식=위/아래의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 기준값 슬라이더 (이보다 크다)
//   - 결과도형: 여러 개의 값 알갱이 중 기준을 넘는 것만 통과(초록불), 못 넘으면 빨간불
//   - 그래프: 수직선에서 기준 오른쪽 전체가 띠(구간)로 칠해짐 — 답이 하나가 아님
//   sharedXByLog[logIdx] = { thr }.
//
// [핵심] "이보다 크다"의 답은 한 개가 아니라 무수히 많은 값의 범위(구간)다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';

export function renderRange(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_range 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const XMAX = 10;
  const thr = sharedXByLog?.[logIdx]?.thr ?? 4;
  const setThr = (t) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), thr: Math.min(XMAX, Math.max(0, t)) } }));

  // 값 알갱이들
  const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          기준값을 정하세요 — "이보다 큰" 값만 통과합니다 (기준 = {thr})
        </div>
        <input type="range" min={0} max={XMAX} step={1} value={thr}
          onChange={(e) => setThr(parseInt(e.target.value, 10))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        {/* 값 알갱이 통과 여부 */}
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
          {samples.map(s => {
            const pass = s > thr;
            return (
              <div key={s} style={{
                width: '26px', height: '26px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 'bold',
                background: pass ? '#2e7d32' : '#c0392b', color: '#fff'
              }}>{s}</div>
            );
          })}
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          통과한 값이 <b>여러 개</b>입니다 — 답은 한 개가 아니라 이 값들 전체(범위)
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, XMAX + 1], y: [-2, 2] }} preserveAspectRatio={false} height={140}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          {/* 기준 오른쪽 구간 음영(굵은 초록선으로) */}
          <Line.Segment point1={[thr, 0]} point2={[XMAX, 0]} color={Theme.green} />
          <Point x={thr} y={0} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          기준 오른쪽 <b>전체 구간</b>이 답입니다 — 부등식의 해는 점 하나가 아니라 구간
        </div>
      </div>
    </div>
  );
}
