import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Polygon } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderMaxMinJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 부드러운 3차 곡선식
  const formula = (v.curves || [])[0]?.formula || '0.15*x*x*x-1.2*x*x+2*x+3';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;

  const f = (x) => {
    try {
      return compiled.evaluate({ x });
    } catch (e) {
      return NaN;
    }
  };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-1, 9]);

  // 슬라이더로 조절할 울타리의 양 끝점 a, b 상태 관리
  const st = sharedXByLog?.[logIdx] || {};
  const a = st.a ?? 1.0;
  const b = st.b ?? 5.5;
  const patch = (p) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || { a, b }), ...p }
    }));
  };

  const lo = Math.min(a, b);
  const hi = Math.max(a, b);

  // [수학 핵심 알고리즘] 3차 곡선의 미분값이 0이 되는 꼭대기(극대)와 골짜기(극소) 후보 추출
  // f(x) = 0.15x^3 - 1.2x^2 + 2x + 3 -> 극대 x ≈ 1.03, 극소 x ≈ 4.30
  const peakX = 1.033;
  const valleyX = 4.30;

  // 닫힌 울타리 안에서만 작동하는 용의자 명단(Candidates List) 작성
  const suspects = [
    { id: 'left', name: '왼쪽 벽 끝 (a)', x: lo, y: f(lo), type: 'wall' },
    { id: 'right', name: '오른쪽 벽 끝 (b)', x: hi, y: f(hi), type: 'wall' }
  ];

  // 만약 둥근 꼭대기가 울타리 안에 들어오면 용의자 명단에 수배 추가
  if (peakX >= lo && peakX <= hi) {
    suspects.push({ id: 'peak', name: '중간 꼭대기', x: peakX, y: f(peakX), type: 'peak' });
  }

  // 만약 푹 파인 골짜기가 울타리 안에 들어오면 용의자 명단에 수배 추가
  if (valleyX >= lo && valleyX <= hi) {
    suspects.push({ id: 'valley', name: '중간 골짜기', x: valleyX, y: f(valleyX), type: 'valley' });
  }

  // 명단에 소환된 용의자들의 세로 높이(Y)를 1:1 결투(토너먼트) 시켜 진짜 대장과 꼴찌 락온!
  const maxSuspect = suspects.reduce((prev, curr) => curr.y > prev.y ? curr : prev);
  const minSuspect = suspects.reduce((prev, curr) => curr.y < prev.y ? curr : prev);

  // 울타리 바깥을 어둡게 막는 시야 가림판
  const leftDarkZone = [
    [xRange[0], yRange[0]],
    [lo, yRange[0]],
    [lo, yRange[1]],
    [xRange[0], yRange[1]],
  ];
  const rightDarkZone = [
    [hi, yRange[0]],
    [xRange[1], yRange[0]],
    [xRange[1], yRange[1]],
    [hi, yRange[1]],
  ];

  // HTML 실시간 연동 오버레이 좌표 계산 (1:1 화면 비율 스냅용)
  const maxXPct = ((maxSuspect.x - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const maxYPct = ((yRange[1] - maxSuspect.y) / (yRange[1] - yRange[0])) * 100;
  const minXPct = ((minSuspect.x - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const minYPct = ((yRange[1] - minSuspect.y) / (yRange[1] - yRange[0])) * 100;

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    card: { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'center' },
    sliderPanel: { display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' },
    sliderRow: { display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' },
    sliderLabel: { fontSize: '12px', fontWeight: 'bold', color: '#475569', width: '90px', textAlign: 'left' },
    slider: { width: '60%', accentColor: '#ea580c', cursor: 'pointer', height: '6px' },
    suspectBoard: { 
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
      gap: '8px', marginTop: '12px', background: '#f1f5f9', padding: '10px', borderRadius: '12px' 
    },
    suspectCard: (isActiveMax, isActiveMin) => ({
      background: isActiveMax ? '#dcfce7' : (isActiveMin ? '#fee2e2' : '#ffffff'),
      border: `2px solid ${isActiveMax ? '#16a34a' : (isActiveMin ? '#dc2626' : '#e2e8f0')}`,
      borderRadius: '8px', padding: '8px', textAlign: 'center', transition: 'all 0.2s'
    }),
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.15s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .mafs-6d-engine .MafsView { background-color: #fafafa !important; }
        .mafs-6d-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 토너먼트 배틀보드 */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 'bold', marginBottom: '8px' }}>
          ⚔️ 네 명의 용의자 높이 대결 (최대·최소 토너먼트)
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          울타리 안의 최고와 최저는 아무나 될 수 없어요. 오직 <b>양 끝 벽자리</b>와 <b>울타리 안 꼭대기/골짜기</b> 중 왕관을 쓴 녀석들이 진짜 정답이 됩니다!
        </div>

        {/* 조종용 울타리 슬라이더 2종 */}
        <div style={styles.sliderPanel}>
          <div style={styles.sliderRow}>
            <span style={styles.sliderLabel}>🚧 왼쪽 벽 (a)</span>
            <input 
              type="range" 
              min={xRange[0] + 0.2} 
              max={xRange[1] - 0.2} 
              step={0.05} 
              value={a}
              onChange={(e) => patch({ a: parseFloat(e.target.value) })} 
              style={styles.slider} 
            />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', width: '30px' }}>{lo.toFixed(1)}</span>
          </div>
          <div style={styles.sliderRow}>
            <span style={styles.sliderLabel}>🚧 오른쪽 벽 (b)</span>
            <input 
              type="range" 
              min={xRange[0] + 0.2} 
              max={xRange[1] - 0.2} 
              step={0.05} 
              value={b}
              onChange={(e) => patch({ b: parseFloat(e.target.value) })} 
              style={styles.slider} 
            />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', width: '30px' }}>{hi.toFixed(1)}</span>
          </div>
        </div>

        {/* 실시간 용의자 결투 현황판 */}
        <div style={styles.suspectBoard}>
          {/* 왼쪽 벽 후보 */}
          <div style={styles.suspectCard(maxSuspect.id === 'left', minSuspect.id === 'left')}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>왼쪽 벽 끝</div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', margin: '2px 0' }}>Y = {f(lo).toFixed(1)}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: maxSuspect.id === 'left' ? '#16a34a' : (minSuspect.id === 'left' ? '#dc2626' : '#64748b') }}>
              {maxSuspect.id === 'left' ? '👑 진짜최대' : (minSuspect.id === 'left' ? '🕳️ 진짜최소' : '대기중')}
            </div>
          </div>

          {/* 중간 꼭대기 후보 (울타리 안에 들어왔을 때만 활성화) */}
          <div style={styles.suspectCard(maxSuspect.id === 'peak', minSuspect.id === 'peak')}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>중간 꼭대기</div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: (peakX >= lo && peakX <= hi) ? '#0f172a' : '#94a3b8', margin: '2px 0' }}>
              {(peakX >= lo && peakX <= hi) ? `Y = ${f(peakX).toFixed(1)}` : '탈락 (밖)'}
            </div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: maxSuspect.id === 'peak' ? '#16a34a' : (minSuspect.id === 'peak' ? '#dc2626' : '#cbd5e1') }}>
              {(peakX >= lo && peakX <= hi) ? (maxSuspect.id === 'peak' ? '👑 진짜최대' : '대기중') : '영역밖'}
            </div>
          </div>

          {/* 중간 골짜기 후보 (울타리 안에 들어왔을 때만 활성화) */}
          <div style={styles.suspectCard(maxSuspect.id === 'valley', minSuspect.id === 'valley')}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>중간 골짜기</div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: (valleyX >= lo && valleyX <= hi) ? '#0f172a' : '#94a3b8', margin: '2px 0' }}>
              {(valleyX >= lo && valleyX <= hi) ? `Y = ${f(valleyX).toFixed(1)}` : '탈락 (밖)'}
            </div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: maxSuspect.id === 'valley' ? '#16a34a' : (minSuspect.id === 'valley' ? '#dc2626' : '#cbd5e1') }}>
              {(valleyX >= lo && valleyX <= hi) ? (minSuspect.id === 'valley' ? '🕳️ 진짜최소' : '대기중') : '영역밖'}
            </div>
          </div>

          {/* 오른쪽 벽 후보 */}
          <div style={styles.suspectCard(maxSuspect.id === 'right', minSuspect.id === 'right')}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>오른쪽 벽 끝</div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', margin: '2px 0' }}>Y = {f(hi).toFixed(1)}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: maxSuspect.id === 'right' ? '#16a34a' : (minSuspect.id === 'right' ? '#dc2626' : '#64748b') }}>
              {maxSuspect.id === 'right' ? '👑 진짜최대' : (minSuspect.id === 'right' ? '🕳️ 진짜최소' : '대기중')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 대결 인터랙티브 캔버스 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-6d-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={280}>
            <Coordinates.Cartesian />

            {/* 울타리 밖 영역 시각 차단판 */}
            <Polygon points={leftDarkZone} color="#0f172a" opacity={0.4} />
            <Polygon points={rightDarkZone} color="#0f172a" opacity={0.4} />

            {/* 울타리 경계선 기둥 (두꺼운 주황선) */}
            <Line.Segment point1={[lo, yRange[0]]} point2={[lo, yRange[1]]} color="#ea580c" weight={3.5} />
            <Line.Segment point1={[hi, yRange[0]]} point2={[hi, yRange[1]]} color="#ea580c" weight={3.5} />

            {/* 기본 함수 뒷배경 */}
            <Plot.OfX y={f} color="#cbd5e1" weight={2} />

            {/* 울타리 내부 무대 활성화 선 */}
            <Plot.OfX y={f} color="#3b82f6" weight={4.5} domain={[lo, hi]} />

            {/* 고정 용의자: 왼쪽/오른쪽 벽 끝점 */}
            <Point x={lo} y={f(lo)} color="#ea580c" svgCircleProps={{ r: 5 }} />
            <Point x={hi} y={f(hi)} color="#ea580c" svgCircleProps={{ r: 5 }} />

            {/* 고정 용의자: 꼭대기/골짜기 (울타리 안에 들어올 때만 보석 마커 활성화) */}
            {peakX >= lo && peakX <= hi && (
              <Point x={peakX} y={f(peakX)} color="#94a3b8" svgCircleProps={{ r: 5 }} />
            )}
            {valleyX >= lo && valleyX <= hi && (
              <Point x={valleyX} y={f(valleyX)} color="#94a3b8" svgCircleProps={{ r: 5 }} />
            )}

            {/* 최종 우주 1등 챔피언 조준 레이저 */}
            <Line.Segment point1={[maxSuspect.x, maxSuspect.y]} point2={[0, maxSuspect.y]} color="#16a34a" weight={2.5} style="dashed" />
            <Point x={maxSuspect.x} y={maxSuspect.y} color="#16a34a" svgCircleProps={{ r: 8 }} />

            {/* 최종 우주 꼴찌 챔피언 조준 레이저 */}
            <Line.Segment point1={[minSuspect.x, minSuspect.y]} point2={[0, minSuspect.y]} color="#dc2626" weight={2.5} style="dashed" />
            <Point x={minSuspect.x} y={minSuspect.y} color="#dc2626" svgCircleProps={{ r: 8 }} />
          </Mafs>

          {/* 3. 기하학적 정답판에 스냅되는 실시간 HTML 라벨 */}
          {/* 진짜 최대 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${maxXPct}%`,
            top: `${maxYPct}%`,
            transform: 'translate(-50%, -140%)',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }}>
            👑 전역 최대: {maxSuspect.y.toFixed(1)} ({maxSuspect.type === 'wall' ? '끝 벽' : '꼭대기'})
          </div>

          {/* 진짜 최소 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${minXPct}%`,
            top: `${minYPct}%`,
            transform: 'translate(-50%, 140%)',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }}>
            🕳️ 전역 최소: {minSuspect.y.toFixed(1)} ({minSuspect.type === 'wall' ? '끝 벽' : '골짜기'})
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 'bold', lineHeight: '1.4' }}>
        두 슬라이더를 옮기며 울타리(a, b)의 너비를 자유롭게 조절해 보세요!<br />
        <b>꼭대기나 끝 벽이 최대와 최소 타이틀을 어떻게 뺏고 빼앗기는지</b> 용의자 카드 판정을 보며 확인해 봐요.
      </div>
    </div>
  );
}