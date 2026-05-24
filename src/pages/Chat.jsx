import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { sendToSanctuary } from "../agent/agent"
import { useChat } from "../hooks/useChat"
import { KEYS } from "../lib/storage"

export default function Chat() {
  const { messages, setMessages, typing, setTyping } = useChat()
  const [input, setInput] = useState("")
  const [draftCopy, setDraftCopy] = useState("")
  const bottomRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (location.state?.prefill) setInput(location.state.prefill)
  }, [location.state])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  async function send() {
    if (!input.trim() || typing) return
    const userText = input.trim()
    const next = [...messages, { role: "user", text: userText }]
    setMessages(next)
    setInput("")
    setTyping(true)
    try {
      const res = await sendToSanctuary(userText, messages)
      const draft = res.meta?.find((m) => m.name === "draft_message")?.result?.draft
      if (draft) setDraftCopy(draft)
      else setDraftCopy("")
      setMessages([...next, { role: "assistant", text: res.text || "Done." }])
      localStorage.setItem(KEYS.lastCheckinMsg, userText)
    } catch (err) {
      const msg = err?.message?.includes("429")
        ? "NIM rate limit — wait a moment and try again."
        : "Connection issue. Try again in a moment."
      setMessages([...next, { role: "assistant", text: msg }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="chat-wrap">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "msg-user" : "msg-agent"}>
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="msg-agent typing-dots">
            <span />
            <span />
            <span />
          </div>
        )}
        {draftCopy && (
          <div className="card" style={{ marginTop: 8 }}>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, margin: 0 }}>{draftCopy}</pre>
            <button type="button" className="btn-sage" style={{ marginTop: 10 }} onClick={() => navigator.clipboard.writeText(draftCopy)}>
              Copy
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
        <input
          className="input-field"
          style={{ borderRadius: 999 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tell me what happened."
        />
        <button
          type="button"
          onClick={send}
          disabled={typing}
          style={{
            border: 0,
            width: 46,
            height: 46,
            borderRadius: 999,
            background: "var(--ember)",
            color: "#fff",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}
