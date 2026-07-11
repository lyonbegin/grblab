import React, { useState, useEffect, useRef } from 'react';
import {
  GOALS_DATA,
  BOOKS_DATA,
  SYSTEM_PROMPT_COMMON,
  SYSTEM_PROMPT_KOR,
  SYSTEM_PROMPT_ENG,
  SYSTEM_PROMPT_MATH
} from './constants';

// 과목 진행 순서와, 과목별로 어떤 프롬프트 모듈 / 목표 키 / 표시 이름을 쓸지 매핑.
// "지금 턴이 어느 과목인지"는 모델에게 묻지 않고 이 순서와 trackStatus를 보고 코드가 결정한다.
const SUBJECT_ORDER = ['korean', 'english', 'math'];
const SUBJECT_META = {
  korean: { label: '국어', goalKey: 'kor', prompt: SYSTEM_PROMPT_KOR },
  english: { label: '영어', goalKey: 'eng', prompt: SYSTEM_PROMPT_ENG },
  math: { label: '수학', goalKey: 'math', prompt: SYSTEM_PROMPT_MATH }
};

// Gemini에게 구조를 강제하기 위한 JSON 스키마. 텍스트 지시("JSON만 출력하라")만으로는
// 모델이 통째로 무시할 수 있으므로, responseMimeType + responseSchema로 API 레벨에서 강제한다.
const SCENE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    origin_reason: { type: 'STRING' },
    active_track: { type: 'STRING', enum: ['korean', 'english', 'math'] },
    narration: { type: 'STRING' },
    choices: { type: 'ARRAY', items: { type: 'STRING' } },
    correct_index: { type: 'INTEGER' },
    track_status: {
      type: 'OBJECT',
      properties: {
        korean: { type: 'STRING', enum: ['미시작', '실패반복', '깨달음직전', '완주'] },
        english: { type: 'STRING', enum: ['미시작', '실패반복', '깨달음직전', '완주'] },
        math: { type: 'STRING', enum: ['미시작', '실패반복', '깨달음직전', '완주'] }
      },
      required: ['korean', 'english', 'math']
    },
    scene_complete: { type: 'BOOLEAN' }
  },
  required: ['origin_reason', 'active_track', 'narration', 'choices', 'correct_index', 'track_status', 'scene_complete']
};

export default function SceneGeneratorEngine() {
  const GEMINI_API_KEY = "AQ.Ab8RN6Jwrwo7TruQDJhlsuTuEg5v6AJmeI7hCvdLcijHwIGNig";
  const GEMINI_MODEL = "gemini-3.1-flash-lite";

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

  const [trackStatus, setTrackStatus] = useState({ korean: '미시작', english: '미시작', math: '미시작' });
  const [trackTurnCounts, setTrackTurnCounts] = useState({ korean: 0, english: 0, math: 0 });
  const [storyLogs, setStoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesRef = useRef([]);
  const sceneInfoRef = useRef({
    chapterArea: '', chapterGrade: '', chapterTitle: '',
    selectedBookText: '', selectedTierLabel: '', goalTexts: { kor: '', eng: '', math: '' }
  });
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

  function goalFullText(subject, item) {
    if (!item) return '';
    if (subject === 'math') {
      return `${item.title} (${item.part || ''} ${item.category || ''}, 난이도 ${item.difficulty || ''}) — 출제 경향: ${item.trend || ''}`;
    }
    return `${item.title} (${item.major || ''} ${item.mid || ''}, 권장학습단계 ${item.stage || ''}, 중요도 ${item.importance || ''}) — ${item.content || ''}`;
  }

  // ===========================================================
  // 코드가 "지금 턴은 어느 과목, 어떤 턴유형인지" 직접 계산한다 (모델에게 맡기지 않음)
  // ===========================================================
  function getActiveSubject(status) {
    return SUBJECT_ORDER.find(s => status[s] !== '완주') || null; // null이면 세 과목 모두 완주
  }

  function getTurnTypeLabel(turnCount) {
    if (turnCount <= 0) return '결핍턴 (개념 이름·공식·정답 형태를 절대 등장시키지 말 것)';
    if (turnCount === 1) return '발명턴 (아이가 직접 구체적 형태를 만들어보게 할 것)';
    return '완결턴 (TRACK_TURN_COUNT 한도 초과 — 이번 응답에서 반드시 마무리하고 완주 처리할 것)';
  }

  // 이번 호출에 실제로 보낼 systemInstruction을 조합한다.
  // 공통 섀시 + "지금 담당하는 과목 모듈 1개"만 붙여서, 프롬프트 길이와 혼란을 줄인다.
  function buildSystemInstruction(activeSubject, turnCount) {
    if (!activeSubject) {
      return `${SYSTEM_PROMPT_COMMON}

[지금 이 턴의 지시]
국어·영어·수학 세 트랙이 모두 완주되었다. scene_complete를 true로 하고, 세 트랙이 함께 마무리되는 짧은 결말 narration을 작성하라. choices는 빈 배열로 두고, active_track에는 가장 마지막에 완주된 과목을 넣어라.`;
    }
    const meta = SUBJECT_META[activeSubject];
    return `${SYSTEM_PROMPT_COMMON}

${meta.prompt}

[지금 이 턴의 지시]
지금 담당할 과목은 "${meta.label}"이다. active_track 필드에는 반드시 "${activeSubject}"를 넣어라. 이번 턴의 유형은: ${getTurnTypeLabel(turnCount)}`;
  }

  // ===========================================================
  // 메시지 윈도잉
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
  // JSON 파싱 복구
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
        throw e1;
      }
    }
  }

  // ===========================================================
  // 내용 검증 — 프롬프트 지시를 "코드가 강제로" 확인한다.
  // 여기 걸리면 재시도 사유를 구체적으로 적어 다시 요청한다.
  // ===========================================================
  function validateTurnContent(activeSubject, turnCount, parsed) {
    const problems = [];
    if (!activeSubject) return problems; // 마무리 턴은 검증 생략

    const narration = parsed.narration || '';
    const choicesJoined = (parsed.choices || []).join(' ');
    const isDeficitTurn = turnCount <= 0;

    if (activeSubject === 'math') {
      const mathText = narration + ' ' + choicesJoined;
      if (/\$|\\frac|\\lim|\\sum|\\sqrt|\^\{|_\{/.test(mathText)) {
        problems.push('수학 턴인데 LaTeX/수식 기호($, \\frac, \\lim, ^{...} 등)가 사용되었다. 모든 수식은 반드시 한글 문장으로 풀어써야 한다 (예: "3분의 1", "x가 1에 가까워질 때").');
      }
      if (isDeficitTurn && parsed.choices && parsed.choices.length > 0) {
        const allNumericLike = parsed.choices.every(c => /^[\s0-9.\-\/,]+$/.test(c));
        if (allNumericLike) {
          problems.push('결핍턴인데 선택지가 완성된 숫자 답으로만 되어 있다. 결핍턴 선택지는 "어떤 전략으로 접근할지"를 고르는 것이어야지 이미 계산된 답이어서는 안 된다.');
        }
      }
    }

    if (activeSubject === 'english') {
      const hangulCount = (narration.match(/[가-힣]/g) || []).length;
      const ratio = hangulCount / Math.max(1, narration.length);
      if (ratio > 0.4) {
        problems.push('영어 턴인데 narration이 한국어 위주로 작성되었다. 지문 전체를 영어로 다시 작성하라 (짧은 지시문 정도만 한글 허용).');
      }
    }

    return problems;
  }

  // ===========================================================
  // Gemini API 호출
  // ===========================================================
  const callGeminiAPI = async (messages, systemText) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: SCENE_RESPONSE_SCHEMA
          }
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
  // 한 턴 진행: 호출 → JSON 파싱 → 내용 검증 → (문제 시 최대 2회 교정 재시도)
  // ===========================================================
  const MAX_ATTEMPTS = 3;

  async function getSceneUpdate() {
    const activeSubject = getActiveSubject(trackStatusRef.current);
    const turnCount = activeSubject ? (trackTurnCountsRef.current[activeSubject] || 0) : 0;
    const systemText = buildSystemInstruction(activeSubject, turnCount);

    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const messagesToSend = getMessagesForAPI();
      const rawText = await callGeminiAPI(messagesToSend, systemText);

      let parsed;
      try {
        parsed = parseModelJSON(rawText);
      } catch (parseErr) {
        lastError = parseErr;
        messagesRef.current.push({
          role: 'user',
          content: '[주의] 직전 응답이 유효한 JSON이 아니었다. narration 문자열 안의 줄바꿈은 반드시 \\n\\n 이스케이프 시퀀스로만 표기하고, 실제 줄바꿈 문자를 절대 넣지 마라. 대사에 큰따옴표를 쓸 경우 반드시 \\" 로 이스케이프하라. 유효한 JSON만 다시 출력하라.'
        });
        continue;
      }

      const problems = validateTurnContent(activeSubject, turnCount, parsed);
      if (problems.length > 0) {
        lastError = new Error('내용 검증 실패: ' + problems.join(' / '));
        messagesRef.current.push({
          role: 'user',
          content: `[주의] 직전 응답이 규칙을 위반했다:\n- ${problems.join('\n- ')}\n같은 상황을 유지한 채, 위 문제만 고쳐서 다시 응답하라. JSON만 출력하라.`
        });
        continue;
      }

      messagesRef.current.push({ role: 'assistant', content: rawText });
      return parsed;
    }

    throw lastError || new Error('알 수 없는 이유로 장면 생성에 실패했습니다.');
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
  // 프롬프트용 입력 메시지 빌더
  // ===========================================================
  function buildInitialUserMessage() {
    const info = sceneInfoRef.current;
    const activeSubject = getActiveSubject({ korean: '미시작', english: '미시작', math: '미시작' });
    const meta = SUBJECT_META[activeSubject];
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
지금 담당할 과목: ${meta.label} (${activeSubject})

첫 단락(오프닝)을 생성하라. 아직 선택은 없었다. 새로운 허구의 세계관과 등장인물을 이번 응답에서 창작해 오프닝을 시작하고, 곧바로 "${meta.label}" 과목의 결핍턴으로 들어가라. JSON만 출력하라.`;
  }

  function buildChoiceUserMessage(choiceText) {
    const status = trackStatusRef.current;
    const counts = trackTurnCountsRef.current;
    const activeSubject = getActiveSubject(status);
    const meta = activeSubject ? SUBJECT_META[activeSubject] : null;
    return `아이가 선택했다: "${choiceText}"

지금까지의 대화(직전 장면, 등장인물, 세계관, 진행 상황)를 그대로 이어받아 다음 단락을 생성하라. 절대 새로 시작하지 말고, 방금 아이가 고른 선택의 직접적 결과로 이어지는 사건을 전개하라.
현재 트랙 상태: ${JSON.stringify(status)}
현재 TRACK_TURN_COUNT: ${JSON.stringify(counts)}
지금 담당할 과목: ${meta ? `${meta.label} (${activeSubject})` : '없음 — 모든 과목 완주, 마무리 장면 작성'}

JSON만 출력하라.`;
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

  const trackLabel = (key) => (SUBJECT_META[key]?.label || key || '-');

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