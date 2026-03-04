// src/api/ppeDetailApi.js
const DETAIL_DB = {
  p1: {
    id: 'p1',
    title: '개인보호구 지급대장(헬멧/안전모)-20250915',
    siteName: '2025년 어울림 복지센터 신축공사',
    projectName: '철근콘크리트공사',
    author: '홍익84123',
    createdAt: '2025-09-15T01:39:00.000Z',
    body: '본인은 지급된 보호구를 정확히 착용하고 작업에 임하겠습니다.\n아래와 같이 보호구를 지급받았음을 확인하며 서명합니다.',
    location: '1공구',
    // ✅ recipients → ledger 로 구조 통일 (컴포넌트와 동일한 필드명)
    ledger: [
      {
        id: 'r1',
        receiverName: '김상현',
        giverName: '홍익84123',
        giveDate: '2025-09-15',
        signName: '김상현',
        selected: { helmet: true, shoes: true, gloves: true },
      },
      {
        id: 'r2',
        receiverName: '이순신',
        giverName: '홍익84123',
        giveDate: '2025-09-15',
        signName: '이순신',
        selected: { helmet: true, goggles: true, gloves: true },
      },
      {
        id: 'r3',
        receiverName: '홍길동',
        giverName: '홍익84123',
        giveDate: '2025-09-15',
        signName: '홍길동',
        selected: { helmet: true, shoes: true, belt: true },
      },
    ],
    previewImageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80',
    attachments: [
      { id: 'a1', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80', name: '사진1' },
    ],
    status: '진행중',
    tags: [],
  },
  p2: {
    id: 'p2',
    title: '개인보호구 지급대장(공통)-20250923',
    siteName: '신림초등학교 외 1건(전주…)',
    projectName: '가설/안전관리',
    author: '안전담당이님',
    createdAt: '2025-09-23T08:10:00.000Z',
    body: '',
    location: '',
    ledger: [], // ✅ 빈 배열로 초기화
    previewImageUrl: 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=1200&q=80',
    attachments: [],
    status: '진행중',
    tags: [],
  },
}

function sleep(ms = 120) {
  return new Promise((r) => setTimeout(r, ms))
}

function normalizeId(postId) {
  return String(postId || '').trim()
}

function firstKey() {
  const keys = Object.keys(DETAIL_DB)
  return keys.length ? keys[0] : ''
}

function toSafeIso(dateStr) {
  const s = String(dateStr || '').trim()
  if (!s) return ''
  if (/[zZ]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) return s + 'Z'
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T00:00:00Z'
  return s
}

function formatKoreanDateTime(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return String(dateStr || '')
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  })
}

export async function getPpeDetail(postId, options = {}) {
  const { fallback = true, throwIfNotFound = false } = options
  await sleep()

  const key = normalizeId(postId)
  let data = key && DETAIL_DB[key] ? DETAIL_DB[key] : null

  if (!data) {
    if (throwIfNotFound || !fallback) throw new Error('POST_NOT_FOUND')
    const fk = firstKey()
    data = fk ? DETAIL_DB[fk] : null
    if (!data) throw new Error('POST_NOT_FOUND')
  }

  const createdAtSafe = toSafeIso(data.createdAt)
  return {
    ...data,
    // ✅ ledger 항상 배열 보장
    ledger: Array.isArray(data.ledger) ? data.ledger : [],
    createdAt: createdAtSafe || data.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || data.createdAt),
  }
}

export async function updatePpeDetail(postId, patch = {}) {
  await sleep()

  const key = normalizeId(postId) || firstKey()
  const post = key ? DETAIL_DB[key] : null
  if (!post) throw new Error('POST_NOT_FOUND')

  // ✅ 핵심 수정: ledger, body, location 추가
  const allow = [
    'title', 'siteName', 'projectName', 'note',
    'previewImageUrl',
    'body',      // ✅ 추가
    'location',  // ✅ 추가
    'ledger',    // ✅ 추가 (지급대장 저장 핵심)
  ]
  allow.forEach((field) => {
    if (field in patch) post[field] = patch[field]
  })

  const createdAtSafe = toSafeIso(post.createdAt)
  return {
    ...post,
    ledger: Array.isArray(post.ledger) ? post.ledger : [],
    createdAt: createdAtSafe || post.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || post.createdAt),
  }
}

export async function deletePpeDetail(postId) {
  await sleep()
  const key = normalizeId(postId)
  if (!key || !DETAIL_DB[key]) throw new Error('POST_NOT_FOUND')
  delete DETAIL_DB[key]
  return true
}