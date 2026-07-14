// ===========================================================
// no:"zerodiv" "0 나누기 0 — 누가 더 빨리 작아지나" 전용 인터랙션.
//
// [이 파일의 위치] div1(÷x 하면 한 조각이 0으로 작아짐)의 직관을 두 개로 확장한 봉우리.
// infdiv(∞/∞, 커지는 쪽)와 쌍둥이 — 이쪽은 0/0, 위아래 조각이 함께 0으로 작아지는 부정형.
//
// [핵심 수식] y = (분자속도 / x) / (분모속도 / x)  →  x가 약분되어  y = 분자속도/분모속도.
// 즉 공통 크기 x를 아무리 크게 키워(두 조각을 0으로 보내)도, 위아래 1/x가 약분되어
// "속도의 비율"만 남고 값은 하나로 고정된다. 이것이 0/0이 정해진 값을 갖는 이유다.
// div1의 "÷x 하면 조각이 작아진다"를 분자·분모 두 조각에 동시에 적용한 것.
//
// [조작]
//   - 공통 크기 슬라이더 1개(x): x를 키우면 위아래 부채꼴 조각이 같은 x로 함께 작아진다(0으로).
//     이걸 밀면 그래프의 빨간 점이 수평선을 따라 오른쪽(x 큰 쪽)으로 미끄러진다.
//   - 배수 버튼(1·2·3배)은 위(분자)/아래(분모) 따로: 각 속도를 정해 값(비율)을 결정한다.
//
// [값 계산] 분자조각 = 분자속도/x,  분모조각 = 분모속도/x.
//           값 = 분자조각/분모조각 = 분자속도/분모속도 (x 약분).
//
// [상태] logIdx별 { step, numRate, denRate }. step이 공통 크기(x), 배수는 위아래 따로.
//        step(x)이 클수록 두 조각 모두 0에 가깝다(둘 다 0으로 수렴).
//
// [모델 필드] visual.kind만 mafs_function이면 된다(formula는 이 장치에선 안 씀).
//
// [부채꼴] div1과 동일하게 SVG path로 직접 그린다(Mafs로는 부채꼴 불가). 그래프만 Mafs.
//   조각 각도 = (속도/x) 기준으로 스케일 → x가 커지면 각도가 0으로 좁아진다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { toRange } from './mathDeviceShared';

// 중심(cx,cy), 반지름 r, 조각 각도 angleDeg 인 부채꼴 SVG path 문자열.
// 위쪽(12시 방향)을 중심으로 좌우 대칭으로 벌어진다. (div1에서 그대로 가져옴)
function wedgePath(cx, cy, r, angleDeg) {
  const a = (Math.min(359.999, Math.max(0, angleDeg)) * Math.PI) / 180;
  const start = -Math.PI / 2 - a / 2;
  const end = -Math.PI / 2 + a / 2;
  const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
  const largeArc = angleDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// 부채꼴 한 개 파트(제목 + 배수버튼 + 피자). 분수 카드 안에서 위(분자)/아래(분모)로 쓰인다.
// 조각 크기 = rate/x. x가 커질수록 조각이 0으로 좁아진다.
function WedgeRow({ role, color, x, rate, onRate }) {
  const sliceSize = rate / x;                 // 이 조각의 현재 크기 = 속도/x
  // 각도 스케일: 속도 1배가 x=1일 때 한 판(120°) 정도 되게 잡고, 크기에 비례.
  const wedgeAngle = Math.min(340, sliceSize * 120);
  const SVG_W = 130, SVG_H = 120, CX = 65, CY = 62, R = 48;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ minWidth: '112px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: color.edge }}>
          {role.label}
          <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#8a8880', marginLeft: '3px' }}>
            {role.side}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#5f5e5a', margin: '4px 0 2px' }}>속도</div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[1, 2, 3].map(r => (
            <button key={r} type="button" onClick={() => onRate(r)}
              style={{
                padding: '2px 8px', fontSize: '12px', borderRadius: '5px', cursor: 'pointer',
                border: rate === r ? `2px solid ${color.edge}` : '1px solid #ccc',
                background: rate === r ? color.b : '#fff',
                fontWeight: rate === r ? 'bold' : 'normal'
              }}>{r}배</button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: color.edge, fontWeight: 'bold', marginTop: '4px' }}>
          조각 크기 {sliceSize.toFixed(2)}
        </div>
      </div>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
        {/* 전체 판(점선) — 크기 기준 */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ccc" strokeDasharray="4 4" strokeWidth="1.5" />
        {/* 강조된 한 조각: x가 커지면 이 부채꼴이 0으로 좁아진다 */}
        <path d={wedgePath(CX, CY, R, wedgeAngle)} fill={color.a} stroke={color.edge} strokeWidth="2" />
      </svg>
    </div>
  );
}

export function renderZeroDiv(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_zerodiv 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }

  const maxStep = 12;
  const st = sharedXByLog?.[logIdx] || {};
  const step = st.step ?? 2;          // 공통 크기 x (클수록 조각이 0에 가깝다)
  const numRate = st.numRate ?? 2;    // 분자 속도(기본 2배)
  const denRate = st.denRate ?? 1;    // 분모 속도(기본 1배)

  const patch = (p) => {
    setSharedXByLog?.(prev => {
      const cur = prev?.[logIdx] || { step, numRate, denRate };
      return { ...prev, [logIdx]: { ...cur, ...p } };
    });
  };

  const numSlice = numRate / step;              // 분자 조각 크기 = 분자속도/x
  const denSlice = denRate / step;              // 분모 조각 크기 = 분모속도/x
  const value = numSlice / denSlice;            // = numRate/denRate (x 약분)

  const numColor = { a: '#e8a13a', b: '#f0c070', edge: '#b5701a' };
  const denColor = { a: '#5a86c4', b: '#8fb0dd', edge: '#2f5a99' };

  // 가로축 = 공통 크기 x(1→maxStep), 세로축 = 값 y. x를 키워도 y=value(수평선)로 고정.
  const xAxisMax = maxStep + 1;
  const yAxisMax = 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 공통 크기 슬라이더 — x를 키우면(오른쪽) 두 조각이 함께 0으로 작아진다 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          <b>공통 크기 x</b> — 분자·분모를 같은 x로 나눈다. x를 <b>키울수록 두 조각이 함께 0으로</b> 작아집니다 (이 x가 약분됩니다)
        </div>
        <input type="range" min={1} max={maxStep} step={1} value={step}
          onChange={(e) => patch({ step: parseInt(e.target.value, 10) })}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '11px', color: '#8a8880', display: 'flex', justifyContent: 'space-between', width: '80%', margin: '0 auto' }}>
          <span>&larr; 조각이 큼</span><span>조각이 0에 가까움 &rarr;</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#7a5a10', marginTop: '2px' }}>
          x = {step}
        </div>
      </div>

      {/* 분수 카드: [ 값 = 큰 분수 ] | [ 분자 부채꼴 / 분수선 / 분모 부채꼴 ] */}
      <div style={{
        display: 'flex', alignItems: 'stretch', gap: '12px',
        background: '#faf7ef', border: '2px solid #ddd6c4', borderRadius: '12px', padding: '12px'
      }}>
        {/* 왼쪽: 큰 "값 = 분자조각/분모조각" */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minWidth: '96px', borderRight: '2px dashed #ddd6c4', paddingRight: '12px'
        }}>
          <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>값 =</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: numColor.edge }}>{numSlice.toFixed(2)}</div>
            <div style={{ width: '56px', borderTop: '3px solid #333', margin: '2px 0' }} />
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: denColor.edge }}>{denSlice.toFixed(2)}</div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32', marginTop: '6px' }}>
            = {value.toFixed(2)}
          </div>
        </div>

        {/* 오른쪽: 위(분자) 부채꼴 / 분수선 / 아래(분모) 부채꼴 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <WedgeRow role={{ label: '분자', side: '(위)' }} color={numColor}
            x={step} rate={numRate} onRate={(r) => patch({ numRate: r })} />
          <div style={{ borderTop: '3px solid #333', margin: '8px 0' }} />
          <WedgeRow role={{ label: '분모', side: '(아래)' }} color={denColor}
            x={step} rate={denRate} onRate={(r) => patch({ denRate: r })} />
        </div>
      </div>

      {/* 그래프 카드: y=(분자속도/x)/(분모속도/x) → 약분 → y=값(수평선) */}
      <div className="viz-box">
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '14px', color: '#333', fontWeight: 'bold' }}>
            y = (분자속도 / x) / (분모속도 / x) = {numRate} / {denRate}
          </div>
          <div style={{ fontSize: '13px', color: '#2e7d32', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: '#8a8880', marginRight: '6px' }}>(위아래 1/x가 약분되어 사라짐)</span>
            &rarr; <b>y = {value.toFixed(2)}</b> (x를 키워 두 조각을 0으로 보내도 그대로인 수평선)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{
            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            fontSize: '12px', textAlign: 'center', padding: '0 2px', fontWeight: 'bold', color: '#2e7d32'
          }}>
            세로 = 값 (y)
          </div>
          <div style={{ flex: 1 }}>
            <Mafs viewBox={{ x: [0, xAxisMax], y: [0, yAxisMax] }} preserveAspectRatio={false} height={260}>
              <Coordinates.Cartesian xAxis={{ lines: 1 }} yAxis={{ lines: 1 }} />
              {/* y = value 수평선: 위아래 1/x가 약분되어 값은 x와 무관하게 하나로 고정 */}
              <Line.Segment point1={[0, value]} point2={[xAxisMax, value]} color={Theme.green} />
              {/* 빨간 점 = (현재 x, 값). 오른쪽으로 드래그해도 y는 value에 붙어 수평선 위를 미끄러진다. */}
              <MovablePoint
                point={[step, value]}
                constrain={(pos) => {
                  const cx = Math.min(xAxisMax, Math.max(1, pos[0]));
                  return [cx, value];
                }}
                color={Theme.red}
                onMove={(pos) => {
                  const newStep = Math.min(maxStep, Math.max(1, Math.round(pos[0])));
                  patch({ step: newStep });
                }}
              />
            </Mafs>
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#7a5a10', marginTop: '2px' }}>
              가로 = 공통 크기 x (&rarr; 조각이 0으로)
            </div>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          지금 점: 가로 x={step} &middot; 세로 값={value.toFixed(2)}
          <br />
          <span style={{ fontSize: '11px' }}>
            x를 아무리 키워 두 조각을 0에 가깝게 만들어도 점은 같은 높이(수평선) 위를 오른쪽으로만 움직일 뿐 &mdash;
            값은 속도 비율(분자속도&divide;분모속도 = {numRate}&divide;{denRate}) 하나로 정해집니다.
          </span>
        </div>
      </div>
    </div>
  );
}
