import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Text, Polygon } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * no: "8" [방정식 해 = 교점 최종 마스터 종합판] 300줄 초밀도 순수 로직 에디션
 * * [시스템 설계 지침 및 프론트엔드 아키텍처 규격 준수]
 * 1. Zero-Hook 아키텍처: React 내부의 useState, useEffect를 엄격히 금지하고 sharedXByLog 상태망으로 단방향/역방향 라우팅.
 * 2. 양방향 듀얼 기하 엔진: 좌측 저울 접시 조작 시 각도 역산 동기화 및 우측 그래프 조종 노드 조작 시 시소 실시간 회전.
 * 3. 왜곡 차단 스케일러: preserveAspectRatio={true} 적용으로 모눈종이와 저울 장치의 물리 배율 완벽 보존.
 * 4. 요금 격차 기둥(Vertical Dynamic Beam): 두 함수 그래프 사이의 실시간 높이 차이를 시각적 기둥으로 렌더링.
 */
export function renderDevice_no8(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 초등 대수 탐색 영역 정의 (사용량 변수: 0 ~ 6 구간 제어)
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-1.2, 13.2]);

  // =================================================================
  // ⚙️ [수학 코어 엔진] 두 통신사의 요금제 부동 관계식 함수 정의
  // A통신사 (종량제 요금 인형): y = 2x + 1  (기본료 1원, 1칸당 2원씩 치솟음)
  // B통신사 (결합제 요금 인형): y = x + 4   (기본료 4원, 1칸당 1원씩 완만함)
  // 수학적 완전 평형점(연립방정식의 해): 사용량 x = 3.0 일 때 두 요금이 7원으로 완벽히 일치.
  // =================================================================
  const costA = (x) => {
    return 2 * x + 1;
  };

  const costB = (x) => {
    return x + 4;
  };
  
  const targetX = 3.0;
  const targetY = 7.0;

  // =================================================================
  // 🔌 [상태 라우터] Zero-Hook 데이터 싱크 및 제어 모듈
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const xVal = st.xVal ?? 1.0; // 실시간 연동 데이터 사용량 (초기값: 1.0)

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

  // 실시간 요금 결과 계산 및 차이 도출
  const currentYA = costA(xVal);
  const currentYB = costB(xVal);
  const priceGap = currentYA - currentYB; 
  
  // 평형 도달 여부 분석 판정 (오차 0.04 유효 반경 설정)
  const isBalanced = Math.abs(xVal - targetX) < 0.04;
  
  // 저울대의 회전 각도(라디안) 매핑 연산 법칙 (요금 차이에 비례하여 시소 각도 변경)
  const seesawAngle = Math.min(0.36, Math.max(-0.36, priceGap * 0.075));

  // =================================================================
  // ⚖️ [저울 기하학 데이터 도출 엔진] 회전 행렬 삼각함수 로직
  // points[0] = 받침점 중심 고정좌표
  // points[1] = 회전된 왼쪽 A요금 접시 지지점
  // points[2] = 회전된 오른쪽 B요금 접시 지지점
  // =================================================================
  const pivotX = 3.0;
  const pivotY = 4.8; 
  const armLength = 2.1; 
  
  const leftX = pivotX - armLength * Math.cos(seesawAngle);
  const leftY = pivotY - armLength * Math.sin(seesawAngle);
  const rightX = pivotX + armLength * Math.cos(seesawAngle);
  const rightY = pivotY + armLength * Math.sin(seesawAngle);

  // 실시간 어린이 관제실 콘솔 내레이션 빌더
  let consoleTitle = "⚖️ 양팔시소 요금제 놀이터: 완벽한 수평을 조준하라!";
  let consoleDetail = "좌측의 시소 접시나 우측 그래프의 주황색 스캐너를 직접 손으로 붙잡고 움직여 시소가 완전한 수평 일자가 되는 지점을 격추하세요.";
  let panelTheme = {
    bg: '#f8fafc',
    border: '#bae6fd',
    text: '#0369a1',
    cardInk: '#475569',
    badge: '시소 탐색 중'
  };

  if (isEquilibrium) {
    consoleTitle = "🎉 미션 성공! 저울대가 완벽하게 평평해졌습니다!";
    consoleDetail = "양쪽 요금의 무게가 똑같아져 저울이 평평해진 바로 그 순간, 우측 수학 모눈종이 위에서는 두 요금 그래프 선이 정확하게 크로스하는 [교점 P(3, 7)]이 기적처럼 켜집니다!";
    panelTheme = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', cardInk: '#16a34a', badge: '⚖️ 완전 평형 달성' };
  } else if (priceGap > 0) {
    consoleTitle = "⚠️ 종량제 요금 인형(A)이 너무 무거워요!";
    consoleDetail = "데이터 사용량이 평형점보다 많아져서 왼쪽 요금 인형의 무게가 증가해 시소의 왼쪽 접시가 아래로 쿵 내려앉았습니다.";
    panelTheme = { bg: '#fff5f5', border: '#fed7d7', text: '#c53030', cardInk: '#2563eb', badge: 'A인형 하중 초과' };
  } else {
    consoleTitle = "⚠️ 결합제 요금 인형(B)이 너무 무거워요!";
    consoleDetail = "사용량이 적을 때는 B회사의 기본요금 폭탄의 영향으로 오른쪽 인형이 더 무거워서 시소의 오른쪽 접시가 밑으로 쏠립니다.";
    panelTheme = { bg: '#fffaf0', border: '#feebc8', text: '#9c4221', cardInk: '#db2777', badge: 'B인형 기본료 장벽' };
  }

  // =================================================================
  // 🎨 [엔터프라이즈 레벨 시각 스타일시트 매트릭스]
  // =================================================================
  const styles = {
    container: { display: 'flex', fontFamily: 'sans-serif', flexDirection: 'column', gap: '14px', userSelect: 'none' },
    hud: { background: panelTheme.bg, border: `2px solid ${panelTheme.border}`, borderRadius: '16px', padding: '14px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
    hudTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' },
    hudTitle: { fontSize: '14px', fontWeight: '800', color: panelTheme.text },
    hudBadge: { background: panelTheme.text, color: '#ffffff', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    splitGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flexWrap: 'wrap' },
    box: { background: '#ffffff', borderRadius: '16px', padding: '12px', border: '2px solid #e2e8f0' },
    title: { fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', textAlign: 'center' },
    simCanvas: { background: '#fafaf9', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' },
    mathCanvas: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    dashboard: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px' },
    miniCard: { background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', border: '1px solid #e2e8f0', fontWeight: '700' },
    footer: { fontSize: '12.5px', color: '#334155', textAlign: 'center', marginTop: '6px', lineHeight: '1.6', padding: '0 4px', fontWeight: '500' }
  };

  return (
    <div style={styles.container}>
      
      {/* Mafs 기본 검은 배경 오버라이드 및 벡터 번짐 방지 클리핑 룸 설정 */}
      <style>{`
        .mafs-master-engine .MafsView { background-color: transparent !important; }
        .mafs-master-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* =================================================================
          📡 [HUD 통제 센터] 실시간 물리 시소 평형 메인 스크린
          ================================================================= */}
      <div className="viz-box" style={styles.hud}>
        <div style={styles.hudTop}>
          <span style={styles.hudTitle}>{consoleTitle}</span>
          <span style={styles.hudBadge}>{panelTheme.badge}</span>
        </div>
        <div style={{fontSize:'12px', color:'#475569', fontWeight:'500', marginTop: '4px', lineHeight: '1.4'}}>{consoleDetail}</div>
      </div>

      {/* =================================================================
          🧩 1층 공간: 이원화 비주얼 인터페이스 (물리 저울 vs 수학 그래프)
          ================================================================= */}
      <div style={styles.splitGrid}>
        
        {/* ⚖️ 좌측 파트: 아날로그 물리 양팔 시소 기지 (device_visual 완벽 빌드) */}
        <div className="viz-box" style={styles.box}>
          <div style={styles.title}>⚖️ [1층 왼쪽] 아날로그 시소 평형 실험대</div>
          <div className="mafs-master-engine" style={styles.simCanvas}>
            <Mafs viewBox={{ x: [0.2, 5.8], y: [1.2, 6.8] }} preserveAspectRatio={true} height={250}>
              
              {/* 시소 안전 지지 기반 바닥 지평선 드로잉 */}
              <Line.Segment point1={[0.5, 1.8]} point2={[5.5, 1.8]} color="#78716c" weight={3} />
              
              {/* 시소의 중심을 단단히 고정하는 입체 받침대 기둥 다각형 매핑 */}
              <Polygon points={[[3.0, pivotY], [2.6, 1.8], [3.4, 1.8]]} color="#a8a29e" weight={1} opacity={0.35} />

              {/* [저울 중심점 피벗 앵커 points[0]] */}
              <Point x={pivotX} y={pivotY} color="#451a03" size={6} />
              
              {/* 실시간 회전 법칙 행렬이 적용되어 기울어지는 시소 메인 나무 바(Bar) */}
              <Line.Segment point1={[leftX, leftY]} point2={[rightX, rightY]} color="#b45309" weight={6} />

              {/* 🔵 왼쪽 요금 접시: 밧줄 지지선 및 요금 인형 바구니 결합 (points[1]) */}
              <Line.Segment point1={[leftX, leftY]} point2={[leftX, leftY - 1.4]} color="#78716c" weight={1.5} />
              <Line.Segment point1={[leftX - 0.5, leftY - 1.4]} point2={[leftX + 0.5, leftX - 1.4]} color="#2563eb" weight={4} />
              <Text x={leftX} y={leftY - 1.9} size={11} color="#2563eb" weight="black" attach="s">{`A인형: ${currentYA.toFixed(0)}원`}</Text>

              {/* 🔴 오른쪽 요금 접시: 밧줄 지지선 및 요금 인형 바구니 결합 (points[2]) */}
              <Line.Segment point1={[rightX, rightY]} point2={[rightX, rightY - 1.4]} color="#78716c" weight={1.5} />
              <Line.Segment point1={[rightX - 0.5, rightY - 1.4]} point2={[rightX + 0.5, rightY - 1.4]} color="#db2777" weight={4} />
              <Text x={rightX} y={rightY - 1.9} size={11} color="#db2777" weight="black" attach="s">{`B인형: ${currentYB.toFixed(0)}원`}</Text>

              {/* 🎮 [직접 인터랙션 1] 오른쪽 인형 접시 바닥 노드를 손가락으로 잡고 위아래 시소 무빙 직접 조작 */}
              <MovablePoint
                point={[rightX, rightY - 1.4]}
                color={Theme.red}
                constrain={(pos) => {
                  const snapX = Math.round(pos[0] * 10) / 10;
                  const clampX = Math.min(GMAX, Math.max(0, snapX));
                  const nAngle = Math.min(0.36, Math.max(-0.36, (costA(clampX) - costB(clampX)) * 0.075));
                  return [pivotX + armLength * Math.cos(nAngle), pivotY + armLength * Math.sin(nAngle) - 1.4];
                }}
                onMove={(pos) => {
                  // 고난도 기하학 각도 역산 엔진 가동: 아크탄젠트(theta) 역계산으로 가로축 xVal 복원 바인딩
                  const dx = pos[0] - pivotX;
                  const dy = (pos[1] + 1.4) - pivotY;
                  const theta = Math.atan2(dy, dx);
                  const rawX = targetX + (theta / 0.075); 
                  const snapX = Math.min(GMAX, Math.max(0, Math.round(rawX * 10) / 10));
                  patchState({ xVal: snapX });
                }}
              />
              <Text x={rightX} y={rightY - 0.9} size={11} color="#ef4444" weight="black" attach="n">↕ 시소 조작 핸들</Text>
            </Mafs>
          </div>
        </div>

        {/* 📐 우측 파트: 진짜 데카르트 일차연립방정식 함수 평면 (visual 스펙 완벽 구현) */}
        <div className="viz-box" style={styles.box}>
          <div style={styles.title}>📐 [1층 오른쪽] 데카르트 직교 함수 눈금 평면</div>
          <div className="mafs-master-engine" style={styles.mathCanvas}>
            <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
              
              {/* 정밀 표준 수학 격자 배치 */}
              <Coordinates.Cartesian />

              {/* Plot 컴포넌트 스펙을 엄격 준수하여 두 통신사의 일차함수 레일을 완벽하게 드로잉 */}
              <Plot.OfX y={costA} color="#2563eb" weight={3.5} />
              <Plot.OfX y={costB} color="#db2777" weight={3.5} />

              {/* 실시간 입력 사용량 기하 위치 추적 오렌지 레이저선 */}
              <Line.Segment point1={[xVal, -1.2]} point2={[xVal, Math.max(currentYA, currentYB)]} color="#ea580c" weight={2} style="dashed" />

              {/* 🚨 [빼먹었던 핵심 복원] 두 요금제 그래프 사이의 실시간 요금 격차(높이 두께) 기둥선 레이저 빔 */}
              <Line.Segment 
                point1={[xVal, currentYA]} 
                point2={[xVal, currentYB]} 
                color="#a855f7" 
                weight={3.5} 
              />
              <Text x={xVal} y={(currentYA + currentYB) / 2} size={10} color="#a855f7" weight="black" attach="e">
                {`격차: ${Math.abs(priceGap).toFixed(1)}원`}
              </Text>

              {/* 두 직선이 운명적으로 교차 충돌하는 방정식의 진짜 평형해 마커 (3, 7) */}
              <Point x={targetX} y={targetY} color={isBalanced ? Theme.green : "#cbd5e1"} size={isBalanced ? 7.5 : 4.5} />
              <Text x={targetX} y={targetY} size={11} color="#0f172a" weight="black" attach="ne">🔓 평형해(3, 7)</Text>

              {/* 🎮 [역방향 직접 인터랙션 2] 그래프 바닥축의 주황색 타임라인 제어 노드를 잡고 좌우 스케일링 */}
              <MovablePoint
                point={[xVal, 0]}
                color="#ea580c"
                constrain={(pos) => [Math.min(GMAX, Math.max(0, Math.round(pos[0] * 10) / 10)), 0]}
                onMove={(pos) => patchState({ xVal: pos[0] })}
              />
            </Mafs>
          </div>
        </div>

      </div>

      {/* =================================================================
          📋 2층 공간: 실시간 대수-물리 데이터 스코어 인프라 계기판
          ================================================================= */}
      <div style={styles.dashboard}>
        <div style={styles.miniCard}>📊 데이터 사용량 (<span style={{color:'#ea580c'}}>가로 x</span>)<br /><b style={{fontSize:'13px'}}>{xVal.toFixed(1)} GB 칸</b></div>
        <div style={{ ...styles.miniCard, color: '#a855f7' }}>💰 두 인형의 실시간 요금 격차<br /><b style={{fontSize:'13px'}}>{Math.abs(priceGap).toFixed(1)} 원 차이</b></div>
        <div style={{ ...styles.miniCard, color: panelTheme.cardInk }}>📐 아날로그 시소 회전 각도<br /><b style={{fontSize:'13px'}}>{(seesawAngle * (180 / Math.PI)).toFixed(1)} 도 기울어짐</b></div>
      </div>

      {/* 최종 대단원 결합 기하 마스터 스펙 꼬리표 코어 피드백 */}
      <div style={styles.footer}>
        물리적인 양팔 시소 장치가 완벽하게 일치하여 수평 평형($-$)을 이루는 극적인 순간은, 우측 수학 직교 모눈종이 위에서 독립된 두 통신사의 요금 수식 그래프가 서로 크로스하며 격돌하는 **[교점의 발생 순간]**과 한 치의 오차도 없이 완전하게 똑같은 현상(사건)임을 증명합니다.
        <br />
        교점을 기점으로 삼아 두 요금 함수의 높낮이(대소 관계 우위)가 완벽하게 상하 역전되는 궤도 매커니즘을 시소의 기울기 변화와 다이렉트로 연결하여 분석함으로써, 훗날 교과과정에서 마주할 최고 난이도의 함수 추론 연립방정식을 통달할 수 있는 완벽한 수학적 눈을 완성하십시오.
      </div>

    </div>
  );
}