// ===========================================================
// no:"9-5" "경계는 포함될 수도, 아닐 수도" (부등식=위/아래의 선행개념)
//
// [초등~중등 맞춤형 양방향 인터랙티브 교구 - 마법 열차 레이저 게이트 에디션]
// - 규칙 준수 1: React Hooks (useState, useEffect)를 절대 사용하지 않는 Zero-Hook 구조입니다.
// - 규칙 준수 2: 상단 조작계와 하단 Mafs 그래프의 MovablePoint가 실시간으로 동기화되는 양방향 인터랙션입니다.
// - 규칙 준수 3: 하단 그래프의 MovablePoint 드래그 시, 동물들의 키 위치(10cm 단위)로 자석처럼 강제 구속(snapping)됩니다.
// - 규칙 준수 4: 일반 텍스트 내 특수문자(<, > 등) 파싱 에러를 완벽하게 방지하기 위해 자바스크립트 문자열 처리를 적용했습니다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Point, Line, Theme, MovablePoint } from 'mafs';

export function renderBoundary(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_boundary 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  // 1. 상태 관리 설계 (sharedXByLog 구조 활용, Hook 사용 금지)
  const st = sharedXByLog?.[logIdx] || {};
  const thr = st.thr ?? 130;             // 탑승 기준 키 (기본값: 130cm)
  const inclusive = st.inclusive ?? true; // 경계 포함 여부 (기본값: true, 이상)

  // 부모 상태 갱신을 위한 헬퍼 함수
  const patchState = (updatedFields) => {
    setSharedXByLog?.(prev => ({
      ...prev,
      [logIdx]: {
        ...(prev?.[logIdx] || {}),
        ...updatedFields
      }
    }));
  };

  // 2. 시나리오 데이터 정의 (놀이공원 마법 열차를 기다리는 동물 친구들)
  const animals = [
    { id: 'rabbit', name: '토끼 🐰', height: 110 },
    { id: 'cat', name: '고양이 🐱', height: 120 },
    { id: 'bear', name: '곰 🐻', height: 130 },
    { id: 'lion', name: '사자 🦁', height: 140 },
    { id: 'tiger', name: '호랑이 🐯', height: 150 }
  ];

  const X_MIN = 100;
  const X_MAX = 160;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* Mafs 뷰 배경 투명화 CSS 강제 주입 */}
      <style>{`
        .mafs-gate-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [1단계] 상단 조작계: 스토리텔링 인터랙티브 레이아웃 */}
      <div className="viz-box" style={{ background: '#f0f9ff', borderRadius: '14px', padding: '14px', border: '2px solid #bae6fd' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#0369a1' }}>
          🎡 마법 열차 탑승 제한 게이트 (현재 기준: {thr}cm)
        </div>

        {/* 기준 키 설정 슬라이더 (정방향 조작축) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7' }}>기준 키 조절:</span>
          <input 
            type="range" 
            min={110} 
            max={150} 
            step={10} 
            value={thr}
            onChange={(e) => patchState({ thr: parseInt(e.target.value, 10) })} 
            style={{ width: '60%', cursor: 'pointer' }} 
          />
        </div>

        {/* 부등호 조건 토글 버튼 (이상 vs 초과) */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '14px' }}>
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
            {"기준 키 이상 (≤, 경계 포함)"}
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
            {"기준 키 초과 (<, 경계 제외)"}
          </button>
        </div>

        {/* 동물 대기열 실시간 통과/막힘 상태 보드 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {animals.map(animal => {
            const isBoundary = animal.height === thr;
            const isPassed = inclusive ? animal.height >= thr : animal.height > thr;
            
            return (
              <div 
                key={animal.id} 
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '8px', borderRadius: '10px', width: '65px',
                  background: isPassed ? '#e2fbe8' : '#e2e8f0',
                  border: isBoundary ? '3px solid #a855f7' : '1px solid #cbd5e1',
                  boxShadow: isBoundary ? '0 0 8px rgba(168, 85, 247, 0.4)' : 'none'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{animal.name}</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{animal.height}cm</span>
                <span style={{ 
                  fontSize: '11px', fontWeight: 'bold', 
                  color: isPassed ? '#15803d' : '#64748b' 
                }}>
                  {isPassed ? '🌸 탑승!' : '🥀 대기'}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: '11px', color: '#475569', textAlign: 'center', marginTop: '10px', lineHeight: '1.4' }}>
          ✨ 보라색 테두리는 현재 기준과 정확히 일치하는 <b>{"경계값 동물"}</b>입니다.
          <br />
          조건에 따라 경계값인 <b>{"곰 🐻(130cm)"}</b>이 통과(초록)하는지, 제외(회색)되는지 관찰해 보세요!
        </div>
      </div>

      {/* [2단계] 하단 결과 그래프: 1차원 수직선 좌표계 및 역방향 MovablePoint 연동 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px', textAlign: 'center' }}>
          📊 1차원 수직선 기하학 매핑 (좌우로 점을 드래그해 보세요!)
        </div>

        <div className="mafs-gate-container" style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <Mafs viewBox={{ x: [X_MIN - 5, X_MAX + 5], y: [-1, 1] }} preserveAspectRatio={false} height={100}>
            {/* 수직선 레이아웃 보존 */}
            <Coordinates.Cartesian yAxis={false} />

            {/* 조건 만족 영역을 수직선 상에 녹색 빔으로 표현 (가이드라인) */}
            <Line.Segment 
              point1={[inclusive ? thr : thr + 0.1, 0]} 
              point2={[X_MAX, 0]} 
              color={Theme.green} 
              weight={6} 
            />

            {/* 동물들의 키 위치 지시 마커 점들 */}
            {animals.map(a => (
              <Point key={a.id} x={a.height} y={0.2} color={Theme.blue} size={3} />
            ))}

            {/* 핵심: 역방향 인터랙션을 지원하는 자석 구속형 MovablePoint */}
            <MovablePoint 
              point={[thr, 0]} 
              color={Theme.red}
              constrain={(pos) => {
                // X축 범위를 제한하고 10cm 단위 그리드로 자석처럼 강제 구속(Snapping)
                const clampedX = Math.min(150, Math.max(110, pos[0]));
                const snappedX = Math.round(clampedX / 10) * 10;
                return [snappedX, 0];
              }}
              onMove={(pos) => patchState({ thr: pos[0] })}
            />

            {/* 시각적 정합성 룰: inclusive 여부에 따라 채운 점(이상)과 빈 점(초록/흰색 중첩으로 구현) 표현 */}
            {!inclusive && (
              <Point x={thr} y={0} color="#ffffff" size={4} />
            )}
          </Mafs>
        </div>

        <div style={{ fontSize: '12px', color: '#475569', textAlign: 'center', marginTop: '6px', fontWeight: '500' }}>
          {"수직선 끝점의 상태: "}
          <span style={{ color: inclusive ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
            {inclusive ? '● 채운 점 (경계값 포함, ≤)' : '○ 빈 점 (경계값 불포함, <)'}
          </span>
        </div>
      </div>

    </div>
  );
}