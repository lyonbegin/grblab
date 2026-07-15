import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Polygon } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderWindowSlide(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 부드럽게 요동치는 3차 곡선 기본식
  const formula = (v.curves || [])[0]?.formula || '0.15*x*x*x-1.2*x*x+2*x+3.5';
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
  
  // 울타리(창문)의 가로 너비 (기본 2.5칸)
  const winW = typeof v.windowWidth === 'number' ? v.windowWidth : 2.5;

  const wMin = xRange[0];
  const wMax = xRange[1] - winW;
  
  // 울타리 시작 지점 상태 관리 (양방향 연동)
  const wStart = sharedXByLog?.[logIdx] ?? (wMin + (wMax - wMin) * 0.15);
  const setWStart = (val) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: Math.min(wMax, Math.max(wMin, val))
    }));
  };
  
  const wEnd = wStart + winW;

  // [실시간 최적값 탐색 알고리즘] 울타리 내부에서 미세한 보폭으로 최고/최저 높이 추적
  let maxX = wStart, minX = wStart;
  for (let x = wStart; x <= wEnd; x += 0.01) {
    if (f(x) > f(maxX)) maxX = x;
    if (f(x) < f(minX)) minX = x;
  }

  const maxY = f(maxX);
  const minY = f(minX);

  // 울타리 바깥 영역을 어둡게 가릴 투명 음영 다각형 좌표 계산 (Spotlight 기하 연산)
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

  // HTML 실시간 연동 오버레이 좌표 계산 (1:1 화면 비율 스냅용)
  const maxXPct = ((maxX - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const maxYPct = ((yRange[1] - maxY) / (yRange[1] - yRange[0])) * 100;
  const minXPct = ((minX - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const minYPct = ((yRange[1] - minY) / (yRange[1] - yRange[0])) * 100;

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    card: { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'center' },
    hud: { 
      background: '#f1f5f9', 
      border: '2px solid #cbd5e1', 
      borderRadius: '12px', padding: '10px 14px', marginTop: '10px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center'
    },
    sliderContainer: { display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0 6px 0', justifyContent: 'center' },
    slider: { width: '70%', accentColor: '#ea580c', cursor: 'pointer', height: '6px', borderRadius: '4px' },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.1s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .mafs-6b-engine .MafsView { background-color: #fafafa !important; }
        .mafs-6b-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 수학 핵심 직관 가이드 배너 */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 'bold', marginBottom: '8px' }}>
          🔋 울타리를 치면 진짜 1등(최대)이 무조건 태어난다!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          끝없이 날아가는 곡선에는 진짜 1등이 없어요. 하지만 아래 슬라이더로 <b>주황색 안전 울타리</b>를 딱 쳐서 가두면, 그 안에선 반드시 진짜 1등과 꼴찌가 단 한 명씩 보장된답니다!
        </div>

        {/* 인터랙티브 울타리 조종기 */}
        <div style={styles.sliderContainer}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>👈 울타리 이동</span>
          <input 
            type="range" 
            min={wMin} 
            max={wMax} 
            step={0.02} 
            value={wStart}
            onChange={(e) => setWStart(parseFloat(e.target.value))} 
            style={styles.slider} 
          />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ea580c' }}>오른쪽 👉</span>
        </div>

        {/* 울타리 내부 전광판 */}
        <div style={styles.hud}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>📍 현재 울타리 범위</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>
              {wStart.toFixed(1)} 칸 ~ {wEnd.toFixed(1)} 칸
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>👑 울타리 안 1등 (최대)</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>
              높이 {maxY.toFixed(1)}
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>🕳️ 울타리 안 꼴찌 (최소)</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#dc2626', marginTop: '2px' }}>
              높이 {minY.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 기하 인터랙티브 캔버스 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-6b-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={280}>
            <Coordinates.Cartesian />

            {/* 울타리 바깥 왼쪽 영역 어둡게 가리기 */}
            <Polygon points={leftDarkZone} color="#0f172a" opacity={0.4} />

            {/* 울타리 바깥 오른쪽 영역 어둡게 가리기 */}
            <Polygon points={rightDarkZone} color="#0f172a" opacity={0.4} />

            {/* 울타리 경계 기둥선 (주황색 장벽) */}
            <Line.Segment point1={[wStart, yRange[0]]} point2={[wStart, yRange[1]]} color="#ea580c" weight={3} />
            <Line.Segment point1={[wEnd, yRange[0]]} point2={[wEnd, yRange[1]]} color="#ea580c" weight={3} />

            {/* 기본 백그라운드 함수 곡선 */}
            <Plot.OfX y={f} color="#cbd5e1" weight={2} />

            {/* 울타리 내부에 활성화되어 빛나는 곡선 */}
            <Plot.OfX 
              y={f} 
              color="#3b82f6" 
              weight={4.5} 
              domain={[wStart, wEnd]} 
            />

            {/* 실시간 1등 점과 Y축 레이저 */}
            <Line.Segment point1={[maxX, maxY]} point2={[0, maxY]} color="#16a34a" weight={2.5} style="dashed" />
            <Point x={maxX} y={maxY} color="#16a34a" svgCircleProps={{ r: 7 }} />

            {/* 실시간 꼴찌 점과 Y축 레이저 */}
            <Line.Segment point1={[minX, minY]} point2={[0, minY]} color="#dc2626" weight={2.5} style="dashed" />
            <Point x={minX} y={minY} color="#dc2626" svgCircleProps={{ r: 7 }} />
          </Mafs>

          {/* 3. 실시간 비행형 HTML 정보 오버레이 */}
          {/* 1등 왕관 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${maxXPct}%`,
            top: `${maxYPct}%`,
            transform: 'translate(-50%, -140%)',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            👑 안쪽 1등 (Y = {maxY.toFixed(1)})
          </div>

          {/* 꼴찌 푯말 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${minXPct}%`,
            top: `${minYPct}%`,
            transform: 'translate(-50%, 140%)',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            🕳️ 안쪽 꼴찌 (Y = {minY.toFixed(1)})
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 'bold', lineHeight: '1.4' }}>
        슬라이더를 움직여 주황색 울타리를 양옆으로 밀어보세요! <br />
        울타리 안쪽의 파랗게 빛나는 구역 중에서 <b>가장 높고 낮은 점이 실시간으로 따라가며 1등을 갱신</b>합니다.
      </div>
    </div>
  );
}