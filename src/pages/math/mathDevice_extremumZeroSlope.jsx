// ===========================================================
// no:"4b" ★ "기울기 0 — 꼭대기에선 잠깐 평평하다"  (극값 세트 반전 칸)
//
// [초등학생 맞춤형 v4 — 스케이트보드 & 수평계 연관 사고 에디션]
// - 벡터 화살표 대신 직관적인 '스케이트보드'와 '물리 수평계'를 도입했습니다.
// - 위아래 그래프의 x축 위치를 일치시키는 '세로 레이저 가이드선'을 추가했습니다.
// - 안전한 Line.Segment 컴포넌트를 사용하여 렌더링 에러를 완전히 방지했습니다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderExtremumZeroSlope(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [0, 8]);
  const xMin = xRange[0] + 0.2, xMax = xRange[1] - 0.2;
  const px = sharedXByLog?.[logIdx] ?? 3.5;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  const eps = 1e-4;
  const df = (x) => (f(x + eps) - f(x - eps)) / (2 * eps);
  const slope = df(px);
  
  // 초등학생이 수평을 맞추기 쉽도록 판정 범위(역치)를 약간 넓혀 조정 (0.1)
  const isFlat = Math.abs(slope) < 0.12;
  const y0 = f(px);

  // 캐릭터 멘트 및 스타일 설정
  let word = '';
  let wc = '#5f5e5a';
  let levelBg = '#f1c40f'; // 기본 노란색 수평계
  let emoji = '🧗';

  if (isFlat) {
    // 꼭대기인지 바닥인지 판정
    const leftY = f(px - 0.3);
    const rightY = f(px + 0.3);
    if (y0 > leftY && y0 > rightY) {
      word = '우와! 산꼭대기(봉우리)에 도달해서 보드가 수평이 되었어요! 👑';
      emoji = '👑';
    } else {
      word = '찾았다! 가장 깊은 골짜기(바닥)에서 보드가 평평해졌어요! ⛺';
      emoji = '⛺';
    }
    wc = '#2e7d32';
    levelBg = '#2ecc71'; // 수평 성공 시 초록색으로 변경
  } else if (slope > 0) {
    word = '끙차끙차! 가파른 오르막길을 올라가는 중이에요! (기울기 +)';
    wc = '#2980b9';
    emoji = '🧗';
  } else {
    word = '슈우웅! 신나게 내리막길을 내려가는 중이에요! (기울기 -)';
    wc = '#e67e22';
    emoji = '🏂';
  }

  // 도함수 최소/최대 영역 구하기
  let dMin = Infinity, dMax = -Infinity;
  for (let x = xRange[0]; x <= xRange[1]; x += 0.05) {
    const d = df(x); if (d < dMin) dMin = d; if (d > dMax) dMax = d;
  }
  const dPad = (dMax - dMin) * 0.15;
  const yRangeLower = [dMin - dPad, dMax + dPad];

  // 수평계 방울 위치 계산 (기울기값에 비례하여 좌우로 이동, 최대 30px 제한)
  const bubbleOffset = Math.max(-30, Math.min(30, -slope * 20));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'sans-serif' }}>
      
      {/* 1. 상단 알림창 & 물리식 액체 수평계 시뮬레이터 */}
      <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '12px', border: `2px solid ${wc}`, textAlign: 'center', transition: 'all 0.2s' }}>
        <div style={{ fontSize: '22px', marginBottom: '4px' }}>{emoji}</div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginBottom: '10px' }}>{word}</div>
        
        {/* 수평계 도구 비주얼 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' }}>실시간 보드 수평계 판독기</div>
          <div style={{
            width: '120px',
            height: '20px',
            background: levelBg,
            border: '2px solid #34495e',
            borderRadius: '10px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)',
            transition: 'background-color 0.2s'
          }}>
            {/* 정중앙 가이드 라인 (수평 마크) */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: '#34495e', opacity: 0.4 }} />
            <div style={{ position: 'absolute', left: 'calc(50% - 10px)', top: 0, bottom: 0, width: '20px', borderLeft: '1px dashed #34495e', borderRight: '1px dashed #34495e', opacity: 0.3 }} />
            
            {/* 수평계 기포 (기울어지면 한쪽으로 쏠림) */}
            <div style={{
              width: '14px',
              height: '14px',
              background: '#ffffff',
              borderRadius: '50%',
              position: 'absolute',
              top: '1px',
              left: `calc(50% - 7px + ${bubbleOffset}px)`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'left 0.05s ease-out'
            }} />
          </div>
        </div>
      </div>

      {/* 2. 상단 그래프: 롤러코스터 산길 & 스케이트보드 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '6px' }}>
          🎢 1단계: 산길 위의 보드 타기 (보드가 평평해지는 곳을 찾으세요!)
        </div>
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          
          {/* 가로축 동기화를 시각적으로 연결해주는 세로 레이저 가이드선 */}
          <Line.Segment
            point1={[px, yRange[0]]}
            point2={[px, yRange[1]]}
            color="#d1d8e0"
            style={{ strokeDasharray: "4 4" }}
          />

          {/* 산길 원래 곡선 */}
          <Plot.OfX y={f} color={Theme.blue} weight={4} />

          {/* 스케이트보드 데크 (접선 막대) */}
          <Line.Segment
            point1={[px - 0.5, y0 - 0.5 * slope]}
            point2={[px + 0.5, y0 + 0.5 * slope]}
            color={isFlat ? Theme.orange : Theme.green}
            weight={6}
          />
          
          {/* 스케이트보드 왼쪽 바퀴 */}
          <Point
            x={px - 0.25}
            y={y0 - 0.25 * slope - 0.15}
            color="#2c3e50"
            size={4}
          />

          {/* 스케이트보드 오른쪽 바퀴 */}
          <Point
            x={px + 0.25}
            y={y0 + 0.25 * slope - 0.15}
            color="#2c3e50"
            size={4}
          />

          {/* 스케이트보드 중심축 (드래그 가능한 빨간 점) */}
          <MovablePoint
            point={[px, y0]}
            constrain={(pos) => {
              const cx = Math.min(xMax, Math.max(xMin, pos[0]));
              return [cx, f(cx)];
            }}
            color={Theme.red}
            onMove={(pos) => setPx(pos[0])}
          />
        </Mafs>
      </div>

      {/* 3. 하단 그래프: 오르내림 계측기 (도함수) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '6px' }}>
          📈 2단계: 오르내림 수치 판독 그래프 (기울기 = 보드가 기운 정도)
        </div>
        <Mafs viewBox={{ x: xRange, y: yRangeLower }} preserveAspectRatio={false} height={160}>
          <Coordinates.Cartesian />
          
          {/* 가로축 동기화를 시각적으로 연결해주는 세로 레이저 가이드선 */}
          <Line.Segment
            point1={[px, yRangeLower[0]]}
            point2={[px, yRangeLower[1]]}
            color="#d1d8e0"
            style={{ strokeDasharray: "4 4" }}
          />

          {/* 경사가 정확히 0이 되는 '수평 기준선' */}
          <Line.Segment
            point1={[xRange[0], 0]}
            point2={[xRange[1], 0]}
            color={Theme.orange}
            weight={2}
            style={{ strokeDasharray: "2 2" }}
          />

          {/* 경사도 곡선 */}
          <Plot.OfX y={df} color={Theme.violet} weight={3} />

          {/* 경사도 곡선 위에서 함께 움직이는 계측 점 */}
          <MovablePoint
            point={[px, slope]}
            constrain={(pos) => {
              const cx = Math.min(xMax, Math.max(xMin, pos[0]));
              return [cx, df(cx)];
            }}
            color={Theme.red}
            onMove={(pos) => setPx(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '4px' }}>
          두 그래프의 <b>세로 레이저 선</b>은 항상 같은 가로 위치를 가리키며 동기화됩니다.
        </div>
      </div>

      {/* 4. 초등 기하학적 연관 가이드 */}
      <div style={{ background: '#eef2f7', borderRadius: '12px', padding: '12px', border: '1px solid #d1d8e0' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34495e', marginBottom: '4px' }}>
          🎯 오늘의 기하 탐험 미션!
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', lineHeight: '1.5' }}>
          위아래 그래프 중 아무 점이나 마우스로 흔들며 다음 연결고리를 눈으로 찾아보세요!
          <br />
          👉 <b>위 그래프에서 보드가 완전히 수평 👑⛺ 이 되는 순간</b>, 
          아래 판독 그래프의 빨간 점은 정확히 <b>주황색 0선</b>을 스치고 지나갑니다!
        </div>
      </div>

    </div>
  );
}