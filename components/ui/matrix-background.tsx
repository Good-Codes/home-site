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

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.01)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#67AFA7" // your logo blue
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)]

        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)

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