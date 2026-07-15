import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Text, Polygon } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * ============================================================================
 * [대단원 8 마스터] 방정식 해 = 교점 (양팔저울 최종 결합 캡스톤 에디션)
 * ============================================================================
 * * 🛠️ [종합 구현 규격 완전 준수]
 * 1. device_visual 완벽 대체: 좌측 기하 공간 내부에 points[0]=받침점, points[1]=왼쪽접시,
 * points[2]=오른쪽접시 인터랙션을 완벽하게 구현하여 양팔저울을 기하학적으로 드로잉합니다.
 * 2. visual 규격 만족: 우측 기하 공간에 A요금제(직선), B요금제(곡선/직선) curves 2개를 정확히 노출합니다.
 * 3. 극상의 2차원 양방향 스냅 바인딩 모델: 슬라이더를 100% 배제하고 저울대 각도와 그래프를 엮어냅니다.
 * 4. Zero-Hook 아키텍처 무상태 구현 수호.
 */
export function renderDevice_no8(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG_TAG = '[mathDevice_no8]';
  const v = log.visual;

  if (!v || v.kind !== 'mafs_function') {
    console.error(`${DEBUG_TAG} 최종 마스터판 visual 인덱싱 실패`);
    return null;
  }

  // 데이터 사용량 축 범위 최적화 (0 ~ 6 구간 제어)
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-1, 13]);

  // =================================================================
  // 📐 [수학 정의] 두 회사의 데이터 사용량 요금 함수식
  // A회사 (사용량 추): y = 2x + 1  |  B회사 (기본결합 추): y = x + 4
  // 정확히 데이터 사용량 x = 3 일 때 양쪽 요금이 7원으로 일치하여 평형을 이룹니다.
  // =================================================================
  const costA = (x) => 2 * x + 1;
  const costB = (x) => x + 4;
  const targetX = 3.0;
  const targetY = 7.0;

  // =================================================================
  // 🔌 [상태 바인딩] Zero-Hook 데이터 밸런싱 코어 라우팅
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const xVal = st.xVal ?? 1.0; // 사용자가 조작 중인 현재 사용량 (초기값: 1.0)

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

  const currentYA = costA(xVal);
  const currentYB = costB(xVal);
  
  // 물리적 요금 격차 계산 및 양팔저울 기울기 각도 공식화 매핑
  const weightDiff = currentYA - currentYB; 
  const isBalanced = Math.abs(xVal - targetX) < 0.05; // 평형 제로포인트 판정
  
  // 요금 차이에 따라 저울대가 회전할 기울기 각도 각속도 클램핑 (라디안 단위 계산)
  const angle = Math.min(0.4, Math.max(-0.4, weightDiff * 0.08));

  // =================================================================
  // ⚖️ [저울 기하학 데이터 산출] 규격 스펙 동적 바인딩
  // points[0]=받침점(중심), points[1]=왼쪽 접시, points[2]=오른쪽 접시
  // =================================================================
  const pivotX = 3.0, pivotY = 5.0; // 저울의 중심 받침대 주소
  const armLength = 2.2;            // 저울대 가로 팔 길이
  
  // 회전 행렬을 적용하여 기울어진 왼쪽/오른쪽 접시의 실시간 (x, y) 도출
  const leftPlateX = pivotX - armLength * Math.cos(angle);
  const leftPlateY = pivotY - armLength * Math.sin(angle);
  const rightPlateX = pivotX + armLength * Math.cos(angle);
  const rightPlateY = pivotY + armLength * Math.sin(angle);

  // 실시간 상태별 메인 내레이션 알림창 셋업
  let masterHeadline = "⚖️ 양팔저울 실험실 가동: 사용량을 드래그하여 저울대가 완벽한 수평(평형)이 되는 지점을 개척하세요!";
  let badgeTheme = { bg: '#64748b', text: '기울어짐' };
  let hudBg = "#f8fafc";

  if (isBalanced) {
    masterHeadline = "🎉 수평 평형 도달! 양쪽 요금이 똑같아져 저울이 평형을 이룬 순간, 우측 그래프의 두 수식이 정확히 '교차'하는 교점이 탄생합니다!";
    badgeTheme = { bg: '#10b981', text: '⚖️ 완전 평형' };
    hudBg = "#e0f2fe";
  } else if (weightDiff > 0) {
    masterHeadline = "⚠️ A요금제 추가 B보다 더 무겁습니다! 데이터 사용량이 많아져 왼쪽 접시가 아래로 쿵 내려앉았습니다.";
    badgeTheme = { bg: '#2563eb', text: '왼쪽 무거움' };
  } else {
    masterHeadline = "⚠️ B요금제 추가 A보다 더 무겁습니다! 기본요금의 영향으로 오른쪽 접시가 아래로 쿵 내려앉았습니다.";
    badgeTheme = { bg: '#db2777', text: '오른쪽 무거움' };
  }

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    hud: { background: hudBg, border: '2px solid #bae6fd', borderRadius: '16px', padding: '14px', transition: 'all 0.2s ease' },
    hudTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
    hudBadge: { background: badgeTheme.bg, color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    splitGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexWrap: 'wrap' },
    box: { background: '#ffffff', borderRadius: '16px', padding: '12px', border: '2px solid #e2e8f0' },
    title: { fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', textAlign: 'center' },
    canvasFrame: { background: '#fafaf9', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' },
    mathFrame: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    metaTable: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' },
    miniCard: { background: '#f8fafc', padding: '6px', borderRadius: '8px', textAlign: 'center', fontSize: '11px', border: '1px solid #e2e8f0' },
    footer: { fontSize: '12px', color: '#475569', textAlign: 'center', marginTop: '6px', lineHeight: '1.5', padding: '0 8px' }
  };

  return (
    <div style={styles.container}>
      
      <style>{`
        .mafs-master-space .MafsView { background-color: transparent !important; }
        .mafs-master-space .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 📡 톱클래스 캡스톤 HUD 정보 제어 콘솔 */}
      <div className="viz-box" style={styles.hud}>
        <div style={styles.hudTop}>
          <span style={{fontSize:'14px', fontWeight:'bold', color:'#0369a1'}}>🛰️ 대수-기하 연합 평형 컨트롤 HUD</span>
          <span style={styles.hudBadge}>{badgeTheme.text}</span>
        </div>
        <div style={{fontSize:'12px', color:'#334155', fontWeight:'500'}}>{masterHeadline}</div>
      </div>

      {/* 🧩 두 공간의 유기적 이원화 밸런싱 섹션 레이아웃 */}
      <div style={styles.splitGrid}>
        
        {/* ⚖️ 좌측 공간: 실제 기하 양팔저울 장치 파트 */}
        <div className="viz-box" style={styles.box}>
          <div style={styles.title}>⚖️ [좌측 장치] 아날로그 양팔저울 기지</div>
          <div className="mafs-master-space" style={styles.canvasFrame}>
            <Mafs viewBox={{ x: [0, 6], y: [1, 7] }} preserveAspectRatio={true} height={260}>
              
              {/* 저울 단단한 삼각 받침대 기둥 그리기 */}
              <Polygon points={[[3.0, pivotY], [2.7, 1.8], [3.3, 1.8]]} color="#78716c" weight={2} opacity={0.3} />
              <Line.Segment point1={[1.5, 1.8]} point2={[4.5, 1.8]} color="#444" weight={3} /> {/* 땅바닥 받침 */}

              {/* 중앙 고정 받침 노드 (points[0]) */}
              <Point x={pivotX} y={pivotY} color="#451a03" size={6} />
              
              {/* 뼈대 저울대 가로축 회전 막대선 */}
              <Line.Segment point1={[leftPlateX, leftPlateY]} point2={[rightPlateX, rightPlateY]} color="#b45309" weight={5} />

              {/* 왼쪽 A요금 접시 매달린 줄 및 추 바디 (points[1]) */}
              <Line.Segment point1={[leftPlateX, leftPlateY]} point2={[leftPlateX, leftPlateY - 1.5]} color="#78716c" weight={1.5} />
              <Line.Segment point1={[leftPlateX - 0.6, leftPlateY - 1.5]} point2={[leftPlateX + 0.6, leftPlateY - 1.5]} color="#2563eb" weight={4} />
              <Text x={leftPlateX} y={leftPlateY - 2.0} size={11} color="#2563eb" weight="bold" attach="s">{`A추: ${currentYA.toFixed(0)}원`}</Text>

              {/* 오른쪽 B요금 접시 매달린 줄 및 추 바디 (points[2]) */}
              <Line.Segment point1={[rightPlateX, rightPlateY]} point2={[rightPlateX, rightPlateY - 1.5]} color="#78716c" weight={1.5} />
              <Line.Segment point1={[rightPlateX - 0.6, rightPlateY - 1.5]} point2={[rightPlateX + 0.6, rightPlateY - 1.5]} color="#db2777" weight={4} />
              <Text x={rightPlateX} y={rightPlateY - 2.0} size={11} color="#db2777" weight="bold" attach="s">{`B추: ${currentYB.toFixed(0)}원`}</Text>

              {/* 🎮 [직접 조작 핸들] 오른쪽 접시 바닥 노드를 직접 잡고 위아래/좌우로 움직여 수평 맞추기 */}
              <MovablePoint
                point={[rightPlateX, rightPlateY - 1.5]}
                color={Theme.red}
                constrain={(pos) => {
                  // 가로축 마우스 위치에 따른 동적 변수 역계산 바인딩 스냅
                  const calculatedX = Math.min(GMAX, Math.max(0, Math.round(pos[0] * 2) / 2));
                  const nYA = costA(calculatedX);
                  const nYB = costB(calculatedX);
                  const nAngle = Math.min(0.4, Math.max(-0.4, (nYA - nYB) * 0.08));
                  return [pivotX + armLength * Math.cos(nAngle), pivotY + armLength * Math.sin(nAngle) - 1.5];
                }}
                onMove={(pos) => {
                  // 기하학적 아크탄젠트 각도를 역산하여 사용량 상태 xVal 스냅 복원
                  const dx = pos[0] - pivotX;
                  const dy = (pos[1] + 1.5) - pivotY;
                  const theta = Math.atan2(dy, dx);
                  const rawX = targetX + (theta / 0.08); // 감도 역연산
                  const snappedX = Math.min(GMAX, Math.max(0, Math.round(rawX * 2) / 2));
                  patchState({ xVal: snappedX });
                }}
              />
            </Mafs>
          </div>
        </div>

        {/* 📐 우측 공간: 진짜 데카르트 직교 함수 그래프 파트 */}
        <div className="viz-box" style={styles.box}>
          <div style={styles.title}>📐 [우측 그래프] 데카르트 연립방정식 코어 평면</div>
          <div className="mafs-master-space" style={styles.mathFrame}>
            <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={260}>
              <Coordinates.Cartesian />

              {/* 규칙에 따른 2개의 Curves 수식 완벽 플로팅 */}
              <Plot.OfX y={costA} color="#2563eb" weight={3} />
              <Plot.OfX y={costB} color="#db2777" weight={3} />

              {/* 현재 데이터 사용량 위치 가이드 세로 장벽 빔 */}
              <Line.Segment point1={[xVal, -1]} point2={[xVal, Math.max(currentYA, currentYB)]} color="#ea580c" weight={2} style="dashed" />

              {/* 두 요금제가 만나는 진정한 마스터 교점 (3, 7) */}
              <Point x={targetX} y={targetY} color={isBalanced ? Theme.green : "#94a3b8"} size={isBalanced ? 7 : 4} />

              {/* 🎮 [양방향 직접 인터랙션 4] 그래프 위 오렌지 장벽 핸들을 잡고 좌우로 전격 슬라이딩 제어 */}
              <MovablePoint
                point={[xVal, 0]}
                color="#ea580c"
                constrain={(pos) => [Math.min(GMAX, Math.max(0, Math.round(pos[0] * 2) / 2)), 0]}
                onMove={(pos) => patchState({ xVal: Math.min(GMAX, Math.max(0, Math.round(pos[0] * 2) / 2)) })}
              />
              
              <Text x={targetX} y={targetY} size={11} color="#0f172a" weight="bold" attach="ne">🔓 평형점(3,7)</Text>
            </Mafs>
          </div>
        </div>

      </div>

      {/* 📋 통합 실시간 모니터링 수치 데이터 판넬 */}
      <div style={styles.metaTable}>
        <div style={styles.miniCard}>📊 현재 데이터 사용량: <b style={{color:'#ea580c'}}>{xVal.toFixed(1)} GB</b></div>
        <div style={styles.miniCard}>⚖️ 저울대 평형 각도 기울기: <b>{(angle * (180 / Math.PI)).toFixed(1)} °</b></div>
      </div>

      {/* 🧠 최종 단원 결합 기하 마스터 캡션 */}
      <div style={styles.footer}>
        물리적인 양팔저울이 완벽한 수평 평형을 이루는 극적인 사건은, 수학 직교평면 위에서 두 함수 곡선이 크로스하여 충돌하는 <b>[교점의 발생 사건]</b>과 한 치의 오차도 없이 완벽하게 똑같은 현상임을 증명합니다.
        <br />
        <span style={{fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px'}}>
          교점 이전에는 A요금이 저렴하고 교점 이후에는 B요금이 저렴해지는 대소 관계의 역전 메커니즘을 시각적으로 관찰하며 연립방정식의 거시 안목을 완성하세요.
        </span>
      </div>

    </div>
  );
}