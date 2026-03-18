"use client";
import { useRef, useCallback, forwardRef, useImperativeHandle } from "react";

export interface MatrixHoverOverlayHandle {
  runOnce: () => void;
}

const MatrixHoverOverlay = forwardRef<MatrixHoverOverlayHandle>(
  function MatrixHoverOverlay(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const running = useRef(false);

    const runOnce = useCallback(() => {
      if (running.current) return;
      running.current = true;

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const parent = canvas.parentElement!;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;

      const fontSize = 10;
      const columns = Math.floor(canvas.width / fontSize);
      const drops = Array.from({ length: columns }, () => 0);
      let frameCount = 0;
      const start = performance.now();
      const duration = 2200;
      const fadeIn = 500;
      const fadeOut = 600;
      const isDark = document.documentElement.classList.contains("dark");
      const rainColor = isDark ? "#ffffff" : "#000000";

      function draw(now: number) {
        const elapsed = now - start;
        if (elapsed > duration) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          running.current = false;
          return;
        }

        let alpha: number;
        if (elapsed < fadeIn) {
          alpha = elapsed / fadeIn;
        } else if (elapsed > duration - fadeOut) {
          alpha = (duration - elapsed) / fadeOut;
        } else {
          alpha = 1;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = rainColor;
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = Math.random() > 0.5 ? "0" : "1";
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          if (frameCount % 4 === 0) {
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) drops[i] = 0;
            drops[i]++;
          }
        }
        frameCount++;
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }, []);

    useImperativeHandle(ref, () => ({ runOnce }), [runOnce]);

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-20 h-full w-full rounded-xl opacity-30"
      />
    );
  }
);

export default MatrixHoverOverlay;