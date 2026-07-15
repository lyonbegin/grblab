// ===========================================================
// no:"4c" "전환점 — 앞뒤 방향으로 극대·극소를 가린다"  (극값 세트 셋째 칸)
//
// [초등학생 맞춤형 v4 — 3연속 내비게이션 & 휘어짐 판독 연관 사고 에디션]
// - 지루한 O/X 격자표와 순간이동하는 계단 그래프를 제거했습니다.
// - "길이 구부러지는 방향(∩형 언덕 vs ∪형 분지)"을 연속적인 휘어짐 판독 그래프로 보여줍니다.
// - 상하 그래프를 일치시켜 생각하도록 돕는 '세로 레이저 가이드선'을 추가했습니다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

const D = 0.5; // 앞뒤 비교 거리 (아이들이 인지하기 좋게 0.5로 최적화)

export function renderExtremumTurn(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [0, 8]);
  const xMin = xRange[0] + D + 0.1, xMax = xRange[1] - D - 0.1;
  const px = sharedXByLog?.[logIdx] ?? 3.5;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  // 순간 경사(기울기) 계산 함수
  const eps = 1e-4;
  const df = (x) => (f(x + eps) - f(x - eps)) / (2 * eps);

  const slopeL = df(px - D); // 지나온 길(뒤)의 경사
  const slopeR = df(px + D); // 다가올 길(앞)의 경사

  // "길의 휘어짐(곡률)" 함수 (오른쪽 경사 - 왼쪽 경사)
  const bend = (x) => df(x + D) - df(x - D);
  const currentBend = bend(px);

  // 앞뒤 경사 변화를 바탕으로 한 상태 판정
  const beforeUp = slopeL > 0.05;
  const afterUp = slopeR > 0.05;

  let turnState = 0; // 1: 극대(꼭대기), -1: 극소(골짜기), 0: 비탈
  if (beforeUp && !afterUp) turnState = 1;
  else if (!beforeUp && afterUp) turnState = -1;

  let stateText = '가던 방향 그대로 쭉 흘러가는 비탈길이에요 🧗';
  let stateColor = '#5f5e5a';
  let emoji = '🧗';

  if (turnState === 1) {
    stateText = '올라갔다가 내려가는 전환점, 산꼭대기(극대)입니다! 👑';
    stateColor = '#2e7d32';
    emoji = '👑';
  } else if (turnState === -1) {
    stateText = '내려갔다가 올라가는 전환점, 골짜기(극소)입니다! ⛺';
    stateColor = '#c0392b';
    emoji = '⛺';
  }

  // 앞뒤 정보 카드 공통 스타일
  const cardStyle = (active, color) => ({
    flex: 1,
    padding: '8px',
    borderRadius: '10px',
    textAlign: 'center',
    border: `2px solid ${active ? color : '#e2e8f0'}`,
    background: active ? `${color}11` : '#ffffff',
    color: active ? color : '#94a3b8',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    fontSize: '13px'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'sans-serif' }}>
      
      {/* 1. 상단 현재 상태 창 */}
      <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '12px', border: `2px solid ${stateColor}`, textAlign: 'center' }}>
        <div style={{ fontSize: '22px', marginBottom: '4px' }}>{emoji}</div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: stateColor }}>{stateText}</div>
        <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>
          👉 아래 산길 위의 빨간 점을 좌우로 끌며 내비게이션의 변화를 관찰해보세요!
        </div>
      </div>

      {/* 2. 내비게이션 화살표 표지판 삼형제 (OX 표 대체) */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        <div style={cardStyle(true, beforeUp ? '#2e7d32' : '#c0392b')}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>◀ 방금 지나온 길 (뒤)</div>
          <div style={{ fontSize: '18px' }}>{beforeUp ? '↗ 오르막' : '↘ 내리막'}</div>
        </div>
        
        <div style={cardStyle(true, stateColor)}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>● 내 위치 (나)</div>
          <div style={{ fontSize: '18px' }}>
            {turnState === 1 ? '👑 꼭대기' : turnState === -1 ? '⛺ 골짜기' : '🧗 비탈길'}
          </div>
        </div>

        <div style={cardStyle(true, afterUp ? '#2e7d32' : '#c0392b')}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>곧 마주할 길 (앞) ▶</div>
          <div style={{ fontSize: '18px' }}>{afterUp ? '↗ 오르막' : '↘ 내리막'}</div>
        </div>
      </div>

      {/* 3. 상단 그래프: 산길과 앞뒤 가이드 점 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '6px' }}>
          🏔️ 1단계: 등산 코스와 내 위치 (앞뒤 점이 오르막인지 내리막인지 알려줘요!)
        </div>
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          
          {/* 가로 좌표 동기화를 위한 세로 레이저 점선 */}
          <Line.Segment
            point1={[px, yRange[0]]}
            point2={[px, yRange[1]]}
            color="#d1d8e0"
            style={{ strokeDasharray: "4 4" }}
          />

          {/* 원래 산길 곡선 */}
          <Plot.OfX y={f} color={Theme.blue} weight={4} />

          {/* 지나온 길 참고 점 (뒤) */}
          <Point x={px - D} y={f(px - D)} color={beforeUp ? Theme.green : Theme.red} size={5} />
          
          {/* 다가올 길 참고 점 (앞) */}
          <Point x={px + D} y={f(px + D)} color={afterUp ? Theme.green : Theme.red} size={5} />

          {/* 내 위치 (MovablePoint) */}
          <MovablePoint
            point={[px, f(px)]}
            constrain={(pos) => {
              const cx = Math.min(xMax, Math.max(xMin, pos[0]));
              return [cx, f(cx)];
            }}
            color={Theme.red}
            onMove={(pos) => setPx(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '11px', color: '#7f8c8d', textAlign: 'center', marginTop: '4px' }}>
          초록 점 = 오르막 구역에 있음 | 빨간 점 = 내리막 구역에 있음
        </div>
      </div>

      {/* 4. 하단 그래프: 순간 기울기 판독기 (곡선 플롯 및 조작 연동만 df로 교체) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '6px' }}>
          📈 2단계: 길의 순간 기울기 판독기 (순간 기울기 곡선)
        </div>
        <Mafs viewBox={{ x: xRange, y: [-2.5, 3.5] }} preserveAspectRatio={false} height={160}>
          <Coordinates.Cartesian />
          
          {/* 가로 좌표 동기화를 위한 세로 레이저 점선 */}
          <Line.Segment
            point1={[px, -2.5]}
            point2={[px, 3.5]}
            color="#d1d8e0"
            style={{ strokeDasharray: "4 4" }}
          />

          {/* 수평 기준선 (기울기가 없는 평평한 상태) */}
          <Line.Segment
            point1={[xRange[0], 0]}
            point2={[xRange[1], 0]}
            color="#7f8c8d"
            style={{ strokeDasharray: "3 3" }}
          />

          {/* 순간 기울기 곡선 (도함수 df 플롯) */}
          <Plot.OfX y={df} color={Theme.purple} weight={3} />

          {/* 현재 내 위치의 순간 기울기 값을 나타내는 빨간 점 */}
          <MovablePoint
            point={[px, df(px)]}
            constrain={(pos) => {
              const cx = Math.min(xMax, Math.max(xMin, pos[0]));
              return [cx, df(cx)];
            }}
            color={Theme.red}
            onMove={(pos) => setPx(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '4px' }}>
          가로=위치, 세로=길의 기울기 (<b>위(+) 영역</b>: 오르막, <b>아래(-) 영역</b>: 내리막)
        </div>
      </div>

      {/* 5. 초등 기하학적 연관 가이드 */}
      <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '12px', border: '1px dashed #f59e0b' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#b45309', marginBottom: '4px' }}>
          🎯 그래프 연계 사고 미션!
        </div>
        <div style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.5' }}>
          위의 빨간 점을 잡고 움직이며 아래 보라색 그래프의 높낮이를 살펴보세요.
          <br />
          👉 등산가가 <b>산꼭대기 👑</b>를 지날 때: 아래 그래프의 점은 <b>가장 아래쪽(-)</b>으로 쑤욱 들어갑니다! (길이 아래로 ∩ 굽기 때문이에요)
          <br />
          👉 등산가가 <b>골짜기 ⛺</b>를 지날 때: 아래 그래프의 점은 <b>가장 위쪽(+)</b>으로 높게 올라갑니다! (길이 위로 ∪ 굽기 때문이에요)
        </div>
      </div>

    </div>
  );
}