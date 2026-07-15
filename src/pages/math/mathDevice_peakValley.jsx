// ===========================================================
// no:"4a" "봉우리와 골 — 주변 셋 중 내가 몇 등?"  (극값 세트 첫 칸)
//
// [재설계 요지 — 11번 세트 형식에 맞춤]
//   기존: 곡선 위 점만 굴리고 결과가 글자로만 떴다(x→y 함수 그래프 없음, 4칸 모두 같은 화면).
//   수정: (1) 시각언어를 bar_chart(막대 높이 비교)로 → 국소 비교의 정의가 눈에 보인다.
//         (2) x→y 함수 그래프를 추가 → x=점 위치, y=주변 3점 중 순위(1~3). 계단 그래프.
//
// [개념] 봉우리 = 주변(왼·나·오른) 셋 중 내가 1등. 골 = 내가 3등(꼴찌). 비탈 = 2등.
//   "주변에서만"이라는 국소의 씨앗을 순위로 몸에 익힌다.
//
// [시각언어] bar_chart — 왼/나/오른 3개 막대의 높이를 직접 비교.
// [조작] 슬라이더로 점 위치 이동 → 3막대 높이가 실시간으로 바뀐다.
// [그래프] x=점 위치, y=순위(1~3). 봉우리에서 1, 골에서 3으로 뚝뚝 떨어지는 계단.
//
// [검증 완료] 곡선 0.12x³-1.05x²+2.1x+2.5 → 극대 x=1.28(순위1), 극소 x=4.55(순위3), 비탈(순위2)
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

const STEP = 0.6; // 이웃까지의 거리

export function renderPeakValley(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [0, 8]);
  const xMin = xRange[0] + STEP, xMax = xRange[1] - STEP;
  const px = sharedXByLog?.[logIdx] ?? 1.3;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  // 주변 3점 높이와 순위
  const yL = f(px - STEP), yC = f(px), yR = f(px + STEP);
  const rankOf = (x) => {
    const a = f(x - STEP), b = f(x), c = f(x + STEP);
    return [a, b, c].filter(y => y > b + 1e-9).length + 1; // 1=봉우리, 3=골
  };
  const rank = rankOf(px);
  const word = rank === 1 ? '1등 — 봉우리! (주변보다 높음)' : rank === 3 ? '3등 — 골! (주변보다 낮음)' : '2등 — 비탈 (오르내리는 중)';
  const wc = rank === 1 ? '#2e7d32' : rank === 3 ? '#c0392b' : '#5f5e5a';

  // 막대 그리기(SVG)
  const BW = 260, BH = 120, PAD = 24;
  const maxY = Math.max(yL, yC, yR, 1);
  const bars = [
    { label: '왼쪽', y: yL, color: '#b0b8c4' },
    { label: '나', y: yC, color: rank === 1 ? '#3b6d11' : rank === 3 ? '#d85a30' : '#5a86c4' },
    { label: '오른쪽', y: yR, color: '#b0b8c4' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 조작 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 옮기며 <b>주변 셋(왼쪽·나·오른쪽) 중 내가 몇 등</b>인지 보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.02} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>

      {/* 도형: 막대 높이 비교 (bar_chart 시각언어) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '8px' }}>
        <svg width="100%" height={BH + 26} viewBox={`0 0 ${BW} ${BH + 26}`} style={{ display: 'block', margin: '0 auto' }}>
          {bars.map((b, i) => {
            const bw = 52, gap = 26;
            const x = PAD + i * (bw + gap);
            const h = Math.max(2, (b.y / maxY) * (BH - 20));
            const y = BH - h;
            return (
              <g key={i}>
                <rect x={x} y={y} width={bw} height={h} fill={b.color} stroke="#5f5e5a" strokeWidth="1" rx="3" />
                <text x={x + bw / 2} y={BH + 12} fontSize="11" fill="#5f5e5a" textAnchor="middle">{b.label}</text>
                <text x={x + bw / 2} y={y - 4} fontSize="10" fill="#5f5e5a" textAnchor="middle">{b.y.toFixed(1)}</text>
              </g>
            );
          })}
          <line x1={0} y1={BH} x2={BW} y2={BH} stroke="#c9c0aa" strokeWidth="1.5" />
        </svg>
        <div style={{ fontSize: '11px', color: '#5f5e5a', textAlign: 'center' }}>
          가운데(나) 막대가 양옆보다 높으면 봉우리, 낮으면 골입니다 — <b>주변 셋만 견줍니다</b>
        </div>
      </div>

      {/* 그래프: x=점 위치, y=순위. 계단 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: [0.5, 3.5] }} preserveAspectRatio={false} height={180}>
          <Coordinates.Cartesian yAxis={{ lines: 1 }} />
          {/* 순위 계단: 곡선 전체를 훑어 순위를 선분으로 */}
          {Array.from({ length: 120 }).map((_, i) => {
            const x1 = xMin + ((xMax - xMin) * i) / 120;
            const x2 = xMin + ((xMax - xMin) * (i + 1)) / 120;
            const r = rankOf((x1 + x2) / 2);
            return <Line.Segment key={i} point1={[x1, r]} point2={[x2, r]}
              color={r === 1 ? Theme.green : r === 3 ? Theme.red : Theme.blue} />;
          })}
          <Point x={px} y={rank} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=점 위치, 세로=주변 셋 중 순위 — <b>계단처럼 1(봉우리)·2(비탈)·3(골)로 뚝뚝 바뀝니다</b>
        </div>
      </div>
    </div>
  );
}
