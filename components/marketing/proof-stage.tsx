"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MarketingShowcaseCase } from "@/lib/marketing/showcase";
import { ResultMedia } from "@/components/marketing/transformation-media";

const AUTO_ADVANCE_MS = 1900;
const MANUAL_PAUSE_MS = 4200;

export function ProofStage({ cases }: { cases: readonly MarketingShowcaseCase[] }) {
  const safeCases = useMemo(() => cases.slice(0, 6), [cases]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const sectionRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const resumeTimer = useRef<number | null>(null);

  const active = safeCases[selectedIndex];
  const isPaused = isHovered || isFocused || manualPause || !isVisible || reducedMotion;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!safeCases.length || isPaused) return;
    const timer = window.setInterval(() => {
      setSelectedIndex((current) => (current + 1) % safeCases.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, safeCases.length]);

  useEffect(() => {
    const rail = railRef.current;
    const button = buttonRefs.current[selectedIndex];
    if (!rail || !button) return;

    const targetLeft = button.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    rail.scrollTo({ left: Math.max(0, Math.min(targetLeft, maxScroll)), behavior: reducedMotion ? "auto" : "smooth" });
  }, [selectedIndex, reducedMotion]);

  useEffect(() => () => {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
  }, []);

  const selectCase = (index: number) => {
    setSelectedIndex(index);
    setManualPause(true);
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setManualPause(false), MANUAL_PAUSE_MS);
  };

  if (!active) return null;

  return (
    <section
      ref={sectionRef}
      aria-label="YourThumb transformation proof"
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsFocused(false);
      }}
    >
      <div className="flex items-end justify-between border-b border-black/10 pb-2.5 dark:border-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/60 dark:text-white/60" aria-live="polite">{active.title}</p>
        <p className="text-[9px] font-black tracking-[0.16em] text-black/35 dark:text-white/35">{String(selectedIndex + 1).padStart(2, "0")} / {String(safeCases.length).padStart(2, "0")}</p>
      </div>

      <div className="mt-2 border-b border-black/10 pb-2.5 dark:border-white/10">
        <figure className="min-w-0">
          <ResultMedia
            result={active}
            size="hero"
            priority
            className="w-full rounded-[1rem] shadow-[0_26px_65px_-44px_rgba(16,16,16,.55)]"
          />
        </figure>
      </div>

      <div ref={railRef} className="overflow-x-auto overscroll-x-contain pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Choose an example">
        <div className="flex min-w-max gap-3">
          {safeCases.map((item, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                key={item.id}
                ref={(node) => { buttonRefs.current[index] = node; }}
                type="button"
                onClick={() => selectCase(index)}
                aria-pressed={selected}
                className={`w-[150px] shrink-0 text-left transition sm:w-[168px] ${selected ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
              >
                <span className="block overflow-hidden rounded-[0.7rem] bg-black/5 dark:bg-white/10">
                  <Image src={item.result} alt="" width={item.resultWidth} height={item.resultHeight} sizes="205px" className="block h-auto w-full" loading="eager" />
                </span>
                <span className="mt-2 flex items-center justify-between gap-3 border-b border-black/10 pb-2 dark:border-white/10">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-[8px] font-black tracking-[0.12em] text-[#d92727]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-black dark:text-white">{item.title}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
