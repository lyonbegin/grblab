import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {

  SYSTEM_PROMPT_COMMON_BASE,
  SYSTEM_PROMPT_TURNS_DISCOVERY,
  SYSTEM_PROMPT_TURNS_PROBLEM,
  SYSTEM_PROMPT_KOR_DISCOVERY,
  SYSTEM_PROMPT_KOR_PROBLEM,
  SYSTEM_PROMPT_ENG_PROBLEM,
  SYSTEM_PROMPT_MATH_PROBLEM,
  KOR_DISCOVERY_MIDS
} from './constants';
import {
  GOALS_DATA,
  BOOKS_DATA
} from './constantsbase';
// 과목 진행 순서와, 과목별 목표 키 / 표시 이름 매핑.
// 프롬프트 모듈은 과목마다 고정이 아니라 "모드"(발견형/문제유형형)에 따라 달라지므로
// getSubjectPromptModule()에서 그때그때 계산한다.
const SUBJECT_ORDER = ['korean', 'english', 'math'];
const SUBJECT_META = {
  korean: { label: '국어', goalKey: 'kor' },
  english: { label: '영어', goalKey: 'eng' },
  math: { label: '수학', goalKey: 'math' }
};

// 영어·수학은 항상 문제유형형이다. 국어만 목표(mid)에 따라 발견형/문제유형형으로 갈린다.
function computeSubjectMode(subject, goalsSnapshot) {
  if (subject !== 'korean') return 'problem';
  const midValue = GOALS_DATA.kor[goalsSnapshot.kor]?.mid || '';
  return KOR_DISCOVERY_MIDS.has(midValue) ? 'discovery' : 'problem';
}

// 발견형은 원인진단→해결확인의 2단계, 문제유형형은 정답판별→이유판별→접근전략의 3단계.
function maxTurnsForMode(mode) {
  return mode === 'discovery' ? 2 : 3;
}

function getSubjectPromptModule(subject, mode) {
  if (subject === 'korean') return mode === 'discovery' ? SYSTEM_PROMPT_KOR_DISCOVERY : SYSTEM_PROMPT_KOR_PROBLEM;
  if (subject === 'english') return SYSTEM_PROMPT_ENG_PROBLEM;
  if (subject === 'math') return SYSTEM_PROMPT_MATH_PROBLEM;
  return '';
}

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
    scene_complete: { type: 'BOOLEAN' },
    visual: {
       type: 'OBJECT',
      nullable: true,
      properties: {
        // 그래프를 몇 개 그릴지, 각 그래프에 곡선을 몇 개 겹쳐 그릴지는 모델이 상황에 맞게 정한다.
        // 예: 세 선택지를 한 그래프에 겹쳐 비교 → graphs 길이 1, 그 안에 curves 3개.
        //     세 선택지를 각각 따로 보여주는 게 나음 → graphs 길이 3, 각 graph에 curves 1개.
        graphs: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              xRange: { type: 'ARRAY', items: { type: 'NUMBER' } },
              yRange: { type: 'ARRAY', items: { type: 'NUMBER' } },
              curves: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    // "explicit": y = formula (x만 포함). "implicit": formula = 0 (x,y 둘 다 포함, 원·타원·쌍곡선 등).
                    kind: { type: 'STRING', enum: ['explicit', 'implicit'] },
                    formula: { type: 'STRING' },
                    label: { type: 'STRING' },
                    color: { type: 'STRING' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  required: ['origin_reason', 'active_track', 'narration', 'choices', 'correct_index', 'scene_complete']
};

export default function SceneGeneratorEngine() {
  const GEMINI_API_KEY = "AQ.Ab8RN6Jwrwo7TruQDJhlsuTuEg5v6AJmeI7hCvdLcijHwIGNig";
  const GEMINI_MODEL = "gemini-3.1-flash-lite";

    // const GEMINI_MODEL = "gemini-3.1-flash";

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
  // 테스트 편의를 위해 국어/영어/수학 중 어느 과목을 이번 장면에 포함시킬지 체크한다.
  // 체크 해제된 과목은 완전히 건너뛰고, 체크된 과목만 순서대로 진행된다.
  const [enabledSubjects, setEnabledSubjects] = useState({ korean: true, english: true, math: true });

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
  // 체크된 과목만 담긴 이번 장면의 실제 진행 순서. startScene에서 채워진다.
  const subjectOrderRef = useRef(SUBJECT_ORDER);
  // 과목별 모드(발견형/문제유형형). 영어·수학은 항상 'problem', 국어는 선택된 목표의 mid에 따라 결정.
  // startScene에서 채워지고 이후 장면 내내 고정된다.
  const subjectModesRef = useRef({ korean: 'problem', english: 'problem', math: 'problem' });
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
    if (!item) return `[[경고: ${subject} 학습목표 데이터를 찾지 못했습니다 — GOALS_DATA.${subject}[선택한 인덱스]가 undefined입니다. constants.ts의 GOALS_DATA 배열 개수/구조를 확인하세요]]`;
    if (!item.title) {
      console.warn(`goalFullText: ${subject} 항목에 title 필드가 없습니다.`, item);
    }
    if (subject === 'math') {
      return `${item.title || '(제목 없음)'} (${item.part || ''} ${item.category || ''}, 난이도 ${item.difficulty || ''}) — 출제 경향: ${item.trend || ''}`;
    }
    return `${item.title || '(제목 없음)'} (${item.major || ''} ${item.mid || ''}, 권장학습단계 ${item.stage || ''}, 중요도 ${item.importance || ''}) — ${item.content || ''}`;
  }

  // ===========================================================
  // "지금 담당할 과목"은 completedTurns가 2 미만인 것 중 순서상 첫 번째.
  // ===========================================================
  function getActiveSubject(completed) {
    return subjectOrderRef.current.find(s => completed[s] < maxTurnsForMode(subjectModesRef.current[s])) || null; // null이면 체크된 과목 모두 완주
  }

  // ===========================================================
  // 발견형 단계 지시문 (원인 진단턴 c=0 → 해결 확인턴 c=1, 성공하면 완주)
  // ===========================================================
  function discoveryStageLabel(c, a) {
    const isDeficitPhase = c === 0;
    if (isDeficitPhase) {
      return a === 0
        ? '원인 진단턴 — narration 끝에서 "왜 이런 일이 벌어졌을까?"를 명확히 물어라. choices에는 그 상황의 원인을 설명하는 완전한 문장 3개("~때문에 그렇다" 형태)를 제시하고, 하나만 실제 원인이어야 한다. 전문 용어·공식 이름은 쓰지 말고 평이한 말로 풀어써라. 세 선택지 모두 반드시 같은 지점(같은 원인)에 대한 것이어야 하며, 서로 관련 없는 주제로 흩어지면 안 된다.'
        : `원인 진단턴 재시도 ${a}회째 — 아이는 방금 틀린 원인을 골랐다. 그 오답이 왜 진짜 원인이 아닌지 직접 설명하지 말고, 그 오답을 사실이라 믿고 시도했을 때 벌어지는 구체적 결과를 사건으로 보여준 뒤, 같은 질문("왜 이런 일이 벌어졌을까?")에 다시 답하게 하라. 선택지는 여전히 같은 지점에 대한 원인 설명 문장 3개여야 한다.${a >= 2 ? ' 이미 여러 번 실패했으니 이번 선택지 중 하나는 확실히 진짜 원인으로 이어지도록 설계하라 (그래도 노골적으로 티내지는 마라).' : ''}`;
    }
    return a === 0
      ? '해결 확인턴 — 원인 진단에 막 성공했다. narration 끝에서 "이 상황을 어떻게 해결하면 될까?"를 명확히 물어라. choices에는 해결 방법을 설명하는 완전한 문장 3개("~하면 해결된다" 형태)를 제시하고, 하나만 실제로 통하는 해결책이어야 한다. 이 선택지들은 반드시 이번 학습목표가 요구하는 판단과 직접 연결되어야 하며, 세 선택지 모두 같은 지점(같은 해결 대상)에 대한 것이어야 한다.'
      : `해결 확인턴 재시도 ${a}회째 — 아이는 방금 틀린 해결책을 골랐다. 그 해결책이 왜 안 통하는지 직접 설명하지 말고, 그것을 시도했을 때 벌어지는 구체적 실패 사건을 보여준 뒤, 같은 질문("이 상황을 어떻게 해결하면 될까?")에 다시 답하게 하라. 선택지는 여전히 같은 지점에 대한 해결 문장 3개여야 한다.${a >= 2 ? ' 이미 여러 번 실패했으니 이번엔 반드시 성공으로 이어지도록 선택지를 설계하라.' : ''}`;
  }

  // ===========================================================
  // 문제유형형 단계 지시문 (정답판별턴 c=0 → 이유판별턴 c=1 → 접근전략턴 c=2, 성공하면 완주)
  // ===========================================================
  function problemStageLabel(c, a) {
    if (c === 0) {
      return a === 0
        ? '정답판별턴 — 먼저 이번 학습목표에 해당하는 대표적인 실전 문제 유형을 하나 정하고, 그 유형의 정답 후보 1개와 그럴듯한 오답 후보 2개를 준비해 지금 세계관 상황에 자연스럽게 입혀라. narration 끝에서 "이 상황에서 어떤 것이 맞을까?"류의 질문을 명확히 던지고, choices에는 준비한 후보 3개(정답 1 + 오답 2)를 완성된 형태 그대로 제시하라 — 이 턴에서는 완성된 문장·형태·값을 노출하는 것이 정상이다.'
        : `정답판별턴 재시도 ${a}회째 — 아이는 방금 오답을 골랐다. 왜 틀렸는지 직접 설명하지 말고, 그 선택대로 진행했을 때 벌어지는 구체적 사건을 보여준 뒤 같은 질문에 다시 답하게 하라. 선택지는 같은 지점(같은 문제 유형)에 대한 후보 3개여야 한다.${a >= 2 ? ' 이미 여러 번 실패했으니 이번 선택지 중 하나는 확실히 정답으로 이어지도록 설계하라 (노골적으로 티내지는 마라).' : ''}`;
    }
    if (c === 1) {
      return a === 0
        ? '이유판별턴 — 방금 통과한 정답에 대해, narration 끝에서 "왜 그게 맞고 나머지는 왜 아닐까?"류의 질문을 명확히 던져라. choices에는 정답이 맞는 이유(또는 오답이 틀린 이유)를 설명하는 완전한 문장 3개를 제시하고, 하나만 실제로 정확한 이유여야 한다. 문법 용어·공식 명칭은 쓰지 말고 평이한 말로 풀어써라. 세 선택지 모두 같은 지점(같은 이유 판별)에 대한 것이어야 한다.'
        : `이유판별턴 재시도 ${a}회째 — 아이는 방금 틀린 이유를 골랐다. 그 이유가 왜 안 맞는지 직접 설명하지 말고, 그 오해를 사실이라 믿고 행동했을 때 벌어지는 사건을 보여준 뒤 같은 질문에 다시 답하게 하라.${a >= 2 ? ' 이미 여러 번 실패했으니 이번엔 반드시 성공으로 이어지도록 선택지를 설계하라.' : ''}`;
    }
    return a === 0
      ? '접근전략턴 — 방금 통과한 이유 판별 직후, narration 끝에서 "이런 유형은 앞으로 어떻게 접근하면 정답을 잘 찾을 수 있을까?"류의 질문을 명확히 던져라. choices에는 이번 문제 하나가 아니라 이 유형 전체에 재사용 가능한 풀이 전략을 설명하는 완전한 문장 3개를 제시하고, 하나만 실제로 효과적인 전략이어야 한다. 이 턴을 통과하면 이 과목이 완주된다.'
      : `접근전략턴 재시도 ${a}회째 — 아이는 방금 비효율적인 전략을 골랐다. 그 전략대로 다음 상황에 시도했을 때 여전히 헤매는 구체적 사건을 보여준 뒤 같은 질문을 다시 던져라.${a >= 2 ? ' 이미 여러 번 실패했으니 이번엔 반드시 성공으로 이어지도록 선택지를 설계하라.' : ''}`;
  }

  function stageLabelForMode(mode, c, a) {
    return mode === 'discovery' ? discoveryStageLabel(c, a) : problemStageLabel(c, a);
  }

  // 다음 과목을 새로 여는 시점의 첫 단계(0회째, 재시도 아님) 지시문.
  function openingStageLabel(mode) {
    return mode === 'discovery'
      ? '원인 진단턴 — narration 끝에서 "왜 이런 일이 벌어졌을까?"를 명확히 묻고, choices에는 그 원인을 설명하는 완전한 문장 3개("~때문에 그렇다" 형태, 하나만 진짜 원인, 세 선택지 모두 같은 지점에 대한 것)를 제시하라. 개념 이름·공식·정답 형태는 절대 등장시키지 마라.'
      : '정답판별턴 — 먼저 이번 학습목표에 해당하는 대표적인 실전 문제 유형을 하나 정하고, 그 유형의 정답 후보 1개와 그럴듯한 오답 후보 2개를 준비해 지금 세계관 상황에 자연스럽게 입혀라. narration 끝에서 "이 상황에서 어떤 것이 맞을까?"류의 질문을 명확히 던지고, choices에는 준비한 후보 3개(정답 1 + 오답 2)를 완성된 형태 그대로 제시하라.';
  }

  // ===========================================================
  // 이번 호출의 맥락(어느 과목·어떤 모드·어떤 단계·어떤 지시문)을 코드가 계산한다.
  // subjectJustResolved: 방금 아이가 선택을 한 과목 (최초 호출이면 undefined).
  // ===========================================================
  function buildTurnContext(subjectJustResolved) {
    const completed = trackCompletedTurnsRef.current;
    const attempts = trackAttemptsRef.current;
    const modes = subjectModesRef.current;

    // 방금 그 과목이 완전히 완주된 경우 (발견형=2턴, 문제유형형=3턴 성공)
    if (subjectJustResolved && completed[subjectJustResolved] >= maxTurnsForMode(modes[subjectJustResolved])) {
      const next = getActiveSubject(completed);
      if (next) {
        const nextMode = modes[next];
        return {
          activeTrack: next,
          subjectForModule: next,
          mode: nextMode,
          isDeficitPhase: true,
          phaseIndex: 0,
          sceneComplete: false,
          instruction: `"${SUBJECT_META[subjectJustResolved].label}" 과목이 방금 완주되었다. narration 안에서 그 완주를 짧게 매듭짓고, 곧바로 다음 과목인 "${SUBJECT_META[next].label}"의 새 단계를 열어라. active_track에는 "${next}"를 넣어라.
이번 "${SUBJECT_META[next].label}" 과목의 학습목표는 정확히 다음과 같다: ${sceneInfoRef.current.goalTexts[SUBJECT_META[next].goalKey]}
narration·origin_reason·choices는 반드시 이 학습목표를 다뤄야 한다. 프롬프트 속 모범 예시의 소재를 그대로 재사용하지 말고 이번 목표에 맞는 새로운 상황을 만들어라.
이번 턴: ${openingStageLabel(nextMode)} ${next !== 'english' ? 'narration과 선택지는 반드시 한국어로 작성하라 (직전 과목이 영어였더라도 지금은 한국어로 전환).' : '이 턴은 정답판별턴이므로 narration과 선택지는 반드시 영어로 작성하라.'}`
        };
      }
      return {
        activeTrack: subjectJustResolved,
        subjectForModule: null,
        mode: null,
        isDeficitPhase: false,
        phaseIndex: null,
        sceneComplete: true,
        instruction: `"${SUBJECT_META[subjectJustResolved].label}" 과목이 방금 완주되어 국어·영어·수학 세 과목이 모두 완주되었다. scene_complete를 true로 하고, 세 과목이 함께 마무리되는 짧은 결말 narration을 작성하라. choices는 빈 배열로 둬라.`
      };
    }

    const subject = subjectJustResolved || getActiveSubject(completed);
    const mode = modes[subject];
    const c = completed[subject];
    const a = attempts[subject];
    // 수학의 "결핍턴 선택지가 완성된 숫자여서는 안 된다" 검증은 발견형 원인진단턴에만 해당한다.
    // 문제유형형 정답판별턴에서는 완성된 값을 선택지로 주는 것이 정상이므로 여기서는 항상 false.
    const isDeficitPhase = mode === 'discovery' && c === 0;
    const stageLabel = stageLabelForMode(mode, c, a);

    // 영어 과목의 언어 지시는 발견형/문제유형형 공통이 아니라 턴(단계)마다 다르다:
    // 정답판별턴(c===0)은 전부 영어, 이유판별턴·접근전략턴(c>=1)은 한국어 뼈대 + 영어 원문 인용 혼용.
    let languageNote;
    if (subject !== 'english') {
      languageNote = '(narration과 선택지는 반드시 한국어로 작성하라. 직전 턴이 영어였더라도 지금은 한국어로 전환하라.)';
    } else if (mode === 'problem' && c >= 1) {
      languageNote = '(이 턴은 이유판별턴/접근전략턴이다. narration과 선택지의 뼈대는 한국어로 쓰되, 판별 대상이 되는 영어 표현은 절대 번역하지 말고 원문 그대로 인용해 문장 속에 남겨두어라. 통째로 한국어로만 쓰거나 통째로 영어로만 쓰면 안 된다 — 반드시 혼용하라.)';
    } else {
      languageNote = '(이 턴은 정답판별턴이다. narration과 선택지는 반드시 영어로 작성하라.)';
    }

    return {
      activeTrack: subject,
      subjectForModule: subject,
      mode,
      isDeficitPhase,
      phaseIndex: c,
      sceneComplete: false,
      instruction: `지금 담당할 과목은 "${SUBJECT_META[subject].label}"이다. active_track 필드에는 반드시 "${subject}"를 넣어라.
이번 "${SUBJECT_META[subject].label}" 과목의 학습목표는 정확히 다음과 같다: ${sceneInfoRef.current.goalTexts[SUBJECT_META[subject].goalKey]}
narration·origin_reason·choices는 반드시 이 학습목표를 다뤄야 한다. 이 목표와 무관한 다른 문법·개념·주제를 다루면 안 된다. 프롬프트 안에 참고용으로 실린 모범 예시는 서술 스타일과 밀도를 보여주기 위한 것일 뿐이니, 그 예시의 소재나 상황을 그대로 재사용하지 말고 이번 학습목표에 맞는 완전히 새로운 상황을 만들어라.
이번 턴: ${stageLabel} ${languageNote}`
    };
  }

  function buildSystemInstruction(ctx) {
    if (!ctx.subjectForModule) {
      return `${SYSTEM_PROMPT_COMMON_BASE}

[지금 이 턴의 지시]
${ctx.instruction}`;
    }
    const turnsBlock = ctx.mode === 'discovery' ? SYSTEM_PROMPT_TURNS_DISCOVERY : SYSTEM_PROMPT_TURNS_PROBLEM;
    const subjectModule = getSubjectPromptModule(ctx.subjectForModule, ctx.mode);
    return `${SYSTEM_PROMPT_COMMON_BASE}

${turnsBlock}

${subjectModule}

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
      if (ctx.isDeficitPhase && ctx.activeTrack === 'math' && parsed.choices && parsed.choices.length > 0) {
        const allNumericLike = parsed.choices.every(c => /^[\s0-9.\-\/,]+$/.test(c));
        if (allNumericLike) {
          problems.push('결핍턴인데 선택지가 완성된 숫자 답으로만 되어 있다. 결핍턴 선택지는 "어떤 전략으로 접근할지"를 고르는 것이어야지 이미 계산된 답이어서는 안 된다.');
        }
      }
    }

 if (ctx.activeTrack === 'math' && !ctx.sceneComplete && parsed.visual && Array.isArray(parsed.visual.graphs) && parsed.visual.graphs.length > 0) {
      // 그래프 일부가 비어있거나 formula가 깨진 것은 코드가 조용히 걸러내고 넘어간다(아래 정제 단계).
      // 여기서는 "쓸 수 있는 곡선이 하나도 없는 경우"만 진짜 실패로 잡아 재시도시킨다.
      let hasAnyValidCurve = false;
      parsed.visual.graphs.forEach((graph) => {
        if (!Array.isArray(graph.curves)) return;
        graph.curves.forEach((curve) => {
          if (!curve.formula || typeof curve.formula !== 'string') return;
          try {
            math.compile(curve.formula);
            hasAnyValidCurve = true;
          } catch (e) {
            // 개별 곡선 하나가 깨진 건 괜찮다 — 렌더링 단계에서 그 곡선만 건너뛴다.
          }
        });
      });
      if (!hasAnyValidCurve) {
        problems.push('visual.graphs가 있지만 그 안에 유효한 formula를 가진 곡선이 하나도 없다. 그래프로 그릴 게 없다면 visual 자체를 넣지 말고(null), 그릴 게 있다면 최소 한 개의 그래프에 최소 한 개의 유효한 curve(formula 포함)를 채워라.');
      }
    }

    const englishInPlay = ctx.subjectForModule === 'english' || ctx.activeTrack === 'english';
    if (englishInPlay && !ctx.sceneComplete) {
      // narration은 "쉬운 영어로 된 이야기 + 맨 끝 한국어 질문" 구조여야 한다.
      // 즉 영어가 이야기의 몸통을 이루고, 한국어는 마지막 질문 한두 문장에만 등장해야 한다.
      const englishText = narration + ' ' + choicesJoined;
      const hangulCount = (englishText.match(/[가-힣]/g) || []).length;
      const asciiLetterCount = (englishText.match(/[A-Za-z]/g) || []).length;
      if (hangulCount === 0) {
        problems.push('영어 턴인데 질문 문장이 한국어로 되어 있지 않다. narration 맨 끝의 질문(또는 이유를 묻는 문장)은 반드시 한국어로 작성하라.');
      }
      if (asciiLetterCount < 20) {
        problems.push('영어 턴인데 영어로 된 이야기가 너무 적다. narration의 대부분(상황 설명, 사건 전개)은 쉬운 영어 단문으로 직접 그려내고, 마지막 질문 문장만 한국어로 써라. 한국어로 이야기를 서술하고 영어 문장 하나만 따옴표로 인용하는 방식은 금지다.');
      }
      if (asciiLetterCount < hangulCount) {
        problems.push('영어 턴인데 narration이 한국어 위주로 쓰였다(국어 수업처럼 느껴짐). narration의 이야기 부분은 반드시 쉬운 영어 문장들로 작성하고, 한국어는 맨 끝 질문 문장에만 써라.');
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
      // narration이 질문 없이 상황 설명만 하고 곧장 선택지로 넘어가면, 아이 입장에서
      // 선택지가 뜬금없이 나온 것처럼 느껴진다. 언어 무관하게 "?" 존재 여부로 가볍게 확인.
      if (!narration.includes('?') && !narration.includes('？')) {
        problems.push('narration이 명확한 질문 없이 상황 설명만 하고 끝났다. 마지막 문장을 아이에게 직접 묻는 질문형으로 바꿔서, 뒤따르는 선택지가 그 질문에 대한 답으로 자연스럽게 이어지게 하라.');
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

    // 이 시점의 systemText는 이미 goals/levels 등 실제 선택값이 전부 치환 완료된 최종 문자열이다.
    // "선택한 값이 실제로 API 요청에 들어갔는지" 눈으로 확인할 수 있도록 그대로 콘솔에 출력한다.
    console.log('========================================');
    console.log('이번 호출에 실제로 전송되는 systemInstruction (이미 치환 완료된 최종 텍스트):');
    console.log(systemText);
    console.log('========================================');

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
      visual: result.visual || null,
      completedTurnsSnapshot: trackCompletedTurnsRef.current[result.active_track] ?? 0,
      attemptsSnapshot: trackAttemptsRef.current[result.active_track] ?? 0,
      maxTurnsSnapshot: maxTurnsForMode(subjectModesRef.current[result.active_track])
    }]);
  }

  // 과목별 완주 기준 턴수를 모드에 맞게 계산해 문자열로 보여준다. (발견형=2, 문제유형형=3)
  function maxTurnsSummary() {
    const modes = subjectModesRef.current;
    return JSON.stringify({
      korean: maxTurnsForMode(modes.korean),
      english: maxTurnsForMode(modes.english),
      math: maxTurnsForMode(modes.math)
    });
  }

  // ===========================================================
  // 프롬프트용 입력 메시지 빌더
  // ===========================================================
  function buildInitialUserMessage() {
    const info = sceneInfoRef.current;
    const ctx = buildTurnContext(undefined); // 첫 과목의 첫 단계(0/0)에서 시작
    const openingAction = ctx.mode === 'discovery'
      ? `곧바로 "${SUBJECT_META[ctx.activeTrack].label}" 과목의 결핍 상황을 겪게 한 뒤 원인 진단턴으로 들어가라`
      : `곧바로 "${SUBJECT_META[ctx.activeTrack].label}" 과목의 실전 문제 상황을 겪게 한 뒤 정답판별턴으로 들어가라`;
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
완료된 턴수: ${JSON.stringify(trackCompletedTurnsRef.current)} (과목별 완주 기준: ${maxTurnsSummary()})
이번 단계 시도 횟수: ${JSON.stringify(trackAttemptsRef.current)}
지금 담당할 과목: ${SUBJECT_META[ctx.activeTrack].label} (${ctx.activeTrack})

첫 단락(오프닝)을 생성하라. 아직 선택은 없었다. 새로운 허구의 세계관과 등장인물을 이번 응답에서 창작해 오프닝을 시작하고, ${openingAction}. JSON만 출력하라.`;
  }

  function buildChoiceUserMessage(choiceText, wasCorrect) {
    return `아이가 선택했다: "${choiceText}"

이 선택은 ${wasCorrect ? '성공 — 상황을 실제로 돌파하는 선택이었다' : '실패 — 그럴듯했지만 막다른 선택이었다'}.
지금까지의 대화(직전 장면, 등장인물, 세계관, 진행 상황)를 그대로 이어받아 다음 단락을 생성하라. 절대 새로 시작하지 말고, 방금 선택의 직접적 결과로 이어지는 사건을 전개하라.
완료된 턴수: ${JSON.stringify(trackCompletedTurnsRef.current)} (과목별 완주 기준: ${maxTurnsSummary()})
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
    const chosenOrder = SUBJECT_ORDER.filter(s => enabledSubjects[s]);
    if (chosenOrder.length === 0) {
      setErrorMsg('국어·영어·수학 중 최소 한 과목은 체크해야 합니다.');
      return;
    }
    subjectOrderRef.current = chosenOrder;

    const bookInfo = chapters.find(b => b.chapter === selectedChapter);

    // 실제로 어떤 목표가 선택됐고, GOALS_DATA에서 무엇이 조회됐는지 직접 눈으로 확인하기 위한 로그.
    console.log('========================================');
    console.log('선택된 goals 인덱스:', goals);
    console.log('국어 GOALS_DATA.kor[goals.kor]:', GOALS_DATA.kor?.[goals.kor], '(GOALS_DATA.kor 길이:', GOALS_DATA.kor?.length, ')');
    console.log('영어 GOALS_DATA.eng[goals.eng]:', GOALS_DATA.eng?.[goals.eng], '(GOALS_DATA.eng 길이:', GOALS_DATA.eng?.length, ')');
    console.log('수학 GOALS_DATA.math[goals.math]:', GOALS_DATA.math?.[goals.math], '(GOALS_DATA.math 길이:', GOALS_DATA.math?.length, ')');
    console.log('========================================');

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

    console.log('최종 goalTexts (프롬프트에 실제로 들어갈 문자열):', sceneInfoRef.current.goalTexts);

    // 과목별 모드(발견형/문제유형형)를 먼저 확정한다. 영어·수학은 항상 문제유형형,
    // 국어는 선택된 목표(mid)에 따라 자동 분기된다. 이 값은 장면이 끝날 때까지 고정된다.
    const subjectModes = {
      korean: computeSubjectMode('korean', goals),
      english: computeSubjectMode('english', goals),
      math: computeSubjectMode('math', goals)
    };
    subjectModesRef.current = subjectModes;
    console.log('과목별 모드(발견형/문제유형형):', subjectModes, '(국어 mid:', GOALS_DATA.kor[goals.kor]?.mid, ')');

    // 체크 해제된 과목은 completedTurns를 처음부터 그 과목의 완주 기준(모드별 2 또는 3)으로 두어,
    // getActiveSubject가 자동으로 건너뛴다.
    const initialCompleted = {
      korean: enabledSubjects.korean ? 0 : maxTurnsForMode(subjectModes.korean),
      english: enabledSubjects.english ? 0 : maxTurnsForMode(subjectModes.english),
      math: enabledSubjects.math ? 0 : maxTurnsForMode(subjectModes.math)
    };
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
      const maxForSubject = maxTurnsForMode(subjectModesRef.current[subject]);
      nextCompleted = { ...prevCompleted, [subject]: Math.min(maxForSubject, (prevCompleted[subject] || 0) + 1) };
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
  // 수학 시각 자료 렌더러 — 모델은 수식 문자열 하나만 내놓고, 코드가 mathjs로 안전하게
  // 계산해서 정확하게 그린다. 함수 종류(다항식/삼각/로그/지수/유리함수 등)가 늘어나도
  // 이 렌더러는 고칠 필요가 없다 — "x만 있는 식(explicit)"과 "x,y가 섞인 식(implicit,
  // 원·타원·쌍곡선 등)" 두 갈래만 처리하면 되기 때문이다.
  // ===========================================================
  function sampleExplicitCurve(compiled, xMin, xMax, yMin, yMax, steps = 200) {
    const pts = [];
    const dx = (xMax - xMin) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      let y;
      try { y = compiled.evaluate({ x }); } catch (e) { y = null; }
      if (typeof y === 'number' && Number.isFinite(y) && y >= yMin && y <= yMax) {
        pts.push([x, y]);
      }
    }
    return pts;
  }

  // 음함수(F(x,y)=0)의 근사 해를 찾는다: 각 x열마다 y를 촘촘히 훑으며 F의 부호가
  // 바뀌는 지점을 선형보간으로 잡아낸다. 원·타원·쌍곡선 등 어떤 이차곡선이 와도
  // 이 방식 하나로 처리된다.
  function sampleImplicitCurve(compiled, xMin, xMax, yMin, yMax, xSteps = 140, ySteps = 140) {
    const pts = [];
    const dx = (xMax - xMin) / xSteps;
    const dy = (yMax - yMin) / ySteps;
    for (let i = 0; i <= xSteps; i++) {
      const x = xMin + i * dx;
      let prevVal = null;
      let prevY = null;
      for (let j = 0; j <= ySteps; j++) {
        const y = yMin + j * dy;
        let val;
        try { val = compiled.evaluate({ x, y }); } catch (e) { val = null; }
        if (typeof val === 'number' && Number.isFinite(val) && typeof prevVal === 'number' && Number.isFinite(prevVal)) {
          if ((prevVal < 0) !== (val < 0)) {
            const t = prevVal / (prevVal - val);
            pts.push([x, prevY + t * (y - prevY)]);
          }
        }
        prevVal = val;
        prevY = y;
      }
    }
    return pts;
  }

  function renderSingleGraph(graph, key) {
    if (!graph || !Array.isArray(graph.curves) || graph.curves.length === 0) return null;

    const W = 280, H = 280, PAD = 24;
    const [xMin, xMax] = graph.xRange && graph.xRange.length === 2 ? graph.xRange : [-10, 10];
    const [yMin, yMax] = graph.yRange && graph.yRange.length === 2 ? graph.yRange : [-10, 10];

    const sx = (x) => PAD + ((x - xMin) / (xMax - xMin)) * (W - 2 * PAD);
    const sy = (y) => H - PAD - ((y - yMin) / (yMax - yMin)) * (H - 2 * PAD);

    const gridLines = [];
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      gridLines.push(<line key={`gx${gx}`} x1={sx(gx)} y1={sy(yMin)} x2={sx(gx)} y2={sy(yMax)} stroke="#e5e5e5" strokeWidth="1" />);
    }
    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy++) {
      gridLines.push(<line key={`gy${gy}`} x1={sx(xMin)} y1={sy(gy)} x2={sx(xMax)} y2={sy(gy)} stroke="#e5e5e5" strokeWidth="1" />);
    }
    const axes = (
      <>
        <line x1={sx(xMin)} y1={sy(0)} x2={sx(xMax)} y2={sy(0)} stroke="#999" strokeWidth="1.5" />
        <line x1={sx(0)} y1={sy(yMin)} x2={sx(0)} y2={sy(yMax)} stroke="#999" strokeWidth="1.5" />
      </>
    );

  const content = graph.curves.map((curve, i) => {
      const color = curve.color || (i === 0 ? '#3b6d11' : '#d85a30');
      let compiled;
      try {
        compiled = math.compile(curve.formula || '0');
      } catch (e) {
        return null;
      }

      if (curve.kind === 'implicit') {
        const pts = sampleImplicitCurve(compiled, xMin, xMax, yMin, yMax);
        return (
          <g key={i}>
            {pts.map(([x, y], pi) => (
              <circle key={pi} cx={sx(x)} cy={sy(y)} r="1.6" fill={color} />
            ))}
            {curve.label && pts.length > 0 && (
              <text x={sx(pts[pts.length - 1][0])} y={sy(pts[pts.length - 1][1]) - 6} fontSize="11" fill={color} textAnchor="middle">{curve.label}</text>
            )}
          </g>
        );
      }

      const pts = sampleExplicitCurve(compiled, xMin, xMax, yMin, yMax);
      return (
        <g key={i}>
          <polyline points={pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5" />
          {curve.label && pts.length > 0 && (
            <text x={sx(pts[pts.length - 1][0]) - 4} y={sy(pts[pts.length - 1][1]) - 6} fontSize="11" fill={color} textAnchor="end">{curve.label}</text>
          )}
        </g>
      );
    });
 return (
      <div key={key} style={{ display: 'inline-block', margin: '4px' }}>
        {graph.title && <div style={{ fontSize: '12px', color: '#5f5e5a', marginBottom: '2px', textAlign: 'center' }}>{graph.title}</div>}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ background: '#fff', border: '1px solid #ddd8ca', borderRadius: '8px' }}>
          {gridLines}
          {axes}
          {content}
        </svg>
      </div>
    );
  }

 function renderMathVisual(visual) {
    if (!visual || !Array.isArray(visual.graphs) || visual.graphs.length === 0) return null;
    // curves가 비어있거나 formula가 아예 없는 그래프는 조용히 걸러내고,
    // 실제로 그릴 수 있는 그래프만 화면에 낸다 (깨진 곡선 하나는 renderSingleGraph 내부에서 개별적으로 건너뛴다).
    const usableGraphs = visual.graphs.filter(g => Array.isArray(g.curves) && g.curves.some(c => c.formula));
    if (usableGraphs.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {usableGraphs.map((graph, i) => renderSingleGraph(graph, i))}
      </div>
    );
  }

  // ===========================================================
  // 텍스트 안의 $...$ 로 감싸진 LaTeX 수식만 KaTeX로 렌더링하고, 나머지 일반 텍스트는 그대로 둔다.
  // ===========================================================
  function renderTextWithMath(text) {
    if (!text) return null;
    const parts = String(text).split(/(\$[^$]+\$)/g);
    return parts.map((part, i) => {
      if (part.length > 2 && part.startsWith('$') && part.endsWith('$')) {
        const expr = part.slice(1, -1);
        try {
          const html = katex.renderToString(expr, { throwOnError: false, displayMode: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          return <span key={i}>{part}</span>;
        }
      }
      return <span key={i}>{part}</span>;
    });
  }

  // ===========================================================
  // 렌더링 헬퍼
  // ===========================================================
  function getDisplayStatus(subject) {
    const c = trackCompletedTurns[subject];
    const a = trackAttempts[subject];
    const max = maxTurnsForMode(subjectModesRef.current[subject]);
    if (c >= max) return '완주';
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
            <div className="goal-tag tag-kor" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={enabledSubjects.korean}
                onChange={(e) => setEnabledSubjects({ ...enabledSubjects, korean: e.target.checked })}
              />
              국어
            </div>
            <div style={{ opacity: enabledSubjects.korean ? 1 : 0.4 }}>
              <select disabled={!enabledSubjects.korean} value={goals.kor} onChange={(e) => setGoals({ ...goals, kor: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.kor.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">
                {goalFullText('kor', GOALS_DATA.kor[goals.kor])}
                {' '}
                <span className="mode-badge">
                  [{computeSubjectMode('korean', goals) === 'discovery' ? '발견형 · 2단계' : '문제유형형 · 3단계'}]
                </span>
              </div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      type="button"
                      disabled={!enabledSubjects.korean}
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
            <div className="goal-tag tag-eng" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={enabledSubjects.english}
                onChange={(e) => setEnabledSubjects({ ...enabledSubjects, english: e.target.checked })}
              />
              영어
            </div>
            <div style={{ opacity: enabledSubjects.english ? 1 : 0.4 }}>
              <select disabled={!enabledSubjects.english} value={goals.eng} onChange={(e) => setGoals({ ...goals, eng: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.eng.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">
                {goalFullText('eng', GOALS_DATA.eng[goals.eng])}
                {' '}
                <span className="mode-badge">[문제유형형 · 3단계]</span>
              </div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      type="button"
                      disabled={!enabledSubjects.english}
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
            <div className="goal-tag tag-math" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={enabledSubjects.math}
                onChange={(e) => setEnabledSubjects({ ...enabledSubjects, math: e.target.checked })}
              />
              수학
            </div>
            <div style={{ opacity: enabledSubjects.math ? 1 : 0.4 }}>
              <select disabled={!enabledSubjects.math} value={goals.math} onChange={(e) => setGoals({ ...goals, math: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.math.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">
                {goalFullText('math', GOALS_DATA.math[goals.math])}
                {' '}
                <span className="mode-badge">[문제유형형 · 3단계]</span>
              </div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      type="button"
                      disabled={!enabledSubjects.math}
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
            {enabledSubjects.korean && <div className={pillClass('korean')}>국어</div>}
            {enabledSubjects.english && <div className={pillClass('english')}>영어</div>}
            {enabledSubjects.math && <div className={pillClass('math')}>수학</div>}
          </div>

          <div id="storyLog">
            {storyLogs.map((log, logIdx) => (
              <React.Fragment key={logIdx}>
                <div className="debug-strip">
                  <b>[테스트용 디버그]</b> 현재 트랙: <b>{trackLabel(log.activeTrack)}</b>
                  {!log.sceneComplete && (
                    <> (완료 턴 {log.completedTurnsSnapshot}/{log.maxTurnsSnapshot} · 이번 단계 시도 {log.attemptsSnapshot + 1}회째)</>
                  )}
                  {log.originReason && (
                    <><br /><b>설계 메모(비공개):</b> {log.originReason}</>
                  )}
                </div>

                <div className="story-card">
                  {log.narration.split('\n\n').filter(p => p.trim()).map((p, pIdx) => (
                    <p key={pIdx}>{renderTextWithMath(p.trim())}</p>
                  ))}
                  {log.activeTrack === 'math' && renderMathVisual(log.visual)}
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
                        {cIdx + 1}. {renderTextWithMath(choice)}
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