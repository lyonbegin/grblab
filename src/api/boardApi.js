// src/api/boardApi.js
// ✅ localStorage 기반 목업 API (스크린샷 UI용 데이터 구조)
// ✅ 나중에 여기만 서버 API로 바꾸시면 UI는 그대로 유지됩니다.

const LS_KEY = 'kras_board_v2';

function nowIso() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function seedIfEmpty(siteId) {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;

  // 스크린샷에 보이는 흐름(번호 10~2, 기한일 파란 링크, 상태 버튼)
  const demo = {
    posts: [
      {
        id: 'p10',
        siteId,
        title: '업무소통 현장 테스트',
        body: '업무소통 테스트 게시글입니다.',
        siteName: '테스트현장',
        author: '개발팀',
        createdAt: '2025-06-04T14:20:00.000Z',
        updatedAt: '2025-06-04T14:20:00.000Z',
        dueDate: '2025-06-11',
        hasAttachment: true,
        status: '확인완료',
        chips: ['업무소통'],
        comments: [],
      },
      {
        id: 'p9',
        siteId,
        title: '테스트 공사변경 관리',
        body: '공사변경 관리 테스트입니다.',
        siteName: '테스트 공사현장',
        author: '개발팀',
        createdAt: '2025-07-03T00:59:00.000Z',
        updatedAt: '2025-07-03T00:59:00.000Z',
        dueDate: '2025-07-10',
        hasAttachment: false,
        status: '',
        chips: [],
        comments: [],
      },
      {
        id: 'p8',
        siteId,
        title: '복공2지구 가로수 정비공사 공사보드',
        body: '복공2지구 가로수 정비공사 관련 공지입니다.',
        siteName: '복공2지구 가로수 정비공사',
        author: '개발팀',
        createdAt: '2025-06-12T17:00:00.000Z',
        updatedAt: '2025-06-12T17:00:00.000Z',
        dueDate: '2025-06-19',
        hasAttachment: true,
        status: '확인완료',
        chips: ['복공2지구', '가로수정비공사', '공사공지', '공사보드'],
        comments: [],
      },
      {
        id: 'p7',
        siteId,
        title: '기안/결재진행 관련 게시물',
        body: '기안/결재진행 테스트 게시물입니다.',
        siteName: '기안/결재진행 테스트현장',
        author: '개발팀',
        createdAt: '2025-05-19T09:18:00.000Z',
        updatedAt: '2025-05-19T09:18:00.000Z',
        dueDate: '2025-05-26',
        hasAttachment: false,
        status: '확인중',
        chips: ['기안/결재진행'],
        comments: [],
      },
      {
        id: 'p6',
        siteId,
        title: '복공2지구 가로수 정비공사',
        body: '현장 공지사항입니다.',
        siteName: '복공2지구 가로수 정비공사',
        author: '개발팀',
        createdAt: '2025-05-16T11:04:00.000Z',
        updatedAt: '2025-05-16T11:04:00.000Z',
        dueDate: '2025-05-23',
        hasAttachment: true,
        status: '확인완료',
        chips: ['복공2지구'],
        comments: [],
      },
      {
        id: 'p5',
        siteId,
        title: '2지구 공사보드 입니다.',
        body: '2지구 공사보드 내용입니다.',
        siteName: '복공2지구 가로수 정비공사',
        author: '개발팀',
        createdAt: '2025-04-24T15:03:00.000Z',
        updatedAt: '2025-04-24T15:03:00.000Z',
        dueDate: '2025-05-01',
        hasAttachment: false,
        status: '확인완료',
        chips: [],
        comments: [],
      },
      {
        id: 'p4',
        siteId,
        title: '공사보드 신고 내용',
        body: '공사보드 신고 관련 내용입니다.',
        siteName: '복공2지구 가로수 정비공사',
        author: '개발팀',
        createdAt: '2025-04-24T15:02:00.000Z',
        updatedAt: '2025-04-24T15:02:00.000Z',
        dueDate: '2025-04-30',
        hasAttachment: false,
        status: '',
        chips: [],
        comments: [],
      },
      {
        id: 'p3',
        siteId,
        title: '가로수 정비공사',
        body: '가로수 정비공사 공지입니다.',
        siteName: '복공2지구 가로수 정비공사',
        author: '개발팀',
        createdAt: '2025-03-24T15:01:00.000Z',
        updatedAt: '2025-03-24T15:01:00.000Z',
        dueDate: '2025-03-31',
        hasAttachment: false,
        status: '',
        chips: [],
        comments: [],
      },
      {
        id: 'p2',
        siteId,
        title: '공사보드입니다. 테스트 합니다.',
        body: '테스트 게시글입니다.',
        siteName: '현장명',
        author: '개발팀',
        createdAt: '2025-02-18T16:48:00.000Z',
        updatedAt: '2025-02-18T16:48:00.000Z',
        dueDate: '2025-02-25',
        hasAttachment: false,
        status: '확인중',
        chips: [],
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

function fmtYMD(date) {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
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

export async function listPosts({ siteId, q = '', filter = '전체', page = 1, pageSize = 10 } = {}) {
  await sleep();
  const db = readAll(siteId);

  const filtered = db.posts
    .filter(p => p.siteId === siteId)
    .filter(p => {
      if (!q) return true;
      const hay = `${p.title} ${p.body} ${p.siteName} ${p.author}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .filter(p => {
      if (!filter || filter === '전체') return true;
      // 칩에 포함된 것만 필터링 (스크린샷 상단 빠른검색 버튼과 동일 개념)
      return (p.chips || []).includes(filter);
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const total = filtered.length;
  const start = (page - 1) * pageSize;

  const pageItems = filtered.slice(start, start + pageSize);

  // 스크린샷처럼 "번호"가 10,9,8... 내려가도록 표시용 번호 생성
  const items = pageItems.map((p, idx) => ({
    id: p.id,
    no: total - (start + idx),     // 페이지 내에서도 자연스럽게 감소
    title: p.title,
    chips: p.chips || [],
    siteName: p.siteName,
    hasAttachment: !!p.hasAttachment,
    author: p.author,
    createdAt: p.createdAt,
    dueDate: p.dueDate,
    status: p.status || '',
    createdAtLabel: fmtYMDHM(p.createdAt),
    dueDateLabel: p.dueDate ? p.dueDate.replaceAll('-', '/').slice(2) : '',
  }));

  return { items, total };
}

export async function getPost({ siteId, postId }) {
  await sleep();
  const db = readAll(siteId);
  const post = db.posts.find(p => p.siteId === siteId && p.id === postId);
  if (!post) throw new Error('POST_NOT_FOUND');
  return JSON.parse(JSON.stringify(post));
}

export async function createPost({ siteId, title, body, author, siteName, dueDate, chips = [], hasAttachment = false }) {
  await sleep();
  const db = readAll(siteId);
  const post = {
    id: uid(),
    siteId,
    title,
    body,
    siteName: siteName || '현장명',
    author: author || '개발팀',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    dueDate: dueDate || '',
    hasAttachment: !!hasAttachment,
    status: '',
    chips,
    comments: [],
  };
  db.posts.unshift(post);
  writeAll(db);
  return JSON.parse(JSON.stringify(post));
}

export async function updatePost({ siteId, postId, title, body }) {
  await sleep();
  const db = readAll(siteId);
  const idx = db.posts.findIndex(p => p.siteId === siteId && p.id === postId);
  if (idx < 0) throw new Error('POST_NOT_FOUND');
  db.posts[idx] = { ...db.posts[idx], title, body, updatedAt: nowIso() };
  writeAll(db);
  return JSON.parse(JSON.stringify(db.posts[idx]));
}

export async function deletePost({ siteId, postId }) {
  await sleep();
  const db = readAll(siteId);
  const before = db.posts.length;
  db.posts = db.posts.filter(p => !(p.siteId === siteId && p.id === postId));
  writeAll(db);
  return { ok: db.posts.length !== before };
}

export async function addComment({ siteId, postId, author, body }) {
  await sleep();
  const db = readAll(siteId);
  const post = db.posts.find(p => p.siteId === siteId && p.id === postId);
  if (!post) throw new Error('POST_NOT_FOUND');
  const c = { id: uid(), postId, author: author || '익명', body, createdAt: nowIso() };
  post.comments = post.comments || [];
  post.comments.push(c);
  post.updatedAt = nowIso();
  writeAll(db);
  return JSON.parse(JSON.stringify(c));
}

export async function deleteComment({ siteId, postId, commentId }) {
  await sleep();
  const db = readAll(siteId);
  const post = db.posts.find(p => p.siteId === siteId && p.id === postId);
  if (!post) throw new Error('POST_NOT_FOUND');
  const before = post.comments.length;
  post.comments = post.comments.filter(c => c.id !== commentId);
  post.updatedAt = nowIso();
  writeAll(db);
  return { ok: post.comments.length !== before };
}