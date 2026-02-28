/**
 * vite-plugin-inference-cache.js
 *
 * Vite 개발 서버에 /api/cache GET·POST 엔드포인트를 추가합니다.
 * 결과는 프로젝트 루트의 inference-cache.json 파일에 저장되므로
 * Vite 재시작 후에도 유지되고, 모든 방문객이 동일 캐시를 공유합니다.
 *
 * ── 사용법 ──────────────────────────────────────────────
 * // vite.config.js
 * import inferenceCache from './vite-plugin-inference-cache.js'
 *
 * export default defineConfig({
 *   plugins: [react(), inferenceCache()],
 * })
 * ────────────────────────────────────────────────────────
 */

import fs   from 'fs'
import path from 'path'

const CACHE_FILE = path.resolve(process.cwd(), 'inference-cache.json')

/* JSON 파일에서 캐시 로드 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    }
  } catch (e) {
    console.warn('[inference-cache] 캐시 파일 로드 실패, 초기화합니다.', e.message)
  }
  return {}
}

/* 캐시를 JSON 파일에 저장 */
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
  } catch (e) {
    console.warn('[inference-cache] 캐시 파일 저장 실패:', e.message)
  }
}

export default function inferenceCachePlugin() {
  // 서버 시작 시 파일에서 캐시 로드 (메모리에도 유지해 빠른 응답)
  const cache = loadCache()
  console.log(`[inference-cache] 캐시 로드 완료 — ${Object.keys(cache).length}개 항목`)

  return {
    name: 'vite-plugin-inference-cache',

    configureServer(server) {
      server.middlewares.use('/api/cache', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        /* Preflight */
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        /* GET /api/cache?key=xxxx  → 캐시 조회 */
        if (req.method === 'GET') {
          const url    = new URL(req.url, 'http://localhost')
          const key    = url.searchParams.get('key')
          if (!key) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'key 파라미터가 필요합니다.' }))
            return
          }
          const hit = cache[key] ?? null
          res.end(JSON.stringify({ hit, key }))
          return
        }

        /* POST /api/cache  body: { key, predictions } → 캐시 저장 */
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const { key, predictions } = JSON.parse(body)
              if (!key || !predictions) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'key, predictions 필드가 필요합니다.' }))
                return
              }
              cache[key] = predictions
              saveCache(cache)           // 파일에 즉시 기록
              console.log(`[inference-cache] 저장: ${key.slice(0, 60)}...`)
              res.end(JSON.stringify({ ok: true, key }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method Not Allowed' }))
      })
    },
  }
}