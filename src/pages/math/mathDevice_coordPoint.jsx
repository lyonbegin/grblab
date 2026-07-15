// ===========================================================
// no:"8-1" "점 = 가로·세로 두 수" (방정식 해=교점의 선행개념)
//
// [핵심] 가로축(X)과 세로축(Y) 두 수가 만나 단 하나의 고유한 위치(보물)를 결정함.
//   - 규칙 준수 1: React Hooks를 일절 사용하지 않는 무상태 제로-훅 인터랙션 구조.
//   - 규칙 준수 2: 상단 보물지도 격자판과 하단 Mafs 좌표계의 MovablePoint 간 완벽한 양방향 연동.
//   - 규칙 준수 3: preserveAspectRatio={true}를 적용하여 좌표평면 격자가 납작해지지 않도록 정사각형 정합성 보존.
//   - 규칙 준수 4: JSX 내 특수문자 바인딩 안전성 확보.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint } from 'mafs';

export function renderCoordPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_coordPoint 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const GMAX = 6; // 격자 지도 범위 (0 ~ 6)

  // 1. 부모 상태 바인딩 (Zero-Hook 구조)
  const st = sharedXByLog?.[logIdx] || {};
  const gx = st.gx ?? 3;
  const gy = st.gy ?? 2;

  const patch = (p) => {
    setSharedXByLog?.(prev => ({
      ...prev,
      [logIdx]: {
        gx, gy,
        ...(prev?.[logIdx] || {}),
        ...p
      }
    }));
  };

  // 2. 상단 보물지도 격자판 SVG 좌표 연산
  const CELL = 34, PAD = 25;
  const W = PAD * 2 + GMAX * CELL;
  const H = PAD * 2 + GMAX * CELL;
  const sx = (x) => PAD + x * CELL;
  const sy = (y) => H - PAD - y * CELL; // Y축 반전 처리 (아래가 기준점 0)

  const gridLines = [];
  for (let i = 0; i <= GMAX; i++) {
    // 세로 격자선
    gridLines.push(<line key={`v${i}`} x1={sx(i)} y1={sy(0)} x2={sx(i)} y2={sy(GMAX)} stroke="#e2e8f0" strokeWidth="1" />);
    // 가로 격자선
    gridLines.push(<line key={`h${i}`} x1={sx(0)} y1={sy(i)} x2={sx(GMAX)} y2={sy(i)} stroke="#e2e8f0" strokeWidth="1" />);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* [1단계] 상단 조작계 & 보물지도 아날로그 패널 */}
      <div className="viz-box" style={{ background: '#fefcf8', borderRadius: '14px', padding: '16px', border: '2px solid #f3eae0' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#451a03' }}>
          🏴‍☠️ 비밀 섬의 보물지도 탐험
        </div>
        
        <div style={{ fontSize: '12px', color: '#78716c', textAlign: 'center', marginBottom: '12px' }}>
          기준점(0,0)에서 출발하여 <b>동쪽과 북쪽으로 몇 걸음</b>을 가야 보물이 나올까요?
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '14px' }}>
          {/* 가로 슬라이더 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309' }}>동쪽으로 (가로축)</span>
            <input 
              type="range" min={0} max={GMAX} step={1} value={gx}
              onChange={(e) => patch({ gx: parseInt(e.target.value, 10) })} 
              style={{ width: '120px', cursor: 'pointer' }} 
          />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#d97706' }}>{gx} 걸음</div>
          </div>

          {/* 세로 슬라이더 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8' }}>북쪽으로 (세로축)</span>
            <input 
              type="range" min={0} max={GMAX} step={1} value={gy}
              onChange={(e) => patch({ gy: parseInt(e.target.value, 10) })} 
              style={{ width: '120px', cursor: 'pointer' }} 
            />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb' }}>{gy} 걸음</div>
          </div>
        </div>

        {/* 보물지도 격자 맵 SVG */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto', background: '#fafaf9', borderRadius: '10px', border: '1px solid #e7e5e4' }}>
          {gridLines}
          
          {/* 동쪽(가로), 북쪽(세로) 추적 점선 유도선 */}
          <line x1={sx(0)} y1={sy(gy)} x2={sx(gx)} y2={sy(gy)} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={sx(gx)} y1={sy(0)} x2={sx(gx)} y2={sy(gy)} stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 3" />
          
          {/* 출발 기준점 마커 (야자수 심볼 대용) */}
          <circle cx={sx(0)} cy={sy(0)} r="5" fill="#16a34a" />
          <text x={sx(0)} y={sy(0) + 16} fontSize="9" textAnchor="middle" fontWeight="bold" fill="#16a34a">기준점</text>

          {/* 보물이 숨겨진 유일한 약속 장소 마커 */}
          <circle cx={sx(gx)} cy={sy(gy)} r="7" fill="#dc2626" />
          <text x={sx(gx)} y={sy(gy) - 12} fontSize="14" textAnchor="middle">🎁</text>
        </svg>

        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginTop: '12px' }}>
          지정된 보물의 주소: <span style={{ color: '#dc2626', fontSize: '15px' }}>({gx}, {gy})</span>
        </div>
      </div>

      {/* [2단계] 하단 그래프: 데카르트 직교좌표평면 (완벽한 양방향 동기화) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          
          {/* preserveAspectRatio={true}로 축 스케일을 일치시켜 완벽한 정사각형 수학 격자 유지 */}
          <Mafs viewBox={{ x: [-1, GMAX + 1], y: [-1, GMAX + 1] }} preserveAspectRatio={true} height={260}>
            <Coordinates.Cartesian />
            
            {/* 좌표평면 위에서 마우스로 직접 보물 위치를 바꿀 수 있는 격자 스냅형 MovablePoint */}
            <MovablePoint
              point={[gx, gy]}
              color={Theme.red}
              constrain={(pos) => [
                Math.min(GMAX, Math.max(0, Math.round(pos[0]))),
                Math.min(GMAX, Math.max(0, Math.round(pos[1])))
              ]}
              onMove={(pos) => patch({
                gx: Math.min(GMAX, Math.max(0, Math.round(pos[0]))),
                gy: Math.min(GMAX, Math.max(0, Math.round(pos[1])))
              })}
            />
          </Mafs>

        </div>

        <div style={{ fontSize: '12px', color: '#475569', textAlign: 'center', marginTop: '8px', lineHeight: '1.4' }}>
          아날로그 보물지도의 위치와 수학적 좌표평면 위의 점은 <b>{"정확히 일치하는 구조"}</b>입니다.
          <br />
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            {"좌표평면의 빨간 점을 드래그하면 상단의 보물상자 아이콘과 걸음수 슬라이더가 동기화되어 움직입니다."}
          </span>
        </div>
      </div>

    </div>
  );
}