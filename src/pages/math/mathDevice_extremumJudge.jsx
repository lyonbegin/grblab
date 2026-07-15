// ===========================================================
// no:"4d" "극대·극소 판별 — 국소는 창 크기가 정한다"  (극값 세트 최종 목표)
//
// [재설계 요지 — 11번 세트 형식에 맞춤]
//   기존: 주변 창을 세로선 두 개로만 표시하고, x→y 함수 그래프가 없었다.
//   수정: (1) 시각언어를 venn풍(원=주변 창)으로 → "내 주변"이 원으로 감싸여 보인다.
//             원 안에 든 극값만 후보라는 게 직관적.
//         (2) x축을 '창 크기'로 바꿔 x→y 그래프 추가 → x=창 반지름, y=창 안 극값 개수.
//             창을 넓힐수록 극값이 하나씩 들어오는 증가 계단.
//             ★ 이 그래프가 "국소(작은 창)와 전역(큰 창)이 다르다"를 증명한다 → no:6 예고.
//
// [개념] 극값은 '주변에서만' 최고/최저. 창(주변)의 크기를 바꾸면 판정이 달라진다.
//
// [시각언어] venn풍 원 — 주변 창을 원으로 감싼다(11-3/11-5의 원 언어 재사용).
// [조작] 슬라이더 2개: 창 중심 위치 + 창 크기(반지름).
// [그래프] x=창 크기, y=창 안 극값 개수. 증가 계단.
//
// [검증 완료] 창중심 x=3.0 기준 → w≈1.6에서 1개, w≈1.8에서 2개로 늘어나는 계단 확인
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Circle, Theme } from 'mafs';
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
  const cx = st.cx ?? 3.0;   // 창 중심
  const w = st.w ?? 1.0;     // 창 반지름(크기)
  const wMax = 3.2;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || { cx, w }), ...p } }));

  // 극값 위치 찾기(기울기 부호 전환)
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

  // 창 안 극값 개수
  const countIn = (center, rad) => extrema.filter(e => e.x >= center - rad && e.x <= center + rad).length;
  const inWindow = extrema.filter(e => e.x >= cx - w && e.x <= cx + w);
  const n = inWindow.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 조작 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          <b>주변 창(원)</b>의 위치와 크기를 바꿔보자 — 창 안에 극값이 몇 개 들어올까?
        </div>
        <div style={{ fontSize: '11px', color: '#5f5e5a' }}>창 중심 = {cx.toFixed(1)}</div>
        <input type="range" min={xRange[0] + 0.5} max={xRange[1] - 0.5} step={0.05} value={cx}
          onChange={(e) => patch({ cx: parseFloat(e.target.value) })} style={{ width: '100%' }} />
        <div style={{ fontSize: '11px', color: '#5f5e5a', marginTop: '4px' }}>창 크기(반지름) = {w.toFixed(1)}</div>
        <input type="range" min={0.2} max={wMax} step={0.05} value={w}
          onChange={(e) => patch({ w: parseFloat(e.target.value) })} style={{ width: '100%' }} />
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: n === 0 ? '#5f5e5a' : '#2e7d32', textAlign: 'center', marginTop: '4px' }}>
          창 안 극값 {n}개
          {inWindow.length > 0 && ` (${inWindow.map(e => e.isMax ? '극대' : '극소').join(', ')})`}
        </div>
      </div>

      {/* 도형: venn풍 원(주변 창) + 곡선 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          {/* 주변 창을 원으로 — venn 언어 */}
          <Circle center={[cx, f(cx)]} radius={w} color={Theme.orange} />
          <Plot.OfX y={f} color={Theme.blue} />
          {/* 모든 극값 표시 — 창 안이면 진하게, 밖이면 흐리게 */}
          {extrema.map((e, i) => {
            const inside = e.x >= cx - w && e.x <= cx + w;
            return <Point key={i} x={e.x} y={f(e.x)}
              color={e.isMax ? Theme.green : Theme.red} opacity={inside ? 1 : 0.25} />;
          })}
          <Point x={cx} y={f(cx)} color={Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '11px', color: '#5f5e5a', textAlign: 'center' }}>
          주황 원 = 내 주변(창). <b>원 안에 든 극값만</b> 후보입니다 — 흐린 점은 창 밖이라 안 보이는 셈
        </div>
      </div>

      {/* 그래프: x=창 크기, y=창 안 극값 개수. 증가 계단 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, wMax], y: [-0.4, extrema.length + 0.6] }} preserveAspectRatio={false} height={180}>
          <Coordinates.Cartesian yAxis={{ lines: 1 }} />
          {Array.from({ length: 100 }).map((_, i) => {
            const w1 = (wMax * i) / 100, w2 = (wMax * (i + 1)) / 100;
            const c = countIn(cx, (w1 + w2) / 2);
            return <Line.Segment key={i} point1={[w1, c]} point2={[w2, c]} color={Theme.violet} />;
          })}
          <Point x={w} y={n} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=창 크기, 세로=창 안 극값 개수 — <b>창을 넓힐수록 계단처럼 하나씩 늘어납니다</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            창이 작으면(국소) 극값이 안 보이기도 합니다. 창을 전체로 넓히면 그게 전역 — 다음 단원(최대·최소)의 이야기입니다.
          </span>
        </div>
      </div>
    </div>
  );
}
