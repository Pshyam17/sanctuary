/**
 * Vercel serverless proxy for NVIDIA NIM.
 * Keeps the API key server-side and bypasses NIM's missing CORS headers.
 *
 * Client posts an OpenAI-compatible chat-completions body to /api/nim;
 * this function forwards it to https://integrate.api.nvidia.com/v1/chat/completions
 * with the Bearer token injected from env.
 *
 * Env: NIM_API_KEY (server-only; do NOT prefix with VITE_).
 *      Falls back to VITE_NIM_API_KEY for legacy parity.
 */

const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "content-type")
    res.status(204).end()
    return
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const key = process.env.NIM_API_KEY || process.env.VITE_NIM_API_KEY
  if (!key) {
    res.status(500).json({ error: "NIM_API_KEY missing on server" })
    return
  }

  try {
    const upstream = await fetch(NIM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: typeof req.body === "string" ? req.body : JSON.stringify(req.body),
    })

    const text = await upstream.text()
    res.status(upstream.status)
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json")
    res.send(text)
  } catch (err) {
    res.status(502).json({ error: `Proxy fetch failed: ${err?.message || String(err)}` })
  }
}
