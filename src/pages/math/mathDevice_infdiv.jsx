// ===========================================================
// no:"infdiv" "무한대 나누기 무한대 — 누가 더 빨리 커지나" 전용 인터랙션.
//
// [이 파일의 위치] div1(÷큰수=작아짐), div2(÷작은수=개수폭발)를 밟고 올라온 봉우리.
// 0/0과 쌍둥이인 ∞/∞ 부정형을 초등 눈높이로 만지게 한다.
//
// [핵심 수식] y = (분자속도 · x) / (분모속도 · x)  →  x가 약분되어  y = 분자속도/분모속도.
// 즉 공통 단계 x를 아무리 무한대로 밀어도, 위아래 x가 약분되어 "속도의 비율"만 남고
// 값은 하나로 고정된다. 이것이 ∞/∞가 정해진 값을 갖는 이유(로피탈의 본질)다.
//
// [조작] 
//   - 공통 단계 슬라이더 1개(x): 위아래 도막이 같은 x로 함께 커진다. 이걸 밀면 그래프의
//     빨간 점이 원점에서 뻗는 직선을 따라 미끄러진다(인터랙티브 연동).
//   - 배수 버튼(1·2·3배)은 위(분자)/아래(분모) 따로: 각 속도를 정해 기울기를 결정한다.
//
// [값 계산] 분자도막 = x · 분자속도,  분모도막 = x · 분모속도.
//           값(기울기) = 분자도막/분모도막 = 분자속도/분모속도 (x 무관).
//
// [상태] logIdx별 { step, numRate, denRate }. step이 공통 단계(x), 배수는 위아래 따로.
//
// [모델 필드] visual.kind만 mafs_function이면 된다(formula는 이 장치에선 안 씀).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { toRange } from './mathDeviceShared';

// 한 장치(배수버튼 + 막대). 단계 슬라이더는 공통이라 여기서 빠지고, step은 부모가 내려준다.
function CutRow({ title, color, step, rate, onRate }) {
  const pieceCount = Math.max(1, Math.round(step * rate));
  const SVG_W = 280, SVG_H = 50, PAD = 8;
  const barW = SVG_W - PAD * 2, barH = 28, barY = 10;
  const rects = [];
  for (let i = 0; i < pieceCount; i++) {
    const x = PAD + (barW * i) / pieceCount;
    const w = barW / pieceCount;
    rects.push(
      <rect key={i} x={x} y={barY} width={w} height={barH}
        fill={i % 2 === 0 ? color.a : color.b} stroke={color.edge} strokeWidth="0.6" />
    );
  }
  return (
    <div style={{ background: '#f5f2e8', borderRadius: '10px', padding: '8px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: color.edge, minWidth: '44px' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#5f5e5a' }}>몇 배씩</div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[1, 2, 3].map(r => (
            <button key={r} type="button" onClick={() => onRate(r)}
              style={{
                padding: '2px 9px', fontSize: '12px', borderRadius: '5px', cursor: 'pointer',
                border: rate === r ? `2px solid ${color.edge}` : '1px solid #ccc',
                background: rate === r ? color.b : '#fff',
                fontWeight: rate === r ? 'bold' : 'normal'
              }}>{r}배</button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', marginLeft: 'auto' }}>
          <b>{pieceCount}도막</b>
        </div>
      </div>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ marginTop: '4px' }}>
        {rects}
        <rect x={PAD} y={barY} width={barW} height={barH} fill="none" stroke={color.edge} strokeWidth="1.2" />
      </svg>
    </div>
  );
}

export function renderInfDiv(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_infdiv 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }

  const maxStep = 12;
  const st = sharedXByLog?.[logIdx] || {};
  const step = st.step ?? 2;          // 공통 단계 x
  const numRate = st.numRate ?? 2;    // 분자 속도(기본 2배)
  const denRate = st.denRate ?? 1;    // 분모 속도(기본 1배)

  const patch = (p) => {
    setSharedXByLog?.(prev => {
      const cur = prev?.[logIdx] || { step, numRate, denRate };
      return { ...prev, [logIdx]: { ...cur, ...p } };
    });
  };

  const numCount = Math.max(1, Math.round(step * numRate));
  const denCount = Math.max(1, Math.round(step * denRate));
  const value = numCount / denCount;            // = numRate/denRate (x 약분)
  const slope = numRate / denRate;              // 직선 기울기(값과 동일, x 무관)

  const axisMax = maxStep * 3 + 1;
  const numColor = { a: '#e8a13a', b: '#f0c070', edge: '#b5701a' };
  const denColor = { a: '#5a86c4', b: '#8fb0dd', edge: '#2f5a99' };

  // 원점에서 기울기 slope로 뻗는 직선(축 끝까지). 이 직선은 step과 무관하게 고정.
  const lineEndX = axisMax;
  const lineEndY = Math.min(axisMax * 3, slope * axisMax);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 공통 단계 슬라이더 — 밀면 위아래 도막이 함께 커지고 그래프 점이 직선 위를 미끄러진다 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          함께 얼마나 밀까 (분자·분모 같은 단계로 커집니다)
        </div>
        <input type="range" min={1} max={maxStep} step={1} value={step}
          onChange={(e) => patch({ step: parseInt(e.target.value, 10) })}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#7a5a10', marginTop: '2px' }}>
          단계 {step}
        </div>
      </div>

      {/* 분자 장치 (위) */}
      <CutRow title="분자" color={numColor} step={step} rate={numRate} onRate={(r) => patch({ numRate: r })} />
      {/* 분수선 */}
      <div style={{ borderTop: '3px solid #333', margin: '0 20px' }} />
      {/* 분모 장치 (아래) */}
      <CutRow title="분모" color={denColor} step={step} rate={denRate} onRate={(r) => patch({ denRate: r })} />

      {/* 그래프: 기울기 = 값. 공통 슬라이더를 밀면 빨간 점이 이 직선 위를 미끄러진다. */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, axisMax], y: [0, axisMax] }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[0, 0]} point2={[lineEndX, lineEndY]} color={Theme.green} />
          {/* 빨간 점 = (분모도막, 분자도막). 드래그하면 그 위치에 맞는 공통 단계로 역산 연동. */}
          <MovablePoint
            point={[denCount, numCount]}
            constrain={(pos) => {
              // 직선 위로만: 분모축(x)에 맞춰 분자축(y)=slope*x 로 고정
              const cx = Math.min(axisMax, Math.max(denRate, pos[0]));
              return [cx, slope * cx];
            }}
            color={Theme.red}
            onMove={(pos) => {
              // 드래그한 분모도막 수 → 공통 단계 x로 역산(x = 분모도막/분모속도)
              const newStep = Math.min(maxStep, Math.max(1, Math.round(pos[0] / denRate)));
              patch({ step: newStep });
            }}
          />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          가로 = 분모 도막수({denCount}), 세로 = 분자 도막수({numCount})
          <br />
          <b style={{ color: '#2e7d32', fontSize: '15px' }}>지금 값(기울기) = {value.toFixed(2)}</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            단계를 아무리 크게 밀어도 점은 같은 기울기 직선 위를 미끄러질 뿐 — 값은 이 기울기({numRate}÷{denRate}) 하나로 정해집니다.
          </span>
        </div>
      </div>
    </div>
  );
}
