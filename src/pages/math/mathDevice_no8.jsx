import React from 'react';
import { Mafs, Coordinates, Plot, Theme, Line, Point, Text, Polygon, Circle } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * no: "8" [방정식 해 = 교점] — 🍬 "사탕 기계 두 대" 버튼 조작판
 *
 * ═══════════════════════════════════════════════════════════════════
 * 【설계 원칙】 객체 시뮬레이션 → 그래프 연동
 *   버튼(🎡 손잡이 돌리기)을 누르면 → 기계가 실제로 한 번 돌아가고 → 사탕이 규칙대로 나오고
 *   → 그 결과가 아래 그래프에 점으로 찍힌다. 조작이 원인, 그래프가 결과.
 *
 * 【버튼 방식으로 바꾼 이유】
 *   이전엔 손잡이를 각도로 끌었다(atan2 역산). 그러나 "한 번 돌리면 몇 개"라는 규칙은
 *   횟수가 정수일 때만 뜻이 통한다. 드래그는 2.7번 같은 어정쩡한 값을 만들어 개념을 흐렸다.
 *   버튼은 누를 때마다 정확히 +1 → 정수만 나오고, "몇 번째"라는 질문에 정직하게 답한다.
 *
 * 【시나리오】
 *   🔵 A기계 : 통에 사탕 3개가 이미 담김. 한 번 돌릴 때마다 1개씩 → 개수 = 횟수 + 3
 *   🔴 B기계 : 텅 비었지만 한 번에 2개씩 우르르 → 개수 = 횟수 × 2
 *   ❓ "손잡이를 몇 번째 돌릴 때 두 기계의 사탕이 같아질까?"  ✅ 3번째, 둘 다 6개
 *
 * 【조작】
 *   🎡 [손잡이 돌리기] 버튼 — 누를 때마다 횟수 +1, 기계가 60도 돌고 사탕이 떨어진다
 *   🔄 [처음부터] 버튼 — 0번으로 초기화
 *
 * 【아키텍처】 Zero-Hook — useState 없이 sharedXByLog로만 상태 라우팅.
 * 【mafs API 준수】 Point엔 size 없음 → svgCircleProps={{r}}. Text엔 weight 없음.
 * ═══════════════════════════════════════════════════════════════════
 */
export function renderDevice_no8(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // ─────────────────────────────────────────────────────────────────
  // 📐 [1] 영역 정의
  // ─────────────────────────────────────────────────────────────────
  const TURN_MAX = 8;
  const xRange = toRange(v.xRange, [-0.7, TURN_MAX + 0.7]);
  const yRange = toRange(v.yRange, [-2.0, 18.0]);

  // ─────────────────────────────────────────────────────────────────
  // 🍬 [2] 두 기계의 배출 규칙
  // ─────────────────────────────────────────────────────────────────
  const candyA = (t) => t + 3;
  const candyB = (t) => 2 * t;
  const ANSWER_TURN = 3;
  const ANSWER_CANDY = 6;

  // ─────────────────────────────────────────────────────────────────
  // 🔌 [3] Zero-Hook 상태 — 횟수는 항상 정수
  // ─────────────────────────────────────────────────────────────────
  const st = sharedXByLog?.[logIdx] || {};
  const turns = Math.round(st.turns ?? 0);

  const patchState = (fields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), ...fields } }));
  };

  const turnHandle = () => patchState({ turns: Math.min(TURN_MAX, turns + 1) });
  const resetAll = () => patchState({ turns: 0 });

  // ─────────────────────────────────────────────────────────────────
  // 🧮 [4] 실시간 물리량
  // ─────────────────────────────────────────────────────────────────
  const cntA = candyA(turns);
  const cntB = candyB(turns);
  const gap = cntA - cntB;
  const distToAnswer = Math.abs(turns - ANSWER_TURN);

  const isMatched = turns === ANSWER_TURN;
  const isNear = distToAnswer === 1;
  const proximity = Math.max(0, 1 - distToAnswer / 3);
  const glowOpacity = isMatched ? 1 : isNear ? 0.45 : 0;
  const isMaxed = turns >= TURN_MAX;

  // 손잡이 회전각 — 한 번에 60도
  const handleAngle = turns * (Math.PI / 3);

  // ─────────────────────────────────────────────────────────────────
  // 💬 [5] 상태별 내레이션
  // ─────────────────────────────────────────────────────────────────
  let hudTitle = "🍬 사탕 기계 대결! 몇 번째에 같아질까?";
  let hudDetail = "🔵 A기계는 통에 사탕 3개가 이미 있고 한 번 돌리면 1개씩 나와요. 🔴 B기계는 텅 비었지만 한 번에 2개씩 우르르! 아래 🎡 버튼을 눌러 손잡이를 돌려보세요!";
  let theme = { bg: '#f8fafc', border: '#cbd5e1', text: '#334155', accent: '#64748b', badge: '🔍 시작!' };

  if (isMatched) {
    hudTitle = "🎉🎊 찾았다! 3번째에 둘 다 6개! 🎊🎉";
    hudDetail = "✨ 손잡이를 3번 돌리자 두 기계 모두 사탕이 6개! 바로 이때 아래 그림에서도 파랑 선과 분홍 선이 딱 만납니다. 답은 사탕 개수(6)가 아니라 손잡이를 돌린 횟수(3번)예요!";
    theme = { bg: '#f0fdf4', border: '#86efac', text: '#15803d', accent: '#16a34a', badge: '🏆 정답!' };
  } else if (isMaxed) {
    hudTitle = "🛑 기계가 다 돌았어요!";
    hudDetail = "🔄 [처음부터] 버튼을 눌러 다시 시작해보세요. 3번째에 두 기계의 사탕이 같아졌던 걸 기억하나요?";
    theme = { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', accent: '#dc2626', badge: '🛑 끝' };
  } else if (isNear) {
    hudTitle = "⚡ 거의 다 왔어요! 한 번만 더!";
    hudDetail = "🔥 두 기계의 사탕 개수 차이가 딱 1개! 한 번만 더 돌리면 같아지거나, 아니면 지나쳐버릴 수도 있어요. 아래 그림에서 두 선이 만나기 직전이에요!";
    theme = { bg: '#fffbeb', border: '#fde68a', text: '#a16207', accent: '#d97706', badge: '⚡ 코앞!' };
  } else if (gap > 0) {
    hudTitle = "🔵 아직 A기계가 더 많아요!";
    hudDetail = "💡 A기계는 처음부터 사탕 3개를 갖고 시작했거든요! 하지만 B기계는 한 번에 2개씩 나오니까 점점 따라오고 있어요. 더 돌려보세요!";
    theme = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', accent: '#2563eb', badge: '🔵 A가 앞섬' };
  } else {
    hudTitle = "🔴 B기계가 역전했어요!";
    hudDetail = "🚀 B기계는 한 번에 2개씩! A기계보다 두 배나 빨라요. 처음엔 뒤졌지만 결국 따라잡고 앞질렀습니다. 🔄 처음부터 눌러 다시 확인해볼까요?";
    theme = { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', accent: '#db2777', badge: '🔴 B가 역전' };
  }

  // ─────────────────────────────────────────────────────────────────
  // 🍬 [6] 통 안 사탕 배치 — 한 줄 4개씩 (검증: 16개까지 통 안에 들어옴)
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

  const MA_X = 1.0, MB_X = 4.6;
  const BIN_Y = 0.35;
  const candiesA = candyGrid(cntA, MA_X + 0.15, BIN_Y);
  const candiesB = candyGrid(cntB, MB_X + 0.15, BIN_Y);

  const HANDLE_R = 0.42;
  const hubAY = 3.4, hubBY = 3.4;
  const hubAX = MA_X + 0.75, hubBX = MB_X + 0.75;
  const handleAX = hubAX + HANDLE_R * Math.cos(handleAngle);
  const handleAY = hubAY + HANDLE_R * Math.sin(handleAngle);
  const handleBX = hubBX + HANDLE_R * Math.cos(handleAngle);
  const handleBY = hubBY + HANDLE_R * Math.sin(handleAngle);

  // ─────────────────────────────────────────────────────────────────
  // 🎨 [7] 스타일
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

    // 🎮 조작 버튼 패널
    btnPanel: { display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' },
    turnBtn: {
      background: isMaxed ? '#e2e8f0' : 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
      color: isMaxed ? '#94a3b8' : '#fff',
      border: 'none', borderRadius: '12px', padding: '14px 26px',
      fontSize: '15px', fontWeight: '900', cursor: isMaxed ? 'not-allowed' : 'pointer',
      boxShadow: isMaxed ? 'none' : '0 4px 0 #b45309, 0 6px 10px rgba(0,0,0,0.15)',
      transition: 'all 0.1s ease', fontFamily: 'inherit'
    },
    resetBtn: {
      background: '#fff', color: '#475569', border: '2px solid #cbd5e1', borderRadius: '12px',
      padding: '12px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
      boxShadow: '0 2px 0 #cbd5e1', fontFamily: 'inherit'
    },
    counter: {
      background: '#1e293b', color: '#fbbf24', padding: '10px 18px', borderRadius: '12px',
      fontSize: '16px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '1px',
      border: '2px solid #475569', minWidth: '110px', textAlign: 'center'
    },

    ruleBox: {
      background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '10px',
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
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

      {/* ═══════════ 📡 HUD ═══════════ */}
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
          🏭 <b>사탕 기계 두 대</b> — 나온 사탕을 직접 세어보세요! 🍬
        </div>
        <div className="candy-machine-engine" style={styles.machineCanvas}>
          <Mafs viewBox={{ x: [0.2, 7.0], y: [-0.5, 4.3] }} preserveAspectRatio={false} height={280}>

            {/* 바닥 */}
            <Line.Segment point1={[0.3, -0.05]} point2={[6.9, -0.05]} color="#d6d3d1" weight={3} />

            {/* ───── 🔵 A기계 ───── */}
            <Polygon
              points={[[MA_X - 0.1, 0.0], [MA_X + 1.6, 0.0], [MA_X + 1.6, 3.0], [MA_X - 0.1, 3.0]]}
              color="#2563eb" opacity={0.06} weight={2}
            />
            <Polygon
              points={[[MA_X, 0.1], [MA_X + 1.5, 0.1], [MA_X + 1.5, 2.2], [MA_X, 2.2]]}
              color="#2563eb" opacity={0.04} weight={1.5}
            />
            <Line.Segment point1={[MA_X + 0.55, 2.6]} point2={[MA_X + 0.95, 2.6]} color="#2563eb" weight={4} />
            <Line.Segment point1={[hubAX, 3.0]} point2={[hubAX, hubAY]} color="#94a3b8" weight={2.5} />
            <Circle center={[hubAX, hubAY]} radius={HANDLE_R} color="#94a3b8" weight={1.5} opacity={0.12} />
            <Point x={hubAX} y={hubAY} color="#475569" svgCircleProps={{ r: 4 }} />
            {/* 손잡이 — 버튼을 누를 때마다 60도씩 돌아간다 */}
            <Line.Segment point1={[hubAX, hubAY]} point2={[handleAX, handleAY]} color="#2563eb" weight={4} />
            <Point x={handleAX} y={handleAY} color={isMatched ? Theme.green : "#1d4ed8"} svgCircleProps={{ r: 7 }} />
            <Text x={MA_X + 0.75} y={3.95} size={13} color="#2563eb" attach="n">🔵 A기계</Text>
            <Text x={MA_X + 0.75} y={-0.15} size={12} color="#2563eb" attach="s">{`🍬 ${cntA}개`}</Text>

            {candiesA.map((p, i) => (
              <Point key={`ca${i}`} x={p[0]} y={p[1]} color="#3b82f6"
                svgCircleProps={{ r: 7 + proximity * 1.5 }} />
            ))}

            {/* ───── 🔴 B기계 ───── */}
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
            <Point x={handleBX} y={handleBY} color={isMatched ? Theme.green : "#be185d"} svgCircleProps={{ r: 7 }} />
            <Text x={MB_X + 0.75} y={3.95} size={13} color="#db2777" attach="n">🔴 B기계</Text>
            <Text x={MB_X + 0.75} y={-0.15} size={12} color="#db2777" attach="s">{`🍬 ${cntB}개`}</Text>

            {candiesB.map((p, i) => (
              <Point key={`cb${i}`} x={p[0]} y={p[1]} color="#ec4899"
                svgCircleProps={{ r: 7 + proximity * 1.5 }} />
            ))}

            {/* 상태 표시 */}
            {isMatched && <Text x={3.6} y={3.5} size={24} attach="center">🎉 같다! 🎉</Text>}
            {isNear && <Text x={3.6} y={3.5} size={16} attach="center">⚡ 1개 차이!</Text>}
            <Text x={3.6} y={2.2} size={14} color={theme.accent} attach="center">
              {`🎡 ${turns}번 돌림`}
            </Text>
          </Mafs>
        </div>

        {/* 🎮 조작 버튼 패널 */}
        <div style={styles.btnPanel}>
          <button
            type="button"
            onClick={turnHandle}
            disabled={isMaxed}
            style={styles.turnBtn}
          >
            🎡 손잡이 돌리기!
          </button>
          <div style={styles.counter}>
            🎡 {turns} / {TURN_MAX} 번
          </div>
          <button
            type="button"
            onClick={resetAll}
            style={styles.resetBtn}
          >
            🔄 처음부터
          </button>
        </div>

        {/* 📋 규칙 상자 */}
        <div style={styles.ruleBox}>
          <span>📋 기계 규칙:</span>
          <span style={{ color: '#2563eb' }}>🔵 A = 돌린 횟수 + 3</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#db2777' }}>🔴 B = 돌린 횟수 × 2</span>
        </div>
      </div>

      {/* ═══════════ 📈 그래프 (기계와 연동) ═══════════ */}
      <div className="viz-box" style={styles.box}>
        <div style={styles.boxTitle}>
          📈 <b>버튼을 누를 때마다 점이 하나씩 찍혀요!</b> — 기계와 실시간 연동
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

            {/* 두 기계의 규칙 선 */}
            <Plot.OfX y={candyA} color="#2563eb" weight={3.5} />
            <Plot.OfX y={candyB} color="#db2777" weight={3.5} />

            {/* 지금까지 돌린 자취 — 누를 때마다 점이 하나씩 쌓인다 */}
            {Array.from({ length: turns + 1 }).map((_, i) => (
              <React.Fragment key={`tr${i}`}>
                <Point x={i} y={candyA(i)} color="#93c5fd" svgCircleProps={{ r: 3.5 }} />
                <Point x={i} y={candyB(i)} color="#f9a8d4" svgCircleProps={{ r: 3.5 }} />
              </React.Fragment>
            ))}

            {/* 지금 위치 세로선 */}
            <Line.Segment point1={[turns, -2.0]} point2={[turns, Math.max(cntA, cntB)]}
              color="#ea580c" weight={2} style="dashed" />

            {/* 차이 기둥 */}
            <Line.Segment point1={[turns, cntA]} point2={[turns, cntB]} color="#a855f7" weight={4} />
            <Text x={turns} y={(cntA + cntB) / 2} size={11} color="#a855f7" attach="e">
              {isMatched ? '🎯 0개!' : `🍬 ${Math.abs(gap)}개 차이`}
            </Text>

            {/* 지금 두 기계 위치 (크게) */}
            <Point x={turns} y={cntA} color="#2563eb" svgCircleProps={{ r: 6 + proximity * 2 }} />
            <Point x={turns} y={cntB} color="#db2777" svgCircleProps={{ r: 6 + proximity * 2 }} />

            {/* 정답 레이저 */}
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
          </Mafs>
        </div>
      </div>

      {/* ═══════════ 📊 계기판 ═══════════ */}
      <div style={styles.dashboard}>
        <div style={styles.card}>
          🎡 돌린 횟수
          <span style={{ ...styles.cardVal, color: '#ea580c' }}>{turns}번</span>
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
            {isMatched ? '0개 🎯' : `${Math.abs(gap)}개`}
          </span>
        </div>
      </div>

      {/* ═══════════ 📝 마무리 ═══════════ */}
      <div style={styles.footer}>
        🍬 두 기계의 사탕이 <b>똑같아지는 순간</b>과, 아래 그림에서 <b>두 선이 만나는 점</b>은 완전히 같은 일이에요.
        <br />
        🔄 만나기 <b>전</b>엔 🔵 A기계가 많고, 만난 <b>후</b>엔 🔴 B기계가 많아져요 — 만나는 점을 지나면 누가 많은지가 <b>뒤바뀝니다</b>!
        <br />
        ✨ 그리고 답은 사탕 개수(6개)가 아니라, <b>손잡이를 돌린 횟수(3번)</b>라는 걸 꼭 기억하세요!
      </div>
    </div>
  );
}