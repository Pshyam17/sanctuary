/**
 * NVIDIA NIM clients for Sanctuary.
 * Calls go through our own /api/nim proxy so:
 *   1. The API key stays server-side (never in the browser bundle).
 *   2. We sidestep NIM's missing CORS headers.
 * Split by complexity so cheap calls (8B) don't burn the same credits as chat (70B).
 */

const ENDPOINT = "/api/nim"

export const MODELS = {
  HEAVY: "meta/llama-3.3-70b-instruct",
  MEDIUM: "meta/llama-3.3-70b-instruct",
  LIGHT: "meta/llama-3.1-8b-instruct",
}

export function hasKey() {
  // Key lives on the server; client just trusts the proxy is configured.
  return true
}

async function callNim(body) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    const status = res.status
    if (status === 401 || status === 403) throw new Error(`NIM auth failed (${status}). Check NIM_API_KEY on Vercel.`)
    if (status === 429) throw new Error("NIM rate limit hit. Wait a moment and retry.")
    if (status === 404) throw new Error(`NIM model not found. ${errText.slice(0, 120)}`)
    if (status === 500 && /NIM_API_KEY missing/.test(errText)) {
      throw new Error("Server is missing NIM_API_KEY. Add it in Vercel env vars.")
    }
    throw new Error(`NIM ${status}: ${errText.slice(0, 160)}`)
  }
  return res.json()
}

/** Heavy chat — full agent turn with optional tools. */
export async function heavy({ messages, tools, tool_choice = "auto", temperature = 0.55, max_tokens = 800 }) {
  return callNim({
    model: MODELS.HEAVY,
    messages,
    ...(tools ? { tools, tool_choice } : {}),
    temperature,
    top_p: 0.9,
    max_tokens,
  })
}

/** Medium — scheduler, task breakdown, drafts. */
export async function medium({ messages, tools, tool_choice = "auto", temperature = 0.6, max_tokens = 900 }) {
  return callNim({
    model: MODELS.MEDIUM,
    messages,
    ...(tools ? { tools, tool_choice } : {}),
    temperature,
    top_p: 0.9,
    max_tokens,
  })
}

/** Light — energy parse, yes/no classification. Tiny prompts, tight responses. */
export async function light({ messages, temperature = 0.1, max_tokens = 40 }) {
  return callNim({
    model: MODELS.LIGHT,
    messages,
    temperature,
    top_p: 0.7,
    max_tokens,
  })
}

/** Extract the assistant message text from a completion, or "". */
export function textOf(completion) {
  return completion?.choices?.[0]?.message?.content || ""
}

/** Extract tool_calls array (or [] if none). */
export function toolCallsOf(completion) {
  return completion?.choices?.[0]?.message?.tool_calls || []
}

export function formatNimError(err) {
  const msg = err?.message || String(err)
  if (/auth|401|403/.test(msg)) return "NIM key rejected. Check VITE_NIM_API_KEY in .env.local and Vercel."
  if (/rate limit|429/.test(msg)) return "NIM rate limit hit. Wait a moment and try again."
  if (/not found|404/.test(msg)) return "NIM model unavailable. Update model id in src/agent/models.js."
  return `Connection issue: ${msg.slice(0, 140)}`
}
