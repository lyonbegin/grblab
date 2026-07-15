import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Text, Polygon, Circle } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * no: "8" [방정식 해 = 교점] — 🍬 "사탕 기계 두 대" 초등 마스터판
 *
 * ═══════════════════════════════════════════════════════════════════
 * 【시나리오】 서로 다른 두 대의 사탕 기계
 *   🔵 A기계 : 통에 사탕 3개가 이미 담겨 있고, 손잡이를 1번 돌릴 때마다 1개씩 떨어진다.
 *              → 나온 개수 = 돌린 횟수 + 3
 *   🔴 B기계 : 통은 비어 있지만, 손잡이를 1번 돌릴 때마다 2개씩 우르르 떨어진다.
 *              → 나온 개수 = 돌린 횟수 × 2
 *   ❓ 핵심 질문 : "손잡이를 몇 번째 돌릴 때 두 기계의 사탕 개수가 같아질까?"
 *   ✅ 정답 : 3번째. 그때 둘 다 6개. (= 두 그래프 선이 만나는 교점 = 방정식의 해)
 *
 * 【왜 이 시나리오인가】
 *   조작하는 것(손잡이 돌린 횟수)이 곧 가로축 x이고, 그 결과(나온 사탕)가 세로축 y다.
 *   저울·시소 같은 바깥 장치를 빌려오지 않아 "이게 왜 여기 있지?"라는 질문이 안 생긴다.
 *
 * 【인터랙션 3종 — 모두 직접 잡고 끄는 방식(슬라이더 없음)】
 *   1. 🎡 A기계 손잡이 : 손잡이 끝을 잡고 원을 그리며 돌린다 → 돌린 횟수 반영
 *   2. 🎡 B기계 손잡이 : 같은 방식. 두 기계는 함께 돌아간다(같은 횟수)
 *   3. 🎯 그래프 바닥 노드 : 가로축을 직접 끌어 횟수를 맞춘다 (역방향 동기화)
 *
 * 【아키텍처】 Zero-Hook — useState/useEffect 없이 sharedXByLog 상태망으로만 라우팅.
 * 【mafs API 준수】 Point엔 size prop 없음 → svgCircleProps={{r}} 사용.
 *                  Text엔 weight prop 없음 → 미사용. Line.Linear 없음 → Line.Segment/PointSlope.
 * ═══════════════════════════════════════════════════════════════════
 */
export function renderDevice_no8(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // ─────────────────────────────────────────────────────────────────
  // 📐 [1] 탐색 영역 정의 — 손잡이는 0~8번까지 돌릴 수 있다
  // ─────────────────────────────────────────────────────────────────
  const TURN_MAX = 8;
  const xRange = toRange(v.xRange, [-0.7, TURN_MAX + 0.7]);
  const yRange = toRange(v.yRange, [-2.0, 18.0]);

  // ─────────────────────────────────────────────────────────────────
  // 🍬 [2] 두 기계의 사탕 배출 규칙 (수학 코어)
  // ─────────────────────────────────────────────────────────────────
  const candyA = (t) => t + 3;    // 🔵 A기계: 3개 미리 담김 + 1번당 1개
  const candyB = (t) => 2 * t;    // 🔴 B기계: 0개로 시작 + 1번당 2개

  const ANSWER_TURN = 3.0;        // 정답: 3번째
  const ANSWER_CANDY = 6.0;       // 그때 개수: 6개

  // ─────────────────────────────────────────────────────────────────
  // 🔌 [3] Zero-Hook 상태 라우터
  // ─────────────────────────────────────────────────────────────────
  const st = sharedXByLog?.[logIdx] || {};
  const turns = st.turns ?? 1.0;  // 손잡이를 돌린 횟수 (실시간)

  const patchState = (fields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), ...fields } }));
  };

  // ─────────────────────────────────────────────────────────────────
  // 🧮 [4] 실시간 물리량 연산
  // ─────────────────────────────────────────────────────────────────
  const nowA = candyA(turns);
  const nowB = candyB(turns);
  const gap = nowA - nowB;
  const distToAnswer = Math.abs(turns - ANSWER_TURN);

  const isMatched = distToAnswer < 0.05;                       // 정답 락온
  const isNear = distToAnswer < 0.7 && !isMatched;             // 근접 경고
  const proximity = Math.max(0, 1 - distToAnswer / 2.2);       // 근접도 0~1
  const glowOpacity = Math.min(1, Math.max(0, (0.5 - distToAnswer) / 0.4)); // 정답 후광

  // 통에 그릴 때는 셀 수 있게 정수로
  const cntA = Math.round(nowA);
  const cntB = Math.round(nowB);

  // 손잡이 회전각 — 1번 돌릴 때마다 60도씩 (시각적 회전감)
  const handleAngle = turns * (Math.PI / 3);

  // ─────────────────────────────────────────────────────────────────
  // 💬 [5] 상태별 내레이션 3단 분기 팩토리
  // ─────────────────────────────────────────────────────────────────
  let hudTitle = "🍬 사탕 기계 대결! 몇 번째에 같아질까?";
  let hudDetail = "🔵 A기계는 통에 사탕 3개가 이미 있고 손잡이를 돌리면 1개씩 나와요. 🔴 B기계는 텅 비었지만 돌리면 2개씩 우르르 나와요! 손잡이(🎡)를 직접 잡고 돌려서 두 기계의 사탕이 똑같아지는 순간을 찾아보세요!";
  let theme = { bg: '#f8fafc', border: '#cbd5e1', text: '#334155', accent: '#64748b', badge: '🔍 찾는 중' };

  if (isMatched) {
    hudTitle = "🎉🎊 찾았다! 3번째에 둘 다 6개! 🎊🎉";
    hudDetail = "✨ 손잡이를 3번 돌리자 두 기계 모두 사탕이 6개! 바로 이 순간, 아래 그림에서도 파랑 선과 분홍 선이 딱 만납니다. 이 만나는 점(3, 6)이 바로 '같아지는 때'의 답이에요. 답은 사탕 개수(6)가 아니라 손잡이를 돌린 횟수(3)랍니다!";
    theme = { bg: '#f0fdf4', border: '#86efac', text: '#15803d', accent: '#16a34a', badge: '🏆 정답!' };
  } else if (isNear) {
    hudTitle = "⚡ 거의 다 왔어요! 조금만 더!";
    hudDetail = "🔥 두 기계의 사탕 개수가 아주 가까워졌어요! 조금만 더 돌리면 딱 같아지는 순간이 옵니다. 아래 그림에서 두 선이 만나기 직전이에요!";
    theme = { bg: '#fffbeb', border: '#fde68a', text: '#a16207', accent: '#d97706', badge: '⚡ 코앞!' };
  } else if (gap > 0) {
    hudTitle = "🔵 아직 A기계가 더 많아요!";
    hudDetail = "💡 A기계는 처음부터 사탕 3개를 갖고 시작했거든요! 하지만 B기계는 한 번에 2개씩 나오니까 점점 따라오고 있어요. 손잡이를 더 돌려보세요!";
    theme = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', accent: '#2563eb', badge: '🔵 A가 앞섬' };
  } else {
    hudTitle = "🔴 B기계가 역전했어요!";
    hudDetail = "🚀 B기계는 한 번에 2개씩! A기계보다 두 배나 빨라요. 처음엔 뒤졌지만 결국 A기계를 따라잡고 앞질렀습니다. 되돌려서 같아지는 순간을 다시 찾아볼까요?";
    theme = { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', accent: '#db2777', badge: '🔴 B가 역전' };
  }

  // ─────────────────────────────────────────────────────────────────
  // 🍬 [6] 통 안 사탕 배치 계산기 — 한 줄 4개씩 아래부터 쌓는다
  //     (검증: 16개까지 x폭 1.37, y높이 1.61 안에 들어옴)
  // ─────────────────────────────────────────────────────────────────
  const candyGrid = (count, baseX, baseY) => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      pts.push([baseX + col * 0.34, baseY + row * 0.42]);
    }
    return pts;
  };

  // 기계 배치 좌표
  const MA_X = 1.0, MB_X = 4.6;             // 두 기계의 왼쪽 기준점
  const BIN_Y = 0.35;                        // 통 바닥
  const candiesA = candyGrid(cntA, MA_X + 0.15, BIN_Y);
  const candiesB = candyGrid(cntB, MB_X + 0.15, BIN_Y);

  // 손잡이 중심과 손잡이 끝점(회전)
  const HANDLE_R = 0.42;
  const hubAY = 3.4, hubBY = 3.4;
  const hubAX = MA_X + 0.75, hubBX = MB_X + 0.75;
  const handleAX = hubAX + HANDLE_R * Math.cos(handleAngle);
  const handleAY = hubAY + HANDLE_R * Math.sin(handleAngle);
  const handleBX = hubBX + HANDLE_R * Math.cos(handleAngle);
  const handleBY = hubBY + HANDLE_R * Math.sin(handleAngle);

  // 손잡이 드래그 → 각도 → 횟수 역산 (연속 회전을 위해 현재 회차 기준으로 보정)
  const angleToTurns = (px, py, hubX, hubY) => {
    const raw = Math.atan2(py - hubY, px - hubX);        // -π ~ π
    const perTurn = Math.PI / 3;                          // 1회 = 60도
    const currentBase = Math.floor(turns / 6) * 6;        // 6회마다 한 바퀴
    let cand = currentBase + (raw < 0 ? raw + 2 * Math.PI : raw) / perTurn;
    // 현재 값에서 가장 가까운 해를 고른다(바퀴 넘김 처리)
    const alts = [cand - 6, cand, cand + 6];
    let best = alts[0], bestD = Math.abs(alts[0] - turns);
    for (const a of alts) { const d = Math.abs(a - turns); if (d < bestD) { best = a; bestD = d; } }
    return Math.min(TURN_MAX, Math.max(0, Math.round(best * 10) / 10));
  };

  // ─────────────────────────────────────────────────────────────────
  // 🎨 [7] 스타일 매트릭스
  // ─────────────────────────────────────────────────────────────────
  const styles = {
    container: { display: 'flex', fontFamily: 'sans-serif', flexDirection: 'column', gap: '12px', userSelect: 'none' },
    hud: {
      background: theme.bg, border: `2px solid ${theme.border}`, borderRadius: '16px', padding: '14px',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
    },
    hudTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
    hudTitle: { fontSize: '14px', fontWeight: '800', color: theme.text },
    hudBadge: { background: theme.accent, color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },
    hudBody: { fontSize: '12.5px', color: theme.text, fontWeight: '500', lineHeight: '1.5' },
    box: { background: '#fff', borderRadius: '16px', padding: '12px', border: '2px solid #e2e8f0' },
    boxTitle: { fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', textAlign: 'center' },
    machineCanvas: { background: '#fffdf5', borderRadius: '12px', border: '1px solid #f0e6d2', overflow: 'hidden' },
    mathCanvas: { background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    ruleBox: {
      background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '10px',
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginTop: '10px'
    },
    dashboard: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' },
    card: { background: '#f8fafc', padding: '9px 6px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', border: '1px solid #e2e8f0', fontWeight: '700' },
    cardVal: { fontSize: '14px', fontWeight: '900', display: 'block', marginTop: '3px' },
    footer: { fontSize: '12.5px', color: '#334155', textAlign: 'center', lineHeight: '1.7', padding: '2px 4px', fontWeight: '500' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .candy-machine-engine .MafsView { background-color: transparent !important; }
        .candy-machine-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* ═══════════ 📡 HUD 안내 콘솔 ═══════════ */}
      <div className="viz-box" style={styles.hud}>
        <div style={styles.hudTop}>
          <span style={styles.hudTitle}>{hudTitle}</span>
          <span style={styles.hudBadge}>{theme.badge}</span>
        </div>
        <div style={styles.hudBody}>{hudDetail}</div>
      </div>

      {/* ═══════════ 🍬 사탕 기계 두 대 ═══════════ */}
      <div className="viz-box" style={styles.box}>
        <div style={styles.boxTitle}>
          🎡 <b>손잡이를 직접 잡고 돌려보세요!</b> — 나온 사탕을 세어보세요 🍬
        </div>
        <div className="candy-machine-engine" style={styles.machineCanvas}>
          <Mafs viewBox={{ x: [0.2, 7.0], y: [-0.5, 4.3] }} preserveAspectRatio={false} height={280}>

            {/* 바닥 */}
            <Line.Segment point1={[0.3, -0.05]} point2={[6.9, -0.05]} color="#d6d3d1" weight={3} />

            {/* ───── 🔵 A기계 몸체 ───── */}
            <Polygon
              points={[[MA_X - 0.1, 0.0], [MA_X + 1.6, 0.0], [MA_X + 1.6, 3.0], [MA_X - 0.1, 3.0]]}
              color="#2563eb" opacity={0.06} weight={2}
            />
            {/* A기계 통(사탕 담기는 곳) */}
            <Polygon
              points={[[MA_X, 0.1], [MA_X + 1.5, 0.1], [MA_X + 1.5, 2.2], [MA_X, 2.2]]}
              color="#2563eb" opacity={0.04} weight={1.5}
            />
            {/* A기계 배출구 */}
            <Line.Segment point1={[MA_X + 0.55, 2.6]} point2={[MA_X + 0.95, 2.6]} color="#2563eb" weight={4} />
            {/* A기계 손잡이 축 */}
            <Line.Segment point1={[hubAX, 3.0]} point2={[hubAX, hubAY]} color="#94a3b8" weight={2.5} />
            <Circle center={[hubAX, hubAY]} radius={HANDLE_R} color="#94a3b8" weight={1.5} opacity={0.12} />
            <Point x={hubAX} y={hubAY} color="#475569" svgCircleProps={{ r: 4 }} />
            {/* A기계 손잡이 대 */}
            <Line.Segment point1={[hubAX, hubAY]} point2={[handleAX, handleAY]} color="#2563eb" weight={4} />
            <Text x={MA_X + 0.75} y={3.95} size={13} color="#2563eb" attach="n">🔵 A기계</Text>
            <Text x={MA_X + 0.75} y={-0.15} size={12} color="#2563eb" attach="s">{`🍬 ${cntA}개`}</Text>

            {/* A기계 사탕들 */}
            {candiesA.map((p, i) => (
              <Point key={`ca${i}`} x={p[0]} y={p[1]} color="#3b82f6"
                svgCircleProps={{ r: 7 + proximity * 1.5 }} />
            ))}

            {/* 🎮 [인터랙션 1] A기계 손잡이 — 잡고 돌린다 */}
            <MovablePoint
              point={[handleAX, handleAY]}
              color={isMatched ? Theme.green : "#1d4ed8"}
              constrain={(pos) => {
                const t = angleToTurns(pos[0], pos[1], hubAX, hubAY);
                const ang = t * (Math.PI / 3);
                return [hubAX + HANDLE_R * Math.cos(ang), hubAY + HANDLE_R * Math.sin(ang)];
              }}
              onMove={(pos) => patchState({ turns: angleToTurns(pos[0], pos[1], hubAX, hubAY) })}
            />

            {/* ───── 🔴 B기계 몸체 ───── */}
            <Polygon
              points={[[MB_X - 0.1, 0.0], [MB_X + 1.6, 0.0], [MB_X + 1.6, 3.0], [MB_X - 0.1, 3.0]]}
              color="#db2777" opacity={0.06} weight={2}
            />
            <Polygon
              points={[[MB_X, 0.1], [MB_X + 1.5, 0.1], [MB_X + 1.5, 2.2], [MB_X, 2.2]]}
              color="#db2777" opacity={0.04} weight={1.5}
            />
            <Line.Segment point1={[MB_X + 0.55, 2.6]} point2={[MB_X + 0.95, 2.6]} color="#db2777" weight={4} />
            <Line.Segment point1={[hubBX, 3.0]} point2={[hubBX, hubBY]} color="#94a3b8" weight={2.5} />
            <Circle center={[hubBX, hubBY]} radius={HANDLE_R} color="#94a3b8" weight={1.5} opacity={0.12} />
            <Point x={hubBX} y={hubBY} color="#475569" svgCircleProps={{ r: 4 }} />
            <Line.Segment point1={[hubBX, hubBY]} point2={[handleBX, handleBY]} color="#db2777" weight={4} />
            <Text x={MB_X + 0.75} y={3.95} size={13} color="#db2777" attach="n">🔴 B기계</Text>
            <Text x={MB_X + 0.75} y={-0.15} size={12} color="#db2777" attach="s">{`🍬 ${cntB}개`}</Text>

            {/* B기계 사탕들 */}
            {candiesB.map((p, i) => (
              <Point key={`cb${i}`} x={p[0]} y={p[1]} color="#ec4899"
                svgCircleProps={{ r: 7 + proximity * 1.5 }} />
            ))}

            {/* 🎮 [인터랙션 2] B기계 손잡이 — 함께 돌아간다 */}
            <MovablePoint
              point={[handleBX, handleBY]}
              color={isMatched ? Theme.green : "#be185d"}
              constrain={(pos) => {
                const t = angleToTurns(pos[0], pos[1], hubBX, hubBY);
                const ang = t * (Math.PI / 3);
                return [hubBX + HANDLE_R * Math.cos(ang), hubBY + HANDLE_R * Math.sin(ang)];
              }}
              onMove={(pos) => patchState({ turns: angleToTurns(pos[0], pos[1], hubBX, hubBY) })}
            />

            {/* 정답 순간 축하 표시 */}
            {isMatched && <Text x={3.6} y={3.5} size={24} attach="center">🎉 같다! 🎉</Text>}
            {isNear && !isMatched && <Text x={3.6} y={3.5} size={16} attach="center">⚡ 거의!</Text>}

            {/* 돌린 횟수 표시 */}
            <Text x={3.6} y={2.2} size={14} color={theme.accent} attach="center">
              {`🎡 ${turns.toFixed(1)}번 돌림`}
            </Text>
          </Mafs>
        </div>

        {/* 📋 두 기계의 규칙 상자 */}
        <div style={styles.ruleBox}>
          <span>📋 기계 규칙:</span>
          <span style={{ color: '#2563eb' }}>🔵 A = 돌린 횟수 + 3</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#db2777' }}>🔴 B = 돌린 횟수 × 2</span>
        </div>
      </div>

      {/* ═══════════ 📈 그래프 ═══════════ */}
      <div className="viz-box" style={styles.box}>
        <div style={styles.boxTitle}>
          📈 <b>돌릴수록 사탕이 어떻게 늘어날까?</b> — 주황 점(🎯)도 직접 끌 수 있어요
        </div>
        <div className="candy-machine-engine" style={styles.mathCanvas}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={270}>
            <Coordinates.Cartesian />

            {/* 정답 근처 후광 */}
            {glowOpacity > 0 && (
              <Polygon
                points={[
                  [ANSWER_TURN - 0.45, ANSWER_CANDY - 0.9], [ANSWER_TURN + 0.45, ANSWER_CANDY - 0.9],
                  [ANSWER_TURN + 0.45, ANSWER_CANDY + 0.9], [ANSWER_TURN - 0.45, ANSWER_CANDY + 0.9]
                ]}
                color={Theme.green} opacity={glowOpacity * 0.16} weight={1}
              />
            )}

            {/* 두 기계의 사탕 개수 선 */}
            <Plot.OfX y={candyA} color="#2563eb" weight={3.5} />
            <Plot.OfX y={candyB} color="#db2777" weight={3.5} />

            {/* 지금 돌린 횟수 자리 */}
            <Line.Segment point1={[turns, -2.0]} point2={[turns, Math.max(nowA, nowB)]}
              color="#ea580c" weight={2} style="dashed" />

            {/* 두 기계 개수 차이 기둥 */}
            <Line.Segment point1={[turns, nowA]} point2={[turns, nowB]} color="#a855f7" weight={4} />
            <Text x={turns} y={(nowA + nowB) / 2} size={11} color="#a855f7" attach="e">
              {isMatched ? '🎯 0개!' : `🍬 ${Math.abs(gap).toFixed(0)}개 차이`}
            </Text>

            {/* 지금 두 기계 위치 — 근접할수록 커진다 */}
            <Point x={turns} y={nowA} color="#2563eb" svgCircleProps={{ r: 5 + proximity * 3 }} />
            <Point x={turns} y={nowB} color="#db2777" svgCircleProps={{ r: 5 + proximity * 3 }} />

            {/* 정답 락온 시 바닥으로 내리꽂는 레이저 */}
            {glowOpacity > 0 && (
              <Line.Segment point1={[ANSWER_TURN, 0]} point2={[ANSWER_TURN, ANSWER_CANDY]}
                color={Theme.green} weight={2 + glowOpacity * 2.5} opacity={glowOpacity} />
            )}

            {/* 만나는 점 */}
            <Point x={ANSWER_TURN} y={ANSWER_CANDY} color={isMatched ? Theme.green : "#cbd5e1"}
              svgCircleProps={{ r: isMatched ? 9 : 4.5 }} />
            <Text x={ANSWER_TURN} y={ANSWER_CANDY} size={11} color="#0f172a" attach="ne">
              {isMatched ? '🍬 여기! (3번, 6개)' : '🍬 만나는 곳'}
            </Text>

            {/* 🎮 [인터랙션 3] 그래프 바닥 노드 — 역방향 동기화 */}
            <MovablePoint
              point={[turns, 0]}
              color="#ea580c"
              constrain={(pos) => [Math.min(TURN_MAX, Math.max(0, Math.round(pos[0] * 10) / 10)), 0]}
              onMove={(pos) => patchState({ turns: pos[0] })}
            />
          </Mafs>
        </div>
      </div>

      {/* ═══════════ 📊 계기판 ═══════════ */}
      <div style={styles.dashboard}>
        <div style={styles.card}>
          🎡 돌린 횟수
          <span style={{ ...styles.cardVal, color: '#ea580c' }}>{turns.toFixed(1)}번</span>
        </div>
        <div style={styles.card}>
          🔵 A기계 사탕
          <span style={{ ...styles.cardVal, color: '#2563eb' }}>{cntA}개</span>
        </div>
        <div style={styles.card}>
          🔴 B기계 사탕
          <span style={{ ...styles.cardVal, color: '#db2777' }}>{cntB}개</span>
        </div>
        <div style={styles.card}>
          🍬 개수 차이
          <span style={{ ...styles.cardVal, color: isMatched ? '#16a34a' : '#a855f7' }}>
            {isMatched ? '0개 🎯' : `${Math.abs(gap).toFixed(0)}개`}
          </span>
        </div>
      </div>

      {/* ═══════════ 📝 마무리 ═══════════ */}
      <div style={styles.footer}>
        🍬 두 기계의 사탕 개수가 <b>똑같아지는 순간</b>과, 아래 그림에서 <b>두 선이 만나는 점</b>은 완전히 같은 일이에요.
        <br />
        🔄 만나기 <b>전</b>엔 🔵 A기계가 많고, 만난 <b>후</b>엔 🔴 B기계가 많아져요 — 만나는 점을 지나면 누가 많은지가 <b>뒤바뀝니다</b>!
        <br />
        ✨ 그리고 답은 사탕 개수(6개)가 아니라, <b>손잡이를 돌린 횟수(3번)</b>라는 걸 꼭 기억하세요!
      </div>
    </div>
  );
}