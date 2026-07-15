import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Polygon } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * no: "8-4" [롤러코스터 레일과 레이저 쉴드 장벽] 에러 원천 차단 마스터판
 * * [수정 내역 — 크래시 원인 완벽 제거]
 * 1. Line.Linear(존재하지 않음) ➡️ Line.PointSlope 컴포넌트로 전면 수정하여 #130 에러 원천 봉쇄.
 * 2. Point 컴포넌트의 size={6} ➡️ svgCircleProps={{ r: 6 }} 공식 SVG 반지름 규격 속성으로 전면 리팩토링.
 * 3. 트리 붕괴를 유발하는 Mafs 내장 <Text> 컴포넌트를 100% 박멸하고 완벽한 HTML 절대 좌표 오버레이 라벨로 대체.
 */
export function renderCountCross(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 1. 초등 수학 직관 격자 반경 한계 도메인 세팅 (가로 0~6, 세로 -1.5~7.5)
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-1.5, 7.5]);

  // 2. 우주 롤러코스터 레일의 2차 곡선(이차함수) 연산 공식 정의
  const fCoaster = (x) => {
    return Math.pow(x - 3, 2) + 1;
  };

  // 3. Zero-Hook 아키텍처 상태 제어 데이터 바인딩
  const st = sharedXByLog?.[logIdx] || {};
  const kVal = st.kVal ?? 4.0; // 사용자가 조작 중인 수평 레이저 장벽의 Y축 높이 k값

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  // 4. 실시간 교점 및 방정식 실근 사영 위치 기하 매트릭스 연산
  const touchZone = 0.08; // 꼭짓점 중근 판정용 자석 스냅 임계 오차 범위
  let clashCount = 0;
  let clashNodes = [];
  let statusText = "💥 레일과 2번 만나요! (방정식 해의 개수 = 2개)";

  if (kVal > 1.0 + touchZone) {
    clashCount = 2;
    const diff = Math.sqrt(kVal - 1);
    clashNodes = [
      { x: 3.0 - diff, y: kVal, id: 'left', label: '첫 번째 만남' },
      { x: 3.0 + diff, y: kVal, id: 'right', label: '두 번째 만남' }
    ];
  } else if (kVal >= 1.0 - touchZone && kVal <= 1.0 + touchZone) {
    clashCount = 1;
    clashNodes = [{ x: 3.0, y: 1.0, id: 'tangent', label: '꼭짓점 접함' }];
    statusText = "⚠️ 아슬아슬! 레일 바닥에 딱 1번 스치듯 만나요! (해의 개수 = 1개)";
  } else {
    clashCount = 0;
    statusText = "🍏 안전지대! 레일과 전혀 만나지 않고 스쳐 지나가요! (해의 개수 = 0개)";
  }

  // 실시간 하중 격차에 따른 테마 색상 동적 할당
  let uiTheme = { bg: '#fff5f5', border: '#fecaca', text: '#991b1b', coreInk: '#ef4444' };
  if (clashCount === 1) {
    uiTheme = { bg: '#fffbeb', border: '#fef3c7', text: '#92400e', coreInk: '#f59e0b' };
  } else if (clashCount === 0) {
    uiTheme = { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', coreInk: '#10b981' };
  }

  // 5. 하이엔드 인라인 UI 스타일 패키지 빌드
  const styles = {
    wrapper: { display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif', userSelect: 'none' },
    hudConsole: { background: uiTheme.bg, border: `2px solid ${uiTheme.border}`, color: uiTheme.text, borderRadius: '16px', padding: '16px', transition: 'all 0.25s ease' },
    hudTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
    panelBox: { background: '#ffffff', borderRadius: '16px', padding: '14px', border: '2px solid #e2e8f0' },
    panelTitleText: { fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', textAlign: 'center' },
    simFrameBox: { background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden', position: 'relative' },
    mathFrameBox: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' },
    scoreboardWrapper: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' },
    scoreCard: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', textAlign: 'center' },
    scoreLabel: { fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '700' },
    scoreValue: { fontSize: '14px', fontWeight: '900', color: '#0f172a' },
    discriminantPanel: { background: '#f8fafc', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', marginTop: '12px' },
    formulaRow: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '12px', fontWeight: 'bold' },
    footerCaptionText: { fontSize: '12.5px', color: '#334155', textAlign: 'center', marginTop: '8px', lineHeight: '1.6' },
    // 🚨 크래시 예방을 위한 가상 좌표 매핑 구조용 오버레이 포지션 스타일
    htmlLabel: { position: 'absolute', pointerEvents: 'none', transform: 'translate(-50%, -50%)', fontWeight: '900', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', transition: 'top 0.1s linear, left 0.1s linear' }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        .mafs-shield-engine .MafsView { background-color: transparent !important; }
        .mafs-shield-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* =================================================================
          📡 [HUD 상단 모니터] 우주 관제탑 레이더 결과창
          ================================================================= */}
      <div className="viz-box" style={styles.hudConsole}>
        <div style={styles.hudTopRow}>
          <span style={{fontSize: '14px', fontWeight: '800'}}>🛸 우주 롤러코스터 충돌 계측 사령부</span>
          <span style={{fontSize: '11px', fontWeight: '900', background: uiTheme.text, color: '#ffffff', padding: '2px 8px', borderRadius: '4px'}}>레이더 판정</span>
        </div>
        <div style={{fontSize: '13px', fontWeight: 'bold', marginTop: '4px'}}>{statusText}</div>
      </div>

      {/* =================================================================
          🎬 [1층 공간] 직접 인터랙션 조종 공간 (3축 평행이동 레버 기하학)
          ================================================================= */}
      <div className="viz-box" style={styles.panelBox}>
        <div style={styles.panelTitleText}>
          🎬 <b>[1층: 우주 레일 장치 판넬]</b> 하늘색 수평 레이저 선을 위아래로 직접 터치해서 끌어보세요!
        </div>
        
        <div className="mafs-shield-engine" style={styles.simFrameBox}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={210}>
            {/* 레일 하단 특이 구역 레이더 스포트라이트 영역 */}
            <Polygon points={[[1, 6], [5, 6], [3, 1]]} color="#38bdf8" opacity={0.04} />
            
            {/* 롤러코스터 포물선 기본 유도 궤적 */}
            <Plot.OfX y={fCoaster} color="#475569" weight={2} style="dashed" />
            
            {/* 🔵 실시간 상하 평행이동 시프트하는 쉴드 장벽 레이저선 */}
            <Line.Segment point1={[-0.5, kVal]} point2={[GMAX + 0.5, kVal]} color="#38bdf8" weight={4} />
            
            {/* 🎮 [직접 인터랙션 1] 중앙 마스터 조종 핸들 */}
            <MovablePoint
              point={[3.0, kVal]}
              color="#ef4444"
              constrain={(pos) => {
                const ry = pos[1];
                if (Math.abs(ry - 1.0) < 0.15) return [3.0, 1.0]; // 꼭짓점 부근 자동 자석 자성 스냅
                return [3.0, Math.min(6.5, Math.max(-1.0, Math.round(ry * 4) / 4))];
              }}
              onMove={(pos) => patchState({ kVal: pos[1] })}
            />

            {/* 🎮 [직접 인터랙션 2] 좌측 보조 조종 핸들 */}
            <MovablePoint
              point={[0.2, kVal]}
              color="#38bdf8"
              constrain={(pos) => [0.2, Math.min(6.5, Math.max(-1.0, Math.round(pos[1] * 4) / 4))]}
              onMove={(pos) => patchState({ kVal: pos[1] })}
            />

            {/* 🎮 [직접 인터랙션 3] 우측 보조 조종 핸들 */}
            <MovablePoint
              point={[5.8, kVal]}
              color="#38bdf8"
              constrain={(pos) => [5.8, Math.min(6.5, Math.max(-1.0, Math.round(pos[1] * 4) / 4))]}
              onMove={(pos) => patchState({ kVal: pos[1] })}
            />
            
            {/* [수정 완료] Point size={7} ➡️ svgCircleProps={{ r: 7 }} 규격 일치화 */}
            {clashNodes.map((node) => (
              <Point key={`sim-${node.id}`} x={node.x} y={node.y} color={Theme.red} svgCircleProps={{ r: 7 }} />
            ))}
          </Mafs>

          {/* 🛡️ HTML 절대 좌표 공간 레이블 오버레이 투영 */}
          <div style={{ ...styles.htmlLabel, left: '50%', top: `${(1 - (kVal + 0.5 - yRange[0]) / (yRange[1] - yRange[0])) * 100}%`, color: '#f87171', backgroundColor: 'rgba(15,23,42,0.85)' }}>↕ 3축 통합 레버</div>
          <div style={{ ...styles.htmlLabel, left: '50%', top: '22%', color: '#94a3b8' }}>U자형 롤러코스터 레일</div>
          {clashNodes.map((node) => (
            <div key={`html-sim-${node.id}`} style={{ ...styles.htmlLabel, left: `${((node.x - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`, top: `${(1 - (node.y - yRange[0]) / (yRange[1] - yRange[0])) * 100}%`, color: '#ffffff', backgroundColor: '#ef4444', fontSize: '10px', padding: '2px 5px', borderRadius: '3px' }}>💥 {node.label}</div>
          ))}
        </div>
      </div>

      {/* =================================================================
          📐 [2층 공간] 정밀 데카르트 직교좌표계 분석 공간
          ================================================================= */}
      <div className="viz-box" style={styles.panelBox}>
        <div style={styles.panelTitleText}>
          📐 <b>[2층: 수학 데카르트 평면]</b> 수평선 장벽을 옮길 때 바뀌는 기하학적 만남의 점 개수
        </div>
        <div className="mafs-shield-engine" style={styles.mathFrameBox}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={240}>
            <Coordinates.Cartesian />
            
            {/* 정밀 포물선 곡선 기하 렌더링 */}
            <Plot.OfX y={fCoaster} color="#44ade8" weight={3.5} />
            
            {/* [수정 완료] Line.Linear(존재하지 않음) ➡️ Line.PointSlope(공식 모듈)로 완벽 리팩토링 */}
            <Line.PointSlope point={[0, kVal]} slope={0} color="#ef4444" weight={2.5} />

            {clashNodes.map((node) => (
              <React.Fragment key={`math-g-${node.id}`}>
                <Point x={node.x} y={node.y} color={Theme.red} svgCircleProps={{ r: 6 }} />
                {/* 바닥 X축 해의 주소를 타격하는 수직 사영 레이저 빔 복원 */}
                <Line.Segment point1={[node.x, 0]} point2={[node.x, node.y]} color={Theme.red} style="dashed" weight={1.6} />
              </React.Fragment>
            ))}

            {/* 🎮 [직접 인터랙션 4] 그래프 우측 경계면 수직 제어 핸들 */}
            <MovablePoint
              point={[GMAX, kVal]}
              color={Theme.red}
              constrain={(pos) => [GMAX, Math.min(6.5, Math.max(-1.0, Math.round(pos[1] * 4) / 4))]}
              onMove={(pos) => patchState({ kVal: pos[1] })}
            />
          </Mafs>

          {/* 그래프 스페이스 전용 절대 좌표 레이블 인젝션 */}
          <div style={{ ...styles.htmlLabel, left: '92%', top: `${(1 - (kVal - yRange[0]) / (yRange[1] - yRange[0])) * 100}%`, color: '#be123c', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 5px' }}>{`y = ${kVal.toFixed(2)}`}</div>
          {clashNodes.map((node) => (
            <div key={`html-num-${node.id}`} style={{ ...styles.htmlLabel, left: `${((node.x - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`, top: '90%', color: '#be123c', fontWeight: 'bold', backgroundColor: '#ffffff', padding: '0 2px' }}>{`x = ${node.x.toFixed(1)}`}</div>
          ))}
        </div>

        {/* 📋 실시간 물리-대수 스코어보드 패널 */}
        <div style={styles.discriminantPanel}>
          <div style={styles.formulaRow}>
            <span>📏 현재 세워진 장벽 높이: <span style={{color: uiTheme.text, fontSize: '13px', fontWeight: 'bold'}}>y = {kVal.toFixed(2)}</span></span>
            <span>📍 그래프가 만난 점의 개수: <span style={{color: uiTheme.text, fontSize: '14px', fontWeight: '900'}}>{clashCount} 개</span></span>
          </div>
        </div>

        <div style={styles.footerCaptionText}>
          수평선 막대기를 위아래로 움직여서 높낮이를 조절하면, 둥근 곡선과 만나는 점의 개수가 실시간으로 바뀝니다. 골치 아프게 수학 계산을 일일이 풀지 않아도 **[눈앞에 보이는 교점의 개수가 곧 방정식의 진짜 답의 개수]**와 완벽하게 똑같다는 기하학의 신비로운 마법을 느껴보세요!
        </div>
      </div>
    </div>
  );
}