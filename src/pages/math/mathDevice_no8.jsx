import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Text, Polygon } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * no: "8" [방정식 해 = 교점] — 초등 눈높이 시나리오판
 *
 * [시나리오 교체 — 왜 바꿨나]
 *   기존: "종량제/결합제 요금제", "데이터 사용량 GB", "연립방정식", "데카르트 직교평면"
 *     → 초등학생이 아는 말이 하나도 없다. 요금제 구조 자체가 아이 경험 밖이다.
 *   교체: 젤리 사탕 가게 두 곳의 값 비교.
 *     - 파랑 가게: 봉지값 1개 + 사탕 1개당 젤리 2개   → y = 2x + 1
 *     - 분홍 가게: 봉지값 4개 + 사탕 1개당 젤리 1개   → y = x + 4
 *     - 사탕을 3개 살 때 두 가게 모두 젤리 7개로 값이 같아진다 (교점 = 방정식의 해)
 *   화면에서 "요금·기본료·사용량·연립방정식·좌표평면" 같은 말을 전부 뺐다.
 *
 * [버그 수정]
 *   1) 왼쪽 접시 가로선의 끝점이 [leftX + 0.5, leftX - 1.4] 로 되어 있었다(둘째 값이 leftY여야
 *      하는데 leftX가 들어감). → 접시가 엉뚱한 높이로 삐뚤어지게 그려지던 오류. leftY로 수정.
 *   2) <Point size={...} /> 는 mafs에 없는 prop(PointProps = x,y,color,opacity,svgCircleProps).
 *      조용히 무시되어 크기 변화가 반영 안 됨 → svgCircleProps={{ r: ... }} 로 교체.
 *   3) <Text weight="black" /> 도 없는 prop(TextProps에 weight 없음) → 제거.
 *
 * [아키텍처] Zero-Hook 유지: useState 없이 sharedXByLog로만 상태 라우팅.
 */
export function renderDevice_no8(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 사탕은 0~6개까지 살 수 있다
  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-1.2, 13.2]);

  // =================================================================
  // 🍬 두 젤리 가게의 값 규칙
  //   파랑 가게: 봉지값 젤리 1개 + 사탕 1개당 젤리 2개  → 2x + 1
  //   분홍 가게: 봉지값 젤리 4개 + 사탕 1개당 젤리 1개  → x + 4
  //   사탕 3개를 살 때 둘 다 젤리 7개 → 값이 똑같아지는 순간
  // =================================================================
  const costA = (x) => 2 * x + 1;   // 파랑 가게
  const costB = (x) => x + 4;       // 분홍 가게

  const targetX = 3.0;
  const targetY = 7.0;

  // =================================================================
  // 🔌 상태 라우터 (Zero-Hook)
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const xVal = st.xVal ?? 1.0;

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  const currentYA = costA(xVal);
  const currentYB = costB(xVal);
  const priceGap = currentYA - currentYB;
  const isBalanced = Math.abs(xVal - targetX) < 0.04;

  // 시소 기울기: 값 차이에 비례
  const seesawAngle = Math.min(0.36, Math.max(-0.36, priceGap * 0.075));

  // =================================================================
  // ⚖️ 시소 좌표 계산
  // =================================================================
  const pivotX = 3.0;
  const pivotY = 4.8;
  const armLength = 2.1;

  const leftX = pivotX - armLength * Math.cos(seesawAngle);
  const leftY = pivotY - armLength * Math.sin(seesawAngle);
  const rightX = pivotX + armLength * Math.cos(seesawAngle);
  const rightY = pivotY + armLength * Math.sin(seesawAngle);

  // =================================================================
  // 💬 초등 눈높이 안내문
  // =================================================================
  let consoleTitle = "⚖️ 어느 가게가 더 비쌀까? 시소로 알아보자!";
  let consoleDetail = "시소 접시나 오른쪽 그림의 주황색 점을 손으로 잡고 움직여서, 시소가 딱 평평해지는 곳을 찾아보세요.";
  let panelTheme = {
    bg: '#f8fafc', border: '#bae6fd', text: '#0369a1', cardInk: '#475569', badge: '찾는 중'
  };

  if (isBalanced) {
    consoleTitle = "🎉 찾았다! 시소가 딱 평평해졌어요!";
    consoleDetail = "사탕 3개를 살 때 두 가게 모두 젤리 7개로 값이 똑같아요! 시소가 평평해진 바로 그때, 오른쪽 그림에서 두 선이 딱 만나는 점이 켜집니다. 이 만나는 점이 바로 답이에요.";
    panelTheme = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', cardInk: '#16a34a', badge: '⚖️ 딱 맞음!' };
  } else if (priceGap > 0) {
    consoleTitle = "⚠️ 파랑 가게가 더 비싸요!";
    consoleDetail = "사탕을 많이 살수록 파랑 가게는 1개당 젤리를 2개씩 받아서 값이 쑥쑥 올라가요. 그래서 왼쪽 접시가 쿵 내려갑니다.";
    panelTheme = { bg: '#fff5f5', border: '#fed7d7', text: '#c53030', cardInk: '#2563eb', badge: '파랑이 무거움' };
  } else {
    consoleTitle = "⚠️ 분홍 가게가 더 비싸요!";
    consoleDetail = "사탕을 조금만 살 때는 분홍 가게의 봉지값(젤리 4개)이 커서 더 비싸요. 그래서 오른쪽 접시가 쿵 내려갑니다.";
    panelTheme = { bg: '#fffaf0', border: '#feebc8', text: '#9c4221', cardInk: '#db2777', badge: '분홍이 무거움' };
  }

  // =================================================================
  // 🎨 스타일
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

      <style>{`
        .mafs-master-engine .MafsView { background-color: transparent !important; }
        .mafs-master-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 안내 화면 */}
      <div className="viz-box" style={styles.hud}>
        <div style={styles.hudTop}>
          <span style={styles.hudTitle}>{consoleTitle}</span>
          <span style={styles.hudBadge}>{panelTheme.badge}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#475569', fontWeight: '500', marginTop: '4px', lineHeight: '1.4' }}>{consoleDetail}</div>
      </div>

      <div style={styles.splitGrid}>

        {/* ⚖️ 왼쪽: 시소 */}
        <div className="viz-box" style={styles.box}>
          <div style={styles.title}>⚖️ 값을 견주는 시소</div>
          <div className="mafs-master-engine" style={styles.simCanvas}>
            <Mafs viewBox={{ x: [0.2, 5.8], y: [1.2, 6.8] }} preserveAspectRatio={true} height={250}>

              {/* 바닥 */}
              <Line.Segment point1={[0.5, 1.8]} point2={[5.5, 1.8]} color="#78716c" weight={3} />

              {/* 받침대 */}
              <Polygon points={[[3.0, pivotY], [2.6, 1.8], [3.4, 1.8]]} color="#a8a29e" weight={1} opacity={0.35} />

              {/* 받침점 [수정] size → svgCircleProps */}
              <Point x={pivotX} y={pivotY} color="#451a03" svgCircleProps={{ r: 6 }} />

              {/* 시소 막대 */}
              <Line.Segment point1={[leftX, leftY]} point2={[rightX, rightY]} color="#b45309" weight={6} />

              {/* 🔵 왼쪽 접시(파랑 가게)
                  [수정] 가로선 둘째 점의 y가 leftX로 잘못 들어가 있었다 → leftY로 고침 */}
              <Line.Segment point1={[leftX, leftY]} point2={[leftX, leftY - 1.4]} color="#78716c" weight={1.5} />
              <Line.Segment point1={[leftX - 0.5, leftY - 1.4]} point2={[leftX + 0.5, leftY - 1.4]} color="#2563eb" weight={4} />
              <Text x={leftX} y={leftY - 1.9} size={11} color="#2563eb" attach="s">{`파랑 가게: 젤리 ${currentYA.toFixed(0)}개`}</Text>

              {/* 🔴 오른쪽 접시(분홍 가게) */}
              <Line.Segment point1={[rightX, rightY]} point2={[rightX, rightY - 1.4]} color="#78716c" weight={1.5} />
              <Line.Segment point1={[rightX - 0.5, rightY - 1.4]} point2={[rightX + 0.5, rightY - 1.4]} color="#db2777" weight={4} />
              <Text x={rightX} y={rightY - 1.9} size={11} color="#db2777" attach="s">{`분홍 가게: 젤리 ${currentYB.toFixed(0)}개`}</Text>

              {/* 🎮 오른쪽 접시를 잡고 시소를 직접 움직인다 */}
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
                  // 접시 위치(각도)로부터 사탕 개수를 거꾸로 계산
                  const dx = pos[0] - pivotX;
                  const dy = (pos[1] + 1.4) - pivotY;
                  const theta = Math.atan2(dy, dx);
                  const rawX = targetX + (theta / 0.075);
                  const snapX = Math.min(GMAX, Math.max(0, Math.round(rawX * 10) / 10));
                  patchState({ xVal: snapX });
                }}
              />
              <Text x={rightX} y={rightY - 0.9} size={11} color="#ef4444" attach="n">↕ 여기를 잡고 움직여요</Text>
            </Mafs>
          </div>
        </div>

        {/* 📐 오른쪽: 그래프 */}
        <div className="viz-box" style={styles.box}>
          <div style={styles.title}>📈 두 가게의 값을 그린 그림</div>
          <div className="mafs-master-engine" style={styles.mathCanvas}>
            <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>

              <Coordinates.Cartesian />

              <Plot.OfX y={costA} color="#2563eb" weight={3.5} />
              <Plot.OfX y={costB} color="#db2777" weight={3.5} />

              {/* 지금 보고 있는 사탕 개수 자리 */}
              <Line.Segment point1={[xVal, -1.2]} point2={[xVal, Math.max(currentYA, currentYB)]} color="#ea580c" weight={2} style="dashed" />

              {/* 두 가게 값 차이를 보여주는 보라색 기둥 */}
              <Line.Segment
                point1={[xVal, currentYA]}
                point2={[xVal, currentYB]}
                color="#a855f7"
                weight={3.5}
              />
              <Text x={xVal} y={(currentYA + currentYB) / 2} size={10} color="#a855f7" attach="e">
                {`젤리 ${Math.abs(priceGap).toFixed(0)}개 차이`}
              </Text>

              {/* 두 선이 만나는 점 [수정] size → svgCircleProps */}
              <Point x={targetX} y={targetY} color={isBalanced ? Theme.green : "#cbd5e1"}
                svgCircleProps={{ r: isBalanced ? 7.5 : 4.5 }} />
              <Text x={targetX} y={targetY} size={11} color="#0f172a" attach="ne">🍬 값이 같아지는 곳</Text>

              {/* 🎮 바닥의 주황 점을 잡고 좌우로 */}
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

      {/* 계기판 */}
      <div style={styles.dashboard}>
        <div style={styles.miniCard}>🍭 산 사탕 개수<br /><b style={{ fontSize: '13px' }}>{xVal.toFixed(1)} 개</b></div>
        <div style={{ ...styles.miniCard, color: '#a855f7' }}>🍬 두 가게 값 차이<br /><b style={{ fontSize: '13px' }}>젤리 {Math.abs(priceGap).toFixed(1)} 개</b></div>
        <div style={{ ...styles.miniCard, color: panelTheme.cardInk }}>⚖️ 시소 기울기<br /><b style={{ fontSize: '13px' }}>{(seesawAngle * (180 / Math.PI)).toFixed(1)} 도</b></div>
      </div>

      {/* 마무리 설명 */}
      <div style={styles.footer}>
        시소가 딱 평평해지는 순간과, 오른쪽 그림에서 두 선이 딱 만나는 순간은 <b>똑같은 일</b>이에요.
        <br />
        만나는 곳보다 <b>왼쪽</b>에서는 분홍 가게가 비싸고, <b>오른쪽</b>에서는 파랑 가게가 비싸져요. 만나는 점을 지나면 누가 더 비싼지가 <b>뒤바뀌는 것</b>을 직접 움직이며 확인해 보세요.
      </div>

    </div>
  );
}