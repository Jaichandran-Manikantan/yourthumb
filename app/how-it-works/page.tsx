import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Frame, Layers3, WandSparkles } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { WorkAtlas } from "@/components/marketing/work-atlas";
import { marketingShowcaseCases, primaryTransformationCase } from "@/lib/marketing/showcase";
import { TransformationPair } from "@/components/marketing/transformation-pair";
import { StartingPointRow } from "@/components/marketing/starting-point-row";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "How It Works",
  description: "See how YourThumb moves from video context to thumbnail direction, creative review and final render.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How YourThumb Works",
    description: "Context → direction → checkpoint → render. A thumbnail studio workflow built around the idea.",
    url: "/how-it-works",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "YourThumb — YouTube Thumbnail Studio" }],
  },
};

const steps = [
  ["01", "CONTEXT", "Bring the story", "Start with your video, an authentic frame, a visual asset or a reference. The studio needs something real to build from."],
  ["02", "DIRECTION", "Shape the package", "Turn the story into a title hook, visual hook, subject hierarchy and a thumbnail direction worth pursuing."],
  ["03", "CHECKPOINT", "Approve the idea", "Review the proposed direction before the render. This is where you decide whether the concept is actually the right one."],
  ["04", "RENDER", "Make the thumbnail", "Generate from the approved direction instead of asking an image model to discover the idea for you."],
  ["05", "REFINE", "Finish the work", "Iterate on the result and continue into Canva when that workflow is available for your account."],
] as const;

const modes = [
  { title: "Frame", image: "/marketing/examples/set-04-frame-travel-source.webp", width: 1200, height: 675, icon: Frame, copy: "Start from an authentic video moment, then package it for the click." },
  { title: "Asset", image: "/marketing/examples/set-01-asset-100-hours-source.webp", width: 151, height: 180, icon: Layers3, copy: "Start from the object, person, food or visual that needs to own the frame." },
  { title: "Copycat", image: "/marketing/examples/set-02-copycat-reference.webp", width: 1280, height: 720, icon: WandSparkles, copy: "Start from a reference composition and rebuild it around your own story." },
];

export default function HowItWorksPage() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How YourThumb creates YouTube thumbnails",
    description: "The YourThumb workflow from video context through strategy, review, rendering and refinement.",
    step: steps.map(([, , name, text]) => ({ "@type": "HowToStep", name, text })),
    url: `${siteUrl.replace(/\/$/, "")}/how-it-works`,
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#101010] dark:bg-zinc-950 dark:text-zinc-50">
      <JsonLd data={schema} />
      <header className="border-b border-black/10 bg-[#f7f7f5]/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="YourThumb home"><BrandMark size={30} /></Link>
          <div className="flex items-center gap-4"><Link href="/" className="hidden text-sm font-semibold text-black/50 hover:text-black sm:inline dark:text-white/50 dark:hover:text-white">Home</Link><Link href="/login" className="inline-flex h-9 items-center gap-2 rounded-full bg-[#111] px-4 text-xs font-bold text-white dark:bg-white dark:text-black">Enter studio <ArrowUpRight className="size-3.5" /></Link></div>
        </div>
      </header>

      <section className="border-b border-black/10 bg-[#101010] text-white dark:border-white/10">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:px-10 lg:py-24">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f06a6a]">THE METHOD</p><h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.91] tracking-[-0.06em] sm:text-6xl lg:text-[5.1rem]">The thumbnail gets decided before it gets rendered.</h1><p className="mt-6 max-w-xl text-base leading-7 text-white/48 sm:text-lg sm:leading-8">YourThumb turns the messy part of thumbnail work into a focused sequence: context, direction, checkpoint, render, refine.</p><Link href="/login" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#d92727] px-6 text-sm font-bold text-white hover:bg-[#bc2020]">Start with a project <ArrowUpRight className="size-4" /></Link></div>

          <TransformationPair item={primaryTransformationCase} />
        </div>
      </section>

      <section className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
          <div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">PROJECT FLOW</p><h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">Five stages. One clear decision at each.</h2></div>
          <div className="mt-10 border-t border-black/10 dark:border-white/10">
            {steps.map(([number, eyebrow, title, copy], index) => <div key={number} className="grid gap-5 border-b border-black/10 py-8 dark:border-white/10 sm:grid-cols-[70px_0.62fr_1.38fr] sm:items-center"><span className="text-[10px] font-black tracking-[0.18em] text-[#d92727]">{number}</span><div><h3 className="text-2xl font-black tracking-[-0.03em]">{title}</h3></div><div className="flex gap-4"><span className={`mt-1 size-1.5 shrink-0 rounded-full ${index === 2 ? "bg-[#d92727]" : "bg-black/20 dark:bg-white/20"}`} /><p className="max-w-2xl text-sm leading-7 text-black/52 dark:text-white/47">{copy}</p></div></div>)}
          </div>
        </div>
      </section>

      <WorkAtlas
        cases={marketingShowcaseCases}
        title="See the range, not a template."
        description="Each case keeps its source and finished thumbnail intact, then lets the differences between starting materials do the explaining."
      />

      <section className="border-b border-black/10 bg-[#e9e9e5] dark:border-white/10 dark:bg-zinc-900/40">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">STARTING POINTS</p><h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl">Choose the material you already have.</h2></div></div>
          <div className="mt-10 border-y border-black/10 dark:border-white/10">
            {modes.map(({ title, image, width, height, copy }, index) => (
              <StartingPointRow
                key={title}
                number={`0${index + 1}`}
                title={title}
                copy={copy}
                source={{
                  input: image,
                  inputWidth: width,
                  inputHeight: height,
                  inputAlt: `${title} starting point example`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 dark:border-white/10"><div className="mx-auto grid w-full max-w-[1200px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:py-24"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">THE CHECKPOINT</p><h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl">The best part happens before the pixels.</h2><p className="mt-5 max-w-md text-sm leading-7 text-black/52 dark:text-white/47">Review the direction while it is still cheap to change: the hook, visual idea, hierarchy and intended composition.</p></div><div className="rounded-[1.8rem] border border-black/10 bg-[#111] p-5 text-white shadow-xl dark:border-white/10 sm:p-7"><div className="border-b border-white/10 pb-4"><h3 className="text-lg font-black">54 WEEKS</h3></div><div className="grid gap-3 py-5 sm:grid-cols-3">{[["Hook", "54 weeks later"],["Visual", "Creator + award"],["Text", "54 WEEKS"]].map(([label,value]) => <div key={label} className="border-t border-white/10 pt-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">{label}</p><p className="mt-1.5 text-sm font-semibold text-white/85">{value}</p></div>)}</div></div></div></section>

      <section className="bg-[#101010] text-white"><div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-24"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f06a6a]">READY TO START</p><h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.93] tracking-[-0.055em] sm:text-6xl">Bring the raw material. Leave with a thumbnail.</h2></div><Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-black hover:bg-zinc-100">Enter the studio <ArrowUpRight className="size-4" /></Link></div></section>
    </main>
  );
}
