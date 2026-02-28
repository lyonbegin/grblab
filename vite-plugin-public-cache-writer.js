// vite-plugin-public-cache-writer.js
import fs from 'fs'
import path from 'path'

export default function publicCacheWriterPlugin() {
  return {
    name: 'vite-plugin-public-cache-writer',
    apply: 'serve', // ✅ 개발 서버에서만 동작 (build에는 미적용)
    configureServer(server) {
      server.middlewares.use('/api/public-cache-write', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }

        let body = ''
        req.on('data', c => (body += c))
        req.on('end', () => {
          try {
            const { modelId, imageFile, predictions } = JSON.parse(body || '{}')
            if (!modelId || !imageFile || !predictions) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'modelId, imageFile, predictions required' }))
              return
            }

            const safe = (s) => String(s).replace(/[^a-zA-Z0-9._-]/g, '_')
            const dir = path.resolve(process.cwd(), 'public', 'api-cache', safe(modelId))
            fs.mkdirSync(dir, { recursive: true })

            const outPath = path.join(dir, safe(imageFile) + '.json')
            fs.writeFileSync(outPath, JSON.stringify({ predictions }, null, 2), 'utf-8')

            res.end(JSON.stringify({ ok: true, path: `/api-cache/${safe(modelId)}/${safe(imageFile)}.json` }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })
    },
  }
}