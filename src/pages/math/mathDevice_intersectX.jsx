import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint, Line, Point, Text, Polygon, Plot } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderIntersectX(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const GMAX = 6;
  const xRange = toRange(v.xRange, [-0.5, GMAX + 0.5]);
  const yRange = toRange(v.yRange, [-0.5, 8.5]);

  const fAgentA = (x) => x + 3;
  const fAgentB = (x) => -x + 7;
  
  const targetX = 2.0;
  const targetY = 5.0;

  const st = sharedXByLog?.[logIdx] || {};
  const xVal = st.xVal ?? 0.5;

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  const yA = fAgentA(xVal);
  const yB = fAgentB(xVal);
  const currentGap = Math.abs(xVal - targetX);
  
  const isTargetMatched = currentGap < 0.04;
  const radarProximity = Math.max(0, 1 - currentGap / 2.5);
  const targetLaserOpacity = Math.min(1, Math.max(0, (0.4 - currentGap) / 0.3));

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
      <style>{`
        .mafs-optics-core .MafsView { background-color: transparent !important; }
        .mafs-optics-core .MafsView svg { overflow: visible !important; }
      `}</style>

      <div className="viz-box" style={styles.hudConsole}>
        <div style={styles.hudHeader}>
          <span style={styles.hudTitle}>{infoTitle}</span>
          <span style={styles.hudBadge}>{isTargetMatched ? "작전 완료" : "실시간 추적"}</span>
        </div>
        <div style={styles.hudBody}>{infoDetail}</div>
      </div>

      <div className="viz-box" style={styles.panelLayout}>
        <div style={styles.panelHeader}>
          🎬 <b>[1층 공간: 스파이 조준 레이더]</b> 주황색 세로 탐색 장벽의 위아래나 바닥을 붙잡고 직접 미세요!
        </div>
        
        <div className="mafs-optics-core" style={styles.simContainer}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={220}>
            <Polygon 
              points={[[targetX - 0.4, targetY - 0.4], [targetX + 0.4, targetY - 0.4], [targetX + 0.4, targetY + 0.4], [targetX - 0.4, targetY + 0.4]]} 
              color={Theme.blue} 
              opacity={0.01 + radarProximity * 0.09} 
            />
            
            <Line.Linear slope={1} intercept={3} color="#cbd5e1" weight={1.2} style="dashed" />
            <Line.Linear slope={-1} intercept={7} color="#cbd5e1" weight={1.2} style="dashed" />

            <Line.Segment point1={[xVal, -0.5]} point2={[xVal, 8.5]} color="#ea580c" weight={isTargetMatched ? 4.5 : 2.5} />

            <Point x={xVal} y={yA} color="#2563eb" size={5 + radarProximity * 2.5} />
            {/* ⚠️ 에러 방지 교정: 문자를 자식으로 주입하지 않고 속성을 통해 우회 렌더링 */}
            <Text x={xVal} y={yA + 0.4} size={13} color="#2563eb" weight="bold" attach="n">Agent A</Text>

            <Point x={xVal} y={yB} color="#db2777" size={5 + radarProximity * 2.5} />
            <Text x={xVal} y={yB - 0.4} size={13} color="#db2777" weight="bold" attach="s">Agent B</Text>

            <Point x={targetX} y={targetY} color={isTargetMatched ? Theme.green : "#cbd5e1"} size={isTargetMatched ? 8 : 4} />
            {isTargetMatched && <Text x={targetX} y={targetY} size={24} color="#ef4444" weight="black" attach="center">MATCH</Text>}

            <MovablePoint
              point={[xVal, 0]}
              color="#ea580c"
              constrain={(pos) => {
                const rx = Math.round(pos[0] * 10) / 10;
                return [Math.min(GMAX, Math.max(0, rx)), 0];
              }}
              onMove={(pos) => patchState({ xVal: pos[0] })}
            />

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

      <div style={styles.relationBoard}>
        {heightRelationText}
      </div>

      <div className="viz-box" style={styles.panelLayout}>
        <div style={styles.panelHeader}>
          📐 <b>[2층 공간: 데카르트 수학 종이]</b> 두 규칙 선이 충돌하여 유일한 교점을 형성하는 수학 평면
        </div>
        
        <div className="mafs-optics-core" style={styles.mathContainer}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            <Coordinates.Cartesian />

            <Plot.OfX y={fAgentA} color="#2563eb" weight={3.5} />
            <Plot.OfX y={fAgentB} color="#db2777" weight={3.5} />

            <Line.Segment point1={[xVal, 0]} point2={[xVal, Math.max(yA, yB)]} color="#94a3b8" style="dashed" weight={1.5} />
            
            {targetLaserOpacity > 0 && (
              <Line.Segment 
                point1={[targetX, 0]} 
                point2={[targetX, targetY]} 
                color={Theme.red} 
                weight={2 + targetLaserOpacity * 2.5} 
                opacity={targetLaserOpacity} 
              />
            )}

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

            <Text x={targetX} y={targetY} size={12} color="#0f172a" weight="black" attach="ne">
              {`P (${targetX}, ${targetY})`}
            </Text>
          </Mafs>
        </div>

        <div style={styles.systemBox}>
          <span>📋 두 요원의 움직임 규칙 상자식:</span>
          <span style={{ color: '#2563eb' }}>y = x + 3</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#db2777' }}>y = −x + 7</span>
        </div>

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

        <div style={styles.captionArea}>
          두 요원의 길이 공중에서 딱 만나는 교점은 두 요원의 높이가 완벽하게 똑같아지는 순간입니다. 만나기 전과 만난 후의 두 함수의 높낮이(대소 관계)가 완전히 뒤바뀌는 구조를 마우스로 직접 선을 끄집어 당기며 관찰하고, 방정식의 진짜 답(해)은 만난 높이(y)가 아니라 **그들이 만나게 된 원인인 바닥의 [가로 주소 x = 2]**임을 기억하세요!
        </div>
      </div>

    </div>
  );
}