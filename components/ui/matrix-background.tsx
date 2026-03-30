"use client"
import { useEffect, useRef } from "react"

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const parent = canvas.parentElement!

    canvas.width = parent.offsetWidth
    canvas.height = parent.offsetHeight

    const letters = "01"
    const fontSize = 14
    const columns = canvas.width / fontSize

    const drops: number[] = []
    for (let i = 0; i < columns; i++) {
      drops[i] = 1
    }

    function isDark() {
      return document.documentElement.classList.contains("dark")
    }

    function draw() {
      ctx.fillStyle = isDark() ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)]

        // Bright head: leading character glows white/light
        ctx.fillStyle = isDark() ? "#ffffff" : "#b8b8b8"
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        // Trail: draw one row back in the normal color
        const trailText = letters[Math.floor(Math.random() * letters.length)]
        const sparkle = Math.random() > 0.95
        ctx.fillStyle = sparkle
          ? (isDark() ? "#ffffff" : "#292929")
          : (isDark() ? "#67AFA7" : "#a0b2b0")
        ctx.fillText(trailText, i * fontSize, (drops[i] - 1) * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i]++
      }
    }

    const interval = setInterval(draw, 55)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 -z-10 w-full h-full opacity-20"
      />
    </>
  )
}