// ===========================================================
// no:"4a" "봉우리와 골 — 오르내림 판독기로 찾는 산꼭대기와 골짜기"
//
// [초등학생 맞춤형 v4 — 기하학적 연관 사고 훈련 에디션]
// - 계단식 그래프와 이산적 순위 비교를 제거했습니다.
// - "오르막/내리막의 기울기(변화율)"를 연속적인 경사도 그래프로 시각화합니다.
// - "꼭대기/골짜기 = 경사도가 0"이라는 미적분의 핵심 직관을 선 그래프로 연결합니다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

const STEP = 0.6;

export function renderPeakValley(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  
  // 원래 곡선 함수 f(x)
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  // 수치 미분을 통한 오르내림 경사도(기울기) 함수 df(x)
  const df = (x) => {
    const h = 0.001;
    try {
      return (f(x + h) - f(x - h)) / (2 * h);
    } catch (e) {
      return 0;
    }
  };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [0, 8]);
  const xMin = xRange[0] + 0.1, xMax = xRange[1] - 0.1;
  
  // 공유되는 빨간 점(등산가)의 x 좌표
  const px = sharedXByLog?.[logIdx] ?? 3.5;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  const currentY = f(px);
  const currentSlope = df(px);

  // 캐릭터 상태 판단 (초등 눈높이에 맞춘 감성 피드백)
  let stateText = '';
  let stateColor = '#5f5e5a';
  let emoji = '🧗';
  const slopeThreshold = 0.15; // 꼭대기/바닥을 판정하기 위한 완만한 구간 역치

  if (Math.abs(currentSlope) <= slopeThreshold) {
    // 꼭대기(극대)인지 골짜기(극소)인지 좌우 높이로 판정
    const leftY = f(px - 0.4);
    const rightY = f(px + 0.4);
    if (currentY > leftY && currentY > rightY) {
      stateText = '산꼭대기(봉우리) 도착! 주변에서 내가 가장 높아! 👑';
      stateColor = '#2e7d32'; // 초록
      emoji = '👑';
    } else if (currentY < leftY && currentY < rightY) {
      stateText = '골짜기(바닥) 도착! 가장 낮은 아늑한 곳이야! ⛺';
      stateColor = '#c0392b'; // 빨강
      emoji = '⛺';
    } else {
      stateText = '완만하고 평평한 길을 걷고 있어 🪵';
      stateColor = '#7f8c8d';
      emoji = '🚶';
    }
  } else if (currentSlope > slopeThreshold) {
    stateText = '영차영차! 오르막길을 올라가는 중이야 🧗';
    stateColor = '#2980b9'; // 파랑
    emoji = '🧗';
  } else {
    stateText = '슈우웅~ 신나게 내려막길을 내려가는 중이야 🏂';
    stateColor = '#e67e22'; // 주황
    emoji = '🏂';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'sans-serif' }}>
      
      {/* 1. 현재 등산가의 상태창 */}
      <div style={{ background: '#f5f6fa', borderRadius: '12px', padding: '12px', border: `2px solid ${stateColor}`, textAlign: 'center', transition: 'all 0.2s' }}>
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{emoji}</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: stateColor }}>
          {stateText}
        </div>
        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
          👉 아래 산길 위의 빨간 점을 직접 좌우로 끌어보세요!
        </div>
      </div>

      {/* 2. 메인 그래프: 내가 걷는 산길 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🏔️</span> 1단계: 등산가의 위치와 산길 (높이 그래프)
        </div>
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          {/* 산길 곡선 */}
          <Plot.OfX y={f} color={Theme.blue} weight={4} />
          
          {/* 현재 위치에서의 경사 상태를 직관적으로 보여주는 노란 접선 막대 */}
          <Line.Segment
            point1={[px - 0.5, currentY - 0.5 * currentSlope]}
            point2={[px + 0.5, currentY + 0.5 * currentSlope]}
            color={Theme.yellow}
            weight={4}
          />

          {/* 직접 드래그하는 등산가 점 (MovablePoint) */}
          <MovablePoint
            point={[px, currentY]}
            constrain={(pos) => {
              const cx = Math.min(xMax, Math.max(xMin, pos[0]));
              return [cx, f(cx)];
            }}
            color={Theme.red}
            onMove={(pos) => setPx(pos[0])}
          />
        </Mafs>
      </div>

      {/* 3. 연계 그래프: 오르내림 판독기 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>📈</span> 2단계: 오르내림 판독기 (경사도 그래프)
        </div>
        <Mafs viewBox={{ x: xRange, y: [-3, 3] }} preserveAspectRatio={false} height={140}>
          {/* 가로축과 세로 격자 표시 */}
          <Coordinates.Cartesian xAxis={{ lines: 1 }} yAxis={{ lines: 1 }} />
          
          {/* 경사가 정확히 0이 되는 '완전히 평평한 지점' 안내선 */}
          <Line.Horizontal y={0} color="#7f8c8d" style="dashed" />

          {/* 경사도 곡선 (미분 그래프) */}
          <Plot.OfX y={df} color={Theme.purple} weight={3} />

          {/* 위 등산가의 가로 위치와 연동되는 오르내림 판독 점 */}
          <Point x={px} y={currentSlope} color={Theme.red} size={6} />

          {/* 위 그래프의 x좌표와 아래 그래프의 x좌표를 연결하여 생각하도록 돕는 가이드 점선 */}
          <Line.Segment
            point1={[px, 0]}
            point2={[px, currentSlope]}
            color="#95a5a6"
            style="dashed"
          />
        </Mafs>
      </div>

      {/* 4. 그래프 연관 사고 가이드 북 */}
      <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '12px', border: '1px dashed #f59e0b' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#b45309', marginBottom: '6px' }}>
          💡 꼭 찾아봐야 할 그래프의 비밀! (그래프 연관 훈련)
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li>
            <b>비밀 1:</b> 등산가가 <b>산꼭대기 👑</b>나 <b>골짜기 ⛺</b>에 서면, 아래 판독기의 빨간 점은 정확히 <b>가운데 선(0)</b>에 걸치게 돼요! (경사가 없으니까요!)
          </li>
          <li>
            <b>비밀 2:</b> <b>오르막길 🧗</b>을 올라갈 때는 아래 판독기 그래프가 <b>가운데 선보다 위쪽(+)</b>에 그려져요.
          </li>
          <li>
            <b>비밀 3:</b> <b>내려막길 🏂</b>을 내려갈 때는 아래 판독기 그래프가 <b>가운데 선보다 아래쪽(-)</b>에 그려져요.
          </li>
        </ul>
      </div>

    </div>
  );
}