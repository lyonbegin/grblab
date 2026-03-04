// src/api/safetyDetailApi.js
// ✅ 안전신고 "디테일 전용" 단독 API
// ✅ boardDetailApi.js 패턴 동일

const DETAIL_DB = {
  s8: {
    id: 's8',
    boardType: '안전신고',
    title: '완료보고사항 입니다.',
    siteName: '죽동2지구 가로수 정비공사',
    location: '대전광역시 유성구 죽동 일원',
    author: '계정일님',
    createdAt: '2025-06-24T05:03:00',
    confirmStatusText: '확인완료',
    confirmRequestText: '확인요청',
    dueFrom: '2025-06-24',
    dueTo: '2025-07-01',
    doneReport: '완료',
    status: '확인완료',
    approvalStatus: '',
    isConfirmed: false,
    body: `완료보고사항 입니다.

- 현장 안전점검 완료
- 위험요인 제거 확인
- 안전관리자 서명 완료

※ 추가 조치사항 발생 시 즉시 보고 바랍니다.`,
    attachments: [
      { id: 'a1', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80', name: '현장사진1' },
    ],
    tags: ['#안전신고', '#현장점검', '#완료보고'],
    comments: [],
  },
  s7: {
    id: 's7',
    boardType: '안전신고',
    title: 'test현장 안전신고 바랍니다.',
    siteName: '죽동2지구 가로수 정비공사',
    location: '대전광역시 유성구 죽동 일원',
    author: '계정이님',
    createdAt: '2025-06-24T01:40:00',
    confirmStatusText: '확인중',
    confirmRequestText: '확인요청',
    dueFrom: '2025-06-24',
    dueTo: '2025-07-01',
    doneReport: '완료',
    status: '확인중',
    approvalStatus: '',
    isConfirmed: true,
    body: `test현장 안전신고 바랍니다.

- 난간 설치 미흡 구간 발견
- 작업자 안전모 미착용 확인
- 즉시 시정 조치 요청

※ 확인 후 결과 보고 바랍니다.`,
    attachments: [
      { id: 'a1', url: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=200&q=80', name: '현장사진1' },
    ],
    tags: ['#안전신고', '#난간', '#안전모'],
    comments: [],
  },
};

function sleep(ms = 120) {
  return new Promise(r => setTimeout(r, ms));
}

function normalizePostId(postId) {
  const raw = String(postId || '').trim();
  if (!raw) return '';
  if (raw.startsWith('s') || raw.startsWith('S')) return 's' + raw.slice(1);
  return 's' + raw;
}

function resolveKey(postId) {
  const n = normalizePostId(postId);
  if (n && DETAIL_DB[n]) return n;
  const raw = String(postId || '').trim();
  if (raw && DETAIL_DB[raw]) return raw;
  return '';
}

function firstKey() {
  const keys = Object.keys(DETAIL_DB);
  return keys.length ? keys[0] : '';
}

function toSafeIso(dateStr) {
  const s = String(dateStr || '').trim();
  if (!s) return '';
  if (/[zZ]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) return s + 'Z';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T00:00:00Z';
  return s;
}

function formatKoreanDateTime(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr || '');
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  });
}

// ── 조회 ──
export async function getSafetyDetail(postId, options = {}) {
  const { fallback = true, throwIfNotFound = false } = options;
  await sleep();

  const key = resolveKey(postId);
  let data = key ? DETAIL_DB[key] : null;

  if (!data) {
    if (throwIfNotFound || !fallback) throw new Error('POST_NOT_FOUND');
    const fk = firstKey();
    data = fk ? DETAIL_DB[fk] : null;
    if (!data) throw new Error('POST_NOT_FOUND');
  }

  const createdAtSafe = toSafeIso(data.createdAt);
  return {
    ...data,
    createdAt: createdAtSafe || data.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || data.createdAt),
    dueRangeLabel: `${data.dueFrom} ~ ${data.dueTo}`,
  };
}

// ── 수정 ──
export async function updateSafetyDetail(postId, patch = {}) {
  await sleep();

  const key = resolveKey(postId) || firstKey();
  const post = key ? DETAIL_DB[key] : null;
  if (!post) throw new Error('POST_NOT_FOUND');

  const allow = ['title', 'body', 'location', 'dueFrom', 'dueTo', 'confirmStatusText', 'confirmRequestText', 'doneReport', 'status', 'approvalStatus'];
  allow.forEach((field) => {
    if (field in patch) post[field] = patch[field];
  });

  const createdAtSafe = toSafeIso(post.createdAt);
  return {
    ...post,
    createdAt: createdAtSafe || post.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || post.createdAt),
    dueRangeLabel: `${post.dueFrom} ~ ${post.dueTo}`,
  };
}

// ── 삭제 ──
export async function deleteSafetyDetail(postId) {
  await sleep();
  const key = resolveKey(postId);
  if (!key) throw new Error('POST_NOT_FOUND');
  delete DETAIL_DB[key];
  return true;
}

// ── 댓글 추가 ──
export async function addSafetyComment(postId, author, body) {
  await sleep();
  const key = resolveKey(postId) || firstKey();
  const post = key ? DETAIL_DB[key] : null;
  if (!post) throw new Error('POST_NOT_FOUND');

  const comment = {
    id: Math.random().toString(36).slice(2, 10),
    author: (author && String(author).trim()) ? String(author).trim() : '익명',
    body: String(body || ''),
    createdAt: new Date().toISOString(),
  };
  post.comments = post.comments || [];
  post.comments.push(comment);
  return JSON.parse(JSON.stringify(comment));
}

// ── 댓글 삭제 ──
export async function deleteSafetyComment(postId, commentId) {
  await sleep();
  const key = resolveKey(postId) || firstKey();
  const post = key ? DETAIL_DB[key] : null;
  if (!post) throw new Error('POST_NOT_FOUND');
  post.comments = (post.comments || []).filter(c => c.id !== commentId);
  return true;
}