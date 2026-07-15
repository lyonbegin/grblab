import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint, Line, Point, Text, Polygon, Plot } from 'mafs';
import { toRange } from './mathDeviceShared';

// ===========================================================
// [수정 요지 — 렌더 크래시 원인 수정]
// 실제 mafs 패키지(build/index.d.ts)를 설치해 API를 직접 검증했다.
//
// 1) 치명적 버그: <Line.Linear slope={} intercept={} .../> 는 존재하지 않는 컴포넌트.
//    mafs의 Line 네임스페이스는 { PointAngle, PointSlope, ThroughPoints, Segment } 뿐이라
//    Line.Linear는 undefined → React가 "Element type is invalid... got: undefined" 에러를
//    던지며 전체 트리가 죽는다. → Line.PointSlope(point, slope)로 교체.
// 2) <Point size={...} /> 는 존재하지 않는 prop(PointProps엔 x,y,color,opacity,svgCircleProps
//    뿐). 에러는 안 나지만 크기 효과가 조용히 무시된다. → svgCircleProps={{ r: ... }}로 교체.
// (weight, style="dashed" 등은 mafs가 자체 정의한 정상 prop이라 그대로 둔다.)
// ===========================================================

export function renderIntersectX(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 1. 초등 수학 인지 반경 내 가로/세로 도메인 경계 정의
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-0.5, 8.5]);

  // 2. 두 비밀 요원의 규칙 수식 정의 (A: 우상향 직선, B: 우하향 직선)
  const fAgentA = (x) => x + 3;
  const fAgentB = (x) => -x + 7;

  // 두 요원이 쾅 충돌하는 운명의 교점 정답 주소 세팅
  const targetX = 2.0;
  const targetY = 5.0;

  // 3. 부모 상태 동기화 바인딩 (Zero-Hook 아키텍처 규칙 완벽 준수)
  const st = sharedXByLog?.[logIdx] || {};
  const xVal = st.xVal ?? 0.5; // 사용자가 서치 중인 실시간 가로 주소

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  // 4. 실시간 수학 및 기하학 상태 물리량 정밀 연산 파트
  const yA = fAgentA(xVal);
  const yB = fAgentB(xVal);
  const currentGap = Math.abs(xVal - targetX);

  // 자석 흡착 정밀 스냅 판정 (교점 근처 0.04 범위 진입 시 락온)
  const isTargetMatched = currentGap < 0.04;
  const radarProximity = Math.max(0, 1 - currentGap / 2.5);
  const targetLaserOpacity = Math.min(1, Math.max(0, (0.4 - currentGap) / 0.3));

  // 5. 교점 전후의 대소 관계 (높낮이 우위) 역동적 추적 제어 엔진
  let heightRelationText = "";
  let relationColor = "#475569";
  if (xVal < targetX) {
    heightRelationText = "💡 현재 상태: B요원이 A요원보다 더 높은 층에 있습니다!";
    relationColor = "#db2777";
  } else if (xVal > targetX) {
    heightRelationText = "💡 현재 상태: A요원이 B요원보다 더 높은 층으로 역전되었습니다!";
    relationColor = "#2563eb";
  } else {
    heightRelationText = "✨ 평형 상태: 두 요원의 높이가 5층으로 완벽하게 일치합니다!";
    relationColor = "#16a34a";
  }

  // 6. 상태별 내레이션 스위칭 팩토리
  let infoTitle = "🕵️‍♂️ 두 비밀 요원의 운명적 비밀 기지 조준 작전";
  let infoDetail = "파란 요원(A)과 분홍 요원(B)이 각자의 규칙을 따라 걷고 있습니다. 화면 내부의 주황색 레이저 기둥이나 조종 노드를 직접 붙잡고 흔들어 두 요원이 정확히 한자리에서 쾅 만나는 비밀 교점을 격추하세요!";
  let uiTheme = { bg: '#f8fafc', border: '#cbd5e1', text: '#334155', main: '#64748b' };

  if (isTargetMatched) {
    infoTitle = "💥 대성공! 두 요원의 운명적인 조우점 포획!";
    infoDetail = "두 요원이 정확히 같은 자리에서 조우했습니다! 이때 두 사람이 위치한 건물 높이(세로 y = 5)가 똑같아집니다. 수학 방정식에서 진짜 정답(해)을 찾을 때는 만난 높이가 아니라, 두 규칙을 똑같게 만든 근원인 바닥의 [가로 주소 x = 2]를 정답으로 읽어내야 합니다.";
    uiTheme = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', main: '#2563eb' };
  } else if (currentGap < 0.6) {
    infoTitle = "⚠️ 경고! 두 요원이 서로 부딪히기 직전입니다!";
    infoDetail = "두 요원의 높낮이가 서로 교차하며 뒤바뀌기 직전의 락온 임계 구역입니다. 바닥의 가로축 숫자를 유심히 살펴보며 조준선을 정밀하게 맞춰보세요.";
    uiTheme = { bg: '#fffbeb', border: '#fde68a', text: '#78350f', main: '#d97706' };
  }

  // 7. 엔터프라이즈급 UI 인라인 스타일 매트릭스
  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif', userSelect: 'none' },
    hudConsole: { background: uiTheme.bg, border: `2px solid ${uiTheme.border}`, borderRadius: '16px', padding: '16px', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
    hudHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    hudTitle: { fontSize: '14px', fontWeight: '800', color: uiTheme.text },
    hudBadge: { background: uiTheme.main, color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    hudBody: { fontSize: '13px', fontWeight: '500', color: uiTheme.text, lineHeight: '1.5' },
    panelLayout: { background: '#ffffff', borderRadius: '16px', padding: '14px', border: '2px solid #e2e8f0' },
    panelHeader: { fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '12px', textAlign: 'center' },
    simContainer: { background: '#fafaf9', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' },
    mathContainer: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },

    // 높낮이 실시간 역전 표시 보드
    relationBoard: { background: '#f8fafc', border: `1px solid ${uiTheme.border}`, padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 'bold', color: relationColor, textAlign: 'center', transition: 'all 0.2s ease' },

    metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px' },
    metricsCard: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', textAlign: 'center' },
    cardLabel: { fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '700' },
    cardValue: { fontSize: '14px', fontWeight: '900', color: '#0f172a' },
    systemBox: { background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '12px', fontSize: '13px', fontWeight: 'bold', color: '#334155' },
    captionArea: { fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '8px', lineHeight: '1.6', padding: '0 4px' }
  };

  return (
    <div style={styles.container}>

      {/* Mafs 뷰어 프레임 고유 다크 테마 강제 제거 CSS 주입 */}
      <style>{`
        .mafs-optics-core .MafsView { background-color: transparent !important; }
        .mafs-optics-core .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* =================================================================
          📡 [HUD 모니터] 작전 제어 통제실 브리핑 정보 창
          ================================================================= */}
      <div className="viz-box" style={styles.hudConsole}>
        <div style={styles.hudHeader}>
          <span style={styles.hudTitle}>{infoTitle}</span>
          <span style={styles.hudBadge}>{isTargetMatched ? "작전 완료" : "실시간 추적"}</span>
        </div>
        <div style={styles.hudBody}>{infoDetail}</div>
      </div>

      {/* =================================================================
          🎬 [1층 기지] 아날로그 시뮬레이터 (두 요원의 추적 레이더망)
          ================================================================= */}
      <div className="viz-box" style={styles.panelLayout}>
        <div style={styles.panelHeader}>
          🎬 <b>[1층 공간: 스파이 조준 레이더]</b> 주황색 세로 탐색 장벽의 위아래나 바닥을 붙잡고 직접 미세요!
        </div>

        <div className="mafs-optics-core" style={styles.simContainer}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={220}>

            {/* 레이더 조준 임계 영역 시각 장식 스포트라이트 */}
            <Polygon
              points={[[targetX - 0.4, targetY - 0.4], [targetX + 0.4, targetY - 0.4], [targetX + 0.4, targetY + 0.4], [targetX - 0.4, targetY + 0.4]]}
              color={Theme.blue}
              opacity={0.01 + radarProximity * 0.09}
            />

            {/* 두 요원의 예상 이동 경로 가이드 점선
                [수정] Line.Linear(존재하지 않음) → Line.PointSlope(point, slope)로 교체.
                y=x+3 은 (0,3)을 지나는 기울기 1, y=-x+7 은 (0,7)을 지나는 기울기 -1. */}
            <Line.PointSlope point={[0, 3]} slope={1} color="#cbd5e1" weight={1.2} style="dashed" />
            <Line.PointSlope point={[0, 7]} slope={-1} color="#cbd5e1" weight={1.2} style="dashed" />

            {/* 🟠 실시간 시간 동기화 세로 레이저 탐색 기둥선 */}
            <Line.Segment point1={[xVal, -0.5]} point2={[xVal, 8.5]} color="#ea580c" weight={isTargetMatched ? 4.5 : 2.5} />

            {/* 파란 요원 A 본체 아이콘 및 실시간 위치 플로팅
                [수정] Point엔 size prop이 없음(조용히 무시됨) → svgCircleProps={{r:...}}로 교체 */}
            <Point x={xVal} y={yA} color="#2563eb" svgCircleProps={{ r: 5 + radarProximity * 2.5 }} />
            <Text x={xVal} y={yA + 0.4} size={13} color="#2563eb" attach="n">😎 요원 A</Text>

            {/* 분홍 요원 B 본체 아이콘 및 실시간 위치 플로팅 */}
            <Point x={xVal} y={yB} color="#db2777" svgCircleProps={{ r: 5 + radarProximity * 2.5 }} />
            <Text x={xVal} y={yB - 0.4} size={13} color="#db2777" attach="s">🥸 요원 B</Text>

            {/* 충돌 감지 센터 앵커 포인트 */}
            <Point x={targetX} y={targetY} color={isTargetMatched ? Theme.red : "#cbd5e1"}
              svgCircleProps={{ r: isTargetMatched ? 8 : 4 }} />
            {isTargetMatched && <Text x={targetX} y={targetY - 0.1} size={28} attach="center">🎉</Text>}

            {/* 🎮 [직접 인터랙션 1] 바닥 X축 조종 핸들 - 선 밑바닥을 잡고 횡이동 제어 */}
            <MovablePoint
              point={[xVal, 0]}
              color="#ea580c"
              constrain={(pos) => {
                const rx = Math.round(pos[0] * 10) / 10;
                return [Math.min(GMAX, Math.max(0, rx)), 0];
              }}
              onMove={(pos) => patchState({ xVal: pos[0] })}
            />

            {/* 🎮 [직접 인터랙션 2] 세로 기둥선 상단 탑 핸들 - 머리 부분을 잡고 통째로 이동 */}
            <MovablePoint
              point={[xVal, 8.0]}
              color="#ea580c"
              constrain={(pos) => {
                const rx = Math.round(pos[0] * 10) / 10;
                return [Math.min(GMAX, Math.max(0, rx)), 8.0];
              }}
              onMove={(pos) => patchState({ xVal: pos[0] })}
            />
          </Mafs>
        </div>
      </div>

      {/* 실시간 요원 높낮이 대소 우위 역전 판정 인디케이터 보드 */}
      <div style={styles.relationBoard}>
        {heightRelationText}
      </div>

      {/* =================================================================
          📐 [2층 기지] 수학 데카르트 직교평면 그래프 공간 (수식 결합)
          ================================================================= */}
      <div className="viz-box" style={styles.panelLayout}>
        <div style={styles.panelHeader}>
          📐 <b>[2층 공간: 데카르트 수학 종이]</b> 두 규칙 선이 충돌하여 유일한 교점을 형성하는 수학 평면
        </div>

        <div className="mafs-optics-core" style={styles.mathContainer}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            <Coordinates.Cartesian />

            {/* Plot 컴포넌트 규격을 철저히 준수한 실시간 1차 직선 그래프 2축 플로팅 */}
            <Plot.OfX y={fAgentA} color="#2563eb" weight={3.5} />
            <Plot.OfX y={fAgentB} color="#db2777" weight={3.5} />

            {/* 실시간 입력 변수 수직 사영 가이드 레이저 점선 */}
            <Line.Segment point1={[xVal, 0]} point2={[xVal, Math.max(yA, yB)]} color="#94a3b8" style="dashed" weight={1.5} />

            {/* 🎯 충돌 정답 영역 락온 시 바닥 X축 해를 향해 수직 낙하하는 붉은색 강렬한 레이저 빔 */}
            {targetLaserOpacity > 0 && (
              <Line.Segment
                point1={[targetX, 0]}
                point2={[targetX, targetY]}
                color={Theme.red}
                weight={2 + targetLaserOpacity * 2.5}
                opacity={targetLaserOpacity}
              />
            )}

            {/* 🎮 [직접 인터랙션 3] 그래프 위의 두 요원 높이의 정중앙 균형 중심 노드를 직접 터치하여 드래그 */}
            <MovablePoint
              point={[xVal, (yA + yB) / 2]}
              color={Theme.red}
              constrain={(pos) => {
                const cx = Math.min(GMAX, Math.max(0, pos[0]));
                const sx = Math.round(cx * 10) / 10;
                return [sx, (fAgentA(sx) + fAgentB(sx)) / 2];
              }}
              onMove={(pos) => patchState({ xVal: pos[0] })}
            />

            {/* 최종 교점 기하학 고유 명사 라벨링 */}
            <Text x={targetX} y={targetY} size={12} color="#0f172a" attach="ne">
              {`비밀 만남의 교점 (${targetX}, ${targetY})`}
            </Text>
          </Mafs>
        </div>

        {/* 대수학 관계식 연립방정식 시스템 구조 뷰어 */}
        <div style={styles.systemBox}>
          <span>📋 두 요원의 움직임 규칙 상자식:</span>
          <span style={{ color: '#2563eb' }}>y = x + 3</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#db2777' }}>y = −x + 7</span>
        </div>

        {/* 📊 실시간 대수-기하 데이터 바인딩 팩트 체크 리스트 */}
        <div style={styles.metricsGrid}>
          <div style={styles.metricsCard}>
            <span style={styles.cardLabel}>⏱️ 움직인 시간 (가로축 x)</span>
            <span style={styles.cardValue}>{xVal.toFixed(1)} 초</span>
          </div>
          <div style={styles.metricsCard}>
            <span style={{ ...styles.cardLabel, color: '#2563eb' }}>🔵 요원 A 서 있는 위치 (y1)</span>
            <span style={{ ...styles.cardValue, color: '#2563eb' }}>{yA.toFixed(1)} 층</span>
          </div>
          <div style={styles.metricsCard}>
            <span style={{ ...styles.cardLabel, color: '#db2777' }}>🔴 요원 B 서 있는 위치 (y2)</span>
            <span style={{ ...styles.cardValue, color: '#db2777' }}>{yB.toFixed(1)} 층</span>
          </div>
        </div>

        {/* 초등 개념 마무리 꼬리표 코어 피드백 */}
        <div style={styles.captionArea}>
          두 요원의 길이 공중에서 딱 만나는 교점은 두 요원의 높이가 완벽하게 똑같아지는 순간입니다.
          만나기 전과 만난 후의 두 함수의 높낮이(대소 관계)가 완전히 뒤바뀌는 구조를 마우스로 직접 선을 끄집어 당기며 관찰하고,
          방정식의 진짜 답(해)은 만난 높이(y)가 아니라 **그들이 만나게 된 원인인 바닥의 [가로 주소 x = 2]**임을 심장에 새기세요.
        </div>
      </div>

    </div>
  );
}