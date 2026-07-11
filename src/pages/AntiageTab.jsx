import React, { useState, useEffect, useRef } from 'react';
import { GOALS_DATA, BOOKS_DATA ,SYSTEM_PROMPT } from './constants';

export default function SceneGeneratorEngine() {
  const GEMINI_API_KEY = "AQ.Ab8RN6JzbpV_y9aVsJdMTJoCzEJhP3CLMC0myUIuFFmKlfCK_Q";

  

  // ===========================================================
  // UI 상태
  // ===========================================================
  const [view, setView] = useState('setup');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [availableBooks, setAvailableBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  const [goals, setGoals] = useState({ kor: 0, eng: 0, math: 0 });
  const [levels, setLevels] = useState({ kor: 3, eng: 3, math: 3 });

  // 장면 진행 상태 (기존의 currentTrack 단일 값 대신, 엔진이 실제로 반환하는 트랙별 상태를 그대로 보관)
  const [trackStatus, setTrackStatus] = useState({ korean: '미시작', english: '미시작', math: '미시작' });
  const [trackTurnCounts, setTrackTurnCounts] = useState({ korean: 0, english: 0, math: 0 });
  const [storyLogs, setStoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 대화 히스토리(messages)와 장면 고정 정보는 렌더링과 무관하므로 ref로 관리해
  // 비동기 호출 중 setState 타이밍 문제로 맥락이 끊기는 것을 방지한다.
  const messagesRef = useRef([]);
  const sceneInfoRef = useRef({
    chapterArea: '', chapterGrade: '', chapterTitle: '',
    selectedBookText: '', selectedTierLabel: '', goalTexts: { kor: '', eng: '', math: '' }
  });
  // 최신 trackStatus/trackTurnCounts를 비동기 콜백 안에서도 정확히 참조하기 위한 ref
  const trackStatusRef = useRef(trackStatus);
  const trackTurnCountsRef = useRef(trackTurnCounts);
  useEffect(() => { trackStatusRef.current = trackStatus; }, [trackStatus]);
  useEffect(() => { trackTurnCountsRef.current = trackTurnCounts; }, [trackTurnCounts]);

  useEffect(() => {
    const uniqueAreas = Array.from(new Set(BOOKS_DATA.map(b => b.area)));
    setAreas(uniqueAreas);
    if (uniqueAreas.length > 0) {
      handleAreaChange(uniqueAreas[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAreaChange = (area) => {
    setSelectedArea(area);
    const filteredChapters = BOOKS_DATA.filter(b => b.area === area);
    setChapters(filteredChapters);
    if (filteredChapters.length > 0) {
      handleChapterChange(filteredChapters[0].chapter, filteredChapters);
    } else {
      setAvailableBooks([]);
      setSelectedBook(null);
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
      setSelectedBook(cards.find(c => c.type === '대표') || cards[0] || null);
    } else {
      setAvailableBooks([]);
      setSelectedBook(null);
    }
  };

  // ===========================================================
  // 목표 텍스트 헬퍼 (원본 엔진과 동일한 상세 서술 생성)
  // ===========================================================
  function goalFullText(subject, item) {
    if (!item) return '';
    if (subject === 'math') {
      return `${item.title} (${item.part || ''} ${item.category || ''}, 난이도 ${item.difficulty || ''}) — 출제 경향: ${item.trend || ''}`;
    }
    return `${item.title} (${item.major || ''} ${item.mid || ''}, 권장학습단계 ${item.stage || ''}, 중요도 ${item.importance || ''}) — ${item.content || ''}`;
  }

  // ===========================================================
  // 메시지 윈도잉 (컨텍스트 무한 증가 방지)
  // ===========================================================
  const MAX_RECENT_MESSAGES = 12;
  function getMessagesForAPI() {
    const msgs = messagesRef.current;
    if (msgs.length <= MAX_RECENT_MESSAGES + 1) return msgs;
    const first = msgs[0];
    const recent = msgs.slice(-MAX_RECENT_MESSAGES);
    const bridgeNote = {
      role: 'user',
      content: '[안내] 오래된 대화 일부는 길이 제한으로 생략되었다. 위 첫 메시지의 세계관·목표 설정과 아래 최근 대화를 기준으로 계속 이어가라. 지금까지 진행된 트랙 상태를 존중하고 이미 완주된 트랙으로 되돌아가지 마라.'
    };
    return [first, bridgeNote, ...recent];
  }

  // ===========================================================
  // JSON 파싱 (줄바꿈/따옴표 이스케이프 누락에 대한 복구 포함)
  // ===========================================================
  function sanitizeJSONText(text) {
    let out = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escape) { out += ch; escape = false; continue; }
        if (ch === '\\') { out += ch; escape = true; continue; }
        if (ch === '"') { inString = false; out += ch; continue; }
        if (ch === '\n') { out += '\\n'; continue; }
        if (ch === '\r') { continue; }
        if (ch === '\t') { out += '\\t'; continue; }
        out += ch;
        continue;
      }
      if (ch === '"') { inString = true; out += ch; continue; }
      out += ch;
    }
    return out;
  }

  function parseModelJSON(rawText) {
    const clean = rawText.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    try {
      return JSON.parse(clean);
    } catch (e1) {
      try {
        return JSON.parse(sanitizeJSONText(clean));
      } catch (e2) {
        throw e1; // 원본 오류를 보여줌
      }
    }
  }

  // ===========================================================
  // Gemini API 호출 (systemInstruction으로 SYSTEM_PROMPT 전달,
  // contents는 {role:'user'|'model', parts:[{text}]} 형식으로 매핑)
  // ===========================================================
  const callGeminiAPI = async (messages) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents
        })
      });

      if (!response.ok) {
        let detailedError = '';
        try {
          const errorJson = await response.json();
          console.error('구글 API 반환 상세 에러 정보:', errorJson);
          detailedError = JSON.stringify(errorJson, null, 2);
        } catch (e) {
          detailedError = await response.text().catch(() => '알 수 없는 에러 본문');
        }
        throw new Error(`\n========================================\nAPI 요청 실패 (HTTP ${response.status})\n----------------------------------------\n${detailedError}\n========================================`);
      }

      const data = await response.json();

      console.log('========================================');
      console.log('Gemini API 수신 성공 (전체 Response 구조):');
      console.log(JSON.stringify(data, null, 2));
      console.log('========================================');

      const resultText = data.candidates && data.candidates[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        throw new Error('API 응답 성공했으나, 텍스트 데이터(candidates) 구조가 올바르지 않습니다: ' + JSON.stringify(data).slice(0, 300));
      }

      console.log('추출된 최종 답변 내용:\n', resultText);
      return resultText;

    } catch (error) {
      console.error('통신 에러 발생:', error);
      throw error;
    }
  };

  // ===========================================================
  // 한 턴 진행: 호출 → 파싱 → (실패 시 1회 교정 재시도) → 히스토리 반영
  // ===========================================================
  async function getSceneUpdate() {
    const rawText = await callGeminiAPI(getMessagesForAPI());
    try {
      const parsed = parseModelJSON(rawText);
      messagesRef.current.push({ role: 'assistant', content: rawText });
      return parsed;
    } catch (e) {
      const retryNote = {
        role: 'user',
        content: '[주의] 직전 응답이 유효한 JSON이 아니었다. narration 문자열 안의 줄바꿈은 반드시 \\n\\n 이스케이프 시퀀스로만 표기하고, 실제 줄바꿈 문자를 절대 넣지 마라. 대사에 큰따옴표를 쓸 경우 반드시 \\" 로 이스케이프하라. 유효한 JSON만 다시 출력하라.'
      };
      const retryMessages = [...getMessagesForAPI(), retryNote];
      const retryRawText = await callGeminiAPI(retryMessages);
      const parsed = parseModelJSON(retryRawText); // 실패하면 여기서 던져짐
      messagesRef.current.push(retryNote, { role: 'assistant', content: retryRawText });
      return parsed;
    }
  }

  function applyResult(result) {
    setTrackStatus(result.track_status);
    const at = result.active_track;
    setTrackTurnCounts(prev => {
      if (!at || !(at in prev)) return prev;
      const next = { ...prev };
      next[at] = result.track_status[at] === '완주' ? 0 : (prev[at] || 0) + 1;
      return next;
    });
  }

  function appendLog(result) {
    setStoryLogs(prev => [...prev, {
      activeTrack: result.active_track,
      originReason: result.origin_reason,
      narration: result.narration,
      choices: result.choices || [],
      correctIndex: typeof result.correct_index === 'number' ? result.correct_index : 0,
      sceneComplete: !!result.scene_complete,
      selectedChoiceIndex: null
    }]);
  }

  // ===========================================================
  // 프롬프트용 입력 메시지 빌더 (원본 엔진과 동일한 입력값 포맷)
  // ===========================================================
  function buildInitialUserMessage() {
    const info = sceneInfoRef.current;
    return `[입력값 — 이 장면의 고정 정보. 이후 대화 내내 유지할 것]
CHAPTER_AREA: ${info.chapterArea}
CHAPTER_GRADE: ${info.chapterGrade}
CHAPTER_TITLE: ${info.chapterTitle}
SELECTED_BOOK (${info.selectedTierLabel} 단계): ${info.selectedBookText} — 이 책의 핵심 주제·개념의 정신만 흡수해 세계관을 창작할 것. 원문 요약·인용 금지.
KOREAN_GOAL: ${info.goalTexts.kor}
KOREAN_LEVEL: ${levels.kor} (1=가장 쉬움 ~ 5=가장 어려움)
ENGLISH_GOAL: ${info.goalTexts.eng}
ENGLISH_LEVEL: ${levels.eng} (1=가장 쉬움 ~ 5=가장 어려움)
MATH_GOAL: ${info.goalTexts.math}
MATH_LEVEL: ${levels.math} (1=가장 쉬움 ~ 5=가장 어려움)
TRACK_STATUS: ${JSON.stringify({ korean: '미시작', english: '미시작', math: '미시작' })}
TRACK_TURN_COUNT: ${JSON.stringify({ korean: 0, english: 0, math: 0 })}

위 세계관 구축 원칙, 절대 원칙, 언어 전환 규칙, 난이도 레벨 규칙, 트랙 전환 강제 규칙, 장면 내부 순서를 따라 첫 단락(오프닝)을 생성하라. 아직 선택은 없었다. 새로운 허구의 세계관과 등장인물을 이번 응답에서 창작해 오프닝을 시작하라. JSON만 출력하라.`;
  }

  function buildChoiceUserMessage(choiceText) {
    const status = trackStatusRef.current;
    const counts = trackTurnCountsRef.current;
    return `아이가 선택했다: "${choiceText}"

지금까지의 대화(직전 장면, 등장인물, 세계관, 진행 상황)를 그대로 이어받아 다음 단락을 생성하라. 절대 새로 시작하지 말고, 방금 아이가 고른 선택의 직접적 결과로 이어지는 사건을 전개하라. 현재 트랙 상태: ${JSON.stringify(status)}. 현재 TRACK_TURN_COUNT: ${JSON.stringify(counts)} — 어느 과목이든 이미 2 이상이면 이번 응답에서 반드시 마무리하고 완주 처리하라. 위 세계관 구축 원칙, 절대 원칙, 언어 전환 규칙, 난이도 레벨 규칙, 트랙 전환 강제 규칙, 장면 내부 순서를 계속 따르라. JSON만 출력하라.`;
  }

  // ===========================================================
  // 장면 시작 / 선택 처리
  // ===========================================================
  const startScene = async () => {
    setErrorMsg('');
    if (!selectedBook) {
      setErrorMsg('세계관의 기반이 될 책을 선택해주세요.');
      return;
    }

    const bookInfo = chapters.find(b => b.chapter === selectedChapter);

    sceneInfoRef.current = {
      chapterArea: selectedArea,
      chapterGrade: bookInfo?.grade || '',
      chapterTitle: selectedChapter,
      selectedBookText: selectedBook.title,
      selectedTierLabel: selectedBook.type,
      goalTexts: {
        kor: goalFullText('kor', GOALS_DATA.kor[goals.kor]),
        eng: goalFullText('eng', GOALS_DATA.eng[goals.eng]),
        math: goalFullText('math', GOALS_DATA.math[goals.math])
      }
    };

    const initialStatus = { korean: '미시작', english: '미시작', math: '미시작' };
    const initialCounts = { korean: 0, english: 0, math: 0 };
    setTrackStatus(initialStatus);
    setTrackTurnCounts(initialCounts);
    trackStatusRef.current = initialStatus;
    trackTurnCountsRef.current = initialCounts;
    setStoryLogs([]);
    setView('stage');
    setLoading(true);

    messagesRef.current = [{ role: 'user', content: buildInitialUserMessage() }];

    try {
      const result = await getSceneUpdate();
      applyResult(result);
      appendLog(result);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (logIndex, choiceIdx, choiceText) => {
    setStoryLogs(prev => {
      const updated = [...prev];
      updated[logIndex] = { ...updated[logIndex], selectedChoiceIndex: choiceIdx };
      return updated;
    });

    setLoading(true);
    setErrorMsg('');

    messagesRef.current.push({ role: 'user', content: buildChoiceUserMessage(choiceText) });

    try {
      const result = await getSceneUpdate();
      applyResult(result);
      appendLog(result);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // 렌더링 헬퍼
  // ===========================================================
  const pillClass = (key) => {
    const s = trackStatus[key];
    if (s === '완주') return 'pill done';
    if (s === '실패반복' || s === '깨달음직전') return 'pill active';
    return 'pill';
  };

  const trackLabel = (key) => ({ korean: '국어', english: '영어', math: '수학' }[key] || key || '-');

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
              <div className="goal-detail">{goalFullText('kor', GOALS_DATA.kor[goals.kor])}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3, 4, 5].map(v => (
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
              <div className="goal-detail">{goalFullText('eng', GOALS_DATA.eng[goals.eng])}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3, 4, 5].map(v => (
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
              <div className="goal-detail">{goalFullText('math', GOALS_DATA.math[goals.math])}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3, 4, 5].map(v => (
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
            <div className={pillClass('korean')}>국어</div>
            <div className={pillClass('english')}>영어</div>
            <div className={pillClass('math')}>수학</div>
          </div>

          <div id="storyLog">
            {storyLogs.map((log, logIdx) => (
              <React.Fragment key={logIdx}>
                <div className="debug-strip">
                  <b>[테스트용 디버그]</b> 현재 트랙: <b>{trackLabel(log.activeTrack)}</b>
                  {!log.sceneComplete && (
                    <> (턴 {trackTurnCounts[log.activeTrack] ?? '-'}/2)</>
                  )}
                  {log.originReason && (
                    <><br /><b>설계 메모(비공개):</b> {log.originReason}</>
                  )}
                </div>

                <div className="story-card">
                  {log.narration.split('\n\n').filter(p => p.trim()).map((p, pIdx) => (
                    <p key={pIdx}>{p.trim()}</p>
                  ))}
                </div>

                {log.sceneComplete ? (
                  <div className="scene-end">장면 완료 — 세 트랙 모두 완주했습니다.</div>
                ) : (
                  <div className="choices">
                    {log.choices.map((choice, cIdx) => (
                      <button
                        key={cIdx}
                        className={`choice-btn ${cIdx === log.correctIndex ? 'test-correct' : ''}`}
                        disabled={log.selectedChoiceIndex !== null}
                        onClick={() => handleChoice(logIdx, cIdx, choice)}
                      >
                        {cIdx + 1}. {choice}
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {loading && <div className="loading">이야기를 쓰는 중...</div>}
          {errorMsg && <div className="err">{errorMsg}</div>}
        </div>
      )}
    </div>
  );
}