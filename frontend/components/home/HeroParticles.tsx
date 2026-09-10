"use client";

import { useEffect, useRef } from "react";

type Particle = {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  angle: number;
  baseAngle: number;
  opacity: number;
  glow: number;
};

function makeParticles(w: number, h: number): Particle[] {
  return Array.from({ length: 300 }, () => {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const angle = Math.random() * Math.PI * 2;
    return {
      homeX: x,
      homeY: y,
      x,
      y,
      vx: 0,
      vy: 0,
      w: 5 * Math.random() + 3,
      h: Math.random() + 1.2,
      angle,
      baseAngle: angle,
      opacity: Math.random() * 0.45 + 0.25,
      glow: 0,
    };
  });
}

/**
 * Cursor-reactive grain field for the hero. White grains drift to a ring
 * around the cursor (attract < 260px, repel < 120px), brighten as it nears,
 * and link into a constellation of faint lines that dissolves when the
 * cursor leaves and the grains spring home.
 */
export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999, inside: false };
    let presence = 0;

    // Without a cursor there is nothing for the grains to react to, so the
    // field is static and one frame is the entire animation. Looping would
    // burn a phone's battery redrawing 300 identical rectangles at 60fps.
    const reactive = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let onscreen = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.inside = true;
    };
    // Keep the last position so glow and links fade out in place
    // instead of vanishing the frame the cursor leaves.
    const onLeave = () => {
      mouse.inside = false;
    };
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);

    const ctx = canvas.getContext("2d")!;
    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      presence += ((mouse.inside ? 1 : 0) - presence) * 0.06;

      const gathered: Particle[] = [];
      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (mouse.inside && dist < 260) {
          if (dist > 120) {
            const f = 0.022 * (1 - dist / 260);
            p.vx += (dx / dist) * f * dist;
            p.vy += (dy / dist) * f * dist;
          }
          if (dist < 120 && dist > 0) {
            const f = 0.22 * (1 - dist / 120);
            p.vx -= (dx / dist) * f;
            p.vy -= (dy / dist) * f;
          }
        } else {
          p.vx += (p.homeX - p.x) * 0.018;
          p.vy += (p.homeY - p.y) * 0.018;
        }
        p.vx *= 0.88;
        p.vy *= 0.88;
        p.x += p.vx;
        p.y += p.vy;
        if (Math.sqrt(p.vx * p.vx + p.vy * p.vy) > 0.15) {
          p.angle = Math.atan2(p.vy, p.vx);
        } else {
          p.angle += (p.baseAngle - p.angle) * 0.05;
        }
        p.glow = Math.max(0, 1 - dist / 260) * presence;
        if (p.glow > 0.05) gathered.push(p);
      }

      // Constellation links between gathered grains.
      // ponytail: O(k²) pair scan; k is the ~40 grains near the cursor, fine —
      // switch to a grid hash if the particle count ever grows.
      if (presence > 0.01) {
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.lineWidth = 1;
        for (let i = 0; i < gathered.length; i++) {
          for (let j = i + 1; j < gathered.length; j++) {
            const a = gathered[i];
            const b = gathered[j];
            const lx = a.x - b.x;
            const ly = a.y - b.y;
            const d2 = lx * lx + ly * ly;
            if (d2 < 70 * 70) {
              ctx.globalAlpha =
                (1 - Math.sqrt(d2) / 70) * 0.3 * Math.min(a.glow, b.glow);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = Math.min(1, p.opacity + p.glow * 0.45);
        ctx.fillStyle = "rgb(255, 255, 255)";
        const hw = p.w / 2;
        const hh = p.h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw + hh, -hh);
        ctx.lineTo(hw - hh, -hh);
        ctx.arcTo(hw, -hh, hw, hh, hh);
        ctx.lineTo(hw - hh, hh);
        ctx.lineTo(-hw + hh, hh);
        ctx.arcTo(-hw, hh, -hw, -hh, hh);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    };

    const frame = () => {
      step();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      if (reactive) raf = requestAnimationFrame(frame);
      else step();
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      // A dvh-sized hero resizes whenever a mobile URL bar collapses; without
      // this guard the observer reshuffled all 300 grains on a no-op.
      if (w === canvas.width && h === canvas.height) return;
      canvas.width = w;
      canvas.height = h;
      particles = makeParticles(w, h);
      if (!reactive && onscreen) step();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    // The hero is one screen tall, so this loop spent most of a session
    // animating pixels nobody was looking at.
    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      if (onscreen) start();
      else stop();
    });
    io.observe(canvas);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}
