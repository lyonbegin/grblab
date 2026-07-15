import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint, Line, Point, Text, Polygon } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * ============================================================================
 * [대단원 8-1] 점 = 가로·세로 두 조건의 교차 (직접 인터랙션 하이엔드 에디션)
 * ============================================================================
 * * 🛠️ [리팩토링 핵심 개선 사항]
 * 1. 외부 슬라이더 100% 박멸: 독자적인 외부 수치 조작바를 전부 제거했습니다.
 * 2. 다이렉트 3축 핸들 제어: 
 * - 중앙 교차점 핸들: 가로/세로를 동시에 자유롭게 조작.
 * - 바닥 가로축 핸들: 오렌지색 세로 레이저선만 좌우로 시프트.
 * - 좌측 세로축 핸들: 파란색 가로 레이저선만 위아래로 시프트.
 * 3. 정수 스냅 매커니즘: 모든 내부 핸들은 정수 좌표 격자에 자석처럼 착착 감깁니다.
 * 4. Zero-Hook 아키텍처 수호: 외부 상태(sharedXByLog)와의 동기화만을 활용합니다.
 */
export function renderCoordPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG_TAG = '[mathDevice_coordPoint]';
  const v = log.visual;

  // 1. 방어적 코드 및 안전성 검사
  if (!v || v.kind !== 'mafs_function') {
    console.error(`${DEBUG_TAG} 올바르지 않은 비주얼 규격입니다.`);
    return null;
  }

  // 공간 범위 정의 (초등·중등 격자 인지 범위: 0 ~ 6)
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-1, GMAX + 1]);
  const yRange = toRange(v.yRange, [-1, GMAX + 1]);

  // 숨겨진 유령 잠수함의 고정된 비밀 주소 타깃
  const targetX = 4;
  const targetY = 3;

  // =================================================================
  // 🔌 [상태 바인딩] Zero-Hook 상태 제어 및 동기화 라우팅
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const gx = st.gx ?? 2; // 초기 가로 주소 (기본값: 2)
  const gy = st.gy ?? 1; // 초기 세로 주소 (기본값: 1)

  /**
   * 상태 통합 갱신 패치 함수 (부모 캔버스 동기화)
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
  // 🎯 [게임 룰 엔진] 레이저 교차 및 타깃 격추 판정
  // =================================================================
  const isTargetLocked = gx === targetX && gy === targetY;
  const isXAligned = gx === targetX;
  const isYAligned = gy === targetY;

  // 실시간 기하 상태 브리핑 메인 내레이션 텍스트 생성
  let statusHeadline = "📡 레이저 가동 중... 격자 위의 장벽을 직접 붙잡고 움직여 잠수함을 포획하세요!";
  let badgeText = "조색 중";
  let themeStyles = {
    bg: '#f8fafc',
    border: '#e2e8f0',
    color: '#475569',
    badgeBg: '#64748b'
  };

  if (isTargetLocked) {
    statusHeadline = "💥 충돌 성공! 두 스캔 조건이 교차하는 유일한 지점에서 잠수함(🚢)을 포획했습니다!";
    badgeText = "락온 완료";
    themeStyles = { bg: '#ecfdf5', border: '#a7f3d0', color: '#047857', badgeBg: '#10b981' };
  } else if (isXAligned || isYAligned) {
    statusHeadline = "⚠️ 경고! 레이저 한 줄이 타깃의 실루엣을 스쳤습니다. 나머지 한 줄도 마저 맞추세요!";
    badgeText = "추적 중";
    themeStyles = { bg: '#fffbeb', border: '#fde68a', color: '#b45309', badgeBg: '#f59e0b' };
  }

  // =================================================================
  // 🎨 [디자인 스타일시트] 하이엔드 시각 셋업
  // =================================================================
  const styles = {
    mainWrapper: { display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif', userSelect: 'none' },
    hudConsole: { background: themeStyles.bg, borderRadius: '16px', padding: '16px', border: `2px solid ${themeStyles.border}`, transition: 'all 0.3s ease', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
    hudHeader: { display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '10px' },
    hudTitle: { fontSize: '15px', fontWeight: 'bold', color: '#0f172a' },
    hudBadge: { background: themeStyles.badgeBg, color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    hudBody: { fontSize: '13px', fontWeight: '500', color: themeStyles.color, lineHeight: '1.5' },
    canvasBox: { background: '#ffffff', borderRadius: '16px', padding: '14px', border: '2px solid #e2e8f0' },
    canvasTitle: { fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '12px', textAlign: 'center' },
    graphicFrame: { background: '#f0fdf4', borderRadius: '12px', border: '1px solid #d1fae5', overflow: 'hidden', position: 'relative' },
    hudFooter: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' },
    cardX: { background: '#fff7ed', border: '1px solid #ffedd5', padding: '10px', borderRadius: '10px', textAlign: 'center' },
    cardY: { background: '#eff6ff', border: '1px solid #dbeafe', padding: '10px', borderRadius: '10px', textAlign: 'center' },
    cardLabel: { fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' },
    cardValue: { fontSize: '15px', fontWeight: 'black' },
    summaryCaption: { fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '10px', lineHeight: '1.5', padding: '0 6px' }
  };

  return (
    <div style={styles.mainWrapper}>
      
      {/* Mafs 뷰어 기본 검은색 배경 강제 박멸 스타일 오버라이드 */}
      <style>{`
        .mafs-direct-radar .MafsView {
          background-color: transparent !important;
        }
        .mafs-direct-radar .MafsView svg {
          overflow: visible !important;
        }
      `}</style>

      {/* =================================================================
          📡 [1단계] 실시간 메인 HUD 통제 관리 센서 패널
          ================================================================= */}
      <div className="viz-box" style={styles.hudConsole}>
        <div style={styles.hudHeader}>
          <span style={styles.hudTitle}>🛰️ 레이더 시스템 브리핑</span>
          <span style={styles.hudBadge}>{badgeText}</span>
        </div>
        <div style={styles.hudBody}>
          {statusHeadline}
        </div>
      </div>

      {/* =================================================================
          📐 [2단계] 메인 기하 공간 (완벽한 직접 인터랙션 직교좌표평면)
          ================================================================= */}
      <div className="viz-box" style={styles.canvasBox}>
        <div style={styles.canvasTitle}>
          🎯 <b>[직접 조작 레이더 판넬]</b> 화면의 장벽과 조종 점을 터치하여 직접 끄세요!
        </div>

        <div className="mafs-direct-radar" style={styles.graphicFrame}>
          {/* 가로세로 배율 고정(preserveAspectRatio)으로 완벽한 정사각형 수학 모눈종이 형태 수호 */}
          <Mafs viewBox={{ x: [-0.8, GMAX + 0.8], y: [-0.8, GMAX + 0.8] }} preserveAspectRatio={true} height={340}>
            
            {/* 표준 데카르트 정밀 격자 배치 */}
            <Coordinates.Cartesian />

            {/* 🌊 안전지대 스캔 이펙트 배경 레이아웃 (그리드 배경 장식) */}
            <Polygon 
              points={[[0,0], [GMAX,0], [GMAX,GMAX], [0,GMAX]]} 
              color="#e6f4ea" 
              opacity={0.3} 
            />

            {/* =================================================================
                🟠 가로 조건식의 시각화: x = gx (오렌지색 세로 레이저 스캔 장벽)
                ================================================================= */}
            <Line.Segment 
              point1={[gx, -0.5]} 
              point2={[gx, GMAX + 0.5]} 
              color="#ea580c" 
              weight={isXAligned ? 5 : 3} 
            />
            {/* 가로 조건 유도 점선 점 바인딩 */}
            <Line.Segment point1={[gx, 0]} point2={[gx, gy]} color="#ea580c" style="dashed" weight={1.5} />

            {/* =================================================================
                🔵 세로 조건식의 시각화: y = gy (파란색 가로 레이저 스캔 장벽)
                ================================================================= */}
            <Line.Segment 
              point1={[-0.5, gy]} 
              point2={[GMAX + 0.5, gy]} 
              color="#2563eb" 
              weight={isYAligned ? 5 : 3} 
            />
            {/* 세로 조건 유도 점선 점 바인딩 */}
            <Line.Segment point1={[0, gy]} point2={[gx, gy]} color="#2563eb" style="dashed" weight={1.5} />

            {/* =================================================================
                🚢 숨겨진 타깃 (조건이 일치할 때만 홀로그램이 완벽히 가동됨)
                ================================================================= */}
            {isTargetLocked ? (
              <Text x={targetX} y={targetY} size={36} attach="center">🚢</Text>
            ) : (
              <React.Fragment>
                {/* 실루엣이 스쳤을 때 힌트를 주는 특수 기하 장치 마커 */}
                {(isXAligned || isYAligned) && (
                  <Point x={targetX} y={targetY} color="#a855f7" size={6} opacity={0.6} />
                )}
                <Text x={targetX} y={targetY} size={16} color="#cbd5e1" opacity={0.4} attach="center">?</Text>
              </React.Fragment>
            )}

            {/* 기준 원점 앵커링 */}
            <Point x={0} y={0} color="#10b981" size={5} />

            {/* =================================================================
                🎮 [핵심 인터랙션 전개] 외부 슬라이더를 대체하는 3대 직접 조종 노드
                ================================================================= */}
            
            {/* 1. [바닥 X축 컨트롤러] 세로 레이저선 아래를 잡고 좌우로 직접 시프트 */}
            <MovablePoint
              point={[gx, 0]}
              color="#ea580c"
              constrain={(pos) => [Math.min(GMAX, Math.max(0, Math.round(pos[0]))), 0]}
              onMove={(pos) => patchState({ gx: Math.min(GMAX, Math.max(0, Math.round(pos[0]))) })}
            />

            {/* 2. [좌측 Y축 컨트롤러] 가로 레이저선 왼쪽을 잡고 위아래로 직접 시프트 */}
            <MovablePoint
              point={[0, gy]}
              color="#2563eb"
              constrain={(pos) => [0, Math.min(GMAX, Math.max(0, Math.round(pos[1])))]}
              onMove={(pos) => patchState({ gy: Math.min(GMAX, Math.max(0, Math.round(pos[1]))) })}
            />

            {/* 3. [중앙 십자 크로스 교점 마스터 핸들] 가로·세로를 사방으로 동시에 제어 */}
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

            {/* 중앙 조종점 지시 안테나 레이블 */}
            {!isTargetLocked && <Text x={gx} y={gy + 0.4} size={13} color="#ef4444" weight="bold" attach="n">📡 조준점</Text>}
          </Mafs>
        </div>

        {/* =================================================================
            📋 [3단계] 실시간 기하 데이터 모니터링 카드 구조
            ================================================================= */}
        <div style={styles.hudFooter}>
          <div style={styles.cardX}>
            <span style={{ ...styles.cardLabel, color: '#ea580c' }}>🟠 동쪽 스캔 위치 (가로 조건 x)</span>
            <span style={{ ...styles.cardValue, color: '#ea580c' }}>{gx} 걸음</span>
          </div>
          <div style={styles.cardY}>
            <span style={{ ...styles.cardLabel, color: '#2563eb' }}>🔵 북쪽 스캔 위치 (세로 조건 y)</span>
            <span style={{ ...styles.cardValue, color: '#2563eb' }}>{gy} 걸음</span>
          </div>
        </div>

        {/* 유일성 원리 매핑 꼬리표 */}
        <div style={styles.summaryCaption}>
          가로 규칙선(<span style={{ color: '#ea580c', fontWeight: 'bold' }}>x = {gx}</span>)과 세로 규칙선(<span style={{ color: '#2563eb', fontWeight: 'bold' }}>y = {gy}</span>)이 평면 위에서 
          만나 크로스하는 자리는 수많은 곳이 아니라 <b>오직 단 하나의 유일한 점 {`(${gx}, ${gy})`}</b>으로 결정됩니다.
          <br />
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            이것이 가로와 세로 두 수의 만남이 평면 속 유일한 주소(점)를 완성하는 위대한 기하학적 1:1 매핑 원리입니다.
          </span>
        </div>
      </div>

    </div>
  );
}