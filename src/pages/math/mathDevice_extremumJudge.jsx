// ===========================================================
// no:"4d" "극대·극소 판별 — 국소는 창 크기가 정한다"  (극값 세트 최종 목표)
//
// [v3 수정 — 슬라이더 완전 제거, 창 중심·크기를 둘 다 직접 드래그로]
//   v2는 슬라이더 2개(중심/크기)로 조작했다. v3는 두 손잡이(handle)를 직접 끈다:
//     - 주황 점(창 중심, 원 안): 좌우로 끌면 창이 곡선을 따라 이동.
//     - 보라 점(창 가장자리, 원 위): 중심에서 멀어지게/가깝게 끌면 창 크기(반지름)가 변한다.
//   두 손잡이 모두 같은 Mafs 좌표계 안에 있어 보이는 대로 정확히 잡힌다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Circle, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderExtremumJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [0, 8]);

  const st = sharedXByLog?.[logIdx] || {};
  const cx = st.cx ?? 3.0;
  const w = st.w ?? 1.0;
  const wMin = 0.2, wMax = 3.2;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || { cx, w }), ...p } }));

  const eps = 1e-4;
  const df = (x) => (f(x + eps) - f(x - eps)) / (2 * eps);
  const extrema = [];
  let prevUp = null;
  for (let i = 0; i <= 400; i++) {
    const x = xRange[0] + ((xRange[1] - xRange[0]) * i) / 400;
    const up = df(x) > 0;
    if (prevUp !== null && up !== prevUp) extrema.push({ x, isMax: prevUp && !up });
    prevUp = up;
  }
  const countIn = (center, rad) => extrema.filter(e => e.x >= center - rad && e.x <= center + rad).length;
  const inWindow = extrema.filter(e => e.x >= cx - w && e.x <= cx + w);
  const n = inWindow.length;

  // 창 가장자리 손잡이 위치(중심에서 오른쪽으로 w만큼, 곡선 높이에 얹음)
  const edgeX = Math.min(xRange[1], cx + w);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a' }}>
          👉 <b>주황 점</b>을 끌어 창을 옮기고, <b>보라 점</b>을 끌어 창 크기를 바꿔보자
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: n === 0 ? '#5f5e5a' : '#2e7d32', marginTop: '2px' }}>
          창 안 극값 {n}개
          {inWindow.length > 0 && ` (${inWindow.map(e => e.isMax ? '극대' : '극소').join(', ')})`}
        </div>
      </div>

      {/* 도형: 창 중심 + 창 가장자리 둘 다 직접 드래그 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={240}>
          <Coordinates.Cartesian />
          <Circle center={[cx, f(cx)]} radius={w} color={Theme.orange} />
          <Plot.OfX y={f} color={Theme.blue} />
          {extrema.map((e, i) => {
            const inside = e.x >= cx - w && e.x <= cx + w;
            return <Point key={i} x={e.x} y={f(e.x)}
              color={e.isMax ? Theme.green : Theme.red} opacity={inside ? 1 : 0.25} />;
          })}
          {/* 창 크기 손잡이: 중심에서 오른쪽으로 끌면 반지름이 늘어난다 */}
          <MovablePoint
            point={[edgeX, f(cx)]}
            constrain={(pos) => {
              const rad = Math.min(wMax, Math.max(wMin, pos[0] - cx));
              return [cx + rad, f(cx)];
            }}
            color={Theme.violet}
            onMove={(pos) => patch({ w: Math.min(wMax, Math.max(wMin, pos[0] - cx)) })}
          />
          {/* 창 중심 손잡이: 좌우로 끌면 창 전체가 곡선을 따라 이동 */}
          <MovablePoint
            point={[cx, f(cx)]}
            constrain={(pos) => {
              const ncx = Math.min(xRange[1] - 0.3, Math.max(xRange[0] + 0.3, pos[0]));
              return [ncx, f(ncx)];
            }}
            color={Theme.orange}
            onMove={(pos) => patch({ cx: Math.min(xRange[1] - 0.3, Math.max(xRange[0] + 0.3, pos[0])) })}
          />
        </Mafs>
        <div style={{ fontSize: '11px', color: '#5f5e5a', textAlign: 'center' }}>
          주황 점=창 중심(이동) · 보라 점=창 가장자리(크기 조절) · 원 안에 든 진한 점만 극값 후보
        </div>
      </div>

      {/* 그래프: x=창 크기, y=창 안 극값 개수 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, wMax], y: [-0.4, extrema.length + 0.6] }} preserveAspectRatio={false} height={170}>
          <Coordinates.Cartesian yAxis={{ lines: 1 }} />
          {Array.from({ length: 100 }).map((_, i) => {
            const w1 = (wMax * i) / 100, w2 = (wMax * (i + 1)) / 100;
            const c = countIn(cx, (w1 + w2) / 2);
            return <Line.Segment key={i} point1={[w1, c]} point2={[w2, c]} color={Theme.violet} />;
          })}
          {/* 이 그래프의 점도 직접 끌 수 있게 — 창 크기를 여기서도 조절 가능 */}
          <MovablePoint
            point={[w, n]}
            constrain={(pos) => {
              const nw = Math.min(wMax, Math.max(wMin, pos[0]));
              return [nw, countIn(cx, nw)];
            }}
            color={Theme.red}
            onMove={(pos) => patch({ w: Math.min(wMax, Math.max(wMin, pos[0])) })}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=창 크기, 세로=창 안 극값 개수 — <b>이 점도 직접 끌면 위 창 크기가 함께 바뀝니다</b>
          <br />
          <span style={{ fontSize: '11px' }}>창이 작으면(국소) 안 보이던 극값이, 창을 넓히면(전역 쪽으로) 하나씩 나타납니다.</span>
        </div>
      </div>
    </div>
  );
}
