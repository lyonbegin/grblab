import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint, Line, Point, Text, Plot } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderCoordPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const GMAX = 6; // 격자 지도 최대 범위 (0 ~ 6)
  const targetX = 4; // 숨겨진 유령 잠수함의 X 주소
  const targetY = 3; // 숨겨진 유령 잠수함의 Y 주소

  // 1. 부모 상태 바인딩 (Zero-Hook 구조 철저 준수)
  const st = sharedXByLog?.[logIdx] || {};
  const gx = st.gx ?? 2; // 초기 가로 걸음수
  const gy = st.gy ?? 1; // 초기 세로 걸음수

  const patchState = (updatedFields) => {
    setSharedXByLog?.(prev => ({
      ...prev,
      [logIdx]: {
        ...(prev?.[logIdx] || {}),
        ...updatedFields
      }
    }));
  };

  // 두 레이저가 정확히 충돌했는지 판별
  const isFound = gx === targetX && gy === targetY;

  // 실시간 락온 상태 피드백 메시지 데이터
  let statusText = "📡 레이저 가동 중... 두 스캐너의 교차점을 밀어 안개 속 잠수함을 포획하세요!";
  let statusBg = "#f8fafc";
  let statusColor = "#64748b";

  if (isFound) {
    statusText = "💥 타깃 락온! 유령 잠수함(🚢)을 완벽하게 포획했습니다!!!";
    statusBg = "#dcfce7";
    statusColor = "#15803d";
  } else if (gx === targetX || gy === targetY) {
    statusText = "⚠️ 레이저 하나가 잠수함의 실루엣을 스쳤습니다! 교차점을 더 좁히세요!";
    statusBg = "#fef3c7";
    statusColor = "#b45309";
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* Mafs 고유의 어두운 다크 배경을 투명하게 날려버리는 스타일 오버라이드 */}
      <style>{`
        .mafs-radar-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [1단계] 상단 조작계: 레이저 스캔 제어 콘솔 (화사한 기지 센터 테마) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
          🛰️ <b>[1단계: 레이저 스캔 공간]</b> 두 조건의 교차 지점 탐색
        </div>

        {/* 정방향 제어를 위한 가로·세로 아날로그 슬라이더 세트 */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ea580c' }}>동쪽 스캔선 (X축)</span>
            <input 
              type="range" min={0} max={GMAX} step={1} value={gx}
              onChange={(e) => patchState({ gx: parseInt(e.target.value, 10) })}
              style={{ width: '110px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ea580c' }}>{gx} 칸 이동</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb' }}>북쪽 스캔선 (Y축)</span>
            <input 
              type="range" min={0} max={GMAX} step={1} value={gy}
              onChange={(e) => patchState({ gy: parseInt(e.target.value, 10) })}
              style={{ width: '110px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}>{gy} 칸 이동</span>
          </div>
        </div>

        {/* 🌊 초록빛 레이더 바다 시뮬레이션 판넬 (Mafs 컴포넌트로 정밀 렌더링) */}
        <div className="mafs-radar-container" style={{ background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: [-0.5, GMAX + 0.5], y: [-0.5, GMAX + 0.5] }} preserveAspectRatio={true} height={180}>
            
            {/* 레이더 느낌을 내는 동심원 눈금선들 */}
            {[1.5, 3.5, 5.5].map(r => (
              <Plot.OfX key={r} y={(x) => {
                const val = r*r - (x-3)*(x-3);
                return val >= 0 ? 3 + Math.sqrt(val) : NaN;
              }} color="#a7f3d0" weight={1} style="dashed" />
            ))}
            {[1.5, 3.5, 5.5].map(r => (
              <Plot.OfX key={r} y={(x) => {
                const val = r*r - (x-3)*(x-3);
                return val >= 0 ? 3 - Math.sqrt(val) : NaN;
              }} color="#a7f3d0" weight={1} style="dashed" />
            ))}

            {/* 바다를 실시간으로 가르는 오렌지(X)와 파랑(Y) 레이저 장벽 */}
            <Line.Segment point1={[gx, -0.5]} point2={[gx, GMAX + 0.5]} color="#f97316" weight={3} />
            <Line.Segment point1={[-0.5, gy]} point2={[GMAX + 0.5, gy]} color="#3b82f6" weight={3} />

            {/* 출발 기준 앵커링 포인트 */}
            <Point x={0} y={0} color="#10b981" size={5} />
            <Text x={0} y={0.3} size={10} color="#047857" weight="bold">시작점(0,0)</Text>

            {/* 💥 조건이 동시에 만족했을 때만 모습을 드러내는 숨겨진 잠수함 락온 시스템 */}
            {isFound ? (
              <Text x={targetX} y={targetY} size={32}>🚢</Text>
            ) : (
              <Text x={gx} y={gy} size={16}>📡</Text>
            )}
          </Mafs>
        </div>

        {/* 실시간 매핑 상태 브리핑 알림창 */}
        <div style={{ 
          marginTop: '8px', padding: '8px', borderRadius: '8px', 
          background: statusBg, color: statusColor, fontSize: '12px', 
          fontWeight: 'bold', textAlign: 'center', transition: 'all 0.2s ease' 
        }}>
          {statusText}
        </div>
      </div>

      {/* [2단계] 하단 그래프: 완벽한 양방향 연동을 지원하는 데카르트 직교좌표평면 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
          📊 <b>[2단계: 수학 좌표평면 그래프]</b> 빨간 점을 마우스로 자유롭게 밀어보세요!
        </div>

        <div className="mafs-radar-container" style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* preserveAspectRatio={true} 고정으로 X와 Y축 배율이 같은 완벽한 정사각형 수학 모눈종이 보존 */}
          <Mafs viewBox={{ x: [-1, GMAX + 1], y: [-1, GMAX + 1] }} preserveAspectRatio={true} height={240}>
            <Coordinates.Cartesian />

            {/* 움직이는 빨간 점과 축 숫자를 다이렉트로 결합해주는 실시간 직교 유도선 빔 */}
            <Line.Segment point1={[gx, 0]} point2={[gx, gy]} color="#f97316" style="dashed" weight={2} />
            <Line.Segment point1={[0, gy]} point2={[gx, gy]} color="#3b82f6" style="dashed" weight={2} />

            {/* 격자 위에 손가락으로 드래그하면 정수 칸으로 챡챡 들러붙는 자석 구속형 조종 점 */}
            <MovablePoint 
              point={[gx, gy]}
              color={Theme.red}
              constrain={(pos) => [
                Math.min(GMAX, Math.max(0, Math.round(pos[0]))),
                Math.min(GMAX, Math.max(0, Math.round(pos[1])))
              ]}
              onMove={(pos) => patchState({
                gx: Math.min(GMAX, Math.max(0, Math.round(pos[0]))),
                gy: Math.min(GMAX, Math.max(0, Math.round(pos[1])))
              })}
            />
          </Mafs>
        </div>

        {/* 훗날 배우게 될 연립방정식 해의 기초가 되는 순서쌍 텍스트 매핑 스코어보드 */}
        <div style={{ 
          display: 'flex', justifyContent: 'center', gap: '4px', 
          background: '#f1f5f9', padding: '6px', borderRadius: '8px', 
          fontSize: '13px', fontWeight: 'bold', color: '#334155', marginTop: '6px' 
        }}>
          두 스캔 조건이 교차하는 유일한 주소: <span style={{ color: '#ef4444', marginLeft: '4px' }}>({gx}, {gy})</span>
        </div>
      </div>

    </div>
  );
}