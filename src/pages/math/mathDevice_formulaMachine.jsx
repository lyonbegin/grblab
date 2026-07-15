import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Line, Point, Text } from 'mafs';
import { toRange } from './mathDeviceShared';

/**
 * no: "8-2" 단원 [식 하나 = 움직이는 점의 네온 레일] 300줄 완성판 교구
 * * [설계 가이드라인 및 규칙 엄격 준수]
 * 1. Zero-Hook 아키텍처: useState, useEffect를 일절 배제하고 부모 sharedXByLog 상태와 완벽 바인딩.
 * 2. 양방향 인터랙션: 상단 슬라이더 조작과 하단 Mafs 평면의 MovablePoint 드래그가 실시간 역방향 동기화.
 * 3. 기하학적 정합성: preserveAspectRatio={true} 속성을 수호하여 데카르트 모눈이 절대 찌그러지지 않음.
 * 4. 2차원 매핑 시스템: 규칙 상자(도형 장치)와 실제 직교좌표평면(수학 그래프)을 완벽하게 이원화 분리.
 */
export function renderFormulaMachine(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG_TAG = '[mathDevice_formulaMachine]';
  const v = log.visual;
  
  // 안전성 검사: 시각 필드 매칭 실패 시 렌더링 차단
  if (!v || v.kind !== 'mafs_function') {
    console.warn(`${DEBUG_TAG} Invalid visual kind. Expected 'mafs_function'.`, v);
    return null;
  }

  // 수학적 도메인 범위 세팅 (초등생 인지 범위 최적화)
  const GMAX = 6;
  const xRange = toRange(v.xRange, [0, GMAX]);
  const yRange = toRange(v.yRange, [-2, 12]); // 치솟는 y값 결과(2x - 1) 수용 범위

  // =================================================================
  // ⚙️ [수학 코어 엔진] 관계식 규칙 정의: y = 2x - 1
  // =================================================================
  const f = (x) => {
    return 2 * x - 1;
  };

  /**
   * 자동차가 전진한 현재 위치(t)까지만 선이 실시간으로 자라나게 만드는 네온 드로잉 필터
   * x가 t를 넘어서는 미래의 구간은 NaN을 반환하여 철저하게 은폐합니다.
   */
  const fRevealed = (x) => {
    if (x >= 0 && x <= t) {
      try {
        return f(x);
      } catch (e) {
        return NaN;
      }
    }
    return NaN;
  };

  // =================================================================
  // 🔌 [상태 라우팅] Zero-Hook 상태 제어 헬퍼
  // =================================================================
  const st = sharedXByLog?.[logIdx] || {};
  const t = st.t ?? 1.0; // 현재 자동차의 x축 입력값 (초기값: 1.0)

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') {
      console.error(`${DEBUG_TAG} setSharedXByLog is not a function.`);
      return;
    }
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: {
        ...(prev?.[logIdx] || {}),
        ...updatedFields
      }
    }));
  };

  const currentY = f(t); // 실시간 연산 출력값
  const isFullyRevealed = t >= 5.95; // 레일이 100% 도달했는지 판정

  // =================================================================
  // 📊 [자취 추적 데이터] 촘촘하게 쌓이는 발자국 알갱이 좌표 리스트 생성
  // =================================================================
  const historyPoints = [];
  const stepInterval = 0.5; // 발자국 배치 간격
  for (let xVal = 0; xVal <= GMAX; xVal += stepInterval) {
    if (xVal <= t) {
      historyPoints.push({ x: xVal, y: f(xVal), id: `pt-${xVal}` });
    }
  }

  // =================================================================
  // 🎨 [스타일 시트] 가독성 극대화를 위한 컴포넌트 인라인 스타일 정의
  // =================================================================
  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif', userSelect: 'none' },
    topPanel: { background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
    panelTitle: { textAlign: 'center', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' },
    pipelineWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' },
    nodeInput: { background: '#2563eb', color: '#ffffff', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(37,99,219,0.2)' },
    nodeMachine: { background: '#ffffff', border: '2px dashed #a855f7', padding: '8px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', color: '#a855f7' },
    nodeOutput: { background: '#10b981', color: '#ffffff', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' },
    arrowIcon: { fontSize: '14px', color: '#94a3b8', fontWeight: 'bold' },
    sliderControl: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    sliderLabel: { fontSize: '12px', fontWeight: 'bold', color: '#475569' },
    sliderInput: { width: '55%', cursor: 'pointer', accentColor: '#2563eb' },
    sliderValue: { fontSize: '14px', fontWeight: 'bold', color: '#2563eb', minWidth: '30px' },
    chartPanel: { background: '#ffffff', borderRadius: '16px', padding: '14px', border: '2px solid #e2e8f0' },
    chartTitle: { fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px', textAlign: 'center' },
    canvasFrame: { background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)' },
    dataTable: { display: 'flex', justifyContent: 'space-around', background: '#f1f5f9', padding: '10px', borderRadius: '10px', fontSize: '12px', color: '#334155', marginTop: '10px', border: '1px solid #e2e8f0' },
    footerCaption: { fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '10px', lineHeight: '1.5', padding: '0 8px' },
    alertSuccess: { color: '#16a34a', fontWeight: 'bold' },
    alertInfo: { color: '#64748b', fontWeight: 'normal' }
  };

  return (
    <div style={styles.container}>
      
      {/* ⚠️ Mafs 컴포넌트가 강제로 주입하는 기본 검은색 배경 테마를 깔끔하게 지워버리는 CSS 오버라이드 */}
      <style>{`
        .mafs-formula-container .MafsView {
          background-color: transparent !important;
        }
        .mafs-formula-container .MafsView svg {
          overflow: visible !important;
        }
      `}</style>

      {/* =================================================================
          📦 [1단계 조작계] 독립된 규칙 계산기 상자 (도형 장치 파트 대시보드)
          ================================================================= */}
      <div className="viz-box" style={styles.topPanel}>
        <div style={styles.panelTitle}>
          🤖 <b>[1단계 조작 기지]</b> 수식 계산기 파이프라인
        </div>

        {/* 숫자가 유기적으로 대입되어 가공되는 과정을 직관화한 파이프라인 장치 */}
        <div style={styles.pipelineWrapper}>
          <div style={styles.nodeInput}>
            📥 가로 입력 (x) = {t.toFixed(1)}
          </div>
          
          <span style={styles.arrowIcon}>▶</span>
          
          <div style={styles.nodeMachine}>
            ⚙️ 규칙 상자: ( 2 × x ) − 1
          </div>
          
          <span style={styles.arrowIcon}>▶</span>

          <div style={styles.nodeOutput}>
            📤 세로 출력 (y) = {currentY.toFixed(1)}
          </div>
        </div>

        {/* 정방향 실시간 조작 슬라이더 레버 */}
        <div style={styles.sliderControl}>
          <span style={styles.sliderLabel}>차량 전진 기어 (x):</span>
          <input 
            type="range" 
            min={0} 
            max={GMAX} 
            step={0.05} 
            value={t}
            onChange={(e) => patchState({ t: parseFloat(e.target.value) })}
            style={styles.sliderInput}
          />
          <span style={styles.sliderValue}>{t.toFixed(2)}</span>
        </div>
      </div>

      {/* =================================================================
          📈 [2단계 그래프] 네온 레일이 실시간으로 생성되는 진짜 직교좌표평면
          ================================================================= */}
      <div className="viz-box" style={styles.chartPanel}>
        <div style={styles.chartTitle}>
          📐 <b>[2단계 기하 공간]</b> 점들의 발자국이 선이 되는 자취 추적 평면
        </div>

        {/* 2D 그래픽스 스페이스 프레임 */}
        <div className="mafs-formula-container" style={styles.canvasFrame}>
          {/* 수학적으로 왜곡 없는 격자 간격을 보존하기 위해 preserveAspectRatio={true} 적용.
            가로 1칸과 세로 1칸의 픽셀 물리 길이를 완벽히 일치시킵니다.
          */}
          <Mafs viewBox={{ x: [-0.8, GMAX + 0.8], y: [-2.5, 12.5] }} preserveAspectRatio={true} height={300}>
            
            {/* 정밀 데카르트 그리드 스냅 레이아웃 */}
            <Coordinates.Cartesian />

            {/* 현재 미니카의 공간 좌표 위치를 축 숫자로 이어주는 실시간 가이드 점선 레이저 */}
            <Line.Segment point1={[t, 0]} point2={[t, currentY]} color="#38bdf8" style="dashed" weight={1.5} />
            <Line.Segment point1={[0, currentY]} point2={[t, currentY]} color="#38bdf8" style="dashed" weight={1.5} />

            {/* 1. 자동차가 지나오며 바닥에 떨구어 누적시킨 보라색 자취 알갱이(점) 리스트 */}
            {historyPoints.map((pt) => (
              <Point key={pt.id} x={pt.x} y={pt.y} color="#c084fc" size={3.5} />
            ))}

            {/* 2. [실시간 성장형 네온 레일] 현재 도달한 t좌표까지만 실시간으로 드로잉되는 빔 */}
            <Plot.OfX y={fRevealed} color="#4ade80" weight={4.5} />

            {/* 규칙이 시작되는 근원점 플로팅 마커 (0, -1) */}
            <Point x={0} y={f(0)} color="#a855f7" size={5} />

            {/* 3. [양방향 동기화] 노드 자체를 직접 마우스로 잡고 궤도 위를 슬라이딩하는 붉은 조종 노드 */}
            <MovablePoint
              point={[t, currentY]}
              color={Theme.red}
              constrain={(pos) => {
                // X축 경계를 [0, GMAX]로 완벽히 가두어 궤도 이탈을 원천 차단
                const clampedX = Math.min(GMAX, Math.max(0, pos[0]));
                return [clampedX, f(clampedX)];
              }}
              onMove={(pos) => patchState({ t: pos[0] })}
            />

            {/* 미래형 미니 에너지카 비주얼 에모지 얹기 */}
            <Text x={t} y={currentY + 0.6} size={24}>🚀</Text>
          </Mafs>
        </div>

        {/* =================================================================
            📋 [3단계 실시간 데이터 보드] 대수-기하 데이터 바인딩 팩트 체크
            ================================================================= */}
        <div style={styles.dataTable}>
          <span>📥 투입된 입력값 (<span style={{ color: '#2563eb', fontWeight: 'bold' }}>가로축 x</span>): <b>{t.toFixed(2)} 걸음</b></span>
          <span>✨ 가공된 결과값 (<span style={{ color: '#a855f7', fontWeight: 'bold' }}>세로축 y</span>): <b>{currentY.toFixed(2)} 층</b></span>
          <span>📍 평면 위 순서쌍 위치: <b style={{ color: '#ef4444' }}>({t.toFixed(1)}, {currentY.toFixed(1)})</b></span>
        </div>

        {/* 초등 수학 개념 관찰 가이드 꼬리표 */}
        <div style={styles.footerCaption}>
          {isFullyRevealed ? (
            <span style={styles.alertSuccess}>
              🎉 <b>대성공!</b> 수많은 대입의 발자국 점들이 빈틈없이 촘촘하게 엮여 마침내 완벽한 <b>[하나의 연속된 선(일차함수 그래프)]</b>이 켜졌습니다!
            </span>
          ) : (
            <span style={styles.alertInfo}>
              💡 <b>관찰 미션:</b> 레버를 당겨 점들의 발자국이 늘어나는 자취를 보세요. 점들이 무한히 촘촘해지면 결국 어떤 기학학적 도형이 완성될까요?
            </span>
          )}
        </div>
      </div>

    </div>
  );
}