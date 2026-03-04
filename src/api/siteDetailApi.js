// src/api/siteDetailApi.js
// ✅ 현장 등록 / 수정 / 삭제 전용 API
// ✅ siteApi.js 와 동일한 localStorage key(kras_site_v1) 공유
// ✅ 나중에 여기만 서버 API 로 교체하면 UI 그대로 유지

const LS_KEY = 'kras_site_v1'

function uid() { return Math.random().toString(36).slice(2, 10) }
function nowIso() { return new Date().toISOString() }
function sleep(ms = 150) { return new Promise(r => setTimeout(r, ms)) }

// ──────────────────────────────────────────
// 날짜 포맷 유틸
// ──────────────────────────────────────────
function fmtDisplay(raw) {
  // '2025-08-04' → '25/08/04'
  if (!raw) return ''
  const parts = raw.split('-')
  if (parts.length !== 3) return raw
  return `${parts[0].slice(2)}/${parts[1]}/${parts[2]}`
}

function calcDday(raw) {
  if (!raw) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const due = new Date(raw); due.setHours(0, 0, 0, 0)
  return Math.round((due - now) / 86400000)
}

function fmtKoreanDateTime(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  })
}

// ──────────────────────────────────────────
// localStorage read / write
// ──────────────────────────────────────────
function readAll() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return { sites: [] }
  return JSON.parse(raw)
}

function writeAll(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

// ──────────────────────────────────────────
// 단건 조회
// ──────────────────────────────────────────
export async function getSiteDetail(siteId) {
  await sleep()
  const db = readAll()
  const site = db.sites.find(s => s.id === siteId)
  if (!site) throw new Error('SITE_NOT_FOUND')

  return {
    ...site,
    createdAtLabel: fmtKoreanDateTime(site.createdAt),
    dday: calcDday(site.dueDateRaw),
  }
}

// ──────────────────────────────────────────
// 현장 등록
// ──────────────────────────────────────────
export async function createSiteDetail({
  siteName,
  client = '',
  author = '관리팀',
  dueDateRaw = '',   // 'YYYY-MM-DD'
  tags = [],
  isActive = true,
}) {
  await sleep()
  if (!siteName || !siteName.trim()) throw new Error('현장명을 입력해 주세요.')

  const db = readAll()

  const site = {
    id: uid(),
    siteName: siteName.trim(),
    isActive,
    starred: false,
    tags,
    boardCount: 0,
    safetyCount: 0,
    safetyConfirmed: 0,
    tbmCount: 0,
    riskCount: 0,
    dueDate: fmtDisplay(dueDateRaw),
    dueDateRaw,
    client: client.trim(),
    author: author.trim() || '관리팀',
    createdAt: nowIso(),
  }

  db.sites.unshift(site)
  writeAll(db)
  return JSON.parse(JSON.stringify(site))
}

// ──────────────────────────────────────────
// 현장 수정
// patch 가능 필드: siteName / client / dueDateRaw / tags / isActive / author
// ──────────────────────────────────────────
export async function updateSiteDetail(siteId, patch = {}) {
  await sleep()
  const db = readAll()
  const idx = db.sites.findIndex(s => s.id === siteId)
  if (idx < 0) throw new Error('SITE_NOT_FOUND')

  const allowed = ['siteName', 'client', 'dueDateRaw', 'tags', 'isActive', 'author']
  const update = {}
  allowed.forEach(f => { if (f in patch) update[f] = patch[f] })

  // dueDateRaw 바뀌면 dueDate(표시용)도 갱신
  if ('dueDateRaw' in update) {
    update.dueDate = fmtDisplay(update.dueDateRaw)
  }
  if ('siteName' in update) {
    if (!update.siteName || !String(update.siteName).trim()) throw new Error('현장명을 입력해 주세요.')
    update.siteName = String(update.siteName).trim()
  }

  db.sites[idx] = { ...db.sites[idx], ...update }
  writeAll(db)

  const site = db.sites[idx]
  return {
    ...site,
    createdAtLabel: fmtKoreanDateTime(site.createdAt),
    dday: calcDday(site.dueDateRaw),
  }
}

// ──────────────────────────────────────────
// 현장 삭제
// ──────────────────────────────────────────
export async function deleteSiteDetail(siteId) {
  await sleep()
  const db = readAll()
  const before = db.sites.length
  db.sites = db.sites.filter(s => s.id !== siteId)
  writeAll(db)
  return { ok: db.sites.length !== before }
}