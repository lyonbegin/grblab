import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint, Line, Point, Text, Polygon, Plot } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * ============================================================================
 * [대단원 8-1] 점 = 가로·세로 두 조건의 교차 (이원화 직접 인터랙션 마스터판)
 * ============================================================================
 * * 🛠️ [리팩토링 핵심 개선 사항]
 * 1. 외부 조작계(슬라이더) 100% 영구 퇴출.
 * 2. 상단 [레이저 스캔 바다] 직접 조작: 
 * - 가로축 오렌지 핸들([gx, 0])을 잡고 좌우로 흔들면 세로 레이저 벽 이동.
 * - 세로축 파란 핸들([0, gy])을 잡고 위아래로 흔들면 가로 레이저 벽 이동.
 * - 교차점 빨간 핸들([gx, gy])을 잡으면 두 장벽 동시 제어.
 * 3. 하단 [데카르트 수학 그래프] 직접 조작:
 * - 평면 위의 빨간 점([gx, gy])을 직접 마우스로 잡고 격자 위를 드래그하면 
 * 역방향으로 상단 바다의 레이저 장벽 구조가 실시간 동기화되어 춤추듯 이동.
 * 4. 정수 단위 자석 스냅(Snapping) 및 격자 왜곡 방지(preserveAspectRatio) 완벽 준수.
 */
export function renderCoordPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG_TAG = '[mathDevice_coordPoint]';
  const v = log.visual;

  // 안전성 검사: 규격 검증 실패 시 렌더링 세이프가드 가동
  if (!v || v.kind !== 'mafs_function') {
    console.error(`${DEBUG_TAG} 올바르지 않은 비주얼 사양입니다.`);
    return null;
  }

  // 0 ~ 6 정수 좌표계 인지 범위 상수화
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.8, GMAX + 0.8]);
  const yRange = toRange(v.yRange, [-0.8, GMAX + 0.8]);

  // 비밀 안개 속에 숨겨진 유령 잠수함의 고정 정답 타깃 주소
  const targetX = 4;
  const targetY = 3;

  // =================================================================
  // 🔌 [상태 라우팅] Zero-Hook 전역 상태 연동 및 바인딩
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const gx = st.gx ?? 2; // 초기 가로 조건값 (기본값: 2)
  const gy = st.gy ?? 1; // 초기 세로 조건값 (기본값: 1)

  /**
   * 상하단 그래프 조작을 원자적으로 묶어 부모 상태로 동기화하는 패치 함수
   */
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

  // =================================================================
  // 🎯 [게임 코어 엔진] 크로스 락온 및 조건 만족 상태 판정
  // =================================================================
  const isTargetLocked = gx === targetX && gy === targetY;
  const isXAligned = gx === targetX;
  const isYAligned = gy === targetY;

  // 물리 피드백 상태별 내레이션 및 테마 정의
  let statusHeadline = "📡 레이저 가동 중... 격자 위의 장벽이나 점을 직접 붙잡고 움직여 잠수함을 포획하세요!";
  let badgeText = "스캔 중";
  let themeStyles = {
    bg: '#f8fafc',
    border: '#e2e8f0',
    color: '#475569',
    badgeBg: '#64748b'
  };

  if (isTargetLocked) {
    statusHeadline = "💥 락온 성공! 가로 규칙과 세로 규칙이 만나는 유일한 교점에서 유령 잠수함(🚢)을 격추했습니다!";
    badgeText = "포획 완료";
    themeStyles = { bg: '#ecfdf5', border: '#a7f3d0', color: '#047857', badgeBg: '#10b981' };
  } else if (isXAligned || isYAligned) {
    statusHeadline = "⚠️ 경고! 레이저 한 줄이 잠수함의 위치를 통과했습니다! 나머지 한 줄도 교차시키세요!";
    badgeText = "추적 중";
    themeStyles = { bg: '#fffbeb', border: '#fde68a', color: '#b45309', badgeBg: '#f59e0b' };
  }

  // =================================================================
  // 🎨 [엔터프라이즈 스타일시트] 레이아웃 객체 셋업
  // =================================================================
  const styles = {
    mainContainer: { display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif', userSelect: 'none' },
    hudConsole: { background: themeStyles.bg, borderRadius: '16px', padding: '14px', border: `2px solid ${themeStyles.border}`, transition: 'all 0.2s ease' },
    hudHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    hudTitle: { fontSize: '14px', fontWeight: 'bold', color: '#0f172a' },
    hudBadge: { background: themeStyles.badgeBg, color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    hudBody: { fontSize: '13px', fontWeight: '500', color: themeStyles.color, lineHeight: '1.4' },
    
    // 이원화 공간 1: 시뮬레이션
    simBox: { background: '#ffffff', borderRadius: '16px', padding: '14px', border: '2px solid #e2e8f0' },
    simTitle: { fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px', textAlign: 'center' },
    simFrame: { background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', overflow: 'hidden' },
    
    // 이원화 공간 2: 수학 그래프
    graphBox: { background: '#ffffff', borderRadius: '16px', padding: '14px', border: '2px solid #e2e8f0' },
    graphTitle: { fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', textAlign: 'center' },
    graphFrame: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    
    // 데이터 스코어 보드
    scoreboard: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' },
    cardX: { background: '#fff7ed', border: '1px solid #ffedd5', padding: '8px', borderRadius: '10px', textAlign: 'center' },
    cardY: { background: '#eff6ff', border: '1px solid #dbeafe', padding: '8px', borderRadius: '10px', textAlign: 'center' },
    cardLabel: { fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' },
    cardValue: { fontSize: '14px', fontWeight: '900' },
    footerCaption: { fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '6px', lineHeight: '1.5', padding: '0 4px' }
  };

  return (
    <div style={styles.mainContainer}>
      
      {/* Mafs 뷰어 기본 테마 강제 제거 스타일 주입 */}
      <style>{`
        .mafs-panel-space .MafsView {
          background-color: transparent !important;
        }
        .mafs-panel-space .MafsView svg {
          overflow: visible !important;
        }
      `}</style>

      {/* =================================================================
          📡 [HUD 콘솔] 실시간 기지 레이더 통제실 브리핑 정보창
          ================================================================= */}
      <div className="viz-box" style={styles.hudConsole}>
        <div style={styles.hudHeader}>
          <span style={styles.hudTitle}>🛰️ 작전 제어 통제소 HUD</span>
          <span style={styles.hudBadge}>{badgeText}</span>
        </div>
        <div style={styles.hudBody}>
          {statusHeadline}
        </div>
      </div>

      {/* =================================================================
          🏖️ [이원화 공간 1] 상단: 직관적 시뮬레이션 (레이저 스캔 바다)
          ================================================================= */}
      <div className="viz-box" style={styles.simBox}>
        <div style={styles.simTitle}>
          🎬 <b>[1층 공간: 레이저 스캔 바다]</b> 선로 위의 조종 핸들을 직접 드래그하세요!
        </div>

        <div className="mafs-panel-space" style={styles.simFrame}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={230}>
            
            {/* 레이더 파동 시각 장식 서클 */}
            {[1.5, 3.5, 5.5].map(r => (
              <Plot.OfX key={`radar-c-${r}`} y={(x) => {
                const val = r*r - (x-3)*(x-3);
                return val >= 0 ? 3 + Math.sqrt(val) : NaN;
              }} color="#a7f3d0" weight={1} style="dashed" />
            ))}
            {[1.5, 3.5, 5.5].map(r => (
              <Plot.OfX key={`radar-c2-${r}`} y={(x) => {
                const val = r*r - (x-3)*(x-3);
                return val >= 0 ? 3 - Math.sqrt(val) : NaN;
              }} color="#a7f3d0" weight={1} style="dashed" />
            ))}

            {/* 🟠 가로 조건 실시간 오렌지색 레이저 장벽 */}
            <Line.Segment point1={[gx, -0.5]} point2={[gx, GMAX + 0.5]} color="#ea580c" weight={isXAligned ? 5 : 3} />
            <Line.Segment point1={[gx, 0]} point2={[gx, gy]} color="#ea580c" style="dashed" weight={1.5} />

            {/* 🔵 세로 조건 실시간 파란색 레이저 장벽 */}
            <Line.Segment point1={[-0.5, gy]} point2={[GMAX + 0.5, gy]} color="#2563eb" weight={isYAligned ? 5 : 3} />
            <Line.Segment point1={[0, gy]} point2={[gx, gy]} color="#2563eb" style="dashed" weight={1.5} />

            {/* 🚢 유령 잠수함 조건식 락온 렌더링 */}
            {isTargetLocked ? (
              <Text x={targetX} y={targetY} size={32} attach="center">🚢</Text>
            ) : (
              <React.Fragment>
                {(isXAligned || isYAligned) && <Point x={targetX} y={targetY} color="#a855f7" size={6} opacity={0.6} />}
                <Text x={targetX} y={targetY} size={15} color="#94a3b8" opacity={0.3} attach="center">?</Text>
              </React.Fragment>
            )}

            {/* 시작점 원점 앵커 */}
            <Point x={0} y={0} color="#10b981" size={5} />
            <Text x={0} y={-0.3} size={10} color="#047857" weight="bold" attach="s">출발점(0,0)</Text>

            {/* 🎮 [직접 인터랙션 1] 바닥 가로축 조종 핸들 - 오렌지 선 좌우 제어 */}
            <MovablePoint
              point={[gx, 0]}
              color="#ea580c"
              constrain={(pos) => [Math.min(GMAX, Math.max(0, Math.round(pos[0]))), 0]}
              onMove={(pos) => patchState({ gx: Math.min(GMAX, Math.max(0, Math.round(pos[0]))) })}
            />

            {/* 🎮 [직접 인터랙션 2] 좌측 세로축 조종 핸들 - 파란 선 위아래 제어 */}
            <MovablePoint
              point={[0, gy]}
              color="#2563eb"
              constrain={(pos) => [0, Math.min(GMAX, Math.max(0, Math.round(pos[1])))]}
              onMove={(pos) => patchState({ gy: Math.min(GMAX, Math.max(0, Math.round(pos[1]))) })}
            />

            {/* 🎮 [직접 인터랙션 3] 중앙 레이저 크로스 조종 마스터 핸들 */}
            <MovablePoint
              point={[gx, gy]}
              color={Theme.red}
              constrain={(pos) => [
                Math.min(GMAX, Math.max(0, Math.round(pos[0]))),
                Math.min(GMAX, Math.max(0, Math.round(pos[1])))
              ]}
              onMove={(pos) => patchState({
                gx: Math.min(GMAX, Math.max(0, Math.round(pos[0]))),
                gy: Math.min(GMAX, Math.max(0, Math.round(pos[1])))
              })}
            />
            {!isTargetLocked && <Text x={gx} y={gy + 0.35} size={11} color="#ef4444" weight="bold" attach="n">📡 조준포인트</Text>}
          </Mafs>
        </div>
      </div>

      {/* =================================================================
          📈 [이원화 공간 2] 하단: 수학 그래프 (데카르트 직교좌표평면)
          ================================================================= */}
      <div className="viz-box" style={styles.graphBox}>
        <div style={styles.graphTitle}>
          📐 <b>[2층 공간: 수학 데카르트 그래프]</b> 평면 위의 빨간 점을 마우스로 잡고 끌어보세요!
        </div>

        <div className="mafs-panel-space" style={styles.graphFrame}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            {/* 정밀 표준 직교 모눈 격자선 */}
            <Coordinates.Cartesian />

            {/* 가로와 세로 두 성분이 만나 영역을 결정함을 보여주는 보라색 사각형 빔 영역 */}
            <Polygon 
              points={[[0, 0], [gx, 0], [gx, gy], [0, gy]]} 
              color={Theme.purple} 
              opacity={0.12} 
            />

            {/* 가로축 눈금 숫자로 내리꽂히는 기하 추적 수직선 */}
            <Line.Segment point1={[gx, 0]} point2={[gx, gy]} color="#ea580c" style="dashed" weight={2} />
            {/* 세로축 눈금 숫자로 내리꽂히는 기하 추적 수평선 */}
            <Line.Segment point1={[0, gy]} point2={[gx, gy]} color="#2563eb" style="dashed" weight={2} />

            {/* 유령 잠수함의 추상적 수학 위치 마커 (4, 3) */}
            <Point x={targetX} y={targetY} color={isTargetLocked ? Theme.green : "#cbd5e1"} size={5} />
            <Text x={targetX} y={targetY} size={11} color="#64748b" attach="se">Target(4,3)</Text>

            {/* 🎮 [역방향 직접 인터랙션 4] 수학 평면 위의 교점 자체를 직접 조작 
                이를 잡고 움직이면 1층 시뮬레이션 바다의 레이저선 기하 구조가 역방향 연동 통제됩니다.
            */}
            <MovablePoint 
              point={[gx, gy]}
              color={Theme.red}
              constrain={(pos) => [
                Math.min(GMAX, Math.max(0, Math.round(pos[0]))),
                Math.min(GMAX, Math.max(0, Math.round(pos[1])))
              ]}
              onMove={(pos) => patchState({
                gx: Math.min(GMAX, Math.max(0, Math.round(pos[0]))),
                gy: Math.min(GMAX, Math.max(0, Math.round(pos[1])))
              })}
            />

            {/* 현재 기하 노드의 위치를 수학 순서쌍 주소로 실시간 드로잉 라벨링 */}
            <Text x={gx} y={gy} size={12} color="#be123c" weight="bold" attach="nw">
              {`P (${gx}, ${gy})`}
            </Text>
          </Mafs>
        </div>

        {/* =================================================================
            📋 [3단계] 실시간 대수-기하 데이터 스코어보드 뷰어
            ================================================================= */}
        <div style={styles.scoreboard}>
          <div style={styles.cardX}>
            <span style={{ ...styles.cardLabel, color: '#ea580c' }}>🟠 동쪽 칸수 (가로 주소 x)</span>
            <span style={{ ...styles.cardValue, color: '#ea580c' }}>{gx} 걸음</span>
          </div>
          <div style={styles.cardY}>
            <span style={{ ...styles.cardLabel, color: '#2563eb' }}>🔵 북쪽 칸수 (세로 주소 y)</span>
            <span style={{ ...styles.cardValue, color: '#2563eb' }}>{gy} 걸음</span>
          </div>
        </div>

        {/* 최종 개념 결합 매핑 가이드라인 */}
        <div style={styles.footerCaption}>
          가로 규칙선(<span style={{ color: '#ea580c', fontWeight: 'bold' }}>x = {gx}</span>)과 세로 규칙선(<span style={{ color: '#2563eb', fontWeight: 'bold' }}>y = {gy}</span>)이 평면 위에서 크로스하여 충돌하는 자리는
          <br />
          수많은 군데가 아니라 <b>오직 단 하나의 유일한 점 {`(${gx}, ${gy})`}</b>으로 수렴되어 락온됩니다.
          <br />
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            위아래 두 공간의 격자 장벽과 빨간 점을 직접 제어해보며 대수적 주소와 기하학적 위치의 완벽한 1대1 매핑 유일성을 체감하세요.
          </span>
        </div>
      </div>

    </div>
  );
}