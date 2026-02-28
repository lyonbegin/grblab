// src/lib/publicInferenceCache.js

// 서버 플러그인과 동일한 safe 규칙
export function safeKey(s) {
  return String(s).replace(/[^a-zA-Z0-9._-]/g, '_')
}

// public 정적 캐시 JSON 경로
export function publicCacheUrl(modelId, imageFile) {
  return `/api-cache/${safeKey(modelId)}/${safeKey(imageFile)}.json`
}

// (빌드/배포 포함) 정적 캐시 읽기
export async function readPublicCache(modelId, imageFile) {
  const url = publicCacheUrl(modelId, imageFile)

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data?.predictions) ? data.predictions : null
  } catch {
    return null
  }
}

// (DEV에서만) public에 저장 요청
export async function writePublicCacheDevOnly(modelId, imageFile, predictions) {
  // ✅ Vite 전용 플래그: dev일 때만 true
  if (!import.meta.env.DEV) return

  try {
    await fetch('/api/public-cache-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, imageFile, predictions }),
    })
  } catch (e) {
    console.warn('[public-cache-write] 실패:', e?.message || e)
  }
}