// ===========================================================
// no:"9-1" "대소 — 어느 쪽이 큰가" (부등식=위/아래의 선행개념)
//
// [핵심] 두 수는 크거나, 작거나, 같다 — 수직선 위의 오른쪽이 더 큰 값.
//   - 규칙 준수 1: React Hooks (useState, useEffect)를 절대 사용하지 않는 Zero-Hook 구조.
//   - 규칙 준수 2: 상단 양팔 저울 조작계와 하단 Mafs 수직선 위 점들이 완전히 연동되는 양방향 인터랙션.
//   - 규칙 준수 3: preserveAspectRatio={true} 적용으로 수직선의 스케일 왜곡 방지.
//   - 규칙 준수 4: 선형 스케일(기울기 및 높이)을 적용하여 원 면적 증가로 인한 시각적 왜곡 해결.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint } from 'mafs';

export function renderCompare(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_compare 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  // 1. 상태 관리 및 기본값 세팅 (Hook 절대 금지)
  const st = sharedXByLog?.[logIdx] || {};
  const a = st.a ?? 3;
  const b = st.b ?? 5;

  const patch = (p) => {
    setSharedXByLog?.(prev => ({
      ...prev,
      [logIdx]: {
        a, b,
        ...(prev?.[logIdx] || {}),
        ...p
      }
    }));
  };

  // 2. 대소 비교 및 시각 피드백 연산 (양팔 저울 시나리오)
  const bigger = a > b ? 'A' : b > a ? 'B' : '같음';
  const relColor = a > b ? '#0284c7' : b > a ? '#ea580c' : '#7c3aed';
  
  // 저울 기울기 및 높이 계산 (최대 20픽셀까지 기우뚱)
  const maxTilt = 20;
  const tilt = Math.max(-maxTilt, Math.min(maxTilt, (a - b) * 3.5));
  
  const W = 240, H = 140;
  const cx = W / 2; // 저울 중심 X (120)
  const cy = 60;    // 저울 중심 Y

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* [1단계] 상단 조작계 & 마법 양팔 저울 패널 */}
      <div className="viz-box" style={{ background: '#fefcf8', borderRadius: '14px', padding: '16px', border: '2px solid #f3eae0' }}>
        <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#451a03' }}>
          ⚖️ 마법의 양팔 저울 (더 무거운 쪽으로 기우는 저울)
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '14px' }}>
          {/* 보석 상자 A 슬라이더 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1' }}>상자 A (보석 개수)</span>
            <input 
              type="range" min={0} max={10} step={1} value={a}
              onChange={(e) => patch({ a: parseInt(e.target.value, 10) })} 
              style={{ width: '110px', cursor: 'pointer' }} 
            />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0284c7' }}>A = {a}개</div>
          </div>
          
          {/* 보석 상자 B 슬라이더 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#c2410c' }}>상자 B (보석 개수)</span>
            <input 
              type="range" min={0} max={10} step={1} value={b}
              onChange={(e) => patch({ b: parseInt(e.target.value, 10) })} 
              style={{ width: '110px', cursor: 'pointer' }} 
            />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ea580c' }}>B = {b}개</div>
          </div>
        </div>

        {/* 양팔 저울 SVG 시각화 (선형 기울기 매커니즘) */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          {/* 저울 받침대 및 기둥 */}
          <line x1={cx} y1={cy} x2={cx} y2={115} stroke="#78716c" strokeWidth="4" strokeLinecap="round" />
          <path d={`M ${cx - 25} 115 L ${cx + 25} 115`} stroke="#78716c" strokeWidth="6" strokeLinecap="round" />
          
          {/* 저울 중심 회전축 회전 점 */}
          <circle cx={cx} cy={cy} r="4" fill="#44403c" />

          {/* 움직이는 저울 대들보 */}
          <line x1={cx - 60} y1={cy + tilt} x2={cx + 60} y2={cy - tilt} stroke="#451a03" strokeWidth="4" strokeLinecap="round" />

          {/* 왼쪽 줄 & 접시 A (값 A에 비례) */}
          <line x1={cx - 60} y1={cy + tilt} x2={cx - 60} y2={cy + tilt + 25} stroke="#94a3b8" strokeWidth="1.5" />
          <path d={`M ${cx - 75} ${cy + tilt + 25} Q ${cx - 60} ${cy + tilt + 38} ${cx - 45} ${cy + tilt + 25}`} fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          <text x={cx - 60} y={cy + tilt + 20} fontSize="11" fontWeight="bold" textAnchor="middle" fill="#0369a1">A</text>

          {/* 오른쪽 줄 & 접시 B (값 B에 비례) */}
          <line x1={cx + 60} y1={cy - tilt} x2={cx + 60} y2={cy - tilt + 25} stroke="#94a3b8" strokeWidth="1.5" />
          <path d={`M ${cx + 45} ${cy - tilt + 25} Q ${cx + 60} ${cy - tilt + 38} ${cx + 75} ${cy - tilt + 25}`} fill="#ffedd5" stroke="#ea580c" strokeWidth="2" />
          <text x={cx + 60} y={cy - tilt + 20} fontSize="11" fontWeight="bold" textAnchor="middle" fill="#c2410c">B</text>
        </svg>

        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: relColor, marginTop: '12px' }}>
          {bigger === '같음' ? '⚖️ 두 상자의 무게가 똑같아 수평을 이룹니다 (A = B)' : `✨ 상자 ${bigger}가 더 무거워 아래로 내려앉았습니다 (${bigger === 'A' ? 'A > B' : 'A < B'})`}
        </div>
      </div>

      {/* [2단계] 하단 그래프: 수직선 기하 공간 (완벽한 양방향 인터랙션) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '4px' }}>
          
          {/* Y축을 숨기고 1차원 수직선의 본질에 집중, 눈금 왜곡 방지 */}
          <Mafs viewBox={{ x: [-1, 11], y: [-1, 1] }} preserveAspectRatio={true} height={90}>
            <Coordinates.Cartesian yAxis={{ lines: false, labels: false }} />
            
            {/* 상자 A를 표현하는 파란색 MovablePoint (정수 그리드 스냅) */}
            <MovablePoint
              point={[a, 0]}
              color={Theme.blue}
              constrain={(pos) => [Math.min(10, Math.max(0, Math.round(pos[0]))), 0]}
              onMove={(pos) => patch({ a: Math.min(10, Math.max(0, Math.round(pos[0]))) })}
            />

            {/* 상자 B를 표현하는 주황색 MovablePoint (정수 그리드 스냅) */}
            <MovablePoint
              point={[b, 0]}
              color={Theme.orange}
              constrain={(pos) => [Math.min(10, Math.max(0, Math.round(pos[0]))), 0]}
              onMove={(pos) => patch({ b: Math.min(10, Math.max(0, Math.round(pos[0]))) })}
            />
          </Mafs>

        </div>

        <div style={{ fontSize: '12px', color: '#475569', textAlign: 'center', marginTop: '10px', lineHeight: '1.4' }}>
          수직선 나라에서는 <b>{"오른쪽에 놓인 숫자가 무조건 더 큰 수"}</b>입니다.
          <br />
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            {"수직선 위의 파란 점(A)과 주황 점(B)을 직접 드래그하면 상단 저울이 실시간으로 춤추듯 반응합니다."}
          </span>
        </div>
      </div>

    </div>
  );
}