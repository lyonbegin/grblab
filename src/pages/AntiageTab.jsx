import React, { useState, useEffect, useRef } from 'react';
import {
  GOALS_DATA,
  BOOKS_DATA,
  SYSTEM_PROMPT_COMMON,
  SYSTEM_PROMPT_KOR,
  SYSTEM_PROMPT_ENG,
  SYSTEM_PROMPT_MATH
} from './constants';

// 과목 진행 순서와, 과목별 프롬프트 모듈 / 목표 키 / 표시 이름 매핑.
const SUBJECT_ORDER = ['korean', 'english', 'math'];
const SUBJECT_META = {
  korean: { label: '국어', goalKey: 'kor', prompt: SYSTEM_PROMPT_KOR },
  english: { label: '영어', goalKey: 'eng', prompt: SYSTEM_PROMPT_ENG },
  math: { label: '수학', goalKey: 'math', prompt: SYSTEM_PROMPT_MATH }
};

// Gemini 구조 강제용 JSON 스키마. track_status는 더 이상 모델이 자체 보고하지 않는다 —
// 턴 진행(완료 여부)은 코드가 "선택 인덱스 === correct_index" 비교로 직접 판정한다.
const SCENE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    origin_reason: { type: 'STRING' },
    active_track: { type: 'STRING', enum: ['korean', 'english', 'math'] },
    narration: { type: 'STRING' },
    choices: { type: 'ARRAY', items: { type: 'STRING' } },
    correct_index: { type: 'INTEGER' },
    scene_complete: { type: 'BOOLEAN' }
  },
  required: ['origin_reason', 'active_track', 'narration', 'choices', 'correct_index', 'scene_complete']
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

  // completedTurns: 과목별 "실제로 성공해서 넘어간" 턴수 (0~2). 2가 되면 그 과목 완주.
  // attempts: 지금 단계(결핍턴 또는 적용확인턴) 안에서 실패한 횟수. 성공하면 0으로 리셋.
  // 둘 다 오직 코드(클릭 시 선택 인덱스 === correct_index 비교)로만 갱신되며, 모델 출력에 의존하지 않는다.
  const [trackCompletedTurns, setTrackCompletedTurns] = useState({ korean: 0, english: 0, math: 0 });
  const [trackAttempts, setTrackAttempts] = useState({ korean: 0, english: 0, math: 0 });
  const [storyLogs, setStoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesRef = useRef([]);
  const sceneInfoRef = useRef({
    chapterArea: '', chapterGrade: '', chapterTitle: '',
    selectedBookText: '', selectedTierLabel: '', goalTexts: { kor: '', eng: '', math: '' }
  });
  const trackCompletedTurnsRef = useRef(trackCompletedTurns);
  const trackAttemptsRef = useRef(trackAttempts);
  useEffect(() => { trackCompletedTurnsRef.current = trackCompletedTurns; }, [trackCompletedTurns]);
  useEffect(() => { trackAttemptsRef.current = trackAttempts; }, [trackAttempts]);

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
  // "지금 담당할 과목"은 completedTurns가 2 미만인 것 중 순서상 첫 번째.
  // ===========================================================
  function getActiveSubject(completed) {
    return SUBJECT_ORDER.find(s => completed[s] < 2) || null; // null이면 세 과목 모두 완주
  }

  // ===========================================================
  // 이번 호출의 맥락(어느 과목·어떤 단계·어떤 지시문)을 코드가 계산한다.
  // subjectJustResolved: 방금 아이가 선택을 한 과목 (최초 호출이면 undefined).
  // ===========================================================
  function buildTurnContext(subjectJustResolved) {
    const completed = trackCompletedTurnsRef.current;
    const attempts = trackAttemptsRef.current;

    // 방금 그 과목이 완전히 완주(2턴 성공)된 경우
    if (subjectJustResolved && completed[subjectJustResolved] >= 2) {
      const next = getActiveSubject(completed);
      if (next) {
        return {
          activeTrack: next,
          subjectForModule: next,
          isDeficitPhase: true,
          sceneComplete: false,
          instruction: `"${SUBJECT_META[subjectJustResolved].label}" 과목이 방금 완주되었다. narration 안에서 그 완주를 짧게 매듭짓고, 곧바로 다음 과목인 "${SUBJECT_META[next].label}"의 결핍 상황을 새로 열어라. active_track에는 "${next}"를 넣어라. choices는 "${SUBJECT_META[next].label}" 결핍턴에 대한 전략 선택지로 채우고, 개념 이름·공식·정답 형태는 절대 등장시키지 마라. ${next !== 'english' ? 'narration과 선택지는 반드시 한국어로 작성하라 (직전 과목이 영어였더라도 지금은 한국어로 전환).' : 'narration과 선택지는 반드시 영어로 작성하라.'}`
        };
      }
      return {
        activeTrack: subjectJustResolved,
        subjectForModule: null,
        isDeficitPhase: false,
        sceneComplete: true,
        instruction: `"${SUBJECT_META[subjectJustResolved].label}" 과목이 방금 완주되어 국어·영어·수학 세 과목이 모두 완주되었다. scene_complete를 true로 하고, 세 과목이 함께 마무리되는 짧은 결말 narration을 작성하라. choices는 빈 배열로 둬라.`
      };
    }

    const subject = subjectJustResolved || getActiveSubject(completed);
    const c = completed[subject];
    const a = attempts[subject];
    const isDeficitPhase = c === 0;

    let stageLabel;
    if (isDeficitPhase) {
      stageLabel = a === 0
        ? '결핍턴 — 개념 이름·공식·정답 형태를 절대 등장시키지 말 것. "무엇을 해야 할까"라는 전략을 고르는 선택지를 제시하라.'
        : `결핍턴 재시도 ${a}회째 — 아이는 방금 실패하는 선택을 했다. 그 선택이 만든 구체적 결과를 사건으로 보여준 뒤, 다시 전략을 고르게 하라. 여전히 개념 이름·정답 형태 금지.${a >= 2 ? ' 이미 여러 번 실패했으니 이번 선택지 중 하나는 확실히 성공으로 이어지도록 설계하라 (그래도 노골적으로 티내지는 마라).' : ''}`;
    } else {
      stageLabel = a === 0
        ? '적용 확인턴 — 전략 발명에 막 성공했다. 방금 발명한 바로 그 개념을 그대로 사용해서 짧게 적용·확인하는 문제 하나만 제시하라. 완전히 새로운 전략을 처음부터 다시 찾게 하지 마라 — 이미 답을 찾는 방법은 정해졌고, 이번엔 그 방법을 실제로 써먹어 보는 것뿐이다.'
        : `적용 확인턴 재시도 ${a}회째 — 아이는 방금 적용에 실패했다. 그 실패를 사건으로 짧게 보여준 뒤, 같은 개념(방금 발명한 것)을 다시 적용해보게 하라. 새로운 전략이나 다른 접근법을 처음부터 다시 탐색하게 만들지 마라 — 방법은 이미 정해져 있고, 그 방법을 정확히 적용하는지만 확인하는 것이다.${a >= 2 ? ' 이미 여러 번 실패했으니 이번엔 반드시 성공으로 이어지도록 선택지를 설계하라.' : ''}`;
    }

    return {
      activeTrack: subject,
      subjectForModule: subject,
      isDeficitPhase,
      sceneComplete: false,
      instruction: `지금 담당할 과목은 "${SUBJECT_META[subject].label}"이다. active_track 필드에는 반드시 "${subject}"를 넣어라. 이번 턴: ${stageLabel} ${subject !== 'english' ? `(narration과 선택지는 반드시 한국어로 작성하라. 직전 턴이 영어였더라도 지금은 한국어로 전환하라.)` : ''}`
    };
  }

  function buildSystemInstruction(ctx) {
    if (!ctx.subjectForModule) {
      return `${SYSTEM_PROMPT_COMMON}

[지금 이 턴의 지시]
${ctx.instruction}`;
    }
    const meta = SUBJECT_META[ctx.subjectForModule];
    return `${SYSTEM_PROMPT_COMMON}

${meta.prompt}

[지금 이 턴의 지시]
${ctx.instruction}`;
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
      content: '[안내] 오래된 대화 일부는 길이 제한으로 생략되었다. 위 첫 메시지의 세계관·목표 설정과 아래 최근 대화를 기준으로 계속 이어가라. 지금까지 진행된 과목·단계를 존중하고 이미 완주된 과목으로 되돌아가지 마라.'
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
  // 내용 검증 — 코드가 직접 확인. active_track 불일치, 수학 LaTeX 사용,
  // 결핍턴인데 선택지가 완성된 숫자 답인 경우, 영어 턴인데 한국어 위주인 경우를 잡아낸다.
  // ===========================================================
  function validateTurnContent(ctx, parsed) {
    const problems = [];

    if (ctx.activeTrack && parsed.active_track !== ctx.activeTrack) {
      problems.push(`active_track 필드가 "${ctx.activeTrack}"이어야 하는데 "${parsed.active_track}"로 응답했다. 정확히 맞춰라.`);
    }

    const narration = parsed.narration || '';
    const choicesJoined = (parsed.choices || []).join(' ');

    const mathInPlay = ctx.subjectForModule === 'math' || ctx.activeTrack === 'math';
    if (mathInPlay) {
      const mathText = narration + ' ' + choicesJoined;
      if (/\$|\\frac|\\lim|\\sum|\\sqrt|\^\{|_\{/.test(mathText)) {
        problems.push('수학 관련 턴인데 LaTeX/수식 기호($, \\frac, \\lim, ^{...} 등)가 사용되었다. 모든 수식은 반드시 한글 문장으로 풀어써야 한다 (예: "3분의 1", "x가 1에 가까워질 때").');
      }
      if (ctx.isDeficitPhase && ctx.activeTrack === 'math' && parsed.choices && parsed.choices.length > 0) {
        const allNumericLike = parsed.choices.every(c => /^[\s0-9.\-\/,]+$/.test(c));
        if (allNumericLike) {
          problems.push('결핍턴인데 선택지가 완성된 숫자 답으로만 되어 있다. 결핍턴 선택지는 "어떤 전략으로 접근할지"를 고르는 것이어야지 이미 계산된 답이어서는 안 된다.');
        }
      }
    }

    const englishInPlay = ctx.subjectForModule === 'english' || ctx.activeTrack === 'english';
    if (englishInPlay) {
      const hangulCount = (narration.match(/[가-힣]/g) || []).length;
      const ratio = hangulCount / Math.max(1, narration.length);
      if (ratio > 0.4) {
        problems.push('영어 관련 턴인데 narration이 한국어 위주로 작성되었다. 지문 전체를 영어로 다시 작성하라 (짧은 지시문 정도만 한글 허용).');
      }
    }

    const nonEnglishInPlay = ctx.activeTrack === 'korean' || ctx.activeTrack === 'math';
    if (nonEnglishInPlay) {
      const hangulCount = (narration.match(/[가-힣]/g) || []).length;
      const ratio = hangulCount / Math.max(1, narration.length);
      if (ratio < 0.3) {
        problems.push(`"${SUBJECT_META[ctx.activeTrack].label}" 턴인데 narration이 한국어가 아니라 다른 언어(주로 영어)로 작성되었다. 직전 턴이 영어였더라도 지금은 반드시 한국어로 작성해야 한다.`);
      }
    }

    // 가장 중요한 검증: 모델이 우리가 정한 진행 상태(ctx.sceneComplete)를 실제로 따랐는가.
    // 이걸 확인하지 않으면 모델이 반복된 실패 끝에 스스로 장면을 끝내버리거나,
    // 정답을 설명으로 알려주며 마무리해버리는 사고가 검증 없이 그대로 통과된다.
    if (!!parsed.scene_complete !== !!ctx.sceneComplete) {
      problems.push(`scene_complete 값이 잘못되었다. 지금은 ${ctx.sceneComplete ? '세 과목이 모두 완주된 시점이므로 scene_complete를 true로' : '아직 진행 중이므로 scene_complete를 false로'} 설정해야 한다. 아직 완주되지 않은 과목을 함부로 끝내지 말고, choices를 포함한 정상적인 진행 턴으로 응답하라.`);
    } else if (!ctx.sceneComplete) {
      const choiceCount = Array.isArray(parsed.choices) ? parsed.choices.filter(c => c && c.trim()).length : 0;
      if (choiceCount < 2) {
        problems.push('아직 장면이 끝나지 않았는데 choices가 비어있거나 부족하다. 아이가 고를 수 있는 선택지 3개를 반드시 포함하라. 정답을 그냥 설명으로 알려주고 끝내지 마라 — 아이가 선택해야만 다음으로 넘어간다.');
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
  // subjectJustResolved가 주어지면 그 과목의 맥락(완료턴/시도횟수는 이미 handleChoice에서
  // 갱신된 값)을 그대로 사용해 응답을 만든다.
  // ===========================================================
  const MAX_ATTEMPTS = 3;

  async function getSceneUpdate(subjectJustResolved) {
    const ctx = buildTurnContext(subjectJustResolved);
    const systemText = buildSystemInstruction(ctx);

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

      const problems = validateTurnContent(ctx, parsed);
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

  function appendLog(result) {
    // 디버그 표시가 "지금 이 순간의" 값이 아니라 "이 응답이 만들어진 시점"의 값을 보여주도록,
    // completedTurns/attempts를 로그 항목에 스냅샷으로 함께 저장한다.
    setStoryLogs(prev => [...prev, {
      activeTrack: result.active_track,
      originReason: result.origin_reason,
      narration: result.narration,
      choices: result.choices || [],
      correctIndex: typeof result.correct_index === 'number' ? result.correct_index : 0,
      sceneComplete: !!result.scene_complete,
      selectedChoiceIndex: null,
      completedTurnsSnapshot: trackCompletedTurnsRef.current[result.active_track] ?? 0,
      attemptsSnapshot: trackAttemptsRef.current[result.active_track] ?? 0
    }]);
  }

  // ===========================================================
  // 프롬프트용 입력 메시지 빌더
  // ===========================================================
  function buildInitialUserMessage() {
    const info = sceneInfoRef.current;
    const ctx = buildTurnContext(undefined); // 국어, 결핍턴, 0/0에서 시작
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
완료된 턴수: ${JSON.stringify(trackCompletedTurnsRef.current)} (과목별 0~2, 2면 완주)
이번 단계 시도 횟수: ${JSON.stringify(trackAttemptsRef.current)}
지금 담당할 과목: ${SUBJECT_META[ctx.activeTrack].label} (${ctx.activeTrack})

첫 단락(오프닝)을 생성하라. 아직 선택은 없었다. 새로운 허구의 세계관과 등장인물을 이번 응답에서 창작해 오프닝을 시작하고, 곧바로 "${SUBJECT_META[ctx.activeTrack].label}" 과목의 결핍턴으로 들어가라. JSON만 출력하라.`;
  }

  function buildChoiceUserMessage(choiceText, wasCorrect) {
    return `아이가 선택했다: "${choiceText}"

이 선택은 ${wasCorrect ? '성공 — 상황을 실제로 돌파하는 선택이었다' : '실패 — 그럴듯했지만 막다른 선택이었다'}.
지금까지의 대화(직전 장면, 등장인물, 세계관, 진행 상황)를 그대로 이어받아 다음 단락을 생성하라. 절대 새로 시작하지 말고, 방금 선택의 직접적 결과로 이어지는 사건을 전개하라.
완료된 턴수: ${JSON.stringify(trackCompletedTurnsRef.current)} (과목별 0~2, 2면 완주)
이번 단계 시도 횟수: ${JSON.stringify(trackAttemptsRef.current)}

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

    const initialCompleted = { korean: 0, english: 0, math: 0 };
    const initialAttempts = { korean: 0, english: 0, math: 0 };
    setTrackCompletedTurns(initialCompleted);
    setTrackAttempts(initialAttempts);
    trackCompletedTurnsRef.current = initialCompleted;
    trackAttemptsRef.current = initialAttempts;
    setStoryLogs([]);
    setView('stage');
    setLoading(true);

    messagesRef.current = [{ role: 'user', content: buildInitialUserMessage() }];

    try {
      const result = await getSceneUpdate(undefined);
      appendLog(result);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 아이가 선택지를 클릭했을 때: 코드가 직접 성공/실패를 판정하고,
  // completedTurns/attempts를 갱신한 뒤 그 결과를 바탕으로 다음 장면을 요청한다.
  const handleChoice = async (logIndex, choiceIdx, choiceText, correctIndex, subject) => {
    setStoryLogs(prev => {
      const updated = [...prev];
      updated[logIndex] = { ...updated[logIndex], selectedChoiceIndex: choiceIdx };
      return updated;
    });

    const wasCorrect = choiceIdx === correctIndex;
    const prevCompleted = trackCompletedTurnsRef.current;
    const prevAttempts = trackAttemptsRef.current;

    let nextCompleted = prevCompleted;
    let nextAttempts = prevAttempts;

    if (wasCorrect) {
      nextCompleted = { ...prevCompleted, [subject]: Math.min(2, (prevCompleted[subject] || 0) + 1) };
      nextAttempts = { ...prevAttempts, [subject]: 0 };
    } else {
      nextAttempts = { ...prevAttempts, [subject]: (prevAttempts[subject] || 0) + 1 };
    }

    trackCompletedTurnsRef.current = nextCompleted;
    trackAttemptsRef.current = nextAttempts;
    setTrackCompletedTurns(nextCompleted);
    setTrackAttempts(nextAttempts);

    setLoading(true);
    setErrorMsg('');

    messagesRef.current.push({ role: 'user', content: buildChoiceUserMessage(choiceText, wasCorrect) });

    try {
      const result = await getSceneUpdate(subject);
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
  function getDisplayStatus(subject) {
    const c = trackCompletedTurns[subject];
    const a = trackAttempts[subject];
    if (c >= 2) return '완주';
    if (c === 0) return a > 0 ? '실패반복' : '미시작';
    return '깨달음직전';
  }

  const pillClass = (key) => {
    const s = getDisplayStatus(key);
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
                    <> (완료 턴 {log.completedTurnsSnapshot}/2 · 이번 단계 시도 {log.attemptsSnapshot + 1}회째)</>
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
                        onClick={() => handleChoice(logIdx, cIdx, choice, log.correctIndex, log.activeTrack)}
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