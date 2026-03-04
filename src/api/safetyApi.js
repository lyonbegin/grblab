// src/api/safetyApi.js
// ✅ localStorage 기반 목업 API
// ✅ 나중에 여기만 서버 API로 바꾸시면 UI는 그대로 유지됩니다.

const LS_KEY = 'kras_safety_v1';

function nowIso() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function seedIfEmpty(siteId) {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;

  const demo = {
    posts: [
      {
        id: 's11',
        siteId,
        title: '9월 24일 10:35, 철골 설치 작업 중 상부...',
        body: '9월 24일 10:35, 철골 설치 작업 중 상부에서 볼트 낙하 위험 발견. 즉시 작업 중단 및 안전망 설치 요청.',
        location: '현장',
        siteName: '앱테스트현장',
        author: '계정일님',
        createdAt: '2025-08-04T01:35:00.000Z',
        updatedAt: '2025-08-04T01:35:00.000Z',
        dueDate: '2025-08-08',
        hasAttachment: false,
        isConfirmed: false,
        doneReport: '완료',
        status: '확인중',
        approvalStatus: '',
        chips: ['#신고', '#여름'],
        thumbnailUrl: '',
        comments: [],
      },
      {
        id: 's10',
        siteId,
        title: '완료보고서 작성 내용입니다.',
        body: '완료보고서 작성 내용입니다.',
        location: '대전광역시 유성...',
        siteName: '죽동2지구 가로수 정비공사',
        author: '계정일님',
        createdAt: '2025-06-25T05:36:00.000Z',
        updatedAt: '2025-06-25T05:36:00.000Z',
        dueDate: '2025-07-02',
        hasAttachment: false,
        isConfirmed: false,
        doneReport: '완료',
        status: '확인완료',
        approvalStatus: '',
        chips: [],
        thumbnailUrl: '',
        comments: [],
      },
      {
        id: 's9',
        siteId,
        title: '완료보고서 작성 내용입니다: 안전신고 확...',
        body: '완료보고서 작성 내용입니다. 안전신고 확인 완료.',
        location: '대전광역시 유성...',
        siteName: '죽동2지구 가로수 정비공사',
        author: '계정일님',
        createdAt: '2025-06-25T00:52:00.000Z',
        updatedAt: '2025-06-25T00:52:00.000Z',
        dueDate: '2025-07-02',
        hasAttachment: false,
        isConfirmed: false,
        doneReport: '완료',
        status: '확인완료',
        approvalStatus: '결재중',
        chips: [],
        thumbnailUrl: '',
        comments: [],
      },
      {
        id: 's8',
        siteId,
        title: '완료보고사항 입니다.',
        body: '완료보고사항 입니다.',
        location: '대전광역시 유성...',
        siteName: '죽동2지구 가로수 정비공사',
        author: '계정일님',
        createdAt: '2025-06-24T05:03:00.000Z',
        updatedAt: '2025-06-24T05:03:00.000Z',
        dueDate: '2025-07-01',
        hasAttachment: false,
        isConfirmed: false,
        doneReport: '',
        status: '확인완료',
        approvalStatus: '',
        chips: [],
        thumbnailUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80',
        comments: [],
      },
      {
        id: 's7',
        siteId,
        title: 'test현장 안전신고 바랍니다.',
        body: 'test현장 안전신고 바랍니다.',
        location: '대전광역시 유성...',
        siteName: '죽동2지구 가로수 정비공사',
        author: '계정이님',
        createdAt: '2025-06-24T01:40:00.000Z',
        updatedAt: '2025-06-24T01:40:00.000Z',
        dueDate: '2025-07-01',
        hasAttachment: false,
        isConfirmed: true,
        doneReport: '완료',
        status: '확인중',
        approvalStatus: '',
        chips: [],
        thumbnailUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=200&q=80',
        comments: [],
      },
      {
        id: 's6',
        siteId,
        title: '죽동공사 현장 안전신고',
        body: '죽동공사 현장 안전신고 내용입니다.',
        location: '대전광역시 유성...',
        siteName: '죽동2지구 가로수 정비공사',
        author: '계정이님',
        createdAt: '2025-06-23T08:42:00.000Z',
        updatedAt: '2025-06-23T08:42:00.000Z',
        dueDate: '2025-06-30',
        hasAttachment: false,
        isConfirmed: true,
        doneReport: '완료',
        status: '확인완료',
        approvalStatus: '',
        chips: ['#신고'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&q=80',
        comments: [],
      },
      {
        id: 's5',
        siteId,
        title: '가원여자고등학교 체육관 내진공사 위험신고',
        body: '가원여자고등학교 체육관 내진공사 위험신고 내용입니다.',
        location: '대전광역시 유성...',
        siteName: '가원여자고등학교 체육관 내...',
        author: '계정이님',
        createdAt: '2025-05-19T00:19:00.000Z',
        updatedAt: '2025-05-19T00:19:00.000Z',
        dueDate: '2025-05-26',
        hasAttachment: false,
        isConfirmed: true,
        doneReport: '완료',
        status: '확인중',
        approvalStatus: '결재중',
        chips: ['#신고'],
        thumbnailUrl: '',
        comments: [],
      },
    ],
  };

  localStorage.setItem(LS_KEY, JSON.stringify(demo));
}

function readAll(siteId) {
  seedIfEmpty(siteId);
  return JSON.parse(localStorage.getItem(LS_KEY));
}

function writeAll(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function sleep(ms = 200) {
  return new Promise(r => setTimeout(r, ms));
}

function fmtYMDHM(date) {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yy}/${mm}/${dd} ${hh}:${mi}`;
}

export async function listSafetyPosts({ siteId, q = '', filter = '#전체', page = 1, pageSize = 10 } = {}) {
  await sleep();
  const db = readAll(siteId);

  const filtered = db.posts
    .filter(p => p.siteId === siteId)
    .filter(p => {
      if (!q) return true;
      const hay = `${p.title} ${p.body} ${p.siteName} ${p.author} ${p.location}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .filter(p => {
      if (!filter || filter === '#전체') return true;
      return (p.chips || []).includes(filter);
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const items = pageItems.map((p, idx) => ({
    id: p.id,
    no: total - (start + idx),
    title: p.title,
    chips: p.chips || [],
    location: p.location || '',
    siteName: p.siteName,
    hasAttachment: !!p.hasAttachment,
    isConfirmed: !!p.isConfirmed,
    author: p.author,
    createdAt: p.createdAt,
    dueDate: p.dueDate,
    doneReport: p.doneReport || '',
    status: p.status || '',
    approvalStatus: p.approvalStatus || '',
    thumbnailUrl: p.thumbnailUrl || '',
    createdAtLabel: fmtYMDHM(p.createdAt),
    dueDateLabel: p.dueDate ? p.dueDate.replaceAll('-', '/').slice(2) : '',
  }));

  return { items, total };
}

export async function getSafetyPost({ siteId, postId }) {
  await sleep();
  const db = readAll(siteId);
  const post = db.posts.find(p => p.siteId === siteId && p.id === postId);
  if (!post) throw new Error('POST_NOT_FOUND');
  return JSON.parse(JSON.stringify(post));
}

export async function createSafetyPost({ siteId, title, body, author, siteName, location, dueDate, chips = [], hasAttachment = false, thumbnailUrl = '' }) {
  await sleep();
  const db = readAll(siteId);
  const post = {
    id: uid(),
    siteId,
    title,
    body,
    location: location || '',
    siteName: siteName || '현장명',
    author: author || '개발팀',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    dueDate: dueDate || '',
    hasAttachment: !!hasAttachment,
    isConfirmed: false,
    doneReport: '',
    status: '',
    approvalStatus: '',
    chips,
    thumbnailUrl,
    comments: [],
  };
  db.posts.unshift(post);
  writeAll(db);
  return JSON.parse(JSON.stringify(post));
}

export async function updateSafetyPost({ siteId, postId, title, body, location, dueDate }) {
  await sleep();
  const db = readAll(siteId);
  const idx = db.posts.findIndex(p => p.siteId === siteId && p.id === postId);
  if (idx < 0) throw new Error('POST_NOT_FOUND');
  db.posts[idx] = { ...db.posts[idx], title, body, location, dueDate, updatedAt: nowIso() };
  writeAll(db);
  return JSON.parse(JSON.stringify(db.posts[idx]));
}

export async function deleteSafetyPost({ siteId, postId }) {
  await sleep();
  const db = readAll(siteId);
  const before = db.posts.length;
  db.posts = db.posts.filter(p => !(p.siteId === siteId && p.id === postId));
  writeAll(db);
  return { ok: db.posts.length !== before };
}