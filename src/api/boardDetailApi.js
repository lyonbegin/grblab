// src/api/boardDetailApi.js
// ✅ 공사보드 "디테일 전용" 단독 API
// ✅ postId가 "6" 이든 "p6" 이든 자동으로 맞춰서 조회
// ✅ 날짜 파싱 흔들림 방지(ISO 보정)
// ✅ (선택) 없는 postId면 fallback 반환(기본 true)

const DETAIL_DB = {
  p6: {
    id: 'p6',
    boardType: '공사보드',

    title: '기안/결재진행 관련 게시물',

    siteName: '복공2지구 가로수 정비공사',
    author: '개발팀',
    createdAt: '2025-05-16T11:04:00',

    confirmStatusText: '개정중, 개정중, 개정중',
    confirmRequestText: '확인요청',

    dueFrom: '2025-05-19',
    dueTo: '2025-05-26',

    body:
`착공 전 주요 공정 변경 사항 공유드립니다.

- 각자 TBM을 통해 위험요인 공유 및 보호구 착용 철저
- 장비 이동 동선/차량 진입 구간 주의
- 안전관리자 확인 후 CCTV 설치구간 업데이트 예정

※ 관련 내용은 현장 상황에 따라 조정될 수 있습니다.`,

    attachments: [
      { id: 'a1', url: '/demo/att1.png', name: '첨부1' },
      { id: 'a2', url: '/demo/att2.png', name: '첨부2' },
      { id: 'a3', url: '/demo/att3.png', name: '첨부3' },
    ],

    tags: ['#현장작업관리', '#CCTV', '#근로자안전수칙', '#TBM'],

    comments: []
  }
};

function sleep(ms = 120) {
  return new Promise(r => setTimeout(r, ms));
}

/** postId가 "6"/"p6"/"P6" 어떤 형태로 와도 p6로 정규화 */
function normalizePostId(postId) {
  const raw = String(postId || '').trim();
  if (!raw) return '';
  if (raw.startsWith('p') || raw.startsWith('P')) return 'p' + raw.slice(1);
  return 'p' + raw;
}

/** DB에서 사용할 실제 키 결정: (1) normalize (2) raw 그대로도 한 번 더 시도 */
function resolveKey(postId) {
  const n = normalizePostId(postId);
  if (n && DETAIL_DB[n]) return n;

  const raw = String(postId || '').trim();
  if (raw && DETAIL_DB[raw]) return raw;

  return '';
}

/** DB의 첫 항목 key */
function firstKey() {
  const keys = Object.keys(DETAIL_DB);
  return keys.length ? keys[0] : '';
}

/** 브라우저별 Date 파싱 흔들림 방지: ISO로 보정 */
function toSafeIso(dateStr) {
  const s = String(dateStr || '').trim();
  if (!s) return '';

  // 이미 Z 또는 timezone이 있으면 그대로
  if (/[zZ]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) return s;

  // "2025-05-16T11:04:00" 형태면 Z 붙여 UTC로 통일
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) return s + 'Z';

  // 날짜만 있는 경우도 보정
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T00:00:00Z';

  return s; // 그 외는 일단 그대로
}


// ==============================
// 디테일 조회 (단독 사용)
// ==============================
// options:
// - fallback: true면 postId가 없어도 첫 글 반환 (기본 true)
// - throwIfNotFound: true면 fallback 없이 throw (기본 false)
export async function getBoardDetail(postId, options = {}) {
  const { fallback = true, throwIfNotFound = false } = options;
  await sleep();

  const key = resolveKey(postId);

  let data = key ? DETAIL_DB[key] : null;

  if (!data) {
    if (throwIfNotFound || !fallback) {
      throw new Error('POST_NOT_FOUND');
    }
    const fk = firstKey();
    data = fk ? DETAIL_DB[fk] : null;
    if (!data) throw new Error('POST_NOT_FOUND'); // DB 자체가 비었을 때만
  }

  const createdAtSafe = toSafeIso(data.createdAt);

  return {
    ...data,
    createdAt: createdAtSafe || data.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || data.createdAt),
    dueRangeLabel: `${data.dueFrom} ~ ${data.dueTo}`
  };
}


// ==============================
// 댓글 추가
// ==============================
export async function addBoardComment(postId, author, body) {
  await sleep();

  const key = resolveKey(postId) || firstKey();
  const post = key ? DETAIL_DB[key] : null;
  if (!post) throw new Error('POST_NOT_FOUND');

  const comment = {
    id: Math.random().toString(36).slice(2, 10),
    author: (author && String(author).trim()) ? String(author).trim() : '익명',
    body: String(body || ''),
    createdAt: new Date().toISOString()
  };

  post.comments = post.comments || [];
  post.comments.push(comment);

  return JSON.parse(JSON.stringify(comment));
}


// ==============================
// 댓글 삭제
// ==============================
export async function deleteBoardComment(postId, commentId) {
  await sleep();

  const key = resolveKey(postId) || firstKey();
  const post = key ? DETAIL_DB[key] : null;
  if (!post) throw new Error('POST_NOT_FOUND');

  post.comments = (post.comments || []).filter(c => c.id !== commentId);
  return true;
}


// ==============================
// 게시글 삭제
// ==============================
export async function deleteBoardDetail(postId) {
  await sleep();

  const key = resolveKey(postId);
  if (!key) throw new Error('POST_NOT_FOUND');

  delete DETAIL_DB[key];
  return true;
}

// ==============================
// 게시글 수정 (읽기/수정 토글용)
// ==============================
// patch 가능한 필드만 반영
// title / body / dueFrom / dueTo / confirmStatusText / confirmRequestText
export async function updateBoardDetail(postId, patch = {}) {
  await sleep();

  const key = resolveKey(postId) || firstKey();
  const post = key ? DETAIL_DB[key] : null;
  if (!post) throw new Error('POST_NOT_FOUND');

  const allow = [
    'title',
    'body',
    'dueFrom',
    'dueTo',
    'confirmStatusText',
    'confirmRequestText'
  ];

  allow.forEach((field) => {
    if (field in patch) {
      post[field] = patch[field];
    }
  });

  const createdAtSafe = toSafeIso(post.createdAt);

  return {
    ...post,
    createdAt: createdAtSafe || post.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || post.createdAt),
    dueRangeLabel: `${post.dueFrom} ~ ${post.dueTo}`
  };
}
// ==============================
// 날짜 포맷
// ==============================
function formatKoreanDateTime(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr || '');

  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });
}