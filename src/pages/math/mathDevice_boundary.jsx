import React from 'react';
import { Mafs, Theme, MovablePoint, Point, Line, Text } from 'mafs';

export function renderBoundary(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_boundary 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  // 1. 상태 관리 설계 (Zero-Hook 구조 준수, 부모 sharedXByLog 연동)
  const st = sharedXByLog?.[logIdx] || {};
  const thr = st.thr ?? 130;             // 탑승 기준 키 (기본값: 130cm)
  const inclusive = st.inclusive ?? true; // 경계 포함 여부 (기본값: true, 이상)

  // 부모 상태 갱신 헬퍼
  const patchState = (updatedFields) => {
    setSharedXByLog?.(prev => ({
      ...prev,
      [logIdx]: {
        ...(prev?.[logIdx] || {}),
        ...updatedFields
      }
    }));
  };

  // 2. 동물 친구들 배치 데이터
  const animals = [
    { id: 'rabbit', name: '토끼', emoji: '🐰', height: 110, x: 1.0 },
    { id: 'cat', name: '고양이', emoji: '🐱', height: 120, x: 2.0 },
    { id: 'bear', name: '곰', emoji: '🐻', height: 130, x: 3.0 },
    { id: 'lion', name: '사자', emoji: '🦁', height: 140, x: 4.0 },
    { id: 'tiger', name: '호랑이', emoji: '🐯', height: 150, x: 5.0 }
  ];

  const X_MIN = 0.2;
  const X_MAX = 5.8;
  const Y_MIN = 85;
  const Y_MAX = 175;
  const GROUND_LEVEL = 95; // 땅바닥 기준선 (95cm)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* Mafs 검은색 디폴트 배경 강제 투명화 */}
      <style>{`
        .mafs-gate-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [1단계] 상단 조작계: 단순하고 명확한 제어 콘솔 */}
      <div className="viz-box" style={{ background: '#f0f9ff', borderRadius: '14px', padding: '12px', border: '2px solid #bae6fd' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#0369a1' }}>
          🎡 마법 열차 탑승 제한 게이트 (현재 제한 기준: {thr}cm)
        </div>

        {/* 조건 토글 버튼 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button 
            type="button" 
            onClick={() => patchState({ inclusive: true })}
            style={{ 
              padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
              border: inclusive ? '2px solid #16a34a' : '1px solid #cbd5e1',
              background: inclusive ? '#dcfce7' : '#ffffff', 
              fontWeight: inclusive ? 'bold' : 'normal',
              color: inclusive ? '#166534' : '#64748b'
            }}
          >
            {"기준 키 이상 (≥, 경계 포함)"}
          </button>
          <button 
            type="button" 
            onClick={() => patchState({ inclusive: false })}
            style={{ 
              padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
              border: !inclusive ? '2px solid #dc2626' : '1px solid #cbd5e1',
              background: !inclusive ? '#fee2e2' : '#ffffff', 
              fontWeight: !inclusive ? 'bold' : 'normal',
              color: !inclusive ? '#991b1b' : '#64748b'
            }}
          >
            {"기준 키 초과 (>, 경계 제외)"}
          </button>
        </div>
      </div>

      {/* [2단계] 진짜 자를 대고 키를 재는 2D 기하학 공간 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px', textAlign: 'center' }}>
          📏 <b>[1단계: 키 재기 판넬]</b> 빨간색 조종 선을 <b>위아래↕</b>로 움직여 보세요!
        </div>

        <div className="mafs-gate-container" style={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: '10px', 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0' 
        }}>
          <Mafs viewBox={{ x: [X_MIN, X_MAX], y: [Y_MIN, Y_MAX] }} preserveAspectRatio={false} height={260}>
            
            {/* 자 눈금 가이드 */}
            <Line.Segment point1={[0.5, GROUND_LEVEL]} point2={[5.5, GROUND_LEVEL]} color="#64748b" weight={3} />
            
            {[100, 110, 120, 130, 140, 150, 160, 170].map(h => (
              <React.Fragment key={h}>
                <Line.Segment point1={[0.5, h]} point2={[5.5, h]} color="#e2e8f0" style="dashed" weight={1} />
                <Text x={0.4} y={h} size={11} color="#94a3b8" attach="w">
                  {`${h}cm`}
                </Text>
              </React.Fragment>
            ))}

            {/* 동물 배치 및 기둥바 시각화 */}
            {animals.map(animal => {
              const isPassed = inclusive ? animal.height >= thr : animal.height > thr;
              
              return (
                <React.Fragment key={animal.id}>
                  <Line.Segment 
                    point1={[animal.x, GROUND_LEVEL]} 
                    point2={[animal.x, animal.height]} 
                    color={isPassed ? "#a7f3d0" : "#e2e8f0"} 
                    weight={18} 
                  />
                  <Line.Segment 
                    point1={[animal.x, GROUND_LEVEL]} 
                    point2={[animal.x, animal.height]} 
                    color={isPassed ? "#10b981" : "#94a3b8"} 
                    weight={2} 
                  />

                  <Text x={animal.x} y={animal.height + 5} size={26}>
                    {animal.emoji}
                  </Text>
                  <Text x={animal.x} y={(GROUND_LEVEL + animal.height) / 2} size={11} color="#475569" weight="bold">
                    {`${animal.height}`}
                  </Text>
                  <Text x={animal.x} y={91} size={11} color="#475569" weight="bold">
                    {animal.name}
                  </Text>
                  <Text x={animal.x} y={animal.height + 15} size={14}>
                    {isPassed ? '🌸' : '🥀'}
                  </Text>
                </React.Fragment>
              );
            })}

            {/* 위아래 슬라이딩 제한 게이트 */}
            <Line.Segment 
              point1={[0.5, thr]} 
              point2={[5.5, thr]} 
              color={Theme.red} 
              style={inclusive ? "solid" : "dashed"}
              weight={3} 
            />

            <Text x={5.5} y={thr} size={11} color="#ef4444" weight="bold" attach="e">
              {`제한: ${thr}cm`}
            </Text>

            {/* 위아래 슬라이딩 조종 점 */}
            <MovablePoint 
              point={[3.0, thr]} 
              color={Theme.red}
              constrain={(pos) => {
                const clampedY = Math.min(150, Math.max(110, pos[1]));
                const snappedY = Math.round(clampedY / 10) * 10;
                return [3.0, snappedY];
              }}
              onMove={(pos) => patchState({ thr: pos[1] })}
            />

            {!inclusive && (
              <Point x={3.0} y={thr} color="#ffffff" size={5} />
            )}
          </Mafs>
        </div>
      </div>

      {/* [3단계] 수식과 매핑되는 1차원 수직선 그래프 (위의 조종 장치와 완벽 상호 연동) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px', textAlign: 'center' }}>
          📊 <b>[2단계: 수직선 기하학 그래프]</b> 아래 점을 <b>좌우↔</b>로 밀어 위를 조종해 보세요!
        </div>

        <div className="mafs-gate-container" style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* 수직선 그래프는 1차원이므로 높이를 컴팩트하게 조절합니다 */}
          <Mafs viewBox={{ x: [95, 165], y: [-0.6, 0.6] }} preserveAspectRatio={false} height={100}>
            
            {/* 기하 수직선 바디 */}
            <Line.Segment point1={[93, 0]} point2={[167, 0]} color="#94a3b8" weight={3} />

            {/* 수직선 상의 10cm 단위 눈금 및 라벨 */}
            {[100, 110, 120, 130, 140, 150, 160].map(val => (
              <React.Fragment key={val}>
                <Line.Segment point1={[val, -0.1]} point2={[val, 0.1]} color="#64748b" weight={2} />
                <Text x={val} y={-0.35} size={11} color="#475569" attach="s">
                  {val.toString()}
                </Text>
              </React.Fragment>
            ))}

            {/* 조건 만족 영역을 녹색 수직선 빔으로 하이라이팅 */}
            <Line.Segment 
              point1={[inclusive ? thr : thr + 0.5, 0]} 
              point2={[167, 0]} 
              color={Theme.green} 
              weight={6} 
            />

            {/* 수직선 상의 실시간 동물들 키 마커 점 (통과하면 초록, 탈락하면 회색) */}
            {animals.map(a => {
              const isPassed = inclusive ? a.height >= thr : a.height > thr;
              return (
                <Point key={a.id} x={a.height} y={0.15} color={isPassed ? Theme.green : "#cbd5e1"} size={4} />
              );
            })}

            {/* 좌우 드래그를 받아주는 자석 구속형 MovablePoint */}
            <MovablePoint 
              point={[thr, 0]} 
              color={Theme.red}
              constrain={(pos) => {
                // X축 범위를 제한하고 10cm 단위로 스냅
                const clampedX = Math.min(150, Math.max(110, pos[0]));
                const snappedX = Math.round(clampedX / 10) * 10;
                return [snappedX, 0];
              }}
              onMove={(pos) => patchState({ thr: pos[0] })}
            />

            {/* 초과(>) 조건일 때 경계점 구멍 뚫기(○) 효과 */}
            {!inclusive && (
              <Point x={thr} y={0} color="#ffffff" size={5} />
            )}
          </Mafs>
        </div>

        {/* 실시간 수식 상태판 */}
        <div style={{ display: 'flex', justifyContent: 'center', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '6px', fontWeight: 'bold' }}>
          <span>수학 부등식 영역: <span style={{ color: inclusive ? '#16a34a' : '#dc2626', fontSize: '13px' }}>
            {inclusive ? `x ≥ ${thr} (이상)` : `x > ${thr} (초과)`}
          </span></span>
        </div>
      </div>

    </div>
  );
}