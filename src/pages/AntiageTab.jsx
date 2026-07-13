import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Mafs, Coordinates, Plot, Point, Line, Vector, Circle, Theme, MovablePoint } from 'mafs';
import 'mafs/core.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {

  SYSTEM_PROMPT_COMMON_BASE,
  SYSTEM_PROMPT_TURNS_DISCOVERY,
  SYSTEM_PROMPT_TURNS_PROBLEM,
  SYSTEM_PROMPT_KOR_DISCOVERY,
  SYSTEM_PROMPT_KOR_PROBLEM,
  SYSTEM_PROMPT_ENG_PROBLEM,
  SYSTEM_PROMPT_MATH_PROBLEM,
  VIZ_PROMPT_MAFS_FUNCTION,
  VIZ_PROMPT_MAFS_SHAPE,
  VIZ_PROMPT_MAFS_VECTOR,
  VIZ_PROMPT_MAFS_AREA,
  VIZ_PROMPT_MAFS_DISCRETE,
  VIZ_PROMPT_BAR_CHART,
  VIZ_PROMPT_VENN,
  VIZ_PROMPT_PSEUDO3D,
  VIZ_PROMPT_MATRIX,
  KOR_DISCOVERY_MIDS
} from './constants';
import {
  GOALS_DATA,
  BOOKS_DATA
} from './constantsbase';
// 학습목표별 전용 인터랙티브 장치 — deviceType으로 분기해서 쓴다(현재는 no.1 부정형 극한만).
import { renderDevice_no1 } from './math/mathDevice_no1';

// vizType(문자열) → 그 시각화에 필요한 프롬프트 블록 매핑.
// "narration"은 일부러 빠져 있다 — narration 타입은 시각 자료 지시 자체를 붙이지 않는다.
const VIZ_PROMPT_BY_TYPE = {
  mafs_function: VIZ_PROMPT_MAFS_FUNCTION,
  mafs_shape: VIZ_PROMPT_MAFS_SHAPE,
  mafs_vector: VIZ_PROMPT_MAFS_VECTOR,
  mafs_area: VIZ_PROMPT_MAFS_AREA,
  mafs_discrete: VIZ_PROMPT_MAFS_DISCRETE,
  bar_chart: VIZ_PROMPT_BAR_CHART,
  venn: VIZ_PROMPT_VENN,
  pseudo3d: VIZ_PROMPT_PSEUDO3D,
  matrix: VIZ_PROMPT_MATRIX
};

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

// visual과 device_visual이 공유하는 형태 정의 (9종 vizType을 아우르는 범용 구조).
// device_visual은 "2단계 장치"(저울 등)를 실제로 화면에 그리기 위한 필드로, visual과 완전히
// 같은 형태를 쓴다 — 장치도 결국 mafs_shape 등 9종 중 하나로 표현되는 그림이기 때문이다.
const VISUAL_SHAPE_PROPERTIES = {
  kind: {
    type: 'STRING',
    enum: ['mafs_function', 'mafs_shape', 'mafs_vector', 'mafs_area', 'mafs_discrete', 'bar_chart', 'venn', 'pseudo3d', 'matrix']
  },
  xRange: { type: 'ARRAY', items: { type: 'NUMBER' } },
  yRange: { type: 'ARRAY', items: { type: 'NUMBER' } },
  curves: {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        kind: { type: 'STRING', enum: ['explicit', 'implicit'] },
        // formula는 "y=", "x=" 없이 순수 수식 문자열만 담는다 (예: "3*x+2"). 절대 여기에 설명·추론
        // 과정을 쓰지 마라 — 이 필드는 mathjs가 그대로 계산에 쓰는 값이다.
        formula: { type: 'STRING', maxLength: 60 },
        // deviceType "limit_approach"(부정형 극한 전용)에서만 쓴다: 이 곡선이 정의되지 않는
        // 지점(예: 0/0이 되는 x)의 x좌표를 숫자로만 알려준다. 예전엔 분자식·분모식을 문자열로
        // 따로 받았는데, 모델이 formula와 같은 내용을 또 쓰라고 하면 무의미한 항을 반복하며
        // 폭주하는 사고가 반복돼서, 반복 위험이 없는 숫자 하나로 바꿨다.
        targetX: { type: 'NUMBER', nullable: true },
        // label은 그래프에 짧게 표시될 이름표일 뿐이다(예: "A", "①"). 절대 여기에 설명·추론
        // 과정이나 수식을 길게 풀어쓰지 마라 — 15자 넘는 텍스트는 전부 잘려나가 화면이 깨진다.
        label: { type: 'STRING', maxLength: 15 },
        color: { type: 'STRING' },
        forChoiceIndex: { type: 'INTEGER', nullable: true }
      },
      required: ['kind', 'formula']
    }
  },
  // mafs_shape에서 저울(balance)로 쓸 때: points[0]=받침점(고정), points[1]=왼쪽 접시(고정 x, 초기 y),
  // points[2]=오른쪽 접시(고정 x, 초기 y) — 이 순서 규칙을 저울↔그래프 연동 렌더러가 그대로 사용한다.
  // (4번째 점부터는 받침대·장식 등 자유롭게 추가 가능 — 렌더러는 점 개수·모양을 전혀 정하지 않는다.)
  points: {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        x: { type: 'NUMBER' },
        y: { type: 'NUMBER' },
        label: { type: 'STRING', maxLength: 15 },
        forChoiceIndex: { type: 'INTEGER', nullable: true }
      },
      required: ['x', 'y']
    }
  },
  // segments는 좌표를 직접 담지 않는다 — points 배열의 몇 번째 점과 몇 번째 점을 잇는 선인지
  // "인덱스"로만 표현한다(0부터 시작). 렌더러는 이 인덱스로 points 배열에서 현재 좌표를 찾아
  // 선을 그릴 뿐, "이건 빔이다/줄이다" 같은 의미를 전혀 모른다 — 어떤 점을 몇 개 만들고
  // 어떻게 이을지는 전부 네(모델)가 points/segments 데이터로 결정한다.
  segments: {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        fromPoint: { type: 'INTEGER' },
        toPoint: { type: 'INTEGER' },
        label: { type: 'STRING', maxLength: 15 },
        color: { type: 'STRING' },
        forChoiceIndex: { type: 'INTEGER', nullable: true }
      },
      required: ['fromPoint', 'toPoint']
    }
  },
  vectors: {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        x1: { type: 'NUMBER' },
        y1: { type: 'NUMBER' },
        x2: { type: 'NUMBER' },
        y2: { type: 'NUMBER' },
        label: { type: 'STRING', maxLength: 15 },
        color: { type: 'STRING' }
      },
      required: ['x1', 'y1', 'x2', 'y2']
    }
  },
  shadeFormula: { type: 'STRING', maxLength: 60 },
  shadeXMin: { type: 'NUMBER' },
  shadeXMax: { type: 'NUMBER' },
  bars: {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        label: { type: 'STRING', maxLength: 15 },
        value: { type: 'NUMBER' }
      },
      required: ['label', 'value']
    }
  },
  vennLabelA: { type: 'STRING', maxLength: 15 },
  vennLabelB: { type: 'STRING', maxLength: 15 },
  vennOnlyA: { type: 'NUMBER' },
  vennOnlyB: { type: 'NUMBER' },
  vennBoth: { type: 'NUMBER' },
  solidType: { type: 'STRING', enum: ['cube', 'cylinder', 'cone', 'sphere'] },
  dims: { type: 'ARRAY', items: { type: 'NUMBER' } },
  solidLabel: { type: 'STRING', maxLength: 15 },
  matrixRows: {
    type: 'ARRAY',
    items: { type: 'ARRAY', items: { type: 'NUMBER' } }
  }
};

// Gemini 구조 강제용 JSON 스키마. track_status는 더 이상 모델이 자체 보고하지 않는다 —
// 턴 진행(완료 여부)은 코드가 "선택 인덱스 === correct_index" 비교로 직접 판정한다.
//
// visual/device_visual 필드는 vizType(9종)을 아우르는 범용 구조다. 실제로 어떤 하위 필드를
// 채울지는 이번 학습목표의 vizType/deviceType으로 이미 정해져 있다.
const SCENE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    origin_reason: { type: 'STRING' },
    active_track: { type: 'STRING', enum: ['korean', 'english', 'math'] },
    narration: { type: 'STRING' },
    choices: { type: 'ARRAY', items: { type: 'STRING' } },
    correct_index: { type: 'INTEGER' },
    scene_complete: { type: 'BOOLEAN' },
    // 2단계 "장치"(저울 등)를 실제로 화면에 그리는 필드. deviceType이 "none"이면 채우지 않는다.
    device_visual: {
      type: 'OBJECT',
      nullable: true,
      properties: VISUAL_SHAPE_PROPERTIES,
      required: ['kind']
    },
    // 3단계 최종 그래프. vizType이 "narration"이 아니면 반드시 채운다.
    visual: {
      type: 'OBJECT',
      nullable: true,
      properties: VISUAL_SHAPE_PROPERTIES,
      required: ['kind']
    }
  },
  required: ['origin_reason', 'active_track', 'narration', 'choices', 'correct_index', 'scene_complete']
};

export default function SceneGeneratorEngine() {
  const GEMINI_API_KEY = "AQ.Ab8RN6Jwrwo7TruQDJhlsuTuEg5v6AJmeI7hCvdLcijHwIGNig";
  const GEMINI_MODEL = "gemini-3.1-flash-lite";

    // const GEMINI_MODEL = "gemini-3.1-flash";

  // 콘솔 노이즈 제어. false면 systemInstruction 전체/응답 전체 JSON 같은 장황한 로그는 찍지 않고,
  // "서버가 이번 턴에 visual을 실제로 뭘 보냈는지"만 요약해서 보여주는 로그(디버그 요약, 항상 출력)만 남는다.
  // 시스템 프롬프트 자체를 눈으로 확인해야 할 때만 true로 바꿔서 써라.
  const DEBUG_VERBOSE = false;

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
  // 저울↔그래프 연동용 공유 x값. logIdx별로 하나씩 유지 — 저울 접시를 끌든 그래프 점을 끌든
  // 같은 이 값을 갱신하고, 양쪽 다 이 값을 읽어서 자기 모습을 다시 그린다.
  const [sharedXByLog, setSharedXByLog] = useState({});
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
  // 이번 장면의 수학 목표가 어떤 vizType을 쓰는지. startScene에서 GOALS_DATA.math[goals.math].vizType로 채워지고 고정된다.
  const mathVizTypeRef = useRef('narration');
  // 이번 장면 수학 목표의 deviceType(2단계 장치 종류, 없으면 'none'). startScene에서 채워지고 고정된다.
  const mathDeviceTypeRef = useRef('none');
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
    if (!item) return `[[경고: ${subject} 학습목표 데이터를 찾지 못했습니다 — GOALS_DATA.${subject}[선택한 인덱스]가 undefined입니다. constantsbase.ts의 GOALS_DATA 배열 개수/구조를 확인하세요]]`;
    if (!item.title) {
      console.warn(`goalFullText: ${subject} 항목에 title 필드가 없습니다.`, item);
    }
    if (subject === 'math') {
      const deviceNote = (item.deviceType && item.deviceType !== 'none')
        ? ` / 중간 장치: ${item.deviceType === 'balance' ? '양팔저울(등식·평형 비유)' : item.deviceType === 'area_split' ? '넓이 분할(도형으로 먼저 확인)' : item.deviceType}`
        : '';
      const graphRuleNote = item.graphRule ? ` / ${item.graphRule}` : '';
      return `${item.title || '(제목 없음)'} (${item.part || ''} ${item.category || ''}, 난이도 ${item.difficulty || ''}) — 출제 경향: ${item.trend || ''}${deviceNote}${graphRuleNote}`;
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

  // math 턴일 때만, 이번 장면의 고정된 vizType에 맞는 시각 자료 지시 블록을 골라준다.
  // vizType이 "narration"이거나 매핑이 없으면 null(=지시 블록 없음, visual 생략).
  function getVizPromptBlock(ctx) {
    if (ctx.activeTrack !== 'math' || ctx.sceneComplete) return null;
    const vizType = mathVizTypeRef.current;
    return VIZ_PROMPT_BY_TYPE[vizType] || null;
  }

  // deviceType이 "none"이 아니면, 2단계 장치도 device_visual 필드로 실제로 그리라는 지시를 추가한다.
  // deviceType이 "balance"(양팔저울)면, 저울↔그래프 인터랙티브 연동 렌더러가 그대로 쓸 수 있도록
  // points 순서 규칙(0=받침점, 1=왼쪽 접시, 2=오른쪽 접시)과 visual.curves가 정확히 2개여야 한다는
  // 제약까지 명시한다 — 이 조건이 맞아야 코드가 저울과 그래프를 실시간으로 연동시켜준다.
  function getDeviceVisualPromptBlock(ctx) {
    if (ctx.activeTrack !== 'math' || ctx.sceneComplete) return null;
    const deviceType = mathDeviceTypeRef.current;
    if (!deviceType || deviceType === 'none') return null;
    // "limit_approach"는 device_visual을 아예 안 쓴다 — 장치(막대)까지 visual.curves 안의
    // numerFormula/denomFormula로 전부 표현되므로, 여기서 별도 지시를 붙이지 않는다
    // (그 지시는 VIZ_PROMPT_MAFS_FUNCTION 쪽에 이미 들어있는 MATH_GOAL.graphRule로 충분하다).
    if (deviceType === 'limit_approach') return null;

    if (deviceType === 'balance') {
      return `[이번 턴의 2단계 장치 지시: 양팔저울을 device_visual에 실제로 그려라]
narration 초반에 양팔저울(또는 그와 동등한 평형 비유) 장면을 등장시키고, 그 장면을 device_visual 필드로 실제로 그려야 한다(말로만 묘사하고 끝내지 마라 — 화면에 그려져야 아이가 손으로 만질 수 있다).

중요: 렌더러(코드)는 어떤 모양을 그릴지 전혀 정하지 않는다 — points와 segments에 있는 데이터를 그대로 그릴 뿐이다. "이게 저울대다", "이게 받침대다" 같은 의미는 코드가 모른다. 그러니 저울처럼 보이게 만드는 모든 선(저울대, 접시를 매단 줄, 받침대 등)을 반드시 네가 segments에 직접 채워야 화면에 나타난다 — 하나라도 안 채우면 그 선은 안 보인다.

device_visual 형식:
- kind: "mafs_shape"
- points: 최소 3개. 앞의 3개는 반드시 이 순서로 고정 — [0] 받침점(저울의 중심, 고정 좌표), [1] 왼쪽 접시(고정 x좌표, 초기 y좌표), [2] 오른쪽 접시(고정 x좌표, 초기 y좌표). 세 점 모두 label을 채워라(예: "받침점", "A요금", "B요금"). 이후 3번, 4번... 점을 자유롭게 추가해서 받침대 다리 끝, 기둥 아래쪽 등 장식용 좌표를 표현해도 된다.
- segments: 각 항목은 좌표가 아니라 "몇 번 점과 몇 번 점을 잇는가"(fromPoint, toPoint — points 배열의 인덱스, 0부터 시작)로 표현한다. 반드시 다음을 포함하라:
  · {fromPoint: 1, toPoint: 2} — 저울대(빔). 코드는 이 두 점의 실시간 위치를 이어서 자동으로 기울어지게 그린다(너는 좌표를 안 넣어도 된다, 인덱스만 맞으면 된다).
  · {fromPoint: 0, toPoint: 1} 와 {fromPoint: 0, toPoint: 2} — 접시를 매단 줄.
  · 그 외 받침대(다리·기둥 등)는 0번 점(또는 네가 추가한 3번,4번... 점)을 서로 이어서 자유롭게 구성하라. 예: 3번·4번 점을 받침대 다리 끝으로 두고 {fromPoint: 0, toPoint: 3}, {fromPoint: 0, toPoint: 4}.
  · segments의 label/color도 자유롭게 채워도 된다(선택).
- xRange, yRange: 저울 전체(받침대 포함)가 잘 보이는 범위로, 받침점보다 아래쪽 공간을 충분히 남겨라(예: 받침점 y좌표보다 2~3만큼 더 아래까지).

이 장치는 이후 아이가 오른쪽 접시(점 인덱스 2번, {fromPoint:1,toPoint:2} 선의 오른쪽 끝)를 직접 드래그해서 움직이면, 코드가 자동으로 그 조작을 3단계의 최종 그래프(visual)와 실시간으로 연동시켜준다 — 저울이 기울어진 정도가 곧 두 그래프(visual.curves[0]와 curves[1])의 y값 차이와 정확히 같아지도록 코드가 계산한다. 이 연동이 되려면 visual.curves가 정확히 2개여야 한다(더 많거나 적으면 연동이 안 켜진다).`;
    }

    if (deviceType === 'area_split') {
      return `[이번 턴의 2단계 장치 지시: 넓이 분할 도형을 device_visual에 실제로 그려라]
narration 초반에 큰 직사각형을 두 조각으로 나누는 장면을 등장시키고, 그 장면을 device_visual 필드로 실제로 그려야 한다.
device_visual 형식:
- kind: "mafs_shape"
- points: 전체 직사각형의 네 꼭짓점 + 나누는 경계선 위 점 (각각 label 포함, 순서대로 인덱스 0,1,2,3...이 매겨진다)
- segments: 좌표가 아니라 points 배열의 인덱스로 "몇 번 점과 몇 번 점을 잇는가"(fromPoint, toPoint)를 적는다. 직사각형의 둘레(네 변)와 나누는 경계선을 전부 이 방식으로 채워라. 예: 꼭짓점이 0,1,2,3이고 나누는 점이 4,5라면 [{fromPoint:0,toPoint:1}, {fromPoint:1,toPoint:2}, {fromPoint:2,toPoint:3}, {fromPoint:3,toPoint:0}, {fromPoint:4,toPoint:5}].
- xRange, yRange: 도형 전체가 잘 보이는 범위.`;
    }

    return `[이번 턴의 2단계 장치 지시]
narration 초반에 이번 개념의 물리적 장치(중간 도구) 장면을 등장시키고, 그 장면을 device_visual 필드로 실제로 그려라 — 말로만 묘사하고 끝내지 마라. device_visual의 kind는 mafs_function/mafs_shape/mafs_vector/mafs_area/mafs_discrete/bar_chart/venn/pseudo3d/matrix 중 이 장치를 가장 잘 표현하는 것을 자유롭게 골라라. 반드시 kind에 맞는 실제 데이터(points/curves/bars 등)도 함께 채워라.`;
  }

  function buildSystemInstruction(ctx) {
    const vizBlock = getVizPromptBlock(ctx);
    const deviceBlock = getDeviceVisualPromptBlock(ctx);
    const vizSection = vizBlock ? `\n\n${vizBlock}` : '';
    const deviceSection = deviceBlock ? `\n\n${deviceBlock}` : '';
    // curves/points/label 등에 사고 과정을 그대로 쏟아붓는 실패 사례가 실제로 있었다 — 강하게 막는다.
    const fieldHygieneWarning = (vizBlock || deviceBlock) ? `

[필드 작성 규칙 — 절대 위반 금지, 실제로 있었던 실패 사례]
visual/device_visual 안의 curves[].formula, curves[].label, points[].label 같은 필드는 전부 화면에 그대로 노출되는 짧은 값이다. 여기에 "~로 표현됩니다", "~라고 가정하면", "선택지 0번이 정답이므로" 같은 설명·추론 과정을 절대 쓰지 마라.
- formula는 mathjs가 그대로 계산할 순수 수식 문자열만 담는다. 최대 60자. 예: 옳음="3*x+2", 틀림="A요금제: 3x+2 (y=3x+2로 표현됨, 기울기 3)"
- label은 그래프에 표시될 짧은 이름표만 담는다. 최대 15자. 예: 옳음="A", "①", 틀림="A사 비용 함수로 추정되는 직선형 요금 체계 모델(y=3x)"
- 계산 과정이나 왜 이 값을 골랐는지는 이 필드들이 아니라 오직 origin_reason이나 네 생각 속에서만 정리하고, JSON의 위 필드들에는 최종 값만 깔끔하게 넣어라.` : '';

    if (!ctx.subjectForModule) {
      return `${SYSTEM_PROMPT_COMMON_BASE}

[지금 이 턴의 지시]
${ctx.instruction}${vizSection}${deviceSection}${fieldHygieneWarning}`;
    }
    const turnsBlock = ctx.mode === 'discovery' ? SYSTEM_PROMPT_TURNS_DISCOVERY : SYSTEM_PROMPT_TURNS_PROBLEM;
    const subjectModule = getSubjectPromptModule(ctx.subjectForModule, ctx.mode);
    return `${SYSTEM_PROMPT_COMMON_BASE}

${turnsBlock}

${subjectModule}

[지금 이 턴의 지시]
${ctx.instruction}${vizSection}${deviceSection}${fieldHygieneWarning}`;
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

  // LaTeX 명령어(\frac, \sqrt, \times, \right 등)는 백슬래시+영문자로 시작하는데,
  // 그중 \f(폼피드)·\t(탭)·\r(캐리지리턴)·\b(백스페이스)는 JSON에서 "유효한" 이스케이프라서,
  // 모델이 실수로 \\frac(이중 백슬래시)가 아니라 \frac(단일 백슬래시)로 쓰면 JSON.parse가
  // \f를 조용히 제어문자로 먹어버려 "frac"의 f가 사라지고 "rac"만 남는 등 LaTeX가 깨진다.
  // (\sqrt처럼 \s가 아예 유효하지 않은 이스케이프인 경우는 파싱 자체가 실패해서 재시도라도 되지만,
  //  \f/\t/\r/\b는 "유효한" 이스케이프라 에러 없이 조용히 깨져서 더 위험하다.)
  // 그래서 JSON.parse를 시도하기 전에, 문자열 리터럴 안에서 \n(의도된 실제 줄바꿈)과 \"·\\·\/·\u
  // 를 제외한 나머지 백슬래시+영문자 시퀀스는 전부 이중 백슬래시로 미리 교정해둔다.
  function fixLatexBackslashes(text) {
    let out = '';
    let inString = false;
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (!inString) {
        out += ch;
        if (ch === '"') inString = true;
        i++;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        i++;
        continue;
      }
      if (ch === '\\') {
        const next = text[i + 1];
        // \n(실제 줄바꿈 의도), \"·\\·\/·\u(정상적인 JSON 이스케이프)는 그대로 둔다.
        if (next === 'n' || next === '"' || next === '\\' || next === '/' || next === 'u') {
          out += ch + (next === undefined ? '' : next);
          i += 2;
          continue;
        }
        if (next === undefined) { out += ch; i++; continue; }
        // 그 외(LaTeX 명령어의 시작일 가능성이 높은 \f, \t, \r, \b, \s, \l, ... )는 이중 이스케이프로 교정.
        out += '\\\\' + next;
        i += 2;
        continue;
      }
      out += ch;
      i++;
    }
    return out;
  }

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
    const fixed = fixLatexBackslashes(clean);
    try {
      return JSON.parse(fixed);
    } catch (e1) {
      try {
        return JSON.parse(sanitizeJSONText(fixed));
      } catch (e2) {
        throw e1;
      }
    }
  }

  // ===========================================================
  // 내용 검증 — 코드가 직접 확인. active_track 불일치, 수학 LaTeX 사용,
  // 결핍턴인데 선택지가 완성된 숫자 답인 경우, 영어 턴인데 한국어 위주인 경우를 잡아낸다.
  // ===========================================================
  // ===========================================================
  // 시각 자료(visual)만 따로 검증한다 — 그래프 하나 때문에 학습 진행 전체가 막히면 안 되므로,
  // 이 검증에서 나온 문제는 getSceneUpdate에서 "마지막 시도에도 안 고쳐지면 그냥 넘어가는"
  // 관대한 처리 대상이다. active_track/narration/choices 같은 핵심 검증(validateTurnContent)과는
  // 분리해서, 시각 자료 실패가 학습 흐름 자체를 막지 않도록 한다.
  // ===========================================================
  function validateVisualContent(ctx, parsed) {
    const problems = [];
    if (ctx.activeTrack !== 'math' || ctx.sceneComplete) return problems;

    const vizType = mathVizTypeRef.current;
    if (vizType === 'narration') {
      if (parsed.visual) {
        problems.push('이번 학습목표는 vizType이 "narration"이라 visual 필드를 아예 넣지 말아야 하는데 채워져 있다. visual을 생략하라(null 또는 필드 자체 삭제).');
      }
      return problems;
    }

    if (!parsed.visual || typeof parsed.visual !== 'object') {
      problems.push(`이번 턴은 vizType "${vizType}"에 해당하므로 visual 필드를 반드시 채워야 하는데 비어 있다. [이번 턴의 시각 자료 지시] 블록을 따라 visual을 채워라. 특히 kind와 함께 curves/points/segments/vectors/bars/matrixRows 등 실제 데이터 필드를 반드시 같이 채워야 한다 — kind만 있고 데이터가 없으면 그래프가 화면에 전혀 나오지 않는다.`);
      return problems;
    }
    if (parsed.visual.kind !== vizType) {
      problems.push(`visual.kind가 "${vizType}"이어야 하는데 "${parsed.visual.kind}"로 되어 있다. 정확히 맞춰라.`);
      return problems;
    }

    const v = parsed.visual;
    const hasAnyContent =
      (Array.isArray(v.curves) && v.curves.some(c => c && c.formula)) ||
      (Array.isArray(v.points) && v.points.length > 0) ||
      (Array.isArray(v.segments) && v.segments.length > 0) ||
      (Array.isArray(v.vectors) && v.vectors.length > 0) ||
      (Array.isArray(v.bars) && v.bars.length > 0) ||
      (Array.isArray(v.matrixRows) && v.matrixRows.length > 0) ||
      typeof v.shadeFormula === 'string' ||
      typeof v.solidType === 'string' ||
      typeof v.vennBoth === 'number';
    if (!hasAnyContent) {
      problems.push(`visual.kind는 "${vizType}"로 맞게 왔지만 정작 그 안의 데이터가 비어 있다 — kind만 채우고 curves/points/segments/vectors/bars/matrixRows 등 실제 값은 빠뜨렸다. [이번 턴의 시각 자료 지시] 블록에 명시된 필드를 반드시 실제 값으로 채워라. (예: mafs_function이면 curves 배열에 formula를 가진 곡선을 최소 1개 넣어야 한다.)`);
    }
    // mafs_function/mafs_shape/mafs_area의 curves는 formula가 mathjs로 컴파일 가능해야 한다.
    if (Array.isArray(v.curves)) {
      let hasValidCurve = v.curves.length === 0; // curves 자체가 필요 없는 vizType이면 통과
      v.curves.forEach((curve) => {
        if (!curve || !curve.formula) return;
        try { if (safeCompile(curve.formula, curve.kind)) hasValidCurve = true; } catch (e) { /* 개별 곡선 하나 깨진 건 렌더링 단계에서 건너뜀 */ }
      });
      if (v.curves.length > 0 && !hasValidCurve) {
        problems.push('visual.curves가 있지만 그 안에 mathjs로 계산 가능한 formula를 가진 곡선이 하나도 없다. 최소 1개는 유효한 formula로 채워라.');
      }
      // targetX("limit_approach" 전용)는 숫자 하나뿐이라 반복 폭주 위험이 없다 — 별도 검증 불필요.
    }

    // device_visual 검증 (deviceType이 있을 때만, 관대하게 — 실패해도 학습 진행을 막지 않음).
    // "limit_approach"처럼 장치를 device_visual이 아니라 visual.curves 안(numerFormula/denomFormula)에
    // 통째로 담는 타입은 애초에 device_visual을 안 쓰므로 이 검증에서 제외한다.
    const DEVICE_TYPES_WITHOUT_DEVICE_VISUAL = new Set(['limit_approach']);
    const deviceType = mathDeviceTypeRef.current;
    if (deviceType && deviceType !== 'none' && !DEVICE_TYPES_WITHOUT_DEVICE_VISUAL.has(deviceType)) {
      if (!parsed.device_visual || typeof parsed.device_visual !== 'object') {
        problems.push(`이번 학습목표는 deviceType "${deviceType}"이라 device_visual도 채워야 하는데 비어 있다. [이번 턴의 2단계 장치 지시] 블록을 따라 device_visual을 채워라.`);
      } else if (deviceType === 'balance') {
        const dv = parsed.device_visual;
        if (!Array.isArray(dv.points) || dv.points.length < 3) {
          problems.push('deviceType "balance"인데 device_visual.points가 3개 미만이다. [받침점, 왼쪽 접시, 오른쪽 접시] 순서로 정확히 3개를 채워라.');
        }
        if (!Array.isArray(v.curves) || v.curves.filter(c => c && c.formula).length !== 2) {
          problems.push('deviceType "balance"는 저울↔그래프 연동을 위해 visual.curves가 정확히 2개(formula 포함)여야 한다.');
        }
      }
    }
    return problems;
  }

  function validateTurnContent(ctx, parsed) {
    const problems = [];

    if (ctx.activeTrack && parsed.active_track !== ctx.activeTrack) {
      problems.push(`active_track 필드가 "${ctx.activeTrack}"이어야 하는데 "${parsed.active_track}"로 응답했다. 정확히 맞춰라.`);
    }

    const narration = parsed.narration || '';
    const choicesJoined = (parsed.choices || []).join(' ');

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
    // DEBUG_VERBOSE일 때만 전체 텍스트를 콘솔에 출력한다 (평소엔 노이즈라 꺼둠).
    if (DEBUG_VERBOSE) {
      console.log('========================================');
      console.log('이번 호출에 실제로 전송되는 systemInstruction (이미 치환 완료된 최종 텍스트):');
      console.log(systemText);
      console.log('========================================');
    }

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

      if (DEBUG_VERBOSE) {
        console.log('========================================');
        console.log('Gemini API 수신 성공 (전체 Response 구조):');
        console.log(JSON.stringify(data, null, 2));
        console.log('========================================');
      }

      const resultText = data.candidates && data.candidates[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        const finishReason = data.candidates?.[0]?.finishReason;
        // RECITATION(저작권 유사 판정)·SAFETY 등으로 구글이 응답 자체를 막은 경우 — 우리 쪽 파싱 문제가
        // 아니라 이번 시도 하나가 차단된 것뿐이므로, 재시도하면 되는 에러라고 표시해둔다.
        if (finishReason === 'RECITATION' || finishReason === 'SAFETY' || finishReason === 'OTHER') {
          const err = new Error(`Gemini가 finishReason="${finishReason}"로 이번 응답을 차단했다(내용이 저작권 자료와 비슷하다고 판단되었거나 안전 필터에 걸림). 같은 상황을 유지한 채 표현만 바꿔서 다시 응답해야 한다.`);
          err.isRetryableBlock = true;
          throw err;
        }
        throw new Error('API 응답 성공했으나, 텍스트 데이터(candidates) 구조가 올바르지 않습니다: ' + JSON.stringify(data).slice(0, 300));
      }

      if (DEBUG_VERBOSE) {
        console.log('추출된 최종 답변 내용:\n', resultText);
      }
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
  const MAX_ATTEMPTS = 6; // RECITATION 차단이 몇 번 겹쳐도 내용 교정 재시도가 굶지 않도록 여유를 늘림.

  // ===========================================================
  // [시각자료 디버그] — 순수하게 "서버(모델)가 이번 턴에 실제로 보낸 것"만 요약해서 찍는다.
  // 학습목표별로 그래프가 아예 안 나오는 게 (a) 애초에 그 목표는 vizType이 narration이라
  // 원래 안 나오는 게 정상인지, (b) 서버가 visual 자체를 안 보냈는지, (c) visual은 왔는데
  // kind가 다르거나 안에 데이터가 비어서 렌더링이 안 되는지 — 이 셋을 한 줄로 구분해서 보여준다.
  // 이 로그는 DEBUG_VERBOSE와 무관하게 항상 찍힌다(가장 자주 필요한 정보이기 때문).
  // ===========================================================
  function logServerVisualSummary(ctx, parsed, attempt) {
    if (ctx.activeTrack !== 'math' || ctx.sceneComplete) return; // 수학 턴이 아니면 애초에 visual 자체가 무관하니 생략

    const expected = mathVizTypeRef.current;
    const label = `[시각자료 디버그] (시도 ${attempt}/${MAX_ATTEMPTS})`;

    if (expected === 'narration') {
      console.log(`${label} 기대 vizType="narration" → 이 학습목표는 원래 그래프가 없는 게 정상입니다. 서버가 보낸 visual:`, parsed.visual ?? '(없음, 정상)');
      return;
    }

    if (!parsed.visual) {
      console.log(`${label} ⚠️ 기대 vizType="${expected}"인데 서버가 visual 필드 자체를 아예 안 보냈습니다 (undefined/null). → 모델이 이번 학습목표에 맞는 시각 자료 지시를 무시했을 가능성이 큽니다.`);
      return;
    }

    const v = parsed.visual;
    const counts = {
      curves: Array.isArray(v.curves) ? v.curves.length : undefined,
      points: Array.isArray(v.points) ? v.points.length : undefined,
      segments: Array.isArray(v.segments) ? v.segments.length : undefined,
      vectors: Array.isArray(v.vectors) ? v.vectors.length : undefined,
      bars: Array.isArray(v.bars) ? v.bars.length : undefined,
      matrixRows: Array.isArray(v.matrixRows) ? v.matrixRows.length : undefined,
      shadeFormula: v.shadeFormula,
      solidType: v.solidType,
      vennBoth: v.vennBoth
    };

    if (v.kind !== expected) {
      console.log(`${label} ⚠️ 서버가 visual은 보냈지만 kind가 기대값과 다릅니다. 기대="${expected}", 실제="${v.kind}". 내용물 개수: ${JSON.stringify(counts)}`);
      return;
    }

    console.log(`${label} ✅ 서버가 visual.kind="${v.kind}"를 정확히 보냈습니다. 내용물 개수(값이 undefined면 그 필드를 아예 안 보낸 것): ${JSON.stringify(counts)}`);
    // 개수는 맞아도 formula 문법이 깨져 있으면 화면엔 안 그려진다 — 실제 내용물을 문자열로 그대로 보여준다
    // (console.log에 객체를 그대로 넘기면 브라우저가 접었다 폈다 하는 참조로만 찍혀서 복사해도 텍스트로 안 남는다 — JSON.stringify로 강제 문자열화).
    if (Array.isArray(v.curves) && v.curves.length > 0) {
      console.log(`${label} curves 실제 내용: ${JSON.stringify(v.curves)}`);
    }
    if (Array.isArray(v.points) && v.points.length > 0) {
      console.log(`${label} points 실제 내용: ${JSON.stringify(v.points)}`);
    }
    if (Array.isArray(v.segments) && v.segments.length > 0) {
      console.log(`${label} segments 실제 내용: ${JSON.stringify(v.segments)}`);
    }
  }

  async function getSceneUpdate(subjectJustResolved) {
    const ctx = buildTurnContext(subjectJustResolved);
    const systemText = buildSystemInstruction(ctx);

    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const messagesToSend = getMessagesForAPI();

      let rawText;
      try {
        rawText = await callGeminiAPI(messagesToSend, systemText);
      } catch (callErr) {
        // 이전에는 여기서 catch 없이 바로 밖으로 던져서, RECITATION 차단 같은 "재시도하면 되는"
        // 에러 하나에 턴 전체가 죽어버렸다. 이제는 재시도 예산 안에서 한 번 더 시도한다.
        lastError = callErr;
        console.warn(`[재시도 디버그] (시도 ${attempt}/${MAX_ATTEMPTS}) API 호출 자체가 실패해 재시도함:`, callErr.message);
        if (callErr.isRetryableBlock) {
          messagesRef.current.push({
            role: 'user',
            content: `[주의] 직전 시도가 차단되었다: ${callErr.message} 같은 학습목표·같은 진행 상태(과목/단계)는 유지하되, 세계관·인물·소재·문장을 상당히 다르게 새로 지어내라 — 특히 origin_reason과 narration의 역사적 사실 설명 문장은 교과서·백과사전 문체와 겹치지 않게 완전히 다른 어순·표현으로 풀어써라. 단어 몇 개만 바꾸는 미세 수정으로는 다시 차단될 수 있다. JSON만 출력하라.`
          });
        }
        continue;
      }

      // 서버가 이번 시도에서 실제로 보낸 원문 그대로 — 파싱/검증/재시도 판단이 일어나기 전에
      // 무조건 먼저 찍는다. 파싱이 깨지거나 검증에서 걸려도 이 로그는 항상 남으므로,
      // "재시도되기 전에 뭘 받았는지" 여기서 그대로 확인할 수 있다.
      console.log(`[원문 디버그] (시도 ${attempt}/${MAX_ATTEMPTS}) 서버 원문 그대로:`);
      console.log(rawText);

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

      // [시각자료 디버그] — 서버가 이번 시도에서 visual로 정확히 뭘 보냈는지만 순수하게 보여준다.
      // (systemInstruction/전체 응답 JSON 같은 노이즈는 DEBUG_VERBOSE로 따로 뺐고, 이건 항상 찍는다.)
      logServerVisualSummary(ctx, parsed, attempt);

      const coreProblems = validateTurnContent(ctx, parsed);
      const visualProblems = validateVisualContent(ctx, parsed);

      // [시각자료 디버그] "curves는 왔는데 왜 재시도됐지?" 같은 의문을 바로 풀 수 있도록,
      // 이번 시도가 왜 통과/거부됐는지 그 이유(핵심 검증 문제 / 시각자료 검증 문제)를 그대로 찍는다.
      if (coreProblems.length > 0 || visualProblems.length > 0) {
        console.log(`[검증 디버그] (시도 ${attempt}/${MAX_ATTEMPTS}) 이번 응답이 거부된 이유 → ${JSON.stringify({
          core: coreProblems.length > 0 ? coreProblems : '(핵심 검증은 통과)',
          visual: visualProblems.length > 0 ? visualProblems : '(시각자료 검증은 통과)'
        })}`);
      } else {
        console.log(`[검증 디버그] (시도 ${attempt}/${MAX_ATTEMPTS}) 핵심·시각자료 검증 모두 통과 → 이 턴은 정상적으로 화면에 표시됩니다.`);
      }

      if (coreProblems.length > 0) {
        // 핵심 검증(active_track/narration/choices/scene_complete 등) 실패는 항상 재시도.
        lastError = new Error('내용 검증 실패: ' + coreProblems.concat(visualProblems).join(' / '));
        messagesRef.current.push({
          role: 'user',
          content: `[주의] 직전 응답이 규칙을 위반했다:\n- ${coreProblems.concat(visualProblems).join('\n- ')}\n같은 상황을 유지한 채, 위 문제만 고쳐서 다시 응답하라. JSON만 출력하라.`
        });
        continue;
      }

      if (visualProblems.length > 0) {
        if (attempt < MAX_ATTEMPTS) {
          // 시각 자료만 문제면, 아직 시도 횟수가 남아있는 동안은 고쳐보라고 재시도시킨다.
          lastError = new Error('시각 자료 검증 실패: ' + visualProblems.join(' / '));
          messagesRef.current.push({
            role: 'user',
            content: `[주의] 직전 응답의 내용(narration/choices)은 정상이지만 시각 자료(visual)에 문제가 있다:\n- ${visualProblems.join('\n- ')}\n같은 narration과 choices를 그대로 유지한 채, visual 필드만 고쳐서 다시 응답하라. JSON만 출력하라.`
          });
          continue;
        }
        // 마지막 시도까지 시각 자료를 못 고쳤으면, 그래프 없이라도 학습 진행 자체는 막지 않는다.
        // (그래프는 부가 요소 — narration/choices/correct_index 등 핵심 판정 로직에는 영향 없음.)
        console.warn('시각 자료 생성에 최종 실패해 visual/device_visual 없이 진행합니다:', visualProblems);
        parsed.visual = null;
        parsed.device_visual = null;
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
      deviceVisual: result.device_visual || null,
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

    // 실제로 어떤 목표가 선택됐고, GOALS_DATA에서 무엇이 조회됐는지 확인하는 로그 (DEBUG_VERBOSE 전용).
    if (DEBUG_VERBOSE) {
      console.log('========================================');
      console.log('선택된 goals 인덱스:', goals);
      console.log('국어 GOALS_DATA.kor[goals.kor]:', GOALS_DATA.kor?.[goals.kor], '(GOALS_DATA.kor 길이:', GOALS_DATA.kor?.length, ')');
      console.log('영어 GOALS_DATA.eng[goals.eng]:', GOALS_DATA.eng?.[goals.eng], '(GOALS_DATA.eng 길이:', GOALS_DATA.eng?.length, ')');
      console.log('수학 GOALS_DATA.math[goals.math]:', GOALS_DATA.math?.[goals.math], '(GOALS_DATA.math 길이:', GOALS_DATA.math?.length, ')');
      console.log('========================================');
    }

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

    if (DEBUG_VERBOSE) {
      console.log('최종 goalTexts (프롬프트에 실제로 들어갈 문자열):', sceneInfoRef.current.goalTexts);
    }

    // 이번 장면의 수학 목표가 어떤 vizType을 쓰는지 고정한다 (GOALS_DATA.math 항목에 미리 박혀있는 값).
    // 이 한 줄은 "서버가 뭘 보내야 정상인지"의 기준값이라 항상 찍어둔다.
    mathVizTypeRef.current = GOALS_DATA.math[goals.math]?.vizType || 'narration';
    mathDeviceTypeRef.current = GOALS_DATA.math[goals.math]?.deviceType || 'none';
    console.log('[시각자료 디버그] 이번 장면 수학 vizType(기대값):', mathVizTypeRef.current, '/ deviceType:', mathDeviceTypeRef.current);

    // 과목별 모드(발견형/문제유형형)를 먼저 확정한다. 영어·수학은 항상 문제유형형,
    // 국어는 선택된 목표(mid)에 따라 자동 분기된다. 이 값은 장면이 끝날 때까지 고정된다.
    const subjectModes = {
      korean: computeSubjectMode('korean', goals),
      english: computeSubjectMode('english', goals),
      math: computeSubjectMode('math', goals)
    };
    subjectModesRef.current = subjectModes;
    if (DEBUG_VERBOSE) {
      console.log('과목별 모드(발견형/문제유형형):', subjectModes, '(국어 mid:', GOALS_DATA.kor[goals.kor]?.mid, ')');
    }

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
  // 시각 자료 렌더러 — vizType(9종)에 따라 분기한다.
  // mafs 기반 5종(mafs_function/mafs_shape/mafs_vector/mafs_area/mafs_discrete)은
  // <Mafs> 안에서 mafs 컴포넌트로 그리고, 나머지 3종(bar_chart/venn/matrix/pseudo3d)은
  // mafs 범위 밖이라 각각 recharts 또는 소형 SVG로 별도 렌더링한다.
  // ===========================================================

  const MAFS_VIEWBOX_DEFAULT = { x: [-10, 10], y: [-10, 10] };

  // 모델이 "formula=0" 지시를 안 지키고 "x^2 + y^2 = 25"처럼 등호로 방정식을 쓰는 경우를 방어한다.
  // mathjs 표현식 파서는 "="를 대입 연산자로 취급해서 이런 문자열을 그대로 컴파일하지 못하므로,
  // "좌변 = 우변"을 "(좌변)-(우변)"으로 자동 변환해 implicit(=0) 형태로 맞춰준다.
  // (==, <=, >=, != 처럼 두 글자짜리 비교 연산자는 건드리지 않는다.)
  function normalizeFormula(formula) {
    if (typeof formula !== 'string') return formula;
    const eqMatch = formula.match(/^([^=<>!]*[^=<>!\s])\s*=\s*(?!=)([^=].*)$/);
    if (eqMatch) {
      return `(${eqMatch[1].trim()})-(${eqMatch[2].trim()})`;
    }
    return formula;
  }

  function safeCompile(formula, kind) {
    // 등호(=) 자동 보정은 implicit(=0 형태) 곡선에만 적용한다. explicit 곡선은 formula가
    // 순수히 x의 함수(f(x))여야 하므로, 혹시 모델이 실수로 "y=..."를 붙였어도 그건 다른 문제라
    // 여기서 억지로 등호를 지워버리면 오히려 더 깨진다 — explicit은 원문 그대로 컴파일한다.
    const target = kind === 'implicit' ? normalizeFormula(formula) : formula;
    try { return math.compile(target); } catch (e) { return null; }
  }

  function toRange(range, fallback) {
    return Array.isArray(range) && range.length === 2 ? range : fallback;
  }

  // ===========================================================
  // 저울 ↔ 그래프 인터랙티브 연동
  // "A(x)-B(x) = target" 이 되는 x를 xRange 안에서 찾는다(부호가 바뀌는 구간을 선형보간,
  // 못 찾으면 가장 가까운 값). 저울 접시를 드래그해서 만든 기울기(target)를 그래프의 x로
  // 역산할 때 쓴다 — curve가 임의의 식이라 정확한 역함수 대신 표본 탐색으로 근사한다.
  // ===========================================================
  function findXForDiff(compiledA, compiledB, xMin, xMax, target, steps = 400) {
    let bestX = (xMin + xMax) / 2;
    let bestErr = Infinity;
    let prevX = null, prevVal = null;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      let a, b;
      try { a = compiledA.evaluate({ x }); b = compiledB.evaluate({ x }); } catch (e) { continue; }
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const val = a - b;
      if (prevVal !== null && ((prevVal - target) < 0) !== ((val - target) < 0)) {
        const t = (target - prevVal) / (val - prevVal);
        return prevX + t * (x - prevX);
      }
      const err = Math.abs(val - target);
      if (err < bestErr) { bestErr = err; bestX = x; }
      prevX = x; prevVal = val;
    }
    return bestX;
  }

  // deviceVisual(저울, mafs_shape) + visual(mafs_function, curves 정확히 2개)을 같은 화면에
  // 위아래로 그리고, 오른쪽 접시(점)를 드래그하면 그 기울기가 실시간으로 x로 역산되어
  // 아래 그래프의 점이 같은 x로 이동한다. 반대로 그래프 점을 드래그해도 x가 갱신되어
  // 저울 기울기가 그만큼 다시 계산된다 — 두 그림이 "sharedX" 하나를 공유해서 보여주는 구조.
  function renderBalanceGraphLinked(log, logIdx) {
    const dv = log.deviceVisual;
    const v = log.visual;
    if (!dv || dv.kind !== 'mafs_shape' || !v || v.kind !== 'mafs_function') return null;
    const curves = (v.curves || []).filter(c => c && c.formula);
    if (curves.length !== 2) return null;
    const compiledA = safeCompile(curves[0].formula, curves[0].kind);
    const compiledB = safeCompile(curves[1].formula, curves[1].kind);
    if (!compiledA || !compiledB) return null;
    const dPoints = Array.isArray(dv.points) ? dv.points : [];
    if (dPoints.length < 3) return null;
    const dSegments = Array.isArray(dv.segments) ? dv.segments : [];

    const xRange = toRange(v.xRange, [-10, 10]);
    const yRange = toRange(v.yRange, [-10, 10]);

    const sharedX = sharedXByLog[logIdx] ?? (xRange[0] + xRange[1]) / 2;
    const setSharedX = (x) => {
      const clamped = Math.min(xRange[1], Math.max(xRange[0], x));
      setSharedXByLog(prev => ({ ...prev, [logIdx]: clamped }));
    };

    let yA = NaN, yB = NaN;
    try { yA = compiledA.evaluate({ x: sharedX }); } catch (e) { /* 무시 */ }
    try { yB = compiledB.evaluate({ x: sharedX }); } catch (e) { /* 무시 */ }
    const diff = (Number.isFinite(yA) && Number.isFinite(yB)) ? (yA - yB) : 0;
    const isBalanced = Math.abs(diff) < (Math.max(1, Math.abs(dPoints[0].y)) * 0.01 + 0.05);
    const tiltScale = 0.2; // diff 1단위당 접시가 움직이는 y거리(장치 표현용 배율, 실제 눈금 아님)

    // "받침점=0번, 왼쪽 접시=1번, 오른쪽 접시=2번" 이라는 인덱스 규칙만 코드가 알고 있다(그래야
    // 어느 점을 드래그시킬지, 어느 점을 diff로 움직일지 알 수 있다). 그 외에 이 점이 "저울"인지,
    // 몇 개의 점으로 어떤 모양을 이루는지는 전혀 모른다 — 그건 전부 points/segments 데이터다.
    // livePoints: 1번·2번 점의 y좌표만 diff에 따라 실시간으로 덮어쓴 좌표 목록(그리기용).
    const baseY = dPoints[0].y;
    const livePoints = dPoints.map((p, i) => {
      if (i === 1) return { ...p, y: baseY + diff * tiltScale };
      if (i === 2) return { ...p, y: baseY - diff * tiltScale };
      return p;
    });

    const dXRange = toRange(dv.xRange, [dPoints[0].x - 4, dPoints[0].x + 4]);
    const dYRange = toRange(dv.yRange, [baseY - 3, baseY + 3]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
          <Mafs viewBox={{ x: dXRange, y: dYRange }} preserveAspectRatio={false} height={220}>
            {/* 좌표축·눈금은 일부러 안 그린다 — 수학 그래프가 아니라 장치 "그림"이어야 하기 때문 */}
            {/* segments/points는 전부 모델 데이터다. 렌더러는 fromPoint/toPoint 인덱스로 livePoints에서
                현재 좌표를 찾아 선을 긋고, 점을 찍을 뿐 — 이게 저울대인지 받침대인지 전혀 모른다. */}
            {dSegments.map((s, i) => {
              const p1 = livePoints[s.fromPoint];
              const p2 = livePoints[s.toPoint];
              if (!p1 || !p2) return null;
              const isBeam = (s.fromPoint === 1 && s.toPoint === 2) || (s.fromPoint === 2 && s.toPoint === 1);
              return (
                <Line.Segment
                  key={`seg${i}`}
                  point1={[p1.x, p1.y]}
                  point2={[p2.x, p2.y]}
                  color={isBeam && isBalanced ? Theme.green : (s.color || '#8a7f6a')}
                />
              );
            })}
            {livePoints.map((p, i) => {
              if (i === 2) {
                // 오른쪽 접시(2번 점)만 드래그 가능 — 인터랙션이 필요한 유일한 지점이라 여기만 코드가 관여한다.
                return (
                  <MovablePoint
                    key="movable-pan"
                    point={[p.x, p.y]}
                    constrain={(pos) => [p.x, pos[1]]}
                    color={Theme.red}
                    onMove={(pos) => {
                      const newDiff = (baseY - pos[1]) / tiltScale;
                      const newX = findXForDiff(compiledA, compiledB, xRange[0], xRange[1], newDiff);
                      setSharedX(newX);
                    }}
                  />
                );
              }
              return typeof p.x === 'number' && typeof p.y === 'number'
                ? <Point key={`pt${i}`} x={p.x} y={p.y} color={i === 1 ? Theme.blue : '#5f5e5a'} />
                : null;
            })}
          </Mafs>
          <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
            저울의 오른쪽 접시(빨간 점)를 위아래로 끌어보세요{isBalanced ? ' — 지금 평형입니다!' : ''}
          </div>
        </div>
        <div className="viz-box">
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={320}>
            <Coordinates.Cartesian />
            <Plot.OfX y={(x) => { try { return compiledA.evaluate({ x }); } catch (e) { return NaN; } }} color={curves[0].color || Theme.blue} />
            <Plot.OfX y={(x) => { try { return compiledB.evaluate({ x }); } catch (e) { return NaN; } }} color={curves[1].color || Theme.red} />
            <MovablePoint
              point={[sharedX, 0]}
              constrain={(pos) => [Math.min(xRange[1], Math.max(xRange[0], pos[0])), 0]}
              color={Theme.green}
              onMove={(pos) => setSharedX(pos[0])}
            />
          </Mafs>
          <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
            지금 x = {sharedX.toFixed(2)} · 차이 = {diff.toFixed(2)}{isBalanced ? ' (두 값이 같아졌습니다!)' : ''}
          </div>
        </div>
      </div>
    );
  }

  // 원점 중심 원(x^2+y^2+c0=0 형태)인지 근사 판별. 원이면 mafs의 <Circle>로 정확히 그릴 수 있지만,
  // 타원·쌍곡선 등 그 외 implicit 곡선은 mafs에 범용 음함수 플로터가 없어 이 판별에 실패한다.
  function circleRadiusIfSimple(compiled) {
    try {
      const c0 = compiled.evaluate({ x: 0, y: 0 });
      const r = Math.sqrt(Math.max(0, -c0));
      // 실제로 원인지 몇 개 표본점에서 검증 (x^2+y^2-r^2 골격인지)
      const check1 = compiled.evaluate({ x: r, y: 0 });
      const check2 = compiled.evaluate({ x: 0, y: r });
      if (r > 0 && Number.isFinite(r) && Math.abs(check1) < 1e-6 && Math.abs(check2) < 1e-6) {
        return r;
      }
    } catch (e) { /* 원이 아니거나 평가 실패 */ }
    return null;
  }

  // curves 중 "단순 원이 아닌 implicit 곡선"이 하나라도 있으면 true.
  // (타원·쌍곡선처럼 mafs로 못 그리는 경우 — 이전 mathjs 샘플링 모듈로 폴백해야 하는 신호)
  function hasComplexImplicitCurve(curves) {
    if (!Array.isArray(curves)) return false;
    return curves.some((curve) => {
      if (!curve || curve.kind !== 'implicit' || !curve.formula) return false;
      const compiled = safeCompile(curve.formula, curve.kind);
      if (!compiled) return false;
      return circleRadiusIfSimple(compiled) === null;
    });
  }

  // ===========================================================
  // 이전 모듈(복원) — mathjs로 직접 표본을 찍어 근사하는 방식.
  // mafs가 다루지 못하는 타원·쌍곡선 등 일반 implicit 곡선(F(x,y)=0)이 하나라도 있으면,
  // 그 그래프 전체(곡선+점+변)를 이 모듈로 그린다 (좌표계 혼용을 피하기 위해 통째로 전환).
  // ===========================================================
  function sampleExplicitCurveClassic(compiled, xMin, xMax, yMin, yMax, steps = 200) {
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
  function sampleImplicitCurveClassic(compiled, xMin, xMax, yMin, yMax, xSteps = 140, ySteps = 140) {
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

  // curves(+선택적으로 points/segments)를 이전 mathjs 샘플링 모듈로 통째로 그린다.
  function renderClassicSvgGraph(v, key) {
    const W = 300, H = 300, PAD = 26;
    const [xMin, xMax] = toRange(v.xRange, [-10, 10]);
    const [yMin, yMax] = toRange(v.yRange, [-10, 10]);
    const curves = Array.isArray(v.curves) ? v.curves : [];
    const points = Array.isArray(v.points) ? v.points : [];
    const segments = Array.isArray(v.segments) ? v.segments : [];

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

    const curveElements = curves.map((curve, i) => {
      if (!curve || !curve.formula) return null;
      const compiled = safeCompile(curve.formula, curve.kind);
      if (!compiled) return null;
      const color = curve.color || (i === 0 ? '#3b6d11' : '#d85a30');

      if (curve.kind === 'implicit') {
        const pts = sampleImplicitCurveClassic(compiled, xMin, xMax, yMin, yMax);
        return (
          <g key={`curve${i}`}>
            {pts.map(([x, y], pi) => (
              <circle key={pi} cx={sx(x)} cy={sy(y)} r="1.6" fill={color} />
            ))}
            {curve.label && pts.length > 0 && (
              <text x={sx(pts[pts.length - 1][0])} y={sy(pts[pts.length - 1][1]) - 6} fontSize="11" fill={color} textAnchor="middle">{curve.label}</text>
            )}
          </g>
        );
      }

      const pts = sampleExplicitCurveClassic(compiled, xMin, xMax, yMin, yMax);
      return (
        <g key={`curve${i}`}>
          <polyline points={pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5" />
          {curve.label && pts.length > 0 && (
            <text x={sx(pts[pts.length - 1][0]) - 4} y={sy(pts[pts.length - 1][1]) - 6} fontSize="11" fill={color} textAnchor="end">{curve.label}</text>
          )}
        </g>
      );
    });

    const segmentElements = segments.map((s, i) => {
      const p1 = points[s.fromPoint];
      const p2 = points[s.toPoint];
      if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p2.x !== 'number') return null;
      return <line key={`seg${i}`} x1={sx(p1.x)} y1={sy(p1.y)} x2={sx(p2.x)} y2={sy(p2.y)} stroke={s.color || '#5a5a8c'} strokeWidth="2" />;
    });

    const pointElements = points.map((p, i) => (
      (typeof p.x === 'number' && typeof p.y === 'number') ? (
        <g key={`pt${i}`}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r="3" fill="#d85a30" />
          {p.label && <text x={sx(p.x) + 6} y={sy(p.y) - 6} fontSize="11" fill="#5f5e5a">{p.label}</text>}
        </g>
      ) : null
    ));

    return (
      <div key={key} style={{ display: 'inline-block', margin: '4px' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ background: '#fff', border: '1px solid #ddd8ca', borderRadius: '8px' }}>
          {gridLines}
          {axes}
          {segmentElements}
          {curveElements}
          {pointElements}
        </svg>
      </div>
    );
  }

  // ===========================================================
  // 선택지별 미니 그래프 지원 — curves/points/segments 각 항목에 forChoiceIndex(숫자)가 있으면
  // 그 항목은 "특정 선택지 전용"이고, 없으면 "공통 배경"(모든 미니 그래프 + 상단 공통 그래프에 표시)이다.
  // ===========================================================
  function isTaggedForChoice(item) {
    return typeof item?.forChoiceIndex === 'number';
  }
  function sharedOnly(arr) {
    return Array.isArray(arr) ? arr.filter(it => !isTaggedForChoice(it)) : arr;
  }
  function sharedPlusChoice(arr, idx) {
    return Array.isArray(arr) ? arr.filter(it => !isTaggedForChoice(it) || it.forChoiceIndex === idx) : arr;
  }
  function hasChoiceTagged(arr, idx) {
    return Array.isArray(arr) && arr.some(it => isTaggedForChoice(it) && (idx === undefined || it.forChoiceIndex === idx));
  }
  function visualHasAnyChoiceTag(v) {
    if (!v) return false;
    return hasChoiceTagged(v.curves) || hasChoiceTagged(v.points) || hasChoiceTagged(v.segments);
  }
  function buildSharedVisual(v) {
    return { ...v, curves: sharedOnly(v.curves), points: sharedOnly(v.points), segments: sharedOnly(v.segments) };
  }
  function buildChoiceVisual(v, idx) {
    return { ...v, curves: sharedPlusChoice(v.curves, idx), points: sharedPlusChoice(v.points, idx), segments: sharedPlusChoice(v.segments, idx) };
  }
  function visualHasSomeContent(v) {
    if (!v) return false;
    return (Array.isArray(v.curves) && v.curves.some(c => c && c.formula)) ||
      (Array.isArray(v.points) && v.points.length > 0) ||
      (Array.isArray(v.segments) && v.segments.length > 0);
  }

  // 선택지 버튼 바로 아래에 그릴 "그 선택지 전용" 미니 그래프. mafs_function/mafs_shape에서만 지원한다.
  // 이번 턴에 forChoiceIndex 태그가 하나도 없으면(=모델이 선택지별 그래프를 안 쓰기로 한 턴이면) null.
  function renderChoiceMiniGraph(visual, choiceIndex) {
    if (!visual || !visual.kind) return null;
    if (visual.kind !== 'mafs_function' && visual.kind !== 'mafs_shape') return null;
    if (!visualHasAnyChoiceTag(visual)) return null;
    if (!hasChoiceTagged(visual.curves, choiceIndex) && !hasChoiceTagged(visual.points, choiceIndex) && !hasChoiceTagged(visual.segments, choiceIndex)) {
      return null; // 이 선택지에는 태그된 항목이 없음 — 미니 그래프 안 그림
    }
    const miniV = buildChoiceVisual(visual, choiceIndex);
    try {
      return (
        <div className="viz-box viz-box-mini" style={{ marginTop: '4px', marginBottom: '4px' }}>
          {visual.kind === 'mafs_function' ? renderMafsFunction(miniV, 160) : renderMafsShape(miniV, 160)}
        </div>
      );
    } catch (e) {
      console.error('renderChoiceMiniGraph 렌더링 중 오류:', e);
      return null;
    }
  }


  // 타원·쌍곡선 등 mafs로 못 그리는 복잡한 implicit 곡선이 하나라도 섞여 있으면,
  // 좌표계 혼용을 피하려고 이 그래프 전체를 이전 mathjs 샘플링 모듈(renderClassicSvgGraph)로 넘긴다.
  function renderMafsFunction(v, heightPx) {
    if (hasComplexImplicitCurve(v.curves)) {
      return renderClassicSvgGraph(v, 'classic-function');
    }
    const xRange = toRange(v.xRange, [-10, 10]);
    const yRange = toRange(v.yRange, [-10, 10]);
    const curves = Array.isArray(v.curves) ? v.curves : [];
    return (
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={heightPx || 500}>
        <Coordinates.Cartesian />
        {curves.map((curve, i) => {
          if (!curve || !curve.formula) return null;
          const compiled = safeCompile(curve.formula, curve.kind);
          if (!compiled) return null;
          const color = curve.color || Theme.blue;
          if (curve.kind === 'implicit') {
            const r = circleRadiusIfSimple(compiled);
            if (r !== null) {
              return <Circle key={i} center={[0, 0]} radius={r} color={color} />;
            }
            return null; // 여기 도달하면 hasComplexImplicitCurve가 이미 걸러냈어야 함
          }
          return (
            <Plot.OfX key={i} y={(x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } }} color={color} />
          );
        })}
      </Mafs>
    );
  }

  // mafs_shape: points(꼭짓점) + segments(변) + curves(원, 있다면)를 함께 그린다.
  // 마찬가지로 복잡한 implicit 곡선이 섞여 있으면 전체를 이전 모듈로 넘긴다.
  function renderMafsShape(v, heightPx) {
    if (hasComplexImplicitCurve(v.curves)) {
      return renderClassicSvgGraph(v, 'classic-shape');
    }
    const xRange = toRange(v.xRange, [-1, 8]);
    const yRange = toRange(v.yRange, [-1, 8]);
    const points = Array.isArray(v.points) ? v.points : [];
    const segments = Array.isArray(v.segments) ? v.segments : [];
    const curves = Array.isArray(v.curves) ? v.curves : [];
    return (
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={heightPx || 500}>
        <Coordinates.Cartesian />
        {segments.map((s, i) => {
          const p1 = points[s.fromPoint];
          const p2 = points[s.toPoint];
          if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p2.x !== 'number') return null;
          return <Line.Segment key={`seg${i}`} point1={[p1.x, p1.y]} point2={[p2.x, p2.y]} color={s.color || Theme.indigo} />;
        })}
        {curves.map((curve, i) => {
          if (!curve || !curve.formula || curve.kind !== 'implicit') return null;
          const compiled = safeCompile(curve.formula, curve.kind);
          if (!compiled) return null;
          const r = circleRadiusIfSimple(compiled);
          if (r !== null) return <Circle key={`c${i}`} center={[0, 0]} radius={r} color={curve.color || Theme.blue} />;
          return null;
        })}
        {points.map((p, i) => (
          typeof p.x === 'number' && typeof p.y === 'number'
            ? <Point key={`pt${i}`} x={p.x} y={p.y} color={Theme.red} />
            : null
        ))}
        {points.map((p, i) => (
          p.label && typeof p.x === 'number' && typeof p.y === 'number' ? (
            <text key={`lbl${i}`} x={p.x} y={p.y} style={{ transform: 'translate(6px, -6px)', fontSize: '12px' }}>{p.label}</text>
          ) : null
        ))}
      </Mafs>
    );
  }

  // mafs_vector: Vector 컴포넌트로 tail→tip 화살표를 그린다.
  function renderMafsVector(v) {
    const xRange = toRange(v.xRange, [-6, 6]);
    const yRange = toRange(v.yRange, [-6, 6]);
    const vectors = Array.isArray(v.vectors) ? v.vectors : [];
    const points = Array.isArray(v.points) ? v.points : [];
    return (
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false}>
        <Coordinates.Cartesian />
        {vectors.map((vec, i) => (
          typeof vec.x1 === 'number' && typeof vec.y1 === 'number' && typeof vec.x2 === 'number' && typeof vec.y2 === 'number'
            ? <Vector key={i} tail={[vec.x1, vec.y1]} tip={[vec.x2, vec.y2]} color={vec.color || Theme.blue} />
            : null
        ))}
        {points.map((p, i) => (
          typeof p.x === 'number' && typeof p.y === 'number'
            ? <Point key={`pt${i}`} x={p.x} y={p.y} color={Theme.red} />
            : null
        ))}
      </Mafs>
    );
  }

  // mafs_area: Plot.OfX로 기준 곡선을 그리고, Plot.Inequality로 [shadeXMin, shadeXMax] 구간의
  // 곡선 아래(또는 위) 영역을 음영 처리한다.
  function renderMafsArea(v) {
    const xRange = toRange(v.xRange, [-10, 10]);
    const yRange = toRange(v.yRange, [-10, 10]);
    const curves = Array.isArray(v.curves) ? v.curves : [];
    const shadeCompiled = v.shadeFormula ? safeCompile(v.shadeFormula, 'explicit') : null;
    const xMin = typeof v.shadeXMin === 'number' ? v.shadeXMin : xRange[0];
    const xMax = typeof v.shadeXMax === 'number' ? v.shadeXMax : xRange[1];
    return (
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false}>
        <Coordinates.Cartesian />
        {curves.map((curve, i) => {
          if (!curve || !curve.formula) return null;
          const compiled = safeCompile(curve.formula, curve.kind);
          if (!compiled) return null;
          return (
            <Plot.OfX key={i} y={(x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } }} color={curve.color || Theme.blue} />
          );
        })}
        {shadeCompiled && (
          <Plot.Inequality
            y={{
              '<=': (x) => (x >= xMin && x <= xMax ? (() => { try { return shadeCompiled.evaluate({ x }); } catch (e) { return 0; } })() : 0),
              '>': (x) => (x >= xMin && x <= xMax ? 0 : 1e9)
            }}
            color={Theme.green}
          />
        )}
      </Mafs>
    );
  }

  // mafs_discrete: 이산수열 항들을 Point로 나열한다.
  function renderMafsDiscrete(v) {
    const xRange = toRange(v.xRange, [0, 10]);
    const yRange = toRange(v.yRange, [-10, 10]);
    const points = Array.isArray(v.points) ? v.points : [];
    return (
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false}>
        <Coordinates.Cartesian />
        {points.map((p, i) => (
          typeof p.x === 'number' && typeof p.y === 'number'
            ? <Point key={i} x={p.x} y={p.y} color={Theme.blue} />
            : null
        ))}
      </Mafs>
    );
  }

  // bar_chart: recharts 막대그래프.
  function renderBarChart(v) {
    const bars = Array.isArray(v.bars) ? v.bars : [];
    if (bars.length === 0) return null;
    return (
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={bars}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b6d11" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // venn: 겹치는 원 두 개로 그리는 소형 SVG 벤다이어그램.
  function renderVenn(v) {
    const labelA = v.vennLabelA || 'A';
    const labelB = v.vennLabelB || 'B';
    const onlyA = typeof v.vennOnlyA === 'number' ? v.vennOnlyA : '';
    const onlyB = typeof v.vennOnlyB === 'number' ? v.vennOnlyB : '';
    const both = typeof v.vennBoth === 'number' ? v.vennBoth : '';
    return (
      <svg width="320" height="200" viewBox="0 0 320 200">
        <circle cx="130" cy="100" r="80" fill="#3b6d1122" stroke="#3b6d11" strokeWidth="2" />
        <circle cx="190" cy="100" r="80" fill="#d85a3022" stroke="#d85a30" strokeWidth="2" />
        <text x="80" y="60" fontSize="14" fill="#3b6d11">{labelA}</text>
        <text x="220" y="60" fontSize="14" fill="#d85a30">{labelB}</text>
        <text x="95" y="105" fontSize="16" textAnchor="middle">{onlyA}</text>
        <text x="160" y="105" fontSize="16" textAnchor="middle">{both}</text>
        <text x="225" y="105" fontSize="16" textAnchor="middle">{onlyB}</text>
      </svg>
    );
  }

  // matrix: 숫자 격자를 표(HTML table)로 그린다.
  function renderMatrix(v) {
    const rows = Array.isArray(v.matrixRows) ? v.matrixRows : [];
    if (rows.length === 0) return null;
    return (
      <table style={{ borderCollapse: 'collapse', margin: '8px 0' }}>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((val, ci) => (
                <td key={ci} style={{ border: '1px solid #ddd8ca', padding: '6px 12px', textAlign: 'center' }}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // pseudo3d: 정육면체·원기둥·원뿔·구를 고정된 등각투상 SVG 프리셋으로 그린다.
  function renderPseudo3D(v) {
    const kind = v.solidType;
    const label = v.solidLabel || '';
    if (kind === 'cube') {
      return (
        <svg width="220" height="200" viewBox="0 0 220 200">
          <polygon points="40,140 120,140 150,100 70,100" fill="#e8e4d8" stroke="#5f5e5a" />
          <polygon points="40,140 40,60 120,60 120,140" fill="#f5f2e8" stroke="#5f5e5a" />
          <polygon points="120,60 150,20 150,100 120,140" fill="#ddd8ca" stroke="#5f5e5a" />
          {label && <text x="80" y="180" fontSize="13" textAnchor="middle">{label}</text>}
        </svg>
      );
    }
    if (kind === 'cylinder') {
      return (
        <svg width="220" height="200" viewBox="0 0 220 200">
          <ellipse cx="110" cy="50" rx="60" ry="20" fill="#f5f2e8" stroke="#5f5e5a" />
          <path d="M50,50 L50,140 A60,20 0 0 0 170,140 L170,50" fill="#e8e4d8" stroke="#5f5e5a" />
          <ellipse cx="110" cy="140" rx="60" ry="20" fill="none" stroke="#5f5e5a" />
          {label && <text x="110" y="180" fontSize="13" textAnchor="middle">{label}</text>}
        </svg>
      );
    }
    if (kind === 'cone') {
      return (
        <svg width="220" height="200" viewBox="0 0 220 200">
          <ellipse cx="110" cy="140" rx="60" ry="20" fill="#e8e4d8" stroke="#5f5e5a" />
          <path d="M110,20 L50,140 A60,20 0 0 0 170,140 Z" fill="#f5f2e8" stroke="#5f5e5a" />
          {label && <text x="110" y="180" fontSize="13" textAnchor="middle">{label}</text>}
        </svg>
      );
    }
    if (kind === 'sphere') {
      return (
        <svg width="220" height="200" viewBox="0 0 220 200">
          <circle cx="110" cy="100" r="70" fill="#f5f2e8" stroke="#5f5e5a" />
          <ellipse cx="110" cy="100" rx="70" ry="22" fill="none" stroke="#5f5e5a" strokeDasharray="4 3" />
          {label && <text x="110" y="185" fontSize="13" textAnchor="middle">{label}</text>}
        </svg>
      );
    }
    return null;
  }

  function renderVisual(visual) {
    if (!visual || !visual.kind) return null;
    try {
      // curves/points/segments 중 forChoiceIndex로 태그된 항목은 선택지별 미니 그래프 전용이므로,
      // 상단 공통 그래프에서는 제외한다. 태그된 항목만 있고 공통(태그 없는) 내용이 하나도 없으면
      // 상단 공통 그래프 자체를 생략한다(전부 선택지 버튼 아래 미니 그래프로만 보여준다).
      const isSharableKind = visual.kind === 'mafs_function' || visual.kind === 'mafs_shape';
      const displayVisual = isSharableKind && visualHasAnyChoiceTag(visual) ? buildSharedVisual(visual) : visual;
      if (isSharableKind && visualHasAnyChoiceTag(visual) && !visualHasSomeContent(displayVisual)) {
        return null;
      }
      switch (visual.kind) {
        case 'mafs_function': return <div className="viz-box">{renderMafsFunction(displayVisual)}</div>;
        case 'mafs_shape': return <div className="viz-box">{renderMafsShape(displayVisual)}</div>;
        case 'mafs_vector': return <div className="viz-box">{renderMafsVector(visual)}</div>;
        case 'mafs_area': return <div className="viz-box">{renderMafsArea(visual)}</div>;
        case 'mafs_discrete': return <div className="viz-box">{renderMafsDiscrete(visual)}</div>;
        case 'bar_chart': return <div className="viz-box">{renderBarChart(visual)}</div>;
        case 'venn': return <div className="viz-box">{renderVenn(visual)}</div>;
        case 'matrix': return <div className="viz-box">{renderMatrix(visual)}</div>;
        case 'pseudo3d': return <div className="viz-box">{renderPseudo3D(visual)}</div>;
        default: return null;
      }
    } catch (e) {
      console.error('renderVisual 렌더링 중 오류:', e);
      return null;
    }
  }

  // 수학 턴의 시각 영역 전체를 담당하는 진입점. deviceVisual과 visual이 저울↔그래프 연동
  // 조건(mafs_shape 저울 + mafs_function curves 2개)을 만족하면 인터랙티브 연동 뷰를 그리고,
  // 아니면 deviceVisual(있으면)과 visual을 그냥 위아래로 정적으로 쌓아서 보여준다.
  function renderMathVisualArea(log, logIdx) {
    console.log(`[디스패치 디버그] logIdx=${logIdx} mathDeviceTypeRef.current="${mathDeviceTypeRef.current}" log.visual 존재=${!!log.visual} log.visual?.kind="${log.visual?.kind}"`);
    // 학습목표별 전용 인터랙티브 장치가 있으면 그걸 우선 쓴다.
    if (mathDeviceTypeRef.current === 'limit_approach') {
      const custom = renderDevice_no1(log, logIdx, sharedXByLog, setSharedXByLog);
      if (custom) {
        console.log('[디스패치 디버그] renderDevice_no1이 정상적으로 화면을 반환함 — 이걸 씀.');
        return custom;
      }
      console.log('[디스패치 디버그] ⚠️ renderDevice_no1이 null을 반환함(위 [mathDevice_no1 디버그] 로그에서 어느 조건에 걸렸는지 확인) → 일반 렌더러로 폴백함.');
    }
    const linked = renderBalanceGraphLinked(log, logIdx);
    if (linked) return linked;
    return (
      <>
        {log.deviceVisual && renderVisual(log.deviceVisual)}
        {renderVisual(log.visual)}
      </>
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
                {' '}
                <span className="viz-badge">[시각화: {GOALS_DATA.math[goals.math]?.vizType || 'narration'}]</span>
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
                  {log.activeTrack === 'math' && renderMathVisualArea(log, logIdx)}
                </div>

                {log.sceneComplete ? (
                  <div className="scene-end">장면 완료 — 세 트랙 모두 완주했습니다.</div>
                ) : (
                  <div className="choices">
                    {log.choices.map((choice, cIdx) => (
                      <div className="choice-item" key={cIdx}>
                        <button
                          className={`choice-btn ${cIdx === log.correctIndex ? 'test-correct' : ''}`}
                          disabled={log.selectedChoiceIndex !== null}
                          onClick={() => handleChoice(logIdx, cIdx, choice, log.correctIndex, log.activeTrack)}
                        >
                          {cIdx + 1}. {renderTextWithMath(choice)}
                        </button>
                        {log.activeTrack === 'math' && renderChoiceMiniGraph(log.visual, cIdx)}
                      </div>
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