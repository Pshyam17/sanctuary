import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const localKey = env.NIM_API_KEY || env.VITE_NIM_API_KEY

  return {
    plugins: [
      react(),
      // Local-dev proxy that mirrors api/nim.js so `npm run dev` works.
      // In production, Vercel serves api/nim.js as a real serverless function.
      {
        name: 'sanctuary-nim-dev-proxy',
        configureServer(server) {
          server.middlewares.use('/api/nim', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            if (!localKey) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'NIM_API_KEY missing in .env.local' }))
              return
            }
            try {
              const chunks = []
              for await (const chunk of req) chunks.push(chunk)
              const body = Buffer.concat(chunks).toString('utf-8')
              const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${localKey}`,
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                body,
              })
              const text = await upstream.text()
              res.statusCode = upstream.status
              res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
              res.end(text)
            } catch (err) {
              res.statusCode = 502
              res.end(JSON.stringify({ error: `Proxy fetch failed: ${err?.message || String(err)}` }))
            }
          })
        },
      },
    ],
  }
})
