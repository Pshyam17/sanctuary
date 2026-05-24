/**
 * NVIDIA NIM clients for Sanctuary.
 * One API key (VITE_NIM_API_KEY) hits the OpenAI-compatible endpoint.
 * Split by complexity so cheap calls (8B) don't burn the same credits as chat (70B).
 */

const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions"

export const MODELS = {
  HEAVY: "meta/llama-3.3-70b-instruct",
  MEDIUM: "meta/llama-3.3-70b-instruct",
  LIGHT: "meta/llama-3.1-8b-instruct",
}

function getKey() {
  return import.meta.env.VITE_NIM_API_KEY
}

export function hasKey() {
  return Boolean(getKey())
}

async function callNim(body) {
  const key = getKey()
  if (!key) throw new Error("VITE_NIM_API_KEY missing — add it to .env.local and Vercel.")
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    const status = res.status
    if (status === 401 || status === 403) throw new Error(`NIM auth failed (${status}). Check VITE_NIM_API_KEY.`)
    if (status === 429) throw new Error("NIM rate limit hit. Wait a moment and retry.")
    if (status === 404) throw new Error(`NIM model not found. ${errText.slice(0, 120)}`)
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
