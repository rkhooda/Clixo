"use client";

import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { cn } from "@/lib/utils";

/* ── Ballots ──────────────────────────────────────────────────────────────
   Illustrative splits, not live data — the panel labels itself "Sample task".
   Percentages and the vote target are derived from the counts so none of the
   three can ever drift apart.

   The three subjects are deliberately unlike each other — a thumbnail, a
   brand mark, a physical package — because the pitch is "any decision that
   needs honest human judgment", and three variations on "which layout" read
   as one narrow tool. Cycling through three different palettes is also what
   keeps the panel from looking static between rolls.

   Artwork is hand-written SVG in `public/hero/`: crisp at any size, ~600B
   each, no optimizer round-trip. Light-on-dark is load-bearing — the earlier
   DOM wireframes drew --line bars on --ink at ~1.2:1. Swap a `src` for a real
   screenshot whenever one exists. */

const BALLOTS = [
  {
    id: 42,
    question: "Which thumbnail would you actually click?",
    pot: 0.048,
    options: [
      { label: "Silhouette", votes: 16, src: "/hero/thumb-face.svg" },
      { label: "Typographic", votes: 9, src: "/hero/thumb-text.svg" },
    ],
  },
  {
    id: 47,
    question: "Which logo should this coffee brand ship?",
    pot: 0.06,
    options: [
      { label: "Symbol", votes: 9, src: "/hero/logo-mark.svg" },
      { label: "Wordmark", votes: 21, src: "/hero/logo-word.svg" },
    ],
  },
  {
    id: 51,
    question: "Which bag would you pick off the shelf?",
    pot: 0.033,
    options: [
      { label: "Quiet", votes: 13, src: "/hero/pack-minimal.svg" },
      { label: "Loud", votes: 9, src: "/hero/pack-bold.svg" },
    ],
  },
];

/* The feed is the only thing on a landing page that says "other people are
   here right now". Addresses are obviously fake and never presented as live —
   the rail above the card reads "Sample task". */
const FEED = [
  "0x7a…3f cast an opinion",
  "0x21…b8 joined the pool",
  "0xd4…09 cast an opinion",
  "0x8c…12 joined the pool",
];

const SEAL_MS = 520;
const FEED_MS = 1900;
/* Dwell before the ballot rolls itself over. The slowest reveal animation —
   the reward count-up — lands at 1100ms, so this leaves ~1.9s of settled
   result to actually read. */
const AUTO_ADVANCE_MS = 3000;

export function HeroBallot() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() =>
    BALLOTS.map(() => null)
  );
  const [sealing, setSealing] = useState(false);
  const [feedAt, setFeedAt] = useState(0);
  const sealTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const ballot = BALLOTS[index];
  const picked = picks[index];
  const revealed = picked !== null && !sealing;

  /* The target IS the total, which is what makes the visitor's click mean
     something: the task sits one opinion short, and casting it is what closes
     the task and releases the pot. That is the actual product mechanic, not a
     decoration — a task settles when it hits its vote target. */
  const target = ballot.options[0].votes + ballot.options[1].votes;
  const cast = revealed ? target : target - 1;
  const winner = ballot.options[0].votes >= ballot.options[1].votes ? 0 : 1;
  const withCrowd = picked === winner;
  const share = ballot.pot / ballot.options[winner].votes;

  const countA = useCountUp(ballot.options[0].votes, revealed, 0, 900);
  const countB = useCountUp(ballot.options[1].votes, revealed, 0, 900);
  const counts = [countA, countB];
  const reward = useCountUp(share, revealed, 4, 1100);

  useEffect(() => () => clearTimeout(sealTimer.current), []);

  /* Feed only runs while the ballot is still open — once the result is up,
     that row is the verdict, and a task at its vote target has no one left
     arriving anyway. */
  useEffect(() => {
    if (revealed || reduce) return;
    const t = setInterval(() => setFeedAt((n) => n + 1), FEED_MS);
    return () => clearInterval(t);
  }, [revealed, reduce]);

  /* Roll to the next ballot on our own once the result has landed. Reduced
     motion opts out and keeps the manual control: an unrequested timer moving
     content out from under the reader is exactly what WCAG 2.2.2 is about, and
     `reduce` is the only signal we have for "don't move things at me". */
  useEffect(() => {
    if (!revealed || reduce) return;
    const t = setTimeout(advance, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
    // `advance` is re-created every render but only ever reads `index`, which
    // is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, reduce, index]);

  function vote(choice: number) {
    if (picked !== null) return;
    setPicks((prev) => {
      const next = [...prev];
      next[index] = choice;
      return next;
    });
    if (reduce) return;
    setSealing(true);
    sealTimer.current = setTimeout(() => setSealing(false), SEAL_MS);
  }

  /* Wrapping past the last ballot clears every pick. Without that the cycle
     lands on a ballot that is already voted, reveals instantly, and the
     auto-advance timer spins the card forever with nothing to interact with. */
  function advance() {
    clearTimeout(sealTimer.current);
    setSealing(false);
    const next = (index + 1) % BALLOTS.length;
    setIndex(next);
    if (next === 0) setPicks(BALLOTS.map(() => null));
  }

  return (
    /* Every block that only appears once revealed reserves its height while
       open, so casting a vote never shifts the card in its centred panel. */
    <div className="w-full max-w-[400px] rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-lo">
          Task #{ballot.id} · {index + 1}/{BALLOTS.length}
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] uppercase",
            revealed ? "text-green" : "text-amber"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full bg-current",
              !revealed && !reduce && "animate-pulse"
            )}
          />
          {revealed ? "Settled" : "Open"}
        </span>
      </div>

      <div className="mt-2 mb-4 min-h-[42px] font-display text-[15px] font-medium leading-snug tracking-[-0.01em] text-hi">
        {ballot.question}
      </div>

      <div role="group" aria-label={ballot.question} className="grid grid-cols-2 gap-3">
        {ballot.options.map((option, i) => {
          const isPick = picked === i;
          const pct = Math.round((option.votes / target) * 100);
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => vote(i)}
              /* aria-disabled, not disabled: a disabled button leaves the tab
                 order, and these hold the result the visitor just asked for.
                 vote() ignores the second click. */
              aria-disabled={picked !== null}
              aria-label={
                revealed
                  ? `${option.label}: ${pct} percent, ${option.votes} of ${target} opinions`
                  : `Vote for ${option.label}`
              }
              className={cn(
                "group/opt flex flex-col rounded-md border bg-raised p-2.5 text-left",
                "transition-[border-color,transform] duration-200",
                picked !== null ? "cursor-default" : "cursor-pointer",
                picked === null && "border-line hover:-translate-y-0.5 hover:border-amber",
                isPick ? "border-hi" : "border-line"
              )}
            >
              {/* Only the artwork recedes once a pick is in — dimming the whole
                 tile would drag its numbers under the AA floor. The ring keeps
                 the light mockup from bleeding into the tile's own edge. */}
              <div
                className={cn(
                  "relative aspect-[4/3] w-full overflow-hidden rounded-xs bg-white",
                  "ring-1 ring-inset ring-black/10 transition-opacity duration-200",
                  picked !== null && !isPick && "opacity-40"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element --
                    static same-origin SVG at a fixed box: next/image would add
                    an optimizer round-trip and needs dangerouslyAllowSVG. */}
                <img
                  src={option.src}
                  alt=""
                  width={320}
                  height={240}
                  draggable={false}
                  className={cn(
                    "h-full w-full object-cover transition-transform duration-300",
                    picked === null && "group-hover/opt:scale-[1.04]"
                  )}
                />
                {/* Reads as a real ballot rather than two pictures, and gives
                    the pre-vote state something to point at. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-xs",
                    "font-mono text-[10px] leading-none backdrop-blur-sm transition-colors duration-200",
                    isPick
                      ? "bg-hi text-ink"
                      : "bg-black/45 text-white/85 group-hover/opt:bg-black/65"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-[0.06em] uppercase",
                    isPick ? "text-hi" : "text-lo"
                  )}
                >
                  {option.label}
                </span>
                {revealed && i === winner && (
                  <span className="font-mono text-[9px] tracking-[0.06em] text-green">
                    TOP
                  </span>
                )}
              </div>

              {/* The empty track shows while open: there is a number here,
                 you just don't get to see it before you vote. Rendering it in
                 both states is also what keeps the card from shifting. */}
              <div className="mt-2">
                <div className="h-[3px] overflow-hidden rounded-[1px] bg-line">
                  {revealed &&
                    (reduce ? (
                      <div
                        className={cn("h-full", i === winner ? "bg-hi" : "bg-dim")}
                        style={{ width: `${pct}%` }}
                      />
                    ) : (
                      <m.div
                        className={cn("h-full", i === winner ? "bg-hi" : "bg-dim")}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ))}
                </div>
                <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-dim">
                  {revealed ? (
                    <>
                      <span>{reduce ? option.votes : counts[i]} opinions</span>
                      <span className={i === winner ? "text-lo" : undefined}>
                        {pct}%
                      </span>
                    </>
                  ) : (
                    <span>result hidden</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pot and progress-to-target. This is the half of the product the two
          option tiles cannot show: there is real ETH staked, and the task
          settles the moment the target is met. */}
      <div className="mt-4 rounded-md border border-subtle bg-ink px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">
            Staked pot
          </span>
          <span className="font-mono text-[12px] text-amber">
            Ξ {ballot.pot.toFixed(3)} ETH
          </span>
        </div>
        <div className="mt-2 h-[3px] overflow-hidden rounded-[1px] bg-line">
          {reduce ? (
            <div
              className={cn("h-full", revealed ? "bg-green" : "bg-amber")}
              style={{ width: `${(cast / target) * 100}%` }}
            />
          ) : (
            <m.div
              className={cn("h-full", revealed ? "bg-green" : "bg-amber")}
              animate={{ width: `${(cast / target) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-dim">
          <span>
            {cast} of {target} opinions
          </span>
          <span className={revealed ? "text-green" : undefined}>
            {revealed ? "Target reached" : "1 to close"}
          </span>
        </div>
      </div>

      {/* Fixed, not min-h: the revealed verdict + reward rows are taller than
         the open state's two lines, and a growing footer would nudge the whole
         card inside its vertically-centred panel. */}
      <div aria-live="polite" className="h-[52px] pt-3">
        {revealed ? (
          <>
            {reduce ? (
              <VerdictLine withCrowd={withCrowd} />
            ) : (
              <m.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <VerdictLine withCrowd={withCrowd} />
              </m.div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-dim">
                Paid to each winner
              </span>
              <span className="font-mono text-[11px] text-amber">
                Ξ {reduce ? share.toFixed(4) : reward.toFixed(4)} ETH
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="m-0 font-mono text-[10px] tracking-[0.06em] text-lo uppercase">
              {sealing ? "Sealing vote…" : "Pick one — your vote closes this task"}
            </p>
            {/* Keyed so each line animates in on its own; no exit animation,
                which keeps AnimatePresence out of the bundle. */}
            <div className="mt-2 h-4 overflow-hidden font-mono text-[10px] text-dim">
              {reduce ? (
                <span>{FEED[0]}</span>
              ) : (
                <m.span
                  key={feedAt}
                  className="block"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {FEED[feedAt % FEED.length]}
                </m.span>
              )}
            </div>
          </>
        )}
      </div>

      {/* The card advances itself, so this slot is a countdown rather than a
          control — without it the ballot would swap with no warning while the
          visitor is still reading the result. */}
      <div className="mt-2 flex h-8 items-center gap-3">
        {revealed &&
          (reduce ? (
            <button
              type="button"
              onClick={advance}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "group px-0 hover:bg-transparent",
              })}
            >
              Next task
              <ArrowRight
                size={13}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </button>
          ) : (
            <>
              <span className="shrink-0 font-mono text-[10px] tracking-[0.06em] text-dim uppercase">
                Next task
              </span>
              <div
                aria-hidden="true"
                className="h-px flex-1 overflow-hidden bg-line"
              >
                <m.div
                  key={index}
                  className="h-full bg-lo"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
                />
              </div>
            </>
          ))}
      </div>
    </div>
  );
}

/* Minority opinion still earns nothing here — the payout pool is the winning
   option only — so the copy states that plainly rather than dressing it up. */
function VerdictLine({ withCrowd }: { withCrowd: boolean }) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] tracking-[0.08em] uppercase",
        withCrowd ? "text-green" : "text-amber"
      )}
    >
      {withCrowd ? "With the crowd — you'd earn" : "Contrarian — no payout"}
    </span>
  );
}
