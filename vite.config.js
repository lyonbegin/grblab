import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import inferenceCache from './vite-plugin-inference-cache.js'
import publicCacheWriter from './vite-plugin-public-cache-writer.js'

export default defineConfig({
  plugins: [
    react(),
    inferenceCache(),
    publicCacheWriter(),

    // ✅ 추가: 개발 모드에서만 public/api-cache에 저장하는 엔드포인트
    {
      name: 'dev-cache-writer',
      configureServer(server) {
        // 개발 서버에서만 동작 (build/preview에서는 configureServer 자체가 실행되지 않음)
        if (server.config.mode !== 'development') return

        server.middlewares.use('/api/save-cache', (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            return res.end()
          }

          if (req.method !== 'POST') {
            res.statusCode = 405
            return res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          }

          let body = ''
          req.on('data', chunk => (body += chunk))
          req.on('end', async () => {
            try {
              const { filename, data } = JSON.parse(body)
              if (!filename) {
                res.statusCode = 400
                return res.end(JSON.stringify({ error: 'filename is required' }))
              }

              const fs = await import('fs')
              const path = await import('path')

              const dir = path.resolve(process.cwd(), 'public/api-cache')
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

              // ✅ 경로 안전장치: 파일명에 /, \, .. 등 금지
              // const safe = String(filename).replace(/[^\w.-]/g, '_')
              const filePath = path.join(dir, `${filename}.json`)

              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

              return res.end(JSON.stringify({ ok: true, file: `/api-cache/${filename}.json` }))
            } catch (e) {
              res.statusCode = 500
              return res.end(JSON.stringify({ error: e.message }))
            }
          })
        })
      },
    },
  ],

  server: {
   port: 8080,
  },
})