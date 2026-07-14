// ===========================================================
// no:"10-1" "포물선은 그릇 모양이다" (판별식 D의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 폭(벌어짐) 슬라이더
//   - 결과도형: 그릇 그림이 좁아지고 넓어짐
//   - 그래프: y = a*x^2 포물선이 슬라이더 값에 따라 좁아짐/넓어짐
//   sharedXByLog[logIdx] = { a }.
//
// [핵심] 이차식은 언제나 대칭인 그릇(포물선) 모양이다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderParabolaShape(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_parabolaShape 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-1, 9]);
  const a = sharedXByLog?.[logIdx]?.a ?? 1;
  const setA = (na) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), a: Math.min(3, Math.max(0.3, na)) } }));

  // 결과도형(그릇) — a가 클수록 좁은 그릇
  const W = 200, H = 130;
  const cx = 100, topY = 20, botY = 110;
  const halfW = 70 / a; // a 크면 좁음
  const bowl = `M ${cx - halfW} ${topY} Q ${cx} ${botY + 30} ${cx + halfW} ${topY}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          그릇의 벌어진 정도를 바꿔보세요 (좁게 ↔ 넓게)
        </div>
        <input type="range" min={0.3} max={3} step={0.1} value={a}
          onChange={(e) => setA(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '4px auto 0' }}>
          <path d={bowl} fill="none" stroke="#b5701a" strokeWidth="3" />
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          벌어짐이 바뀌어도 <b>언제나 대칭인 그릇 모양</b>입니다
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={240}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => a * x * x} color={Theme.blue} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          이차식 그래프는 항상 <b>포물선(그릇)</b>입니다 — 좁거나 넓을 뿐 모양은 같습니다
        </div>
      </div>
    </div>
  );
}
