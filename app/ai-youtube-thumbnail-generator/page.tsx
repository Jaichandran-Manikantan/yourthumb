import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { WorkAtlas } from "@/components/marketing/work-atlas";
import { marketingShowcaseCases, primaryTransformationCase } from "@/lib/marketing/showcase";
import { TransformationPair } from "@/components/marketing/transformation-pair";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "AI YouTube Thumbnail Generator",
  description: "Create YouTube thumbnails with YourThumb's strategy-first workflow, creative checkpoint and final render.",
  alternates: { canonical: "/ai-youtube-thumbnail-generator" },
  openGraph: {
    title: "YourThumb — AI YouTube Thumbnail Generator",
    description: "Build the thumbnail direction first. Then render the image you actually meant to make.",
    url: "/ai-youtube-thumbnail-generator",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "YourThumb — YouTube Thumbnail Studio" }],
  },
};

const generatorFaq = [
  ["What makes YourThumb different from a basic AI image generator?", "YourThumb is focused on YouTube packaging. The workflow develops thumbnail direction first, then gives you a creative checkpoint before the final render."],
  ["Can I use a screenshot from my video?", "Yes. Frame is built around authentic moments from your video."],
  ["Can I provide a reference thumbnail?", "Yes. Copycat uses a reference for structural inspiration while your own story drives the direction."],
  ["Can I edit the result later?", "Yes. YourThumb can continue to Canva for editing when that option is available for your account."],
] as const;

const principles = [
  ["01", "Context before prompt", "The project starts with the video, frame, asset or reference—not an empty prompt box."],
  ["02", "Direction before render", "The hook, hierarchy and composition are decided before the final image is generated."],
  ["03", "Approval before spend", "A creative checkpoint gives you a chance to change the idea before committing to the render."],
];

export default function AiYouTubeThumbnailGeneratorPage() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: generatorFaq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  };
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "YourThumb",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: `${siteUrl.replace(/\/$/, "")}/ai-youtube-thumbnail-generator`,
    description: "YouTube thumbnail creation with context, creative direction, review and image generation.",
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#101010] dark:bg-zinc-950 dark:text-zinc-50">
      <JsonLd data={faqSchema} /><JsonLd data={appSchema} />
      <header className="border-b border-black/10 bg-[#f7f7f5]/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90"><div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10"><Link href="/" aria-label="YourThumb home"><BrandMark size={30} /></Link><Link href="/login" className="inline-flex h-9 items-center gap-2 rounded-full bg-[#111] px-4 text-xs font-bold text-white dark:bg-white dark:text-black">Enter studio <ArrowUpRight className="size-3.5" /></Link></div></header>

      <section className="border-b border-black/10 bg-[#101010] text-white dark:border-white/10">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.68fr_1.32fr] lg:items-end lg:px-10 lg:py-24">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f06a6a]">THE STUDIO METHOD</p><h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.91] tracking-[-0.06em] sm:text-6xl lg:text-[5rem]">Not another image generator. A better place to decide the thumbnail.</h1><p className="mt-6 max-w-xl text-base leading-7 text-white/48 sm:text-lg sm:leading-8">Use AI for production. Keep the creative decision in the workflow.</p><Link href="/login" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#d92727] px-6 text-sm font-bold text-white hover:bg-[#bc2020]">Create a thumbnail <ArrowUpRight className="size-4" /></Link></div>
          <TransformationPair item={primaryTransformationCase} />
        </div>
      </section>

      <section className="border-b border-black/10 dark:border-white/10"><div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 sm:py-20 lg:py-24"><div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">WHY THIS WORKFLOW EXISTS</p><h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">A thumbnail can be beautiful and still be the wrong thumbnail.</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-black/52 dark:text-white/47">YourThumb moves the important decision earlier, when changing the idea is easy.</p></div><div className="mt-10 grid gap-3 md:grid-cols-3">{principles.map(([number,title,copy]) => <article key={number} className="border-t border-black/10 pt-6 dark:border-white/10"><p className="text-[10px] font-black tracking-[0.16em] text-[#d92727]">{number}</p><h3 className="mt-5 text-xl font-black tracking-[-0.025em]">{title}</h3><p className="mt-3 text-sm leading-7 text-black/52 dark:text-white/47">{copy}</p></article>)}</div></div></section>

      <WorkAtlas
        cases={marketingShowcaseCases.slice(0, 6)}
        title="Six real projects."
        description="Different starting points. Finished thumbnails."
      />

      <section className="border-b border-black/10 bg-[#e9e9e5] dark:border-white/10 dark:bg-zinc-900/30"><div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:py-24"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">REAL PROJECT LOGIC</p><h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl">The generator is downstream of the decision.</h2><p className="mt-5 max-w-md text-sm leading-7 text-black/52 dark:text-white/47">Frame, Asset and Copycat all reach the same creative checkpoint. The starting material changes; the studio logic stays consistent.</p></div><div className="rounded-[1.8rem] bg-[#111] p-5 text-white shadow-xl sm:p-7"><div className="grid gap-2 sm:grid-cols-4">{[["01","INPUT"],["02","IDEA"],["03","CHECK"],["04","RENDER"]].map(([number,label], index) => <div key={number} className={`rounded-2xl border p-5 ${index === 2 ? "border-[#d92727]/40 bg-[#d92727]/10" : "border-white/10 bg-white/[0.035]"}`}><p className="text-[9px] font-black tracking-[0.14em] text-white/35">{number}</p><p className="mt-8 text-xs font-black tracking-[0.15em]">{label}</p></div>)}</div><p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-6 text-white/45">Don't render the wrong idea beautifully.</p></div></div></section>

      <section className="border-b border-black/10 dark:border-white/10"><div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 sm:py-20 lg:py-24"><div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">FAQ</p><h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Before you open the studio.</h2></div><div className="mt-8 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">{generatorFaq.map(([question,answer]) => <details key={question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-bold sm:text-base"><span>{question}</span><ChevronDown className="size-4 shrink-0 text-black/30 transition group-open:rotate-180 dark:text-white/30" /></summary><p className="mt-3 max-w-3xl pr-8 text-sm leading-7 text-black/52 dark:text-white/47">{answer}</p></details>)}</div></div></section>

      <section className="bg-[#101010] text-white"><div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-24"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f06a6a]">YOUR NEXT THUMBNAIL</p><h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.92] tracking-[-0.055em] sm:text-6xl">Use AI to make the image. Use the studio to make the decision.</h2></div><Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-black hover:bg-zinc-100">Enter YourThumb <ArrowUpRight className="size-4" /></Link></div></section>
    </main>
  );
}
