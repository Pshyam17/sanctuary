/** Gemini model — flash-latest matches your working API key; 2.0-flash hits free-tier quota. */
export const GEMINI_MODEL = "gemini-flash-latest"

export function formatGeminiError(err) {
  const msg = err?.message || String(err)
  if (msg.includes("429") || /quota/i.test(msg)) {
    return "Gemini quota limit hit. Wait a few minutes or check usage at ai.google.dev."
  }
  if (msg.includes("API key") || msg.includes("403")) {
    return "API key rejected. Check VITE_GEMINI_API_KEY in Vercel and .env.local."
  }
  if (msg.includes("404") && msg.includes("model")) {
    return "Model not available for this key. Update GEMINI_MODEL in the app."
  }
  return `Connection issue: ${msg.slice(0, 120)}`
}

export function safeResponseText(response) {
  try {
    return response?.text?.() || ""
  } catch {
    return ""
  }
}
