"use client";

import { useEffect, useRef, useState } from "react";

// Matches the recursive ancestor walk this used to do, in one native call.
const INTERACTIVE =
  "a,button,input,select,textarea,summary,[role='button'],.cursor-pointer";

export function CustomCursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  // Dead weight on a touch device: there is no pointer to follow and mousemove
  // never fires. Same query the native-cursor override in globals.css uses, so
  // the two can never disagree and leave a device with no cursor at all.
  useEffect(() => {
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const wrap = wrapRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!wrap || !ring || !dot) return;

    let x = -100;
    let y = -100;
    let hover = false;
    let down = false;
    let raf = 0;

    // Everything visual is written straight to the two nodes, coalesced into
    // one frame. Holding position in React state cost a render per mousemove
    // event — 60 to 120 a second, each re-styling both layers — which is paid
    // by every other interaction on the page.
    const draw = () => {
      raf = 0;
      ring.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0) scale(${
        down ? 0.55 : hover ? 1.3 : 1
      })`;
      ring.style.borderColor = hover
        ? "rgba(255, 255, 255, 1)"
        : "rgba(255, 255, 255, 0.7)";
      ring.style.borderWidth = down ? "1.5px" : "1px";
      dot.style.transform = `translate3d(${x - 2}px, ${y - 2}px, 0) scale(${
        down ? 0.75 : hover ? 1.25 : 1
      })`;
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = e.target;
      hover = target instanceof Element && !!target.closest(INTERACTIVE);
      wrap.style.opacity = "1";
      schedule();
    };

    const onDown = () => {
      down = true;
      schedule();
    };

    const onUp = () => {
      down = false;
      schedule();
    };

    const onLeave = () => {
      wrap.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden"
    >
      {/* Outer Ring — pulled closer (28px base diameter), clean thin border */}
      <div
        ref={ringRef}
        className="pointer-events-none absolute h-[28px] w-[28px] rounded-full border border-white/80"
        style={{
          transform: "translate3d(-114px, -114px, 0)",
          transformOrigin: "center center",
          transition:
            "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s ease-out",
        }}
      />

      {/* Center Dot — thin micro dot (4px x 4px) */}
      <div
        ref={dotRef}
        className="pointer-events-none absolute h-1 w-1 rounded-full bg-white"
        style={{
          transform: "translate3d(-102px, -102px, 0)",
          transformOrigin: "center center",
          transition: "transform 0.05s linear, scale 0.15s ease-out",
        }}
      />
    </div>
  );
}
