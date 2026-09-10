"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logomark } from "@/components/ui/Logomark";

// One screen, two triggers: the pre-hydration window on first load, and any
// navigation slow enough that the click would otherwise feel dead. Modelled on
// the portfolio loader — mark, mono furniture, and a lift-away exit.
//
// Deliberately not reading useSearchParams: it would opt the whole app out of
// static rendering from the root layout, and ?tab= switches are not
// navigations worth a curtain.

// Statements about the product, not fake progress: a percentage we cannot
// measure would be a lie, and "almost there" is the same lie better dressed.
const LINES = [
  "Blind voting · no anchoring",
  "Every opinion gets paid",
  "Settled on Sepolia",
];

/** A navigation that lands faster than this reads as instant; covering it
 *  would only flash a curtain at someone. Slower is a wait worth hiding.
 *  Every prefetched route in the app clears this and shows nothing. */
const ARM_MS = 300;
/** Once shown it stays this long even if the route lands the next frame — a
 *  40ms curtain is worse than no curtain. */
const MIN_MS = 300;
/** --animate-veil-out */
const EXIT_MS = 420;
/** The click may not have been a navigation at all: a handler cancelled it,
 *  or the route threw. Nothing else would ever clear the veil. */
const GIVE_UP_MS = 12_000;

type Phase = "boot" | "idle" | "pending" | "leaving";

/** True for a plain left-click that Next will turn into a route change. */
function isRouteClick(e: MouseEvent) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a");
  if (!a || a.hasAttribute("download")) return false;
  const target = a.getAttribute("target");
  if (target && target !== "_self") return false;
  const href = a.getAttribute("href");
  if (!href) return false;
  const url = new URL(a.href, location.href);
  // Same pathname covers both `#anchor` and `?query` — a scroll and a filter
  // are not page loads.
  return url.origin === location.origin && url.pathname !== location.pathname;
}

export function AppLoader() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("boot");
  // Restarts the hairline animation on every click, including repeat clicks
  // on the same link.
  const [nav, setNav] = useState(0);
  const [line, setLine] = useState(0);

  // The click listener is bound once, so it reads the phase through a ref.
  const phaseRef = useRef<Phase>("boot");
  const shownAt = useRef(0);
  const timers = useRef<number[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // The splash's dismissal is CSS (--animate-boot-veil); this only unmounts
  // the dead node afterwards. If hydration stalls and the timer never fires,
  // the veil still clears on schedule. Its own timer, not a shared one: the
  // pathname effect below clears the shared set on mount.
  useEffect(() => {
    // A link clicked inside the first third of a second is already being
    // covered by the route veil; dropping to idle here would pull it away.
    const t = window.setTimeout(() => {
      if (phaseRef.current === "boot") go("idle");
    }, 340);
    return () => clearTimeout(t);
  }, [go]);

  // One document-level listener instead of a hook per <Link>: it catches every
  // internal link in the app, including the ones inside RainbowKit's UI, and
  // costs no call-site changes.
  useEffect(() => {
    // Capture phase — by the time a click bubbles, Next's own handler has
    // already called preventDefault, so `defaultPrevented` would reject every
    // real navigation.
    const onClick = (e: MouseEvent) => {
      if (!isRouteClick(e)) return;
      setNav((n) => n + 1);
      if (phaseRef.current === "pending" || phaseRef.current === "leaving") return;
      clear();
      after(ARM_MS, () => {
        shownAt.current = Date.now();
        go("pending");
        after(GIVE_UP_MS, () => go("idle"));
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [after, clear, go]);

  // Next 15 commits the route — and so changes the pathname — the moment the
  // navigation resolves, which is the signal that the wait is over.
  useEffect(() => {
    clear();
    if (phaseRef.current !== "pending") return;
    // At least one frame, so the lift reveals painted content rather than the
    // blank gap before it.
    after(Math.max(16, MIN_MS - (Date.now() - shownAt.current)), () => {
      go("leaving");
      after(EXIT_MS, () => go("idle"));
    });
    // Keyed on pathname: the phase is read through its ref precisely so that
    // entering "pending" cannot replay this and settle the veil instantly.
  }, [pathname, after, clear, go]);

  // Only turns over on a wait long enough to read one, which is the wait
  // where having something to read is the point.
  useEffect(() => {
    if (phase !== "pending") return;
    setLine(Math.floor(Math.random() * LINES.length));
    const id = window.setInterval(
      () => setLine((i) => (i + 1) % LINES.length),
      2200
    );
    return () => clearInterval(id);
  }, [phase]);

  const visible = phase !== "idle";

  return (
    <>
      {/* The hairline fires on the click itself, so even a navigation too fast
          for the veil still acknowledges the press. Self-terminating: the
          keyframes end at opacity 0. */}
      {nav > 0 && (
        <div
          key={nav}
          aria-hidden="true"
          className="animate-route-progress pointer-events-none fixed left-0 top-0 z-[60] h-[2px] w-0 bg-hi/50"
        />
      )}

      {/* Announced once, without the rotating line: a live region reading
          marketing copy every two seconds is worse than silence. */}
      <span role="status" className="sr-only">
        {phase === "pending" ? "Loading" : ""}
      </span>

      {visible && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-[200] bg-ink ${
            phase === "boot"
              ? "animate-boot-veil"
              : phase === "leaving"
                ? "animate-veil-out"
                : "animate-veil-in"
          }`}
        >
          {/* Gutter tracks PageWrapper, so the label lands on the same left
              edge as the content it is covering. */}
          <span className="eyebrow absolute left-4 top-5 sm:left-8 lg:left-12">
            Clixo — Opinion Market
          </span>

          <div className="flex h-full flex-col items-center justify-center gap-5 px-6">
            <Logomark
              className={`size-12 text-hi ${
                phase === "boot" ? "animate-boot-mark" : "animate-veil-mark"
              }`}
            />
            <span className="h-px w-[104px] overflow-hidden bg-line">
              <span className="animate-veil-sweep block h-full w-1/5 bg-hi" />
            </span>
          </div>

          <span className="eyebrow absolute inset-x-6 bottom-8 text-center">
            {LINES[line]}
          </span>
        </div>
      )}
    </>
  );
}
