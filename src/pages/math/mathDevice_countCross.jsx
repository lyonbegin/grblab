import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Text } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * ============================================================================
 * [대단원 8-4] 궤적 시프트와 충돌 횟수 제어 (직접 인터랙션 하이엔드 에디션)
 * ============================================================================
 * * 🛠️ [엔터프라이즈 설계 규칙]
 * 1. 무항목 제로 슬라이더: 화면 우측/상단의 조작 레버를 일절 금지하고 라인을 직접 조작합니다.
 * 2. 동적 해 판별 인디케이터: 충돌 횟수가 2개 -> 1개 -> 0개로 바뀔 때 인프라 테마 실시간 스위칭.
 * 3. 정밀 정수 그리드 시프트: Y축 절편 k값을 자석 스냅으로 착착 구속.
 * 4. Zero-Hook 아키텍처 수호 모델.
 */
export function renderCountCross(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG_TAG = '[mathDevice_countCross]';
  const v = log.visual;

  if (!v || v.kind !== 'mafs_function') {
    console.error(`${DEBUG_TAG} 규격 파싱 에러`);
    return null;
  }

  // 수학 격자 경계 가로세로 대칭 스케일 설정
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-1.5, 7.5]);

  // =================================================================
  // 📐 [수학 정의] 고정된 U자형 운석 궤도 공식: y = (x - 3)^2 + 1
  // 꼭짓점이 (3, 1)이므로, 수평 방어막 y = k의 높이에 따라 교점 개수 결정:
  // k > 1 : 2개 충돌 (적색 위기)
  // k = 1 : 1개 충돌 (황색 접함)
  // k < 1 : 0개 충돌 (녹색 안전)
  // =================================================================
  const fMeteor = (x) => Math.pow(x - 3, 2) + 1;

  // =================================================================
  // 🔌 [상태 라우팅] Zero-Hook 상하 궤적 통합 바인딩
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const kVal = st.kVal ?? 4.0; // 사용자가 직접 오르내리는 방어막 높이 k값 (초기값: 4.0)

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

  // 실시간 교점(방정식 해)의 개수 및 기하 구조 분석 계산
  let intersectCount = 0;
  let intersectPoints = [];
  
  if (kVal > 1) {
    intersectCount = 2;
    const diff = Math.sqrt(kVal - 1);
    intersectPoints = [{ x: 3 - diff, y: kVal }, { x: 3 + diff, y: kVal }];
  } else if (Math.abs(kVal - 1) < 0.01) {
    intersectCount = 1;
    intersectPoints = [{ x: 3, y: 1 }];
  } else {
    intersectCount = 0;
  }

  // 안전 등급에 따른 인터랙티브 HUD 비주얼 스위칭 메커니즘
  let panelTitle = "🚨 위험! 방어막과 운석이 2번 충돌합니다! (해의 개수 = 2개)";
  let infoBg = "#fef2f2";
  let infoColor = "#991b1b";
  let infoBorder = "#fecaca";

  if (intersectCount === 1) {
    panelTitle = "⚠️ 아슬아슬! 방어막 끝자락에 1번 스치듯 만납니다! (해의 개수 = 1개)";
    infoBg = "#fffbeb";
    infoColor = "#92400e";
    infoBorder = "#fef3c7";
  } else if (intersectCount === 0) {
    panelTitle = "🍏 안전! 운석 궤도와 단 한 번도 충돌하지 않습니다! (해의 개수 = 0개)";
    infoBg = "#f0fdf4";
    infoColor = "#166534";
    infoBorder = "#bbf7d0";
  }

  const styles = {
    wrapper: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    hudBoard: { background: infoBg, border: `2px solid ${infoBorder}`, color: infoColor, borderRadius: '16px', padding: '14px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
    hudHeadline: { fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' },
    layoutPanel: { background: '#ffffff', borderRadius: '16px', padding: '12px', border: '2px solid #e2e8f0' },
    layoutTitle: { fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px', textAlign: 'center' },
    canvasBox: { background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' },
    mathCanvasBox: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    metaBar: { display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '8px', border: '1px solid #e2e8f0' },
    footerText: { fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '6px', lineHeight: '1.5' }
  };

  return (
    <div style={styles.wrapper}>
      
      <style>{`
        .mafs-shield-space .MafsView { background-color: transparent !important; }
        .mafs-shield-space .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 📡 실시간 디펜스 스코어 인디케이터 HUD */}
      <div className="viz-box" style={styles.hudBoard}>
        <span style={styles.hudHeadline}>🛰️ 지구 우주방어 기지 통제실</span>
        <div style={{fontWeight: 'bold'}}>{panelTitle}</div>
      </div>

      {/* 🎬 1층: 시뮬레이션 기지 (우주선 방어막 가동) */}
      <div className="viz-box" style={styles.layoutPanel}>
        <div style={styles.layoutTitle}>
          🎬 <b>[1층 시뮬레이션]</b> 수평 레이저 방어막 선을 <b>위아래↕</b>로 직접 조작하세요!
        </div>
        <div className="mafs-shield-space" style={styles.canvasBox}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={200}>
            {/* 고정된 U자형 운석 비행 자취선 선행 유도 드로잉 */}
            <Plot.OfX y={fMeteor} color="#94a3b8" weight={2} style="dashed" />

            {/* 실시간으로 움직이는 수평 레이저 방어막 장벽선 */}
            <Line.Segment point1={[-0.5, kVal]} point2={[GMAX + 0.5, kVal]} color="#38bdf8" weight={4} />

            {/* 날아오는 운석 에모지 얹기 */}
            <Text x={1.2} y={fMeteor(1.2) + 0.4} size={22} attach="center">☄️</Text>

            {/* 🎮 [직접 인터랙션 X-Y 연동 정밀 노드] 중앙에서 방어막 라인을 직접 붙잡고 수직 시프트 */}
            <MovablePoint
              point={[3.0, kVal]}
              color="#ef4444"
              constrain={(pos) => [3.0, Math.min(6, Math.max(-1, Math.round(pos[1] * 2) / 2))]}
              onMove={(pos) => patchState({ kVal: Math.min(6, Math.max(-1, Math.round(pos[1] * 2) / 2)) })}
            />
            <Text x={3.0} y={kVal + 0.35} size={11} color="#f87171" weight="black" attach="n">🛡️ 방어막 핸들</Text>

            {/* 충돌 지점에 폭발 이펙트 플로팅 */}
            {intersectPoints.map((pt, idx) => (
              <Text key={`exp-${idx}`} x={pt.x} y={pt.y} size={22} attach="center">💥</Text>
            ))}
          </Mafs>
        </div>
      </div>

      {/* 📐 2층: 수학 그래프 기지 (교점 카운트 평면) */}
      <div className="viz-box" style={styles.layoutPanel}>
        <div style={styles.layoutTitle}>
          📐 <b>[2층 데카르트 수학 그래프]</b> 곡선과 수평선이 만나는 실시간 교점 분석
        </div>
        <div className="mafs-shield-space" style={styles.mathCanvasBox}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={240}>
            <Coordinates.Cartesian />

            {/* 수학적 정밀 포물선 궤도 그리기 */}
            <Plot.OfX y={fMeteor} color="#4ade80" weight={3} />

            {/* 수학적 방정식 직선 y = k 그리기 */}
            <Line.Linear slope={0} intercept={kVal} color="#ef4444" weight={2.5} />

            {/* 실시간 교점 포인트 마킹 락온 */}
            {intersectPoints.map((pt, idx) => (
              <Point key={`pt-int-${idx}`} x={pt.x} y={pt.y} color={Theme.red} size={6} />
            ))}

            {/* 🎮 [역방향 직접 인터랙션 2] 그래프 우측 끝에 붙은 레이저 꼬리표 노드를 잡고 수직 제어 */}
            <MovablePoint
              point={[GMAX, kVal]}
              color={Theme.red}
              constrain={(pos) => [GMAX, Math.min(6, Math.max(-1, Math.round(pos[1] * 2) / 2))]}
              onMove={(pos) => patchState({ kVal: Math.min(6, Math.max(-1, Math.round(pos[1] * 2) / 2)) })}
            />
            <Text x={GMAX} y={kVal} size={11} color="#ef4444" weight="bold" attach="e">{`y = ${kVal.toFixed(1)}`}</Text>
          </Mafs>
        </div>

        {/* 📋 실시간 수학적 조건 팩트 바인딩 보드 */}
        <div style={styles.metaBar}>
          <span>🛡️ 방어막 높이 공식 공식선: <b style={{color: '#ef4444'}}>y = {kVal.toFixed(1)}</b></span>
          <span>🎯 만나는 **교점의 개수**: <b style={{color: infoColor, fontSize: '14px'}}>{intersectCount} 개</b></span>
        </div>

        <div style={styles.footerText}>
          수식 계산이나 인수분해 없이도, 두 그래프가 평면 상에서 만나는 **[교점의 총 개수]**를 눈으로 세어내기만 하면
          <br />
          그것이 곧 복잡한 방정식의 **[진짜 답(해)의 개수]**와 완벽하게 일치한다는 위대한 기하학적 치트키를 마스터합니다.
        </div>
      </div>

    </div>
  );
}