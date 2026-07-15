import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint, Line, Point, Text, Polygon } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * ============================================================================
 * [대단원 8-3] 두 레일의 충돌과 가로축의 비밀 (직접 인터랙션 마스터판)
 * ============================================================================
 * * 🛠️ [엔터프라이즈 설계 규칙]
 * 1. 외부 조작 컨트롤러 완전 배제: 오직 Mafs 내부 기하 요소로만 제어합니다.
 * 2. 상하단 양방향 인클로저: 타임 빔을 움직여 충돌 지점을 서치합니다.
 * 3. 정합성 스냅: x축 0.1 단위 정밀 제어 및 교점 조우 시 자석 흡착.
 * 4. Zero-Hook 아키텍처: 외부 바인딩 상태 모델 완벽 수호.
 */
export function renderIntersectX(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG_TAG = '[mathDevice_intersectX]';
  const v = log.visual;

  if (!v || v.kind !== 'mafs_function') {
    console.error(`${DEBUG_TAG} 비주얼 데이터 규격 매칭 실패`);
    return null;
  }

  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-0.5, 8.5]);

  // =================================================================
  // 📐 [수학 정의] 두 제트기의 비행 함수 규칙
  // 제트기 A: y = x + 3  |  제트기 B: y = -x + 7
  // 수학적 교점(방정식의 해)은 정확히 x = 2, y = 5 지점입니다.
  // =================================================================
  const fA = (x) => x + 3;
  const fB = (x) => -x + 7;
  const targetX = 2.0;
  const targetY = 5.0;

  // =================================================================
  // 🔌 [상태 매핑] Zero-Hook 데이터 싱크 로직
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const xVal = st.xVal ?? 0.5; // 사용자가 탐색 중인 현재 시간/위치 (x축값)

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: {
        ...(prev?.[logIdx] || {}),
        ...updatedFields
      }
    }));
  };

  const currentYA = fA(xVal);
  const currentYB = fB(xVal);
  const isCollided = Math.abs(xVal - targetX) < 0.05; // 충돌 지점 조우 판정

  // 실시간 기하 결합 상태별 HUD 텍스트 정의
  let hudText = "✈️ 두 제트기가 날아가고 있습니다. 세로축 레이저 타임 바를 움직여 두 궤적이 충돌하는 운명의 순간을 잡으세요!";
  let HUD_BG = "#f8fafc";
  let HUD_BORDER = "#e2e8f0";
  let HUD_COLOR = "#334155";

  if (isCollided) {
    hudText = "💥 조우 성공! 두 비행선이 공중에서 크로스했습니다! 이때의 [가로축 위치 x = 2]가 바로 연립방정식의 해입니다!";
    HUD_BG = "#fee2e2";
    HUD_BORDER = "#fecaca";
    HUD_COLOR = "#991b1b";
  }

  // =================================================================
  // 🎨 [스타일 디자인 팩]
  // =================================================================
  const styles = {
    box: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    hud: { background: HUD_BG, border: `2px solid ${HUD_BORDER}`, color: HUD_COLOR, borderRadius: '16px', padding: '14px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
    hudTitle: { fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', display: 'block' },
    layoutPanel: { background: '#ffffff', borderRadius: '16px', padding: '12px', border: '2px solid #e2e8f0' },
    layoutTitle: { fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', textAlign: 'center' },
    frame: { background: '#f0fdfa', borderRadius: '12px', border: '1px solid #ccfbf1', overflow: 'hidden' },
    mathFrame: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    indicatorBoard: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px' },
    card: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', textAlign: 'center', fontSize: '12px' },
    footer: { fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '6px', lineHeight: '1.4' }
  };

  return (
    <div style={styles.box}>
      
      <style>{`
        .mafs-intersect-space .MafsView { background-color: transparent !important; }
        .mafs-intersect-space .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 📡 상단 정보 브리핑 대시보드 */}
      <div className="viz-box" style={styles.hud}>
        <span style={styles.hudTitle}>🚀 실시간 충돌 궤적 레이더 추적망</span>
        <div>{hudText}</div>
      </div>

      {/* 🎬 1층: 시뮬레이션 기지 (두 제트기 크로스 연출) */}
      <div className="viz-box" style={styles.layoutPanel}>
        <div style={styles.layoutTitle}>
          🎬 <b>[1층 시뮬레이션]</b> 주황색 세로 탐색 장벽을 좌우로 직접 밀어보세요!
        </div>
        <div className="mafs-intersect-space" style={styles.frame}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={200}>
            {/* 비행 유도 궤적 레일 사전 드로잉 */}
            <Line.Linear slope={1} intercept={3} color="#94a3b8" weight={1.5} style="dashed" />
            <Line.Linear slope={-1} intercept={7} color="#94a3b8" weight={1.5} style="dashed" />

            {/* 실시간 탐색 타임 빔 장벽 */}
            <Line.Segment point1={[xVal, -0.5]} point2={[xVal, 8.5]} color="#ea580c" weight={3} />

            {/* 제트기 A 실시간 궤도 및 본체 배치 */}
            <Point x={xVal} y={currentYA} color="#2563eb" size={4} />
            <Text x={xVal} y={currentYA + 0.4} size={16} attach="center">✈️</Text>
            
            {/* 제트기 B 실시간 궤도 및 본체 배치 */}
            <Point x={xVal} y={currentYB} color="#db2777" size={4} />
            <Text x={xVal} y={currentYB + 0.4} size={16} attach="center">🛩️</Text>

            {/* 두 제트기가 만나 충돌하는 운명의 교점 스포트라이트 */}
            <Point x={targetX} y={targetY} color={isCollided ? Theme.red : "#cbd5e1"} size={isCollided ? 8 : 4} />
            {isCollided && <Text x={targetX} y={targetY - 0.6} size={20} attach="s">💥</Text>}

            {/* 🎮 [직접 인터랙션 1] 바닥 타임라인 제어 노드 */}
            <MovablePoint
              point={[xVal, 0]}
              color="#ea580c"
              constrain={(pos) => [Math.min(GMAX, Math.max(0, Math.round(pos[0] * 10) / 10)), 0]}
              onMove={(pos) => patchState({ xVal: Math.min(GMAX, Math.max(0, Math.round(pos[0] * 10) / 10)) })}
            />
          </Mafs>
        </div>
      </div>

      {/* 📐 2층: 수학 그래프 기지 (데카르트 함수 격자) */}
      <div className="viz-box" style={styles.layoutPanel}>
        <div style={styles.layoutTitle}>
          📐 <b>[2층 데카르트 함수 그래프]</b> 두 직선이 충돌하는 교점의 비밀 주소
        </div>
        <div className="mafs-intersect-space" style={styles.mathFrame}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={240}>
            <Coordinates.Cartesian />

            {/* 수식 레일 매핑 */}
            <Plot.OfX y={fA} color="#2563eb" weight={3} />
            <Plot.OfX y={fB} color="#db2777" weight={3} />

            {/* 실시간 대입 위치 점선 기하선 레이저 */}
            <Line.Segment point1={[xVal, 0]} point2={[xVal, Math.max(currentYA, currentYB)]} color="#64748b" style="dashed" weight={1} />
            
            {/* 🎯 핵심 매핑: 충돌 지점 조우 시 바닥 x축으로 꽂히는 붉은색 해(Answer) 레이저 빔 */}
            {isCollided && (
              <Line.Segment point1={[targetX, 0]} point2={[targetX, targetY]} color={Theme.red} weight={3} />
            )}

            {/* 🎮 [직접 인터랙션 2] 그래프 위의 조종 교차점 노드 자체를 직접 드래그 */}
            <MovablePoint
              point={[xVal, (currentYA + currentYB) / 2]}
              color={Theme.red}
              constrain={(pos) => {
                const nx = Math.min(GMAX, Math.max(0, Math.round(pos[0] * 10) / 10));
                return [nx, (fA(nx) + fB(nx)) / 2];
              }}
              onMove={(pos) => patchState({ xVal: Math.min(GMAX, Math.max(0, Math.round(pos[0] * 10) / 10)) })}
            />

            <Text x={targetX} y={targetY} size={12} color="#0f172a" weight="bold" attach="ne">
              {`교점 (${targetX}, ${targetY})`}
            </Text>
          </Mafs>
        </div>

        {/* 📋 실시간 물리 연동 계기판 */}
        <div style={styles.indicatorBoard}>
          <div style={styles.card}>⏱️ 현재 위치 (<span style={{color:'#ea580c', fontWeight:'bold'}}>가로 x</span>)<br /><b>{xVal.toFixed(1)} 초</b></div>
          <div style={styles.card}>🔵 제트기 A 높이 (y1)<br /><b style={{color:'#2563eb'}}>{currentYA.toFixed(1)} m</b></div>
          <div style={styles.card}>🔴 제트기 B 높이 (y2)<br /><b style={{color:'#db2777'}}>{currentYB.toFixed(1)} m</b></div>
        </div>

        <div style={styles.footer}>
          두 직선이 공중에서 마주치는 지점에서 양쪽의 높이 계산 결과가 완벽히 같아집니다.
          <br />
          이때 문제가 요구하는 정답은 만난 빌딩의 높이(y)가 아니라, **그들이 조우한 바닥의 [가로 자리 x = 2]**가 진짜 방정식의 해가 됩니다.
        </div>
      </div>

    </div>
  );
}