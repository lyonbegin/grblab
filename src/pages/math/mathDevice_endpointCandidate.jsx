import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Polygon } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderEndpointCandidate(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 끝점이 최대가 되기 아주 좋은 곡선식 (중간에 귀여운 작은 봉우리가 있고, 오른쪽 끝으로 갈수록 가파르게 수직상승)
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.0*x*x+2.2*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;

  const f = (x) => {
    try {
      return compiled.evaluate({ x });
    } catch (e) {
      return NaN;
    }
  };

  const xRange = toRange(v.xRange, [0, 8]);
  const yRange = toRange(v.yRange, [-1, 9]);
  const winW = typeof v.windowWidth === 'number' ? v.windowWidth : 3;

  const wMin = xRange[0];
  const wMax = xRange[1] - winW;
  
  // 울타리 범위 조종 상태 관리
  const wStart = sharedXByLog?.[logIdx] ?? (wMin + (wMax - wMin) * 0.4);
  const setWStart = (val) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: Math.min(wMax, Math.max(wMin, val))
    }));
  };
  const wEnd = wStart + winW;

  // [실시간 1등 추적 알고리즘]
  let maxX = wStart;
  for (let x = wStart; x <= wEnd; x += 0.01) {
    if (f(x) > f(maxX)) maxX = x;
  }
  const maxY = f(maxX);

  // 최고점이 울타리 끝자리에 걸렸는지 판정 (자석 스냅 오차 0.05 확보)
  const isLeftEdge = Math.abs(maxX - wStart) < 0.05;
  const isRightEdge = Math.abs(maxX - wEnd) < 0.05;
  const atEdge = isLeftEdge || isRightEdge;

  // 울타리 밖 어둡게 처리용 박스 좌표 계산
  const leftDarkZone = [
    [xRange[0], yRange[0]],
    [wStart, yRange[0]],
    [wStart, yRange[1]],
    [xRange[0], yRange[1]],
  ];
  
  const rightDarkZone = [
    [wEnd, yRange[0]],
    [xRange[1], yRange[0]],
    [xRange[1], yRange[1]],
    [wEnd, yRange[1]],
  ];

  // 실시간 1등 점의 HTML 오버레이 위치 비율 계산
  const maxXPct = ((maxX - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const maxYPct = ((yRange[1] - maxY) / (yRange[1] - yRange[0])) * 100;

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    card: { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'center' },
    hud: { 
      background: atEdge ? '#fffbeb' : '#f0fdf4', 
      border: `2px solid ${atEdge ? '#fef08a' : '#bbf7d0'}`, 
      borderRadius: '12px', padding: '12px', marginTop: '10px', transition: 'all 0.3s'
    },
    sliderContainer: { display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0 4px 0', justifyContent: 'center' },
    slider: { width: '70%', accentColor: '#d97706', cursor: 'pointer', height: '6px', borderRadius: '4px' },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.15s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .mafs-6c-engine .MafsView { background-color: #fafafa !important; }
        .mafs-6c-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 기하학적 대반전을 전해주는 헤드보드 */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 'bold', marginBottom: '8px' }}>
          ⛰️ 벽 끝의 역습 — 둥근 꼭대기만 보면 백전백패!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          많은 학생들이 "1등은 무조건 평평한 산꼭대기"에서만 나온다고 오해해요.<br />
          하지만 아래 슬라이더로 울타리를 이리저리 옮기다 보면, <b>산꼭대기가 아닌 막다른 울타리 끝 벽자리</b>가 1등이 되는 대반전이 일어나요!
        </div>

        {/* 울타리 위치 슬라이더 */}
        <div style={styles.sliderContainer}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>👈 울타리 슬라이드</span>
          <input 
            type="range" 
            min={wMin} 
            max={wMax} 
            step={0.02} 
            value={wStart}
            onChange={(e) => setWStart(parseFloat(e.target.value))} 
            style={styles.slider} 
          />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#d97706' }}>오른쪽 👉</span>
        </div>

        {/* 대반전 상황판 (HUD) */}
        <div style={styles.hud}>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
            ⚔️ 현재 구역의 1등 챔피언 상태 판정
          </div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: atEdge ? '#b45309' : '#15803d', marginTop: '6px' }}>
            {atEdge 
              ? '💥 대반전! 평평한 꼭대기가 아닌 [막다른 울타리 벽 끝]이 1등입니다!' 
              : '🌳 안전 지대! 둥글게 솟아오른 [산꼭대기 쉼터]가 1등입니다!'
            }
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            현재 1등의 가로 위치: <b>x = {maxX.toFixed(1)}</b> | 진짜 높이: <b>y = {maxY.toFixed(1)}</b>
          </div>
        </div>
      </div>

      {/* 2. 인터랙티브 캔버스 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-6c-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={280}>
            <Coordinates.Cartesian />

            {/* 울타리 밖 어두운 영역 그늘막 (집중도 극대화) */}
            <Polygon points={leftDarkZone} color="#0f172a" opacity={0.4} />
            <Polygon points={rightDarkZone} color="#0f172a" opacity={0.4} />

            {/* 주황색 울타리 경계선 */}
            <Line.Segment point1={[wStart, yRange[0]]} point2={[wStart, yRange[1]]} color="#d97706" weight={3} />
            <Line.Segment point1={[wEnd, yRange[0]]} point2={[wEnd, yRange[1]]} color="#d97706" weight={3} />

            {/* 뒷배경 전체 곡선 */}
            <Plot.OfX y={f} color="#cbd5e1" weight={2} />

            {/* 울타리 안에서만 선명하게 움직이는 무대 곡선 */}
            <Plot.OfX y={f} color="#3b82f6" weight={4.5} domain={[wStart, wEnd]} />

            {/* [후보 1] 왼쪽 울타리 끝 벽 기하 점 */}
            <Point x={wStart} y={f(wStart)} color="#d97706" svgCircleProps={{ r: 5 }} />
            
            {/* [후보 2] 오른쪽 울타리 끝 벽 기하 점 */}
            <Point x={wEnd} y={f(wEnd)} color="#d97706" svgCircleProps={{ r: 5 }} />

            {/* 1등으로 당첨된 챔피언 점 조준선 및 포인터 */}
            <Line.Segment point1={[maxX, maxY]} point2={[0, maxY]} color={atEdge ? '#b45309' : '#16a34a'} weight={2.5} style="dashed" />
            <Point 
              x={maxX} 
              y={maxY} 
              color={atEdge ? '#d97706' : '#16a34a'} 
              svgCircleProps={{ r: 8 }} 
            />
          </Mafs>

          {/* 3. 기하학적 수치와 1:1 비행 연동되는 스마트 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${maxXPct}%`,
            top: `${maxYPct}%`,
            transform: 'translate(-50%, -140%)',
            backgroundColor: atEdge ? '#d97706' : '#16a34a',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            border: `2px solid ${atEdge ? '#fef08a' : '#86efac'}`
          }}>
            {atEdge 
              ? `⚡ 끝자리의 역습! (Y = ${maxY.toFixed(1)})` 
              : `👑 꺾이는 꼭대기! (Y = ${maxY.toFixed(1)})`
            }
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 'bold', lineHeight: '1.4' }}>
        울타리를 오른쪽 <b>[5.0 ~ 8.0]</b> 구역으로 쭉 밀어보세요!<br />
        중간에 봉우리가 없는데도 <span style={{ color: '#b45309', textDecoration: 'underline' }}>오른쪽 끝 장벽에 닿은 자리</span>가 가장 높은 진짜 최댓값이 되는 모습을 확인할 수 있습니다.
      </div>
    </div>
  );
}