import { useEffect, useState } from "react"

export function useTypewriter(text, speed = 16) {
  const [display, setDisplay] = useState("")

  useEffect(() => {
    setDisplay("")
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i += 1
      setDisplay(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return display
}
