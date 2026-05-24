import { useEffect, useRef } from "react"

const COLORS = { fog: "#7A9EB5", stone: "#888C8F", hollow: "#8A7AAA" }

export default function AvatarCanvas({ type, size = 56 }) {
  const ref = useRef(null)
  const frame = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    let id
    const draw = (now) => {
      const t = now / 1000
      ctx.clearRect(0, 0, size, size)
      if (type === "fog") drawFog(ctx, size, t)
      else if (type === "stone") drawStone(ctx, size, t)
      else drawHollow(ctx, size, t)
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(id)
  }, [type, size])

  return <canvas ref={ref} width={size} height={size} aria-hidden />
}

function drawFog(ctx, s, t) {
  const c = COLORS.fog
  const cx = s / 2 + Math.sin(t * 0.7) * 5
  const cy = s / 2
  const breathe = 1 + Math.sin(t * 1.1) * 0.02
  for (let i = 4; i >= 1; i--) {
    ctx.fillStyle = `rgba(122,158,181,${0.08 * i})`
    ctx.beginPath()
    ctx.ellipse(cx, cy, (14 + i * 3) * breathe, (20 + i * 2) * breathe, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = `rgba(122,158,181,0.35)`
  ctx.beginPath()
  ctx.arc(cx, cy - 6, 9 * breathe, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = `rgba(122,158,181,0.4)`
  ctx.beginPath()
  ctx.ellipse(cx, cy + 6, 10 * breathe, 14 * breathe, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c
  ctx.beginPath()
  ctx.arc(cx, cy - 10, 5 * breathe, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = `rgba(14,12,10,0.9)`
  ctx.beginPath()
  ctx.ellipse(cx - 2, cy - 10, 2.5, 1.2, 0, 0, Math.PI * 2)
  ctx.ellipse(cx + 2, cy - 10, 2.5, 1.2, 0, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 4; i++) {
    const px = cx + Math.sin(t * 0.5 + i) * 18
    const py = cy + Math.cos(t * 0.4 + i * 1.3) * 16
    ctx.fillStyle = `rgba(122,158,181,${0.2 + 0.1 * Math.sin(t + i)})`
    ctx.beginPath()
    ctx.arc(px, py, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawStone(ctx, s, t) {
  const c = COLORS.stone
  const cx = s / 2 + Math.sin(t * 14) * 0.4
  const cy = s / 2 + Math.cos(t * 11) * 0.3
  ctx.fillStyle = "rgba(0,0,0,0.25)"
  ctx.beginPath()
  ctx.ellipse(cx, cy + 18, 12, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  const grad = ctx.createLinearGradient(cx, cy - 14, cx, cy + 14)
  grad.addColorStop(0, "#9a9ea1")
  grad.addColorStop(1, "#5c5f62")
  roundRect(ctx, cx - 11, cy - 4, 22, 22, 4)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = "rgba(255,255,255,0.08)"
  ctx.lineWidth = 0.8
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(cx - 6 + i * 5, cy + 2)
    ctx.lineTo(cx - 4 + i * 5, cy + 10)
    ctx.lineTo(cx - 2 + i * 5, cy + 4)
    ctx.stroke()
  }
  roundRect(ctx, cx - 9, cy - 16, 18, 12, 3)
  ctx.fillStyle = "#7a7e81"
  ctx.fill()
  ctx.strokeStyle = "#4a4d50"
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(cx - 4, cy - 18)
  ctx.lineTo(cx - 2, cy - 15)
  ctx.moveTo(cx + 4, cy - 18)
  ctx.lineTo(cx + 2, cy - 15)
  ctx.stroke()
  ctx.fillStyle = "#1a1714"
  roundRect(ctx, cx - 5, cy - 14, 4, 3, 1)
  roundRect(ctx, cx + 1, cy - 14, 4, 3, 1)
  ctx.fill()
}

function drawHollow(ctx, s, t) {
  const c = COLORS.hollow
  const cx = s / 2
  const cy = s / 2
  const alpha = 0.45 + Math.sin(t * 0.45) * 0.15
  ctx.strokeStyle = c
  ctx.globalAlpha = alpha
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(cx, cy + 6, 10, 14, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy - 10, 6, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = "#0E0C0A"
  ctx.beginPath()
  ctx.ellipse(cx, cy + 6, 7, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#0E0C0A"
  ctx.beginPath()
  ctx.arc(cx - 2, cy - 10, 1.2, 0, Math.PI * 2)
  ctx.arc(cx + 2, cy - 10, 1.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "rgba(138,122,170,0.5)"
  ctx.beginPath()
  ctx.arc(cx - 2, cy - 9, 0.8, 0, Math.PI * 2)
  ctx.arc(cx + 2, cy - 9, 0.8, 0, Math.PI * 2)
  ctx.fill()
  const tear = Math.abs(Math.sin(t * 0.28))
  if (tear > 0.15) {
    ctx.fillStyle = `rgba(138,122,170,${tear * 0.6})`
    ctx.beginPath()
    ctx.arc(cx - 3, cy - 5, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
