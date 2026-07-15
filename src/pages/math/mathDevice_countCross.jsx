import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Text, Polygon } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * no: "8-4" [궤적 시프트와 충돌 횟수 제어] 300줄 초밀도 초등 마스터 에디션
 * * [엔터프라이즈 설계 가이드라인 준수]
 * 1. Zero-Hook 아키텍처: 컴포넌트 내부 로컬 state 훅을 100% 배제하고 sharedXByLog 데이터 레이어와 동기화.
 * 2. 3축 다이렉트 장벽 핸들링: 슬라이더 없이 선의 좌/우/중앙 어디든 붙잡고 위아래로 시프트 조작.
 * 3. 기하학적 정합성 수호: preserveAspectRatio={true} 배율 고정으로 포물선 격자 일그러짐 차단.
 * 4. 해의 X축 사영 레이저: 교점의 발생 시 바닥 X축 눈금으로 실시간 기하선 빔을 투사하여 해의 위치 추적.
 */
export function renderCountCross(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 초등 수학 직관 격자 범위 세팅 (가로 0~6, 세로 -1~7 대칭 스케일)
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-1.5, 7.5]);

  // =================================================================
  // ⚙️ [수학 코어 엔진] 우주 롤러코스터 레일의 이차함수 규칙 정의
  // 규칙 공식: y = (x - 3)^2 + 1  (꼭짓점 주소는 정확히 가로 3, 세로 1)
  // 사용자가 수평 레이저 쉴드 y = k 의 높이를 직접 제어함에 따른 실시간 교점 추적 연산:
  // - k > 1.0  : 2개의 서로 다른 교점 발생 (위기 상태)
  // - k === 1.0 : 딱 1번 아슬아슬하게 만나는 접점 발생 (중근 상태)
  // - k < 1.0  : 만나지 않고 엇갈림 (안전 회피 상태)
  // =================================================================
  const fCoaster = (x) => {
    return Math.pow(x - 3, 2) + 1;
  };

  // =================================================================
  // 🔌 [상태 라우터] Zero-Hook 상하 궤적 통합 바인딩 및 동기화
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const kVal = st.kVal ?? 4.0; // 사용자가 직접 끄는 수평선 장벽의 높이 (기본값: 4.0)

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
  // 🧮 [기하학 예외 처리 및 수리 모델링] 실시간 교점 및 실근 투영 연산
  // =================================================================
  let clashCount = 0;
  let clashNodes = [];
  const magnetEpsilon = 0.08; // 꼭짓점(y=1)에 챡 들러붙게 만드는 자석 스냅 임계값

  // 실시간 판별 하중 요인 역계산
  if (kVal > 1.0 + magnetEpsilon) {
    clashCount = 2;
    const rootOffset = Math.sqrt(kVal - 1);
    clashNodes = [
      { x: 3.0 - rootOffset, y: kVal, id: 'clash-left', label: '첫 번째 만남' },
      { x: 3.0 + rootOffset, y: kVal, id: 'clash-right', label: '두 번째 만남' }
    ];
  } else if (kVal >= 1.0 - magnetEpsilon && kVal <= 1.0 + magnetEpsilon) {
    clashCount = 1;
    clashNodes = [{ x: 3.0, y: 1.0, id: 'clash-tangent', label: '꼭짓점 접함' }];
  } else {
    clashCount = 0;
  }

  // 충돌 반경 근접도 보간(Interpolation) 연산
  const vertexDistance = Math.abs(kVal - 1.0);
  const proximityGlow = Math.max(0, 1 - vertexDistance / 3.0);

  // 실시간 안전 등급 상태별 어린이 맞춤형 텍스트 & 테마 스위칭 매트릭스
  let statusHeadline = "💥 충돌 위기! 수평 레이저가 둥근 레일을 [2번] 뚫고 지나갑니다!";
  let statusDetail = "둥근 롤러코스터 레일과 일자 장벽이 2군데서 만났어요. 수학 나라에서는 이 상태를 '방정식의 답(해)이 2개 생겼다'고 불러요.";
  let uiTheme = {
    bg: '#fff5f5',
    border: '#feb2b2',
    text: '#9b2c2c',
    coreInk: '#ef4444',
    badge: '🚨 위험 (교점 2개)'
  };

  if (clashCount === 1) {
    statusHeadline = "⚠️ 아슬아슬! 레일의 가장 밑바닥 꼭짓점에 [딱 1번] 스치듯 만났습니다!";
    statusDetail = "일자 장벽이 롤러코스터 꼭짓점에 기적처럼 챡 들러붙은 상태예요. 수학에서는 이 특별한 순간을 '중근(해의 개수가 딱 1개)'이라고 부른답니다.";
    uiTheme = { bg: '#fffaf0', border: '#fbd38d', text: '#9c4221', coreInk: '#f59e0b', badge: '⚠️ 중근 (교점 1개)' };
  } else if (clashCount === 0) {
    statusHeadline = "🍏 회피 성공! 수평 레이저가 레일 밑으로 비껴가서 [0번] 만납니다!";
    statusDetail = "장벽을 레일보다 더 밑으로 내렸더니 단 한 번도 충돌하지 않는 안전지대가 열렸어요! 수학에서는 만나는 점이 없으므로 '해의 개수가 0개(없다)'고 선언해요.";
    uiTheme = { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', coreInk: '#10b981', badge: '🍏 안전 (교점 0개)' };
  }

  // =================================================================
  // 🎨 [컴포넌트 시각 레이아웃 디자인 패키지]
  // =================================================================
  const styles = {
    mainWrapper: { display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif', userSelect: 'none' },
    hudConsole: { background: uiTheme.bg, border: `2px solid ${uiTheme.border}`, color: uiTheme.text, borderRadius: '16px', padding: '16px', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
    hudHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
    hudTitleText: { fontSize: '14px', fontWeight: '800' },
    hudBadgeLabel: { fontSize: '11px', fontWeight: '900', background: uiTheme.text, color: '#ffffff', padding: '3px 9px', borderRadius: '6px', letterSpacing: '0.5px' },
    hudBodyText: { fontSize: '13px', fontWeight: 'bold', lineHeight: '1.4' },
    hudSubText: { fontSize: '12px', marginTop: '4px', opacity: 0.85, fontWeight: '500', lineHeight: '1.4' },
    
    panelLayout: { background: '#ffffff', borderRadius: '16px', padding: '14px', border: '2px solid #e2e8f0' },
    panelTitleText: { fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '10px', textAlign: 'center' },
    simFrameBox: { background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden', position: 'relative' },
    mathFrameBox: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    
    scoreboardWrapper: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' },
    scoreCard: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', textAlign: 'center' },
    scoreLabel: { fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '700' },
    scoreValue: { fontSize: '14px', fontWeight: '900', color: '#0f172a' },
    
    footerCaptionText: { fontSize: '12.5px', color: '#334155', textAlign: 'center', marginTop: '8px', lineHeight: '1.6', padding: '0 6px', fontWeight: '500' }
  };

  return (
    <div style={styles.mainWrapper}>
      
      {/* Mafs 내부 그래픽 엔진 레이어 강제 투명화 오버라이드 */}
      <style>{`
        .mafs-shield-engine .MafsView { background-color: transparent !important; }
        .mafs-shield-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* =================================================================
          📡 [HUD 대시보드] 우주 레이싱 관제탑 관측 스크린
          ================================================================= */}
      <div className="viz-box" style={styles.hudConsole}>
        <div style={styles.hudHeaderRow}>
          <span style={styles.hudTitleText}>🛰️ 우주 롤러코스터 충돌 계측 사령부</span>
          <span style={styles.hudBadgeLabel}>{uiTheme.badge}</span>
        </div>
        <div style={styles.hudBodyText}>{statusHeadline}</div>
        <div style={styles.hudSubText}>{statusDetail}</div>
      </div>

      {/* =================================================================
          🎬 [1층 기지] 아날로그 시뮬레이터 공간 (수평 레이저 장벽 직접 조작)
          ================================================================= */}
      <div className="viz-box" style={styles.panelLayout}>
        <div style={styles.panelTitleText}>
          🎬 <b>[1층 공간: 롤러코스터 조종실]</b> 하늘색 수평 레이저선을 직접 붙잡고 <b>위아래↕</b>로 과감하게 움직이세요!
        </div>
        
        <div className="mafs-shield-engine" style={styles.simFrameBox}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={210}>
            
            {/* 롤러코스터 레일이 깔린 대칭 구역 은은한 우주 빔 배경 효과 */}
            <Polygon 
              points={[[1, 6], [5, 6], [3, 1]]} 
              color="#38bdf8" 
              opacity={0.01 + proximityGlow * 0.04} 
            />

            {/* 고정된 U자형 우주선 레일 자취 유도선 미리 드로잉 */}
            <Plot.OfX y={fCoaster} color="#475569" weight={2} style="dashed" />

            {/* 🔵 실시간 상하 평행이동 시프트하는 쉴드 장벽 레이저선 */}
            <Line.Segment point1={[-0.5, kVal]} point2={[GMAX + 0.5, kVal]} color="#38bdf8" weight={4} />

            {/* 날아가는 미니 우주선 에모지 물리 좌표 연동 */}
            <Text x={1.2} y={fCoaster(1.2) + 0.4} size={22} attach="center">🚀</Text>

            {/* 🎮 [직접 인터랙션 1] 중앙 마스터 조종 핸들 - 한가운데를 잡아 끌어올림 */}
            <MovablePoint
              point={[3.0, kVal]}
              color="#ef4444"
              constrain={(pos) => {
                const ry = pos[1];
                // 꼭짓점 부근(y=1)에 근접 시 자석 자성 스냅 보정 가동
                if (Math.abs(ry - 1.0) < 0.14) return [3.0, 1.0];
                const snapY = Math.round(ry * 4) / 4; // 0.25 단위 정밀 스냅 구속
                return [3.0, Math.min(6.5, Math.max(-1.0, snapY))];
              }}
              onMove={(pos) => patchState({ kVal: pos[1] })}
            />

            {/* 🎮 [직접 인터랙션 2] 좌측 사이드 조종 핸들 - 왼쪽 끝을 잡아 밸런싱 시프트 */}
            <MovablePoint
              point={[0.2, kVal]}
              color="#38bdf8"
              constrain={(pos) => {
                const ry = pos[1];
                if (Math.abs(ry - 1.0) < 0.14) return [0.2, 1.0];
                return [0.2, Math.min(6.5, Math.max(-1.0, Math.round(ry * 4) / 4))];
              }}
              onMove={(pos) => patchState({ kVal: pos[1] })}
            />

            {/* 🎮 [직접 인터랙션 3] 우측 사이드 조종 핸들 - 오른쪽 끝을 잡아 밸런싱 시프트 */}
            <MovablePoint
              point={[5.8, kVal]}
              color="#38bdf8"
              constrain={(pos) => {
                const ry = pos[1];
                if (Math.abs(ry - 1.0) < 0.14) return [5.8, 1.0];
                return [5.8, Math.min(6.5, Math.max(-1.0, Math.round(ry * 4) / 4))];
              }}
              onMove={(pos) => patchState({ kVal: pos[1] })}
            />
            
            <Text x={3.0} y={kVal + 0.4} size={11} color="#f87171" weight="black" attach="n">🛡️ 3축 통합 장벽 레버</Text>

            {/* 💥 두 기하 도형이 격돌했을 때 터지는 초등용 불꽃 비주얼 매핑 */}
            {clashNodes.map((node) => (
              <React.Fragment key={`sim-hit-${node.id}`}>
                <Text x={node.x} y={node.y} size={24} attach="center">💥</Text>
                <Text x={node.x} y={node.y - 0.4} size={9} color="#94a3b8" weight="bold" attach="s">{node.label}</Text>
              </React.Fragment>
            ))}
          </Mafs>
        </div>
      </div>

      {/* =================================================================
          📐 [2층 기지] 수학 데카르트 직교좌표평면 그래프 공간 (수식 증명)
          ================================================================= */}
      <div className="viz-box" style={styles.panelLayout}>
        <div style={styles.panelHeader}>
          📐 <b>[2층 공간: 눈금 모눈종이]</b> 포물선 함수 $y = (x-3)^2+1$과 수평선 방정식의 만남 계측 평면
        </div>
        
        <div className="mafs-shield-engine" style={styles.mathFrameBox}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={240}>
            {/* 정밀 표준 수학 격자 배치 */}
            <Coordinates.Cartesian />

            {/* ⚠️ Plot 컴포넌트를 활용하여 2차 곡선 포물선을 부드럽고 명확하게 수학 드로잉 */}
            <Plot.OfX y={fCoaster} color="#4ade80" weight={3.5} />
            
            {/* 대수적 상수 함수 방정식 y = k 실시간 드로잉 */}
            <Line.Linear slope={0} intercept={kVal} color="#ef4444" weight={2.5} />

            {/* 🎯 핵심 매핑: 교점이 터진 위치에서 바닥 X축 정답 눈금자리로 수직 레이저 빔 다운 발사 */}
            {clashNodes.map((node) => (
              <React.Fragment key={`math-hit-${node.id}`}>
                {/* 만난 진짜 교점 마킹 불빛 */}
                <Point x={node.x} y={node.y} color={Theme.red} size={6.5} />
                
                {/* 🚨 [빼먹었던 핵심 복원] X축의 해의 주소로 꽂아버리는 수직 점선 기하 레이저선 */}
                <Line.Segment 
                  point1={[node.x, 0]} 
                  point2={[node.x, node.y]} 
                  color={Theme.red} 
                  style="dashed" 
                  weight={1.8} 
                />
                
                {/* 바닥에 찍힌 숫자가 진짜 원인(해)임을 라벨링 */}
                <Text x={node.x} y={0.2} size={11} color="#be123c" weight="black" attach="n">
                  {`x = ${node.x.toFixed(1)}`}
                </Text>
              </React.Fragment>
            ))}

            {/* 🎮 [역방향 직접 인터랙션 4] 그래프 우측 경계면에 부착된 붉은 조종 노드를 직접 잡아 시프트 */}
            <MovablePoint
              point={[GMAX, kVal]}
              color={Theme.red}
              constrain={(pos) => {
                const targetY = pos[1];
                if (Math.abs(targetY - 1.0) < 0.15) return [GMAX, 1.0];
                return [GMAX, Math.min(6.5, Math.max(-1.0, Math.round(targetY * 4) / 4))];
              }}
              onMove={(pos) => patchState({ kVal: pos[1] })}
            />
            <Text x={GMAX} y={kVal} size={12} color="#be123c" weight="black" attach="e">{`y = ${kVal.toFixed(2)}`}</Text>
          </Mafs>
        </div>

        {/* 📋 실시간 대수학 관측 계기판 스코어보드 */}
        <div style={styles.scoreboardWrapper}>
          <div style={styles.scoreCard}>
            <span style={styles.scoreLabel}>🛡️ 수평 장벽의 수학 이름(식)</span>
            <span style={styles.scoreValue}>y = {kVal.toFixed(2)}</span>
          </div>
          <div style={styles.scoreCard}>
            <span style={styles.scoreLabel}>🎯 눈으로 세어낸 교점의 개수</span>
            <span style={{ ...styles.scoreValue, color: uiTheme.coreInk, fontSize: '15px' }}>{clashCount} 개</span>
          </div>
        </div>

        {/* 대수학 핵심 정체성 내레이션 최종 꼬리표 */}
        <div style={styles.footerCaptionText}>
          수식 뒤로 숫자를 바꾸어 함수선을 위아래로 움직이면(Shift), 곡선과 부딪히는 지점의 개수가 바뀝니다. 
          귀찮은 수학 계산식을 연습장에 일일이 풀지 않더라도 **[그림 위에서 만나는 교점의 개수가 곧 우리가 찾는 방정식의 정답(해)의 총 개수]**와 완벽하게 똑같다는 기하학적 치트키를 관찰하세요!
        </div>
      </div>

    </div>
  );
}