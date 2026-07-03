"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  shape: "rect" | "circle";
}

const COLORS = [
  "#f43f5e", // rose
  "#0ea5e9", // sky
  "#f59e0b", // amber
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#facc15", // yellow
];

/**
 * Full-screen confetti burst rendered on a canvas overlay.
 * Fires once on mount — remount (change `key`) to fire again.
 * Two "cannons" fire from the bottom corners toward the center,
 * then gravity takes over.
 */
export default function Confetti({
  count = 140,
  duration = 2800,
}: {
  count?: number;
  duration?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

    const particles: Particle[] = Array.from({ length: count }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const angle = fromLeft
        ? rand(-Math.PI * 0.45, -Math.PI * 0.25) // up-right
        : rand(-Math.PI * 0.75, -Math.PI * 0.55); // up-left
      const speed = rand(9, 17);
      return {
        x: fromLeft ? rand(-20, w * 0.15) : rand(w * 0.85, w + 20),
        y: h + rand(0, 40),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(6, 12),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.25, 0.25),
        shape: Math.random() < 0.7 ? "rect" : "circle",
      };
    });

    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);

      const fade = Math.max(0, 1 - elapsed / duration);
      for (const p of particles) {
        p.vy += 0.35; // gravity
        p.vx *= 0.99; // drag
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed < duration) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [count, duration]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: "100vw", height: "100vh" }}
      aria-hidden
    />
  );
}
