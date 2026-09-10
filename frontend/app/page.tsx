import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { LiveStats } from "@/components/home/LiveStats";
import { HeroParticles } from "@/components/home/HeroParticles";
import { HeroBallot } from "@/components/home/HeroBallot";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TrustSignals } from "@/components/home/TrustSignals";
import { UseCases } from "@/components/home/UseCases";
import { FAQ } from "@/components/home/FAQ";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Footer } from "@/components/layout/Footer";
import { statsApi } from "@/lib/api";

async function getStats(): Promise<null> {
  try {
    await statsApi.get();
  } catch {
    // ignore
  }
  return null;
}

export default async function LandingPage() {
  await getStats(); // warm cache for other pages

  return (
    <div className="bg-ink">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col overflow-hidden min-h-0 md:min-h-[calc(100dvh-52px)]">
        {/* Graph-paper grid, fading toward the edges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, var(--line-subtle) 0, var(--line-subtle) 1px, transparent 1px, transparent 72px), repeating-linear-gradient(90deg, var(--line-subtle) 0, var(--line-subtle) 1px, transparent 1px, transparent 72px)",
            maskImage:
              "radial-gradient(ellipse 90% 80% at 60% 40%, black 30%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 80% at 60% 40%, black 30%, transparent 78%)",
          }}
        />
        {/* Soft amber glow behind the mockup */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[2%] top-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full hidden md:block"
          style={{
            background:
              "radial-gradient(circle, rgba(232,160,32,0.055), transparent 65%)",
          }}
        />

        {/* Cursor-reactive grain field — gathers around the cursor, drifts home */}
        <HeroParticles />

        <div className="relative flex-1 flex flex-col md:flex-row md:items-stretch">
          {/* Left: headline content */}
          <div className="flex-1 flex flex-col justify-center pt-12 pb-12 md:pb-0 px-6 md:flex-none md:w-[55%] md:pl-[11%] md:pr-12">
            <div className="animate-fade-up border-l border-line pl-3 font-mono text-[11px] text-lo tracking-[0.1em] uppercase mb-7">
              Opinion Market · Powered by Ethereum
            </div>

            <h1 className="font-display font-medium tracking-[-0.03em] leading-[1.08] text-[clamp(38px,4.2vw,58px)] m-0">
              <span className="animate-fade-up [animation-delay:60ms] block text-hi">
                What does the crowd
              </span>
              <span className="animate-fade-up [animation-delay:120ms] block text-lo">
                actually think?
              </span>
            </h1>

            <p className="animate-fade-up [animation-delay:180ms] text-[13px] text-hi max-w-[400px] mt-5 leading-relaxed">
              Post anything that needs real opinions. Stake ETH. Get answers
              from real people who get paid to give a damn.
            </p>

            <div className="animate-fade-up [animation-delay:240ms] flex items-center gap-5 mt-8">
              <Link
                href="/create-task"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-hi text-ink border border-transparent hover:bg-hi/90 active:translate-y-px font-display font-medium tracking-[-0.01em] leading-none whitespace-nowrap select-none transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-10 px-5 text-[13px] group"
              >
                Post a Task
                <ArrowRight
                  size={15}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="/browse"
                className="group inline-flex items-center gap-1.5 py-2.5 text-[13px] text-lo transition-colors duration-150 hover:text-hi"
              >
                Start Earning
                <ArrowRight
                  size={14}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="animate-fade-up [animation-delay:300ms] mt-16">
              <LiveStats />
            </div>
          </div>

          {/* Right: playable ballot in a full-height panel. Shown on mobile
              too — it is the only place the product can be experienced without
              a wallet, and most inbound traffic is a phone. */}
          <div className="flex md:w-[45%] flex-col border-t md:border-t-0 md:border-l border-line">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-5 lg:px-8">
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-lo">Try it</span>
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-lo">Sample task</span>
            </div>

            <div className="flex flex-1 items-center justify-center px-5 py-8 lg:px-8">
              <HeroBallot />
            </div>

            <div className="flex h-11 shrink-0 items-center border-t border-line px-5 lg:px-8">
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-lo">Blind voting · Settled on Sepolia</span>
            </div>
          </div>
        </div>

        {/* Bottom rule + scroll hint */}
        <div className="relative">
          <div className="h-px bg-line" />
          <div className="flex h-8 items-center justify-center gap-1.5 select-none">
            <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-lo">Scroll</span>
            <ChevronDown size={12} className="text-lo animate-scroll-hint" />
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <HowItWorks />

      {/* ── Trust Signals ────────────────────────────────────────────────── */}
      <TrustSignals />

      {/* ── Use Cases ────────────────────────────────────────────────────── */}
      <UseCases />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <FinalCTA />

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}