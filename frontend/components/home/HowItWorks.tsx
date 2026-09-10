import { Coins, EyeOff, Split } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

/* The navbar has always linked to `/#how-it-works`; until now nothing on the
   page carried that id, so the link was a no-op and the core loop — stake,
   blind vote, settle at the target — was never explained anywhere between the
   hero and the FAQ.

   The three steps deliberately mirror the hero ballot's own sequence (staked
   pot → result hidden → target reached → paid to each winner), so a visitor
   who played with the card arrives here already knowing the shape. */
const STEPS = [
  {
    icon: Coins,
    title: "Post and stake",
    body: "Ask your question, upload 2–10 options, and stake the ETH that will pay the people who answer. The stake is the budget — no ads, no subscription.",
    meta: "Creator",
  },
  {
    icon: EyeOff,
    title: "The crowd votes blind",
    body: "Voters see the options and nothing else. Counts stay hidden until their own vote lands, so nobody is anchored by whoever showed up first.",
    meta: "Worker",
  },
  {
    icon: Split,
    title: "Target hit, pot splits",
    body: "When the task reaches its vote target it settles on Sepolia. The staked pot is divided between everyone who backed the winning option.",
    meta: "On-chain",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-[52px] border-t border-line bg-ink py-24">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <Reveal>
          <div className="eyebrow mb-4 tracking-[0.15em]">HOW IT WORKS</div>
          <h2 className="mb-4 max-w-2xl font-display text-[clamp(28px,3.5vw,42px)] font-medium tracking-[-0.02em] text-hi">
            One loop, three steps, settled on-chain
          </h2>
          <p className="max-w-xl text-[15px] leading-relaxed text-lo">
            A task is a question with money attached. It closes the moment
            enough people have answered it.
          </p>
        </Reveal>

        {/* The rail is the section's whole illustration — a hairline the three
            steps hang from, which is cheaper and more on-voice than three
            boxed cards repeating the treatment used by every other section. */}
        <div className="mt-16 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.1} className="h-full">
              <div className="relative flex h-full flex-col">
                <div className="mb-6 flex items-center gap-4">
                  <span className="font-mono text-[11px] tracking-[0.12em] text-amber">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">
                    {step.meta}
                  </span>
                </div>

                <div className="mb-4 text-amber" aria-hidden="true">
                  <step.icon size={22} strokeWidth={1.5} />
                </div>

                <h3 className="mt-0 mb-2 font-display text-lg font-medium text-hi">
                  {step.title}
                </h3>
                <p className="m-0 text-[14px] leading-relaxed text-lo">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
