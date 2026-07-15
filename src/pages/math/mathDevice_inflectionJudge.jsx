import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Point, Text } from 'mafs';

export function renderInflectionJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v) return null;

  // t: 롤러코스터의 현재 위치 (x좌표, 범위 0.5 ~ 5.5, 기본값 2.0)
  const t = sharedXByLog?.[logIdx]?.t ?? 2.0;

  const setT = (val) => setSharedXByLog?.(prev => ({
    ...prev,
    [logIdx]: { ...(prev?.[logIdx] || {}), t: Math.min(5.5, Math.max(0.5, val)) }
  }));

  // 롤러코스터 궤도: f(x) = 0.05 * (x - 3)^3 + 1.5
  // 정확히 x = 3 일 때 변곡점(무중력 탈출)이 일어납니다.
  const f = (x) => 0.05 * Math.pow(x - 3, 3) + 1.5;
  const df = (x) => 0.15 * Math.pow(x - 3, 2); // 속도 (기울기 자)
  const d2f = (x) => 0.3 * (x - 3);          // 엉덩이가 느끼는 힘 (이계도함수)

  const currentY = f(t);
  const slope = df(t);
  const force = d2f(t);

  // 접선 자 (레일의 연장선)
  const getTangentY = (x, evalT) => {
    return df(evalT) * (x - evalT) + f(evalT);
  };

  // 초딩 눈높이 상황 분석
  let coasterText = '';
  let coasterBg = '';
  let coasterColor = '';
  let avatar = '🎢';

  if (force < -0.05) {
    coasterText = '🎈 [붕~ 무중력 구간] 언덕을 타고 넘어가요! 몸이 가벼워지고 엉덩이가 붕 뜹니다! (위로 볼록 ∩)';
    coasterBg = '#fef2f2';
    coasterColor = '#dc2626';
    avatar = '😱'; // 무서움
  } else if (Math.abs(force) <= 0.05) {
    coasterText = '🎯 [무중력 해제 지점!] 몸이 가볍지도 무겁지도 않은 순간! 레일이 똑바로 펴지는 "변곡점"입니다!';
    coasterBg = '#fef3c7';
    coasterColor = '#d97706';
    avatar = '🤩'; // 쾌감
  } else {
    coasterText = '🏋️ [꾹~ 중력 구간] 골짜기를 통과해요! 온몸이 아래로 무겁게 눌려요! (아래로 볼록 ∪)';
    coasterBg = '#eff6ff';
    coasterColor = '#1d4ed8';
    avatar = '🥴'; // 찌그러짐
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      <style>{`
        .mafs-slide-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [메인 시뮬레이터] */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
          🎢 <b>[롤러코스터 무중력 감지 카메라]</b>
        </div>
        
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '12px', lineHeight: '1.4' }}>
          <b>빨간 조종 핸들</b>을 잡고 롤러코스터를 움직여 보세요!<br />
          노란 점선 자가 레일 <b>위</b>에 얹히는지, <b>아래</b>를 받쳐주는지 눈으로 볼 수 있습니다.
        </div>

        <div className="mafs-slide-container" style={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: '10px', 
          background: '#0f172a', // 신나는 야간 놀이공원 테마
          border: '1px solid #334155'
        }}>
          <Mafs viewBox={{ x: [0, 6], y: [-0.5, 3.5] }} preserveAspectRatio={true} height={220}>
            {/* 롤러코스터 레일 */}
            <Plot.OfX y={f} color="#818cf8" weight={5} />

            {/* 접선 자 (레일의 쏠림선) */}
            <Plot.OfX y={(x) => getTangentY(x, t)} color="#fcd34d" weight={1.5} style="dashed" />

            {/* 변곡점 마킹 (가장 평평해지는 순간) */}
            <Point x={3.0} y={f(3.0)} color="#fb7185" size={6} />
            <Text x={3.0} y={f(3.0) - 0.35} size={12} hAlign="center" color="#fb7185">🎯 운명의 변곡점 (3초)</Text>

            {/* 현재 탑승한 롤러코스터 캐릭터 */}
            <Text x={t} y={currentY + 0.3} size={26} hAlign="center">{avatar}</Text>

            {/* 레일 위 조작 핸들 */}
            <MovablePoint
              point={[t, currentY]}
              color={Theme.red}
              constrain={(pos) => {
                const clampedX = Math.min(5.5, Math.max(0.5, pos[0]));
                return [clampedX, f(clampedX)];
              }}
              onMove={(pos) => setT(pos[0])}
            />
          </Mafs>
        </div>

        {/* 신나는 상태 알림판 */}
        <div style={{ 
          marginTop: '12px', 
          padding: '10px', 
          borderRadius: '8px', 
          background: coasterBg, 
          color: coasterColor, 
          fontSize: '13px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          lineHeight: '1.4',
          transition: 'all 0.15s ease'
        }}>
          {coasterText}
        </div>
      </div>

      {/* [하단 몸무게 변화 계기판] */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 내 엉덩이가 느끼는 <b>누르는 힘(중력의 변화)</b>
        </div>

        <div className="mafs-slide-container" style={{ borderRadius: '10px', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: [0, 6], y: [-1.2, 1.2] }} preserveAspectRatio={false} height={110}>
            {/* 기준선 0 (평소 몸무게 상태) */}
            <Plot.OfX y={() => 0} color="#94a3b8" weight={1} />
            
            {/* 누르는 힘 곡선 (우상향 일차함수선) */}
            <Plot.OfX y={d2f} color="#fb7185" weight={3} />

            {/* 3초 지점 가이드 점선 */}
            <Point x={3.0} y={0} color="#94a3b8" size={4} />

            {/* 현재 내 무게 센서 표시 */}
            <Point x={t} y={force} color="#10b981" size={6} />
          </Mafs>
        </div>

        {/* 직관적인 실시간 요약 수치 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '8px' }}>
          <span>⏱️ 통과 시간: <b>{t.toFixed(1)}초</b></span>
          <span style={{ color: force < 0 ? '#dc2626' : force > 0 ? '#1d4ed8' : '#b45309', fontWeight: 'bold' }}>
            🛰️ 체감 중력 상태: <b>{force < -0.05 ? '🎈 가뿐가뿐 (-)' : force > 0.05 ? '🏋️ 무거워짐 (+)' : '⚖️ 딱 좋아! (0)'}</b>
          </span>
        </div>
      </div>

    </div>
  );
}