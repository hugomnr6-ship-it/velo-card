"use client";

import { useEffect, useRef } from "react";
import type { CardTier } from "@/types";

interface ConfettiProps {
  active: boolean;
  duration?: number;
  colors?: string[];
  particleCount?: number;
}

const tierConfettiColors: Record<CardTier, string[]> = {
  bronze: ["#E8A854", "#D4913A", "#C07D26", "#F5C882"],
  argent: ["#C0C8D4", "#9B82C0", "#7E64A8", "#D5C5ED"],
  platine: ["#E0E8F0", "#C8D8E8", "#B0C8E0", "#6366F1"],
  diamant: ["#00D4FF", "#00B8E6", "#6366F1", "#FFFFFF"],
  legende: ["#FFD700", "#FFA500", "#FF6347", "#FFFFFF", "#6366F1"],
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
  shape: "rect" | "circle";
}

export { tierConfettiColors };

export default function Confetti({
  active,
  duration = 3000,
  colors = tierConfettiColors.legende,
  particleCount = 50,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Generate particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.4,
        y: canvas.height * 0.3 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 8 + 4),
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    const startTime = performance.now();
    const gravity = 0.3;
    const friction = 0.99;

    function animate(now: number) {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        return;
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Fade out in the last 500ms
      const fadeProgress = elapsed > duration - 500 ? (duration - elapsed) / 500 : 1;

      for (const p of particles) {
        // Physics
        p.vy += gravity;
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity = fadeProgress;

        // Draw
        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, duration, colors, particleCount]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 51,
      }}
    />
  );
}
