import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about YourThumb's YouTube thumbnail workflow, Frame, Asset, Copycat and Canva editing.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  ["What is YourThumb?", "YourThumb is a YouTube thumbnail workflow that develops the direction before the final render."],
  ["Is this just an AI image generator?", "No. The image generation is one stage inside a larger thumbnail workflow: context, direction, checkpoint and render."],
  ["How does Frame work?", "Frame starts from an authentic moment from your video and uses it as the main visual source."],
  ["How does Asset work?", "Asset starts from the specific visual you want featured and builds the thumbnail around it."],
  ["How does Copycat work?", "Copycat uses a reference thumbnail for structural inspiration while your own story determines the direction."],
  ["What is the creative checkpoint?", "It is the point where you review the proposed thumbnail direction before committing to the render."],
  ["Can I edit the result in Canva?", "Yes. YourThumb can continue the finished result into Canva when that option is available for your account."],
  ["How long does it take?", "The workflow is designed to be focused and fast, with the core process typically taking minutes rather than requiring a long manual design session."],
  ["Do I need a finished video?", "YourThumb works best when you can give it meaningful context such as a video topic, thumbnail idea/angle, frame or reference."],
];

export default function FaqPage() {
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#101010] dark:bg-zinc-950 dark:text-zinc-50">
      <JsonLd data={schema} />
      <header className="border-b border-black/10 bg-[#f7f7f5]/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90"><div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8"><Link href="/" aria-label="YourThumb home"><BrandMark size={30} /></Link><div className="flex items-center gap-4"><Link href="/how-it-works" className="hidden text-sm font-semibold text-black/50 hover:text-black sm:inline dark:text-white/50 dark:hover:text-white">How it works</Link><Link href="/login" className="inline-flex h-9 items-center gap-2 rounded-full bg-[#111] px-4 text-xs font-bold text-white dark:bg-white dark:text-black">Enter studio <ArrowUpRight className="size-3.5" /></Link></div></div></header>

      <section className="border-b border-black/10 bg-[#101010] text-white dark:border-white/10"><div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f06a6a]">FAQ / THE PRACTICAL STUFF</p><h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl">A thumbnail studio should be easy to understand.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-white/48 sm:text-lg">Here is what YourThumb does, where the creative checkpoint fits and how the three starting workflows differ.</p></div></section>

      <section className="mx-auto max-w-[1050px] px-5 py-14 sm:px-8 sm:py-20 lg:py-24"><div className="overflow-hidden rounded-[1.8rem] border border-black/10 bg-white/45 dark:border-white/10 dark:bg-zinc-900/30">{faqs.map(([question, answer], index) => <details key={question} className="group border-b border-black/10 last:border-b-0 dark:border-white/10"><summary className="flex cursor-pointer list-none items-center gap-5 px-5 py-6 sm:px-8"><span className="w-9 shrink-0 text-[10px] font-black tracking-[0.15em] text-[#d92727]">{String(index + 1).padStart(2, "0")}</span><span className="flex-1 text-sm font-bold sm:text-base">{question}</span><ChevronDown className="size-4 shrink-0 text-black/30 transition group-open:rotate-180 dark:text-white/30" /></summary><p className="max-w-3xl px-5 pb-7 pl-[64px] text-sm leading-7 text-black/52 sm:px-8 sm:pl-[93px] dark:text-white/47">{answer}</p></details>)}</div></section>

      <section className="border-t border-black/10 bg-[#e9e9e5] dark:border-white/10 dark:bg-zinc-900/40"><div className="mx-auto flex max-w-[1050px] flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">READY</p><h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em]">Bring the next video into the studio.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-black/50 dark:text-white/45">Start with the raw material you already have. YourThumb handles the workflow from there.</p></div><Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#d92727] px-6 text-sm font-bold text-white hover:bg-[#bc2020]">Start a project <ArrowUpRight className="size-4" /></Link></div></section>
    </main>
  );
}
