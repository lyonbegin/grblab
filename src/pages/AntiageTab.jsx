import React, { useState, useEffect } from 'react';
import { GOALS_DATA, BOOKS_DATA } from './constants';


export default function SceneGeneratorEngine() {
  const GEMINI_API_KEY = "AQ.Ab8RN6JzbpV_y9aVsJdMTJoCzEJhP3CLMC0myUIuFFmKlfCK_Q";

  // UI 상태 관리
  const [view, setView] = useState('setup');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [availableBooks, setAvailableBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  // 국어, 영어, 수학 목표 및 난이도 선택 상태
  const [goals, setGoals] = useState({ kor: 0, eng: 0, math: 0 });
  const [levels, setLevels] = useState({ kor: 1, eng: 1, math: 1 });

  // 이야기 진행 상태
  const [currentTrack, setCurrentTrack] = useState('kor');
  const [storyLogs, setStoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 초기화 및 드롭다운 바인딩
  useEffect(() => {
    const uniqueAreas = Array.from(new Set(BOOKS_DATA.map(b => b.area)));
    setAreas(uniqueAreas);
    if (uniqueAreas.length > 0) {
      handleAreaChange(uniqueAreas[0]);
    }

    setGoals({
      kor: GOALS_DATA.kor[0] ? 0 : 0,
      eng: GOALS_DATA.eng[0] ? 0 : 0,
      math: GOALS_DATA.math[0] ? 0 : 0
    });
  }, []);

  const handleAreaChange = (area) => {
    setSelectedArea(area);
    const filteredChapters = BOOKS_DATA.filter(b => b.area === area);
    setChapters(filteredChapters);
    if (filteredChapters.length > 0) {
      handleChapterChange(filteredChapters[0].chapter, filteredChapters);
    }
  };

  const handleChapterChange = (chapterName, currentChapters = chapters) => {
    setSelectedChapter(chapterName);
    const bookInfo = currentChapters.find(b => b.chapter === chapterName);
    if (bookInfo) {
      const cards = [];
      if (bookInfo.intro) cards.push({ type: '입문', title: bookInfo.intro });
      if (bookInfo.main) cards.push({ type: '대표', title: bookInfo.main });
      if (bookInfo.deep) cards.push({ type: '심화', title: bookInfo.deep });
      setAvailableBooks(cards);
      setSelectedBook(cards[0] || null);
    } else {
      setAvailableBooks([]);
      setSelectedBook(null);
    }
  };
const callGeminiAPI = async (prompt) => {
  // 타겟 URL 변경: 브라우저는 Nginx 서버로 요청을 전송하며, Nginx가 Google로 라우팅
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!response.ok) {
      let detailedError = "";
      try {
        const errorJson = await response.json();
        console.error("구글 API 반환 상세 에러 정보:", errorJson);
        detailedError = JSON.stringify(errorJson, null, 2);
      } catch (e) {
        detailedError = await response.text().catch(() => "알 수 없는 에러 본문");
      }
      
      throw new Error(`\n========================================\nAPI 요청 실패 (HTTP ${response.status})\n----------------------------------------\n${detailedError}\n========================================`);
    }
    
    // 정상적으로 응답을 받았을 때의 처리
    const data = await response.json();
    
    // [디버그 수집] 구글에서 리턴된 데이터 전체 구조를 콘솔에 보기 좋게 출력합니다.
    console.log("========================================");
    console.log("Gemini API 수신 성공 (전체 Response 구조):");
    console.log(JSON.stringify(data, null, 2));
    console.log("========================================");
    
    // 최종 텍스트 추출 검증 및 리턴
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const resultText = data.candidates[0].content.parts[0].text;
      
      // 추출된 텍스트만 별도로 깔끔하게 확인하기 위한 로그
      console.log("추출된 최종 답변 내용:\n", resultText);
      
      return resultText;
    } else {
      throw new Error("API 응답 성공했으나, 텍스트 데이터(candidates) 구조가 올바르지 않습니다.");
    }

  } catch (error) {
    console.error("통신 에러 발생:", error);
    throw error;
  }
};
  const startScene = async () => {
    setErrorMsg('');
    if (!selectedBook) {
      setErrorMsg('세계관의 기반이 될 책을 선택해주세요.');
      return;
    }

    setView('stage');
    setLoading(true);
    setStoryLogs([]);
    setCurrentTrack('kor');

    const korGoal = GOALS_DATA.kor[goals.kor];

    const initialPrompt = `
      너는 교육용 인터랙티브 스토리텔링 엔진이다.
      기반 세계관 도서: "${selectedBook.title}" (${selectedBook.type} 과정)
      교과 단원: [${selectedArea}] ${selectedChapter}
      
      첫 번째 트랙인 [국어] 단계를 시작해라.
      국어 목표: ${korGoal.title} (${korGoal.content}) - 난이도 레벨 ${levels.kor}
      
      이 세계관 안에서 사건의 발단을 제시하고, 학습자가 국어 지식을 활용하여 해결해야 하는 상황을 3지선다형 선택지와 함께 생성해라.
      출력 형식은 반드시 아래 형식을 엄밀하게 유지해라. JSON 포맷이 아닌 텍스트로 줄 것:
      
      [스토리] 여기에 흥미진진한 이야기 서술...
      [선택지1] 오답 선택지 1
      [선택지2] 정답 선택지 (해결로 직행하는 논리적 정답)
      [선택지3] 오답 선택지 2
      [정답번호] 2
    `;

    try {
      const text = await callGeminiAPI(initialPrompt);
      parseAndAppendLog(text, 'kor');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceIdx, correctIdx) => {
    // 사용자가 고른 답안 인덱스를 이전 상태 로그에 업데이트하여 바인딩 유지
    setStoryLogs(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].selectedChoice = choiceIdx;
      }
      return updated;
    });

    setLoading(true);
    setErrorMsg('');

    const isCorrect = choiceIdx === correctIdx;
    let nextTrackName = '';
    let nextPrompt = '';

    const engGoal = GOALS_DATA.eng[goals.eng];
    const mathGoal = GOALS_DATA.math[goals.math];

    if (currentTrack === 'kor') {
      nextTrackName = 'eng';
      setCurrentTrack('eng');
      nextPrompt = `
        이전 [국어] 선택에서 학습자는 ${isCorrect ? '정답' : '오답'}을 골랐다. 이에 따른 유기적인 결과 스토리를 이어가라.
        이어서 두 번째 트랙인 [영어] 단계를 진행해라.
        영어 목표: ${engGoal.title} (${engGoal.content}) - 난이도 레벨 ${levels.eng}
        
        스토리를 심화시키고 영어 개념과 결합된 위기 상황을 제시하여 3지선다형 선택지와 정답 번호를 생성해라.
        형식은 이전과 동일하게 [스토리], [선택지1], [선택지2], [선택지3], [정답번호] 태그를 붙여라.
      `;
    } else if (currentTrack === 'eng') {
      nextTrackName = 'math';
      setCurrentTrack('math');
      nextPrompt = `
        이전 [영어] 선택에서 학습자는 ${isCorrect ? '정답' : '오답'}을 골랐다. 이에 따른 유기적인 결과 스토리를 이어가라.
        이어서 세 번째 트랙인 [수학] 단계를 진행해라.
        수학 목표: ${mathGoal.title} (${mathGoal.trend || ''}) - 난이도 레벨 ${levels.math}
        
        스토리를 절정으로 이끌고 수학 개념과 결합된 최종 수수께끼나 계산 상황을 제시하여 3지선다형 선택지와 정답 번호를 생성해라.
        형식은 이전과 동일하게 [스토리], [선택지1], [선택지2], [선택지3], [정답번호] 태그를 붙여라.
      `;
    } else {
      nextTrackName = 'end';
      setCurrentTrack('end');
      nextPrompt = `
        이전 [수학] 선택에서 학습자는 ${isCorrect ? '정답' : '오답'}을 골랐다.
        모든 융합 트랙이 종료되었으므로, 이 세계관과 네 가지 트랙(단원 개념, 국어, 영어, 수학)이 멋지게 마무리되는 최종 결말 스토리와 에필로그를 작성해라.
        결말이므로 선택지는 필요 없다. [스토리] 태그만 사용해라.
      `;
    }

    try {
      const text = await callGeminiAPI(nextPrompt);
      parseAndAppendLog(text, nextTrackName);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseAndAppendLog = (text, track) => {
    const lines = text.split('\n');
    let story = '';
    let choices = [];
    let correctIdx = 1;

    lines.forEach(line => {
      if (line.startsWith('[스토리]')) {
        story = line.replace('[스토리]', '').trim();
      } else if (line.startsWith('[선택지1]')) {
        choices.push(line.replace('[선택지1]', '').trim());
      } else if (line.startsWith('[선택지2]')) {
        choices.push(line.replace('[선택지2]', '').trim());
      } else if (line.startsWith('[선택지3]')) {
        choices.push(line.replace('[선택지3]', '').trim());
      } else if (line.startsWith('[정답번호]')) {
        correctIdx = parseInt(line.replace('[정답번호]', '').trim(), 10);
      }
    });

    setStoryLogs(prev => [...prev, { track, story, choices, correctIdx, selectedChoice: null }]);
  };

  return (
    <div className="wrap">
      {view === 'setup' && (
        <div id="setup">
          <h1>장면 생성 엔진 프로토타입</h1>
          <p className="sub">교과 챕터를 고르면 그 챕터의 핵심 개념을 뿌리로 한 세계관이 자동 구성됩니다. 국영수 목표 3개를 더하면, 하나의 사건 속에서 네 트랙이 얽히는 장면이 생성됩니다.</p>

          <label>영역</label>
          <select value={selectedArea} onChange={(e) => handleAreaChange(e.target.value)}>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <label>학습 챕터 (교과 단원)</label>
          <select value={selectedChapter} onChange={(e) => handleChapterChange(e.target.value)}>
            {chapters.map((c, idx) => <option key={idx} value={c.chapter}>{c.chapter}</option>)}
          </select>

          <label>세계관의 기반이 될 책 (하나 선택)</label>
          <div className="book-cards">
            {availableBooks.map((b, idx) => (
              <button
                key={idx}
                type="button"
                className={`book-card ${selectedBook?.title === b.title ? 'selected' : ''}`}
                onClick={() => setSelectedBook(b)}
              >
                <span className="tier">{b.type}</span>
                <span className="book-title">{b.title}</span>
              </button>
            ))}
          </div>

          {/* 국어 목표선택 행 */}
          <div className="goal-row" style={{ marginTop: '20px' }}>
            <div className="goal-tag tag-kor">국어</div>
            <div>
              <select value={goals.kor} onChange={(e) => setGoals({ ...goals, kor: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.kor.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">{GOALS_DATA.kor[goals.kor]?.content}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`level-btn ${levels.kor === v ? 'selected' : ''}`}
                      onClick={() => setLevels({ ...levels, kor: v })}
                    >{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 영어 목표선택 행 */}
          <div className="goal-row">
            <div className="goal-tag tag-eng">영어</div>
            <div>
              <select value={goals.eng} onChange={(e) => setGoals({ ...goals, eng: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.eng.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">{GOALS_DATA.eng[goals.eng]?.content}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`level-btn ${levels.eng === v ? 'selected' : ''}`}
                      onClick={() => setLevels({ ...levels, eng: v })}
                    >{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 수학 목표선택 행 */}
          <div className="goal-row">
            <div className="goal-tag tag-math">수학</div>
            <div>
              <select value={goals.math} onChange={(e) => setGoals({ ...goals, math: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.math.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">{GOALS_DATA.math[goals.math]?.trend}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`level-btn ${levels.math === v ? 'selected' : ''}`}
                      onClick={() => setLevels({ ...levels, math: v })}
                    >{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button className="primary" onClick={startScene} disabled={loading}>장면 시작</button>
          {errorMsg && <div className="err">{errorMsg}</div>}
        </div>
      )}

      {view === 'stage' && (
        <div id="stage" style={{ display: 'block' }}>
          <h1>장면 진행 중</h1>
          <div className="progress">
            <div className={`pill ${currentTrack === 'kor' ? 'active' : 'done'}`}>국어</div>
            <div className={`pill ${currentTrack === 'eng' ? 'active' : currentTrack === 'math' || currentTrack === 'end' ? 'done' : ''}`}>영어</div>
            <div className={`pill ${currentTrack === 'math' ? 'active' : currentTrack === 'end' ? 'done' : ''}`}>수학</div>
          </div>

          <div id="storyLog">
            {storyLogs.map((log, logIdx) => (
              <div key={logIdx} className="story-card">
                <div className="debug-strip"><b>트랙:</b> {log.track.toUpperCase()}</div>
                <p>{log.story}</p>
                {log.choices.length > 0 && (
                  <div className="choices">
                    {log.choices.map((choice, cIdx) => {
                      const choiceNum = cIdx + 1;
                      // 사용자가 이미 선택한 버튼이거나, 이 카드가 가장 마지막 카드가 아닐 때 비활성화 처리
                      const isSelected = log.selectedChoice === choiceNum;
                      const hasSelectedAny = log.selectedChoice !== null;

                      return (
                        <button
                          key={cIdx}
                          className={`choice-btn ${isSelected ? 'selected-answer' : ''}`}
                          disabled={hasSelectedAny}
                          onClick={() => handleChoice(choiceNum, log.correctIdx)}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                )}
                {log.track === 'end' && <div className="scene-end">모든 시나리오가 성공적으로 종료되었습니다.</div>}
              </div>
            ))}
          </div>

          {loading && <div className="loading">이야기를 쓰는 중...</div>}
          {errorMsg && <div className="err">{errorMsg}</div>}
        </div>
      )}
    </div>
  );
}