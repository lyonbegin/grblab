import React from 'react';
import { Mafs, Coordinates, Point, Line, MovablePoint } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderHighestPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 비교할 5개의 점
  const pts = Array.isArray(v.points) && v.points.length
    ? v.points
    : [{ x: 1, y: 3 }, { x: 2, y: 6 }, { x: 3, y: 2 }, { x: 4, y: 5 }, { x: 5, y: 4 }];

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  
  // 마진이 확보된 뷰포트 영역
  const xRange = toRange(v.xRange, [-0.8, maxX + 1.2]);
  const yRange = toRange(v.yRange, [-0.8, Math.max(...ys) + 1.2]);

  // 상태 관리: 주황색 바닥 탐색기의 X축 위치 (기본값은 첫 번째 점인 1.0)
  const st = sharedXByLog?.[logIdx] || {};
  const xVal = st.xVal ?? 1.0;

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  // [그래프 연동 핵심 수식] 
  // 현재 조종기 위치(xVal)와 가로축 거리(x)가 가장 가까운 점을 실시간으로 찾아 자석처럼 락온합니다.
  const activePoint = pts.reduce((prev, curr) => 
    Math.abs(curr.x - xVal) < Math.abs(prev.x - xVal) ? curr : prev
  );

  // 최고점과 최저점을 찾아 HUD 비교용으로 사용
  const absoluteMax = pts.reduce((a, b) => (b.y > a.y ? b : a));
  const absoluteMin = pts.reduce((a, b) => (b.y < a.y ? b : a));

  const isHighest = activePoint.y === absoluteMax.y;
  const isLowest = activePoint.y === absoluteMin.y;

  // 실시간 기하 눈금 1:1 대응 비율 계산 (HTML 라벨 실시간 비행용)
  const zeroXPct = ((0 - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const targetXPct = ((activePoint.x - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const targetYPct = ((yRange[1] - activePoint.y) / (yRange[1] - yRange[0])) * 100;

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    card: { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'center' },
    hud: { 
      background: isHighest ? '#f0fdf4' : (isLowest ? '#fef2f2' : '#f1f5f9'), 
      border: `2px solid ${isHighest ? '#bbf7d0' : (isLowest ? '#fecaca' : '#cbd5e1')}`, 
      borderRadius: '12px', padding: '12px', marginTop: '10px', transition: 'all 0.3s' 
    },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .mafs-6a-engine .MafsView { background-color: transparent !important; }
        .mafs-6a-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 실시간 락온 전광판 (HUD) */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}>
          🎯 바닥의 탐색기를 움직여 점들을 조준해 보세요!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
          탐색기를 드래그하면, 점들이 자석처럼 챡 감기며 진짜 세로 높이(Y값)를 알려줍니다.
        </div>

        <div style={styles.hud}>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
            {isHighest && '👑 [축하합니다] 우주 최고 높이 선점!'}
            {isLowest && '🕳️ [찾았습니다] 우주 최저 높이 선점!'}
            {!isHighest && !isLowest && '🔍 현재 점을 탐색하는 중...'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: isHighest ? '#16a34a' : (isLowest ? '#dc2626' : '#3b82f6'), marginTop: '4px' }}>
            조준된 진짜 높이 Y = {activePoint.y}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            가로로 {activePoint.x}번째 칸에 있는 이 점의 높이는 <b>{activePoint.y}</b> 입니다!
          </div>
        </div>
      </div>

      {/* 2. 인터랙티브 마법 캔버스 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-6a-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={280}>
            <Coordinates.Cartesian />

            {/* 세로 스캔 레이저 빔 (탐색기 위치에서 올라가는 기하 기둥) */}
            <Line.Segment
              point1={[xVal, -1]}
              point2={[xVal, 13]}
              color="#ea580c"
              weight={1.5}
              style="dashed"
            />

            {/* 락온된 점의 Y축 레이저 조사선 */}
            <Line.Segment
              point1={[activePoint.x, activePoint.y]}
              point2={[0, activePoint.y]}
              color={isHighest ? '#16a34a' : (isLowest ? '#dc2626' : '#2563eb')}
              weight={4}
            />

            {/* 락온된 점과 바닥 탐색기를 연결하는 보조선 */}
            <Line.Segment
              point1={[activePoint.x, activePoint.y]}
              point2={[activePoint.x, 0]}
              color="#cbd5e1"
              weight={1}
              style="dashed"
            />

            {/* 지도 위의 점들 렌더링 */}
            {pts.map((p, i) => {
              const isActive = p === activePoint;
              return (
                <Point
                  key={i}
                  x={p.x}
                  y={p.y}
                  color={isActive ? (isHighest ? '#16a34a' : (isLowest ? '#dc2626' : '#2563eb')) : '#94a3b8'}
                  svgCircleProps={{ r: isActive ? 8 : 4.5 }}
                />
              );
            })}

            {/* [연동의 심장] 바닥 X축 위를 지나다니는 주황색 조종 탐색기 */}
            <MovablePoint
              point={[xVal, 0]}
              color="#ea580c"
              constrain={(pos) => [Math.min(maxX, Math.max(minX, pos[0])), 0]}
              onMove={(pos) => patchState({ xVal: pos[0] })}
            />
          </Mafs>

          {/* 3. 실시간 비행형 HTML 정보 오버레이 */}
          {/* Y축 충돌판 표지판 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${zeroXPct}%`,
            top: `${targetYPct}%`,
            transform: 'translate(-105%, -50%)',
            backgroundColor: isHighest ? '#dcfce7' : (isLowest ? '#fee2e2' : '#eff6ff'),
            color: isHighest ? '#15803d' : (isLowest ? '#b91c1c' : '#1d4ed8'),
            border: `1.5px solid ${isHighest ? '#86efac' : (isLowest ? '#fca5a5' : '#bfdbfe')}`
          }}>
            🎯 진짜 값 (Y = {activePoint.y})
          </div>

          {/* 타깃 점 머리 위의 칭호 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${targetXPct}%`,
            top: `${targetYPct}%`,
            transform: 'translate(-50%, -140%)',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #0f172a'
          }}>
            {isHighest ? '👑 세상에서 가장 높은 최대!' : (isLowest ? '🕳️ 세상에서 가장 낮은 최소!' : '🔍 조준 완료!')}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
        👇 아래 주황색 조종 노브(탐색기)를 좌우로 드래그하여 움직여 보세요!
      </div>
    </div>
  );
}