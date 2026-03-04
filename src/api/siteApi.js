// src/api/siteApi.js
// ✅ localStorage 기반 목업 API (현장관리 UI용 데이터 구조)
// ✅ 나중에 여기만 서버 API로 바꾸시면 UI는 그대로 유지됩니다.

const LS_KEY = 'kras_site_v1'

function uid() { return Math.random().toString(36).slice(2, 10) }
function nowIso() { return new Date().toISOString() }

function sleep(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

function fmtYMD(date) {
  if (!date) return ''
  const d = new Date(date)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}/${mm}/${dd}`
}

function calcDday(dueDateStr) {
  if (!dueDateStr) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due - now) / (1000 * 60 * 60 * 24))
  return diff
}

function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) return

  const demo = {
    sites: [
      {
        id: 's5',
        siteName: '죽동2지구 가로수 정비공사',
        isActive: true,
        starred: true,
        tags: ['#가로수정비'],
        boardCount: 0,
        safetyCount: 9,  // 안전신고 2/9
        safetyConfirmed: 2,
        tbmCount: 16,
        riskCount: 18,
        dueDate: '2026/05/12',
        dueDateRaw: '2026-05-12',
        client: '대전지방조달청',
        author: '관리팀',
        createdAt: '2025-04-02T00:00:00.000Z',
      },
      {
        id: 's4',
        siteName: '업테스트현장',
        isActive: true,
        starred: false,
        tags: ['#신축공사'],
        boardCount: 1,
        safetyCount: 1,
        safetyConfirmed: 0,
        tbmCount: 1,
        riskCount: 2,
        dueDate: '2026/08/04',
        dueDateRaw: '2026-08-04',
        client: '테스트',
        author: '관리팀',
        createdAt: '2025-08-04T00:00:00.000Z',
      },
      {
        id: 's3',
        siteName: '공동 현장 생성테스트',
        isActive: true,
        starred: false,
        tags: ['#신축공사'],
        boardCount: 0,
        safetyCount: 0,
        safetyConfirmed: 0,
        tbmCount: 5,
        riskCount: 2,
        dueDate: '2026/01/01',
        dueDateRaw: '2026-01-01',
        client: '대전지방조달청',
        author: '관리팀',
        createdAt: '2025-07-09T00:00:00.000Z',
      },
      {
        id: 's2',
        siteName: '테스트 공사현장',
        isActive: true,
        starred: false,
        tags: ['#신축공사'],
        boardCount: 1,
        safetyCount: 0,
        safetyConfirmed: 0,
        tbmCount: 0,
        riskCount: 0, // 미등록
        dueDate: '2026/05/27',
        dueDateRaw: '2026-05-27',
        client: '충북지방조달청',
        author: '관리팀',
        createdAt: '2025-07-09T00:00:00.000Z',
      },
      {
        id: 's1',
        siteName: '가원여자고등학교 체육관 내진보강공사',
        isActive: true,
        starred: false,
        tags: ['#신축공사'],
        boardCount: 1,
        safetyCount: 1,
        safetyConfirmed: 1,
        tbmCount: 1,
        riskCount: 0, // 미등록
        dueDate: '2026/02/24',
        dueDateRaw: '2026-02-24',
        client: '대전시교육청',
        author: '관리팀',
        createdAt: '2025-07-09T00:00:00.000Z',
      },
    ],
  }

  localStorage.setItem(LS_KEY, JSON.stringify(demo))
}

function readAll() {
  seedIfEmpty()
  return JSON.parse(localStorage.getItem(LS_KEY))
}

function writeAll(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export async function listSites({ q = '', tag = '공사전체', page = 1, pageSize = 10 } = {}) {
  await sleep()
  const db = readAll()

  const filtered = db.sites
    .filter((s) => {
      if (!q) return true
      return s.siteName.toLowerCase().includes(q.toLowerCase()) ||
        (s.client || '').toLowerCase().includes(q.toLowerCase())
    })
    .filter((s) => {
      if (!tag || tag === '공사전체' || tag === '#공사전체') return true
      return (s.tags || []).includes(tag)
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))

  const total = filtered.length
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  const items = pageItems.map((s, idx) => ({
    id: s.id,
    no: total - (start + idx),
    isActive: s.isActive,
    starred: s.starred,
    siteName: s.siteName,
    // 공사보드: 아이콘 + 카운트 표시용 (스크린샷: "🗂0")
    boardCount: s.boardCount,
    // 안전신고: 경고 아이콘 + "확인/전체" 표시
    safetyCount: s.safetyCount,
    safetyConfirmed: s.safetyConfirmed,
    safetyLabel: `${s.safetyConfirmed}/${s.safetyCount}`,
    tbmCount: s.tbmCount,
    // 위험성평가: 0이면 미등록, 아니면 N건
    riskCount: s.riskCount,
    dueDate: s.dueDate,
    dday: s.dueDateRaw ? calcDday(s.dueDateRaw) : null,
    client: s.client,
    author: s.author,
    createdAtLabel: fmtYMD(s.createdAt),
  }))

  return { items, total }
}

export async function getSite({ siteId }) {
  await sleep()
  const db = readAll()
  const site = db.sites.find((s) => s.id === siteId)
  if (!site) throw new Error('SITE_NOT_FOUND')
  return JSON.parse(JSON.stringify(site))
}

export async function createSite({
  siteName,
  tags = [],
  client = '',
  author = '관리팀',
  dueDate = '',
  dueDateRaw = '',
}) {
  await sleep()
  const db = readAll()
  const site = {
    id: uid(),
    siteName,
    isActive: true,
    starred: false,
    tags,
    boardCount: 0,
    safetyCount: 0,
    safetyConfirmed: 0,
    tbmCount: 0,
    riskCount: 0,
    dueDate,
    dueDateRaw,
    client,
    author,
    createdAt: nowIso(),
  }
  db.sites.unshift(site)
  writeAll(db)
  return JSON.parse(JSON.stringify(site))
}

export async function updateSite({ siteId, siteName, client, dueDate, dueDateRaw, tags }) {
  await sleep()
  const db = readAll()
  const idx = db.sites.findIndex((s) => s.id === siteId)
  if (idx < 0) throw new Error('SITE_NOT_FOUND')
  db.sites[idx] = {
    ...db.sites[idx],
    ...(siteName !== undefined && { siteName }),
    ...(client !== undefined && { client }),
    ...(dueDate !== undefined && { dueDate }),
    ...(dueDateRaw !== undefined && { dueDateRaw }),
    ...(tags !== undefined && { tags }),
  }
  writeAll(db)
  return JSON.parse(JSON.stringify(db.sites[idx]))
}

export async function deleteSite({ siteId }) {
  await sleep()
  const db = readAll()
  const before = db.sites.length
  db.sites = db.sites.filter((s) => s.id !== siteId)
  writeAll(db)
  return { ok: db.sites.length !== before }
}