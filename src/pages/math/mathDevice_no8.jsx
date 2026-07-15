import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Text } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * no: "8" [방정식 해 = 교점] — "사탕 모으기 대결" 초등판
 *
 * [시나리오]
 *   A친구: 처음부터 사탕 3개를 갖고 시작, 1분마다 1개씩 받음   → y = x + 3
 *   B친구: 처음엔 0개지만, 1분마다 2개씩 더 빠르게 받음        → y = 2x
 *   → 3분 후 둘 다 6개로 같아진다. (교점 = 방정식의 해)
 *   → 3분 전엔 A가 앞서고, 3분 후엔 B가 역전한다.
 *
 * [왜 이 시나리오인가]
 *   앞선 버전들(요금제/저울/가게 계산대)은 소재와 장치가 따로 놀았다.
 *   "누가 먼저 앞서나"는 아이가 바로 아는 대결 구도이고, 시간을 끌면 사탕이
 *   실제로 쌓이는 걸 세어볼 수 있어 장치가 곧 이야기가 된다.
 *
 * [조작] 시간(분)을 직접 끈다. 별도 장치(저울·시소) 없음.
 *   - 위: 두 친구의 사탕이 실제 동그란 사탕으로 쌓인다(세어볼 수 있음).
 *   - 아래: 그 개수를 그림(그래프)으로 옮긴 것. 두 선이 만나는 곳이 답.
 *
 * [아키텍처] Zero-Hook: useState 없이 sharedXByLog로만 상태 라우팅.
 * [mafs API 준수] Point엔 size prop이 없어 svgCircleProps={{r}} 사용, Text엔 weight 없음.
 */
export function renderDevice_no8(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const TMAX = 7;                      // 0~7분까지 볼 수 있다
  const xRange = toRange(v.xRange, [-0.6, TMAX + 0.6]);
  const yRange = toRange(v.yRange, [-1.5, 15.5]);

  // =================================================================
  // 🍬 두 친구가 사탕을 모으는 규칙
  // =================================================================
  const candyA = (t) => t + 3;   // A친구: 3개로 시작 + 1분마다 1개
  const candyB = (t) => 2 * t;   // B친구: 0개로 시작 + 1분마다 2개

  const targetT = 3.0;           // 같아지는 시각
  const targetC = 6.0;           // 그때 개수

  // =================================================================
  // 🔌 상태 (Zero-Hook)
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const tVal = st.tVal ?? 1.0;

  const patchState = (fields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), ...fields } }));
  };

  const nowA = candyA(tVal);
  const nowB = candyB(tVal);
  const gap = nowA - nowB;
  const isSame = Math.abs(tVal - targetT) < 0.04;

  // 사탕을 실제로 그릴 때는 정수 개수로(셀 수 있게)
  const cntA = Math.round(nowA);
  const cntB = Math.round(nowB);

  // =================================================================
  // 💬 초등 눈높이 안내문
  // =================================================================
  let title = "🍬 사탕 모으기 대결! 언제 개수가 같아질까?";
  let detail = "A친구는 사탕 3개를 갖고 시작하지만 1분에 1개씩만 받아요. B친구는 0개로 시작하지만 1분에 2개씩 빠르게 받아요. 주황색 점을 잡고 시간을 움직여서, 두 친구의 사탕 개수가 똑같아지는 때를 찾아보세요!";
  let theme = { bg: '#f8fafc', border: '#bae6fd', text: '#0369a1', badge: '찾는 중' };

  if (isSame) {
    title = "🎉 찾았다! 3분 후에 둘 다 6개!";
    detail = "3분이 지나자 두 친구 모두 사탕이 6개가 되었어요! 이때 아래 그림에서도 두 선이 딱 만납니다. 이 만나는 점이 바로 '같아지는 때'예요.";
    theme = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', badge: '🎉 같아짐!' };
  } else if (gap > 0) {
    title = "🔵 아직 A친구가 앞서고 있어요!";
    detail = "A친구는 처음부터 3개를 갖고 시작했거든요. 하지만 B친구가 더 빠르게 받고 있으니 곧 따라잡힐 거예요!";
    theme = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', badge: 'A친구 앞섬' };
  } else {
    title = "🔴 B친구가 역전했어요!";
    detail = "B친구는 1분에 2개씩 받아서 훨씬 빨라요. 처음엔 뒤졌지만 결국 A친구를 따라잡고 앞질렀습니다!";
    theme = { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', badge: 'B친구 역전' };
  }

  // =================================================================
  // 🍬 사탕 쌓기: 개수만큼 동그란 점을 격자로 배치
  //    한 줄에 5개씩 쌓아 올린다(세기 쉽게).
  // =================================================================
  const candyPositions = (count, baseX) => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      pts.push([baseX + col * 0.42, 0.6 + row * 0.62]);
    }
    return pts;
  };
  const candiesA = candyPositions(cntA, 0.7);
  const candiesB = candyPositions(cntB, 4.3);

  const styles = {
    container: { display: 'flex', fontFamily: 'sans-serif', flexDirection: 'column', gap: '12px', userSelect: 'none' },
    hud: { background: theme.bg, border: `2px solid ${theme.border}`, borderRadius: '16px', padding: '14px', transition: 'all 0.2s ease' },
    hudTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' },
    hudTitle: { fontSize: '14px', fontWeight: '800', color: theme.text },
    hudBadge: { background: theme.text, color: '#fff', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    box: { background: '#fff', borderRadius: '16px', padding: '12px', border: '2px solid #e2e8f0' },
    title: { fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', textAlign: 'center' },
    canvas: { background: '#fffdf7', borderRadius: '12px', border: '1px solid #e7e5e4', overflow: 'hidden' },
    mathCanvas: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    dashboard: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' },
    miniCard: { background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', border: '1px solid #e2e8f0', fontWeight: '700' },
    footer: { fontSize: '12.5px', color: '#334155', textAlign: 'center', lineHeight: '1.6', padding: '0 4px', fontWeight: '500' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .candy-engine .MafsView { background-color: transparent !important; }
        .candy-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 안내 */}
      <div className="viz-box" style={styles.hud}>
        <div style={styles.hudTop}>
          <span style={styles.hudTitle}>{title}</span>
          <span style={styles.hudBadge}>{theme.badge}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#475569', fontWeight: '500', marginTop: '4px', lineHeight: '1.4' }}>{detail}</div>
      </div>

      {/* 🍬 위: 두 친구의 사탕이 실제로 쌓인다 */}
      <div className="viz-box" style={styles.box}>
        <div style={styles.title}>🍬 두 친구가 모은 사탕 (직접 세어보세요!)</div>
        <div className="candy-engine" style={styles.canvas}>
          <Mafs viewBox={{ x: [0, 7.4], y: [-0.3, 4.2] }} preserveAspectRatio={false} height={210}>
            {/* 바닥 */}
            <Line.Segment point1={[0.2, 0.1]} point2={[7.2, 0.1]} color="#d6d3d1" weight={2} />
            {/* 가운데 칸막이 */}
            <Line.Segment point1={[3.7, 0.1]} point2={[3.7, 4.0]} color="#e7e5e4" weight={1.5} style="dashed" />

            {/* A친구 사탕 */}
            {candiesA.map((p, i) => (
              <Point key={`a${i}`} x={p[0]} y={p[1]} color="#2563eb" svgCircleProps={{ r: 8 }} />
            ))}
            <Text x={1.5} y={-0.05} size={13} color="#2563eb" attach="s">{`🙂 A친구: ${cntA}개`}</Text>

            {/* B친구 사탕 */}
            {candiesB.map((p, i) => (
              <Point key={`b${i}`} x={p[0]} y={p[1]} color="#db2777" svgCircleProps={{ r: 8 }} />
            ))}
            <Text x={5.1} y={-0.05} size={13} color="#db2777" attach="s">{`😃 B친구: ${cntB}개`}</Text>

            {isSame && <Text x={3.7} y={3.6} size={20} attach="center">🎉 같다!</Text>}
          </Mafs>
        </div>
      </div>

      {/* ⏱ 시간 조작 + 그래프 */}
      <div className="viz-box" style={styles.box}>
        <div style={styles.title}>📈 시간이 갈수록 사탕이 어떻게 늘어날까 (주황 점을 잡고 움직여요)</div>
        <div className="candy-engine" style={styles.mathCanvas}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
            <Coordinates.Cartesian />

            {/* 두 친구의 사탕 개수 선 */}
            <Plot.OfX y={candyA} color="#2563eb" weight={3.5} />
            <Plot.OfX y={candyB} color="#db2777" weight={3.5} />

            {/* 지금 보고 있는 시각 */}
            <Line.Segment point1={[tVal, -1.5]} point2={[tVal, Math.max(nowA, nowB)]} color="#ea580c" weight={2} style="dashed" />

            {/* 두 친구 개수 차이 기둥 */}
            <Line.Segment point1={[tVal, nowA]} point2={[tVal, nowB]} color="#a855f7" weight={3.5} />
            <Text x={tVal} y={(nowA + nowB) / 2} size={10} color="#a855f7" attach="e">
              {`${Math.abs(gap).toFixed(0)}개 차이`}
            </Text>

            {/* 지금 두 친구 위치 */}
            <Point x={tVal} y={nowA} color="#2563eb" svgCircleProps={{ r: 6 }} />
            <Point x={tVal} y={nowB} color="#db2777" svgCircleProps={{ r: 6 }} />

            {/* 만나는 점 */}
            <Point x={targetT} y={targetC} color={isSame ? Theme.green : "#cbd5e1"}
              svgCircleProps={{ r: isSame ? 8 : 4.5 }} />
            <Text x={targetT} y={targetC} size={11} color="#0f172a" attach="ne">🍬 같아지는 곳</Text>

            {/* 🎮 시간을 직접 끄는 손잡이 */}
            <MovablePoint
              point={[tVal, 0]}
              color="#ea580c"
              constrain={(pos) => [Math.min(TMAX, Math.max(0, Math.round(pos[0] * 10) / 10)), 0]}
              onMove={(pos) => patchState({ tVal: pos[0] })}
            />
          </Mafs>
        </div>
      </div>

      {/* 계기판 */}
      <div style={styles.dashboard}>
        <div style={styles.miniCard}>⏱️ 지난 시간<br /><b style={{ fontSize: '13px' }}>{tVal.toFixed(1)} 분</b></div>
        <div style={{ ...styles.miniCard, color: '#2563eb' }}>🙂 A친구<br /><b style={{ fontSize: '13px' }}>{nowA.toFixed(0)} 개</b></div>
        <div style={{ ...styles.miniCard, color: '#db2777' }}>😃 B친구<br /><b style={{ fontSize: '13px' }}>{nowB.toFixed(0)} 개</b></div>
      </div>

      {/* 마무리 */}
      <div style={styles.footer}>
        위에서 사탕 개수가 <b>똑같아지는 순간</b>과, 아래 그림에서 <b>두 선이 만나는 점</b>은 같은 일이에요.
        <br />
        만나기 <b>전</b>엔 A친구가 앞서고, 만난 <b>후</b>엔 B친구가 앞서요 — 만나는 점을 지나면 누가 앞서는지가 <b>뒤바뀝니다</b>.
      </div>
    </div>
  );
}