import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { WorkAtlas } from "@/components/marketing/work-atlas";
import { ProofStage } from "@/components/marketing/proof-stage";
import { StartingPointRow } from "@/components/marketing/starting-point-row";
import { marketingShowcaseCases } from "@/lib/marketing/showcase";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "YourThumb — Professional YouTube Thumbnail Studio",
  description:
    "Turn the raw material you already have into a deliberate YouTube thumbnail, with the creative direction decided before the final image is rendered.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "YourThumb — Professional YouTube Thumbnail Studio",
    description:
      "Turn real video material, visual assets or references into deliberate YouTube thumbnails — idea first, image second.",
    url: "/",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "YourThumb — YouTube Thumbnail Studio" }],
  },
};

const faqs = [
  {
    q: "What is YourThumb?",
    a: "YourThumb is a YouTube thumbnail workflow that starts from your video context, develops the thumbnail direction, gives you a creative checkpoint, and then renders the final image.",
  },
  {
    q: "Is this just an AI image generator?",
    a: "No. The workflow is designed around thumbnail decisions first: hook, visual direction, hierarchy and approval before the final render.",
  },
  {
    q: "What are Frame, Asset and Copycat?",
    a: "Frame starts from a real video moment, Asset starts from a visual you want featured, and Copycat starts from a reference thumbnail for structural inspiration.",
  },
  {
    q: "Can I edit the result?",
    a: "Yes. YourThumb can continue to Canva for further editing when that option is available for your account.",
  },
];

const processSteps = [
  ["01", "CONTEXT", "Bring the material that matters: a video, frame, visual or reference."],
  ["02", "DIRECTION", "Turn the story into a clear hook, composition and visual hierarchy."],
  ["03", "CHECKPOINT", "Decide whether the thumbnail is worth rendering before you spend the render."],
  ["04", "RENDER", "Generate the version you actually chose to make."],
] as const;

const modes = [
  {
    number: "01",
    title: "Frame",
    copy: "Start from an authentic moment from your video.",
    image: "/marketing/examples/set-04-frame-travel-source.webp",
    width: 1200,
    height: 675,
  },
  {
    number: "02",
    title: "Asset",
    copy: "Start from the visual that needs to own the frame.",
    image: "/marketing/examples/set-01-asset-100-hours-source.webp",
    width: 151,
    height: 180,
  },
  {
    number: "03",
    title: "Copycat",
    copy: "Start from a reference and rebuild it around your story.",
    image: "/marketing/examples/set-02-copycat-reference.webp",
    width: 1280,
    height: 720,
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawRef = params?.ref ? String(params.ref).trim().toUpperCase() : "";
  const referralCode = /^[A-F0-9]{8}$/.test(rawRef) ? rawRef : "";
  const loginHref = referralCode ? `/login?ref=${encodeURIComponent(referralCode)}` : "/login";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "YourThumb",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "YourThumb",
    url: siteUrl,
    description: "A strategy-first YouTube thumbnail workflow with creative review and image generation.",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#101010] dark:bg-zinc-950 dark:text-zinc-50">
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={faqSchema} />

      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f7f5]/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-[60px] w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="YourThumb home"><BrandMark size={28} /></Link>

          <nav className="hidden items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.13em] text-black/45 lg:flex dark:text-white/45" aria-label="Primary">
            <Link href="#work" className="transition hover:text-black dark:hover:text-white">Work</Link>
            <Link href="#method" className="transition hover:text-black dark:hover:text-white">Method</Link>
            <Link href="#workflows" className="transition hover:text-black dark:hover:text-white">Workflows</Link>
            <Link href="#faq" className="transition hover:text-black dark:hover:text-white">FAQ</Link>
            <a
              href="https://www.youtube.com/@YourThumbTech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition hover:text-black dark:hover:text-white"
              aria-label="Watch YourThumb tutorials on YouTube"
            >
              Watch tutorial <span aria-hidden="true">↗</span>
            </a>
            <details className="group flex items-center">
              <summary className="cursor-pointer list-none transition hover:text-black dark:hover:text-white [&::-webkit-details-marker]:hidden">
                Contact
              </summary>
              <div className="ml-4 hidden items-center gap-2 border-l border-black/10 pl-4 group-open:flex dark:border-white/10">
                <a
                  href="mailto:yourthumbtech@gmail.com"
                  className="whitespace-nowrap text-[12px] font-semibold tracking-normal text-black/60 transition hover:text-black dark:text-white/65 dark:hover:text-white"
                  aria-label="Email YourThumb"
                >
                  yourthumbtech@gmail.com
                </a>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=yourthumbtech@gmail.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Email YourThumb in Gmail"
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-black hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
                >
                  <img
                    src="/marketing/gmail-logo.png"
                    alt=""
                    aria-hidden="true"
                    className="h-5 w-auto object-contain"
                  />
                </a>
              </div>
            </details>
          </nav>

          <div className="flex items-center gap-3">
            <Link href={loginHref} className="hidden text-sm font-semibold text-black/55 transition hover:text-black sm:inline-flex dark:text-white/60 dark:hover:text-white">Sign in</Link>
            <Link href={loginHref} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#111] px-4 text-xs font-bold text-white transition hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-100">
              Enter studio <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="overflow-hidden border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-5 pb-3 pt-5 sm:px-8 sm:pb-5 sm:pt-7 lg:flex-row lg:items-center lg:gap-7 lg:px-10 lg:pt-7">
          <div className="max-w-2xl">
            <h1 className="mt-3 max-w-[760px] text-[2.85rem] font-black leading-[0.9] tracking-[-0.065em] sm:text-[3.75rem] lg:text-[4.55rem]">
              <span className="block">Make the thumbnail</span>
              <span className="block text-[#d92727]">before</span>
              <span className="block">you make the image.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[13px] leading-[1.375rem] text-black/58 sm:text-[14px] sm:leading-6 dark:text-white/58">
              Turn the material you already have into a deliberate YouTube thumbnail.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Link href={loginHref} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#d92727] px-5 text-[13px] font-bold text-white shadow-[0_18px_45px_-22px_rgba(217,39,39,.85)] transition hover:-translate-y-0.5 hover:bg-[#bc2020]">
                Start a project <ArrowUpRight className="size-4" />
              </Link>
              <Link href="#work" className="inline-flex h-11 items-center justify-center rounded-full border border-black/15 bg-white/55 px-5 text-[13px] font-semibold transition hover:bg-white dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]">
                See the work
              </Link>
            </div>

          </div>

          <div className="relative min-w-0 flex-1">
            <ProofStage cases={marketingShowcaseCases} />
          </div>
        </div>


      </section>

      <WorkAtlas
        cases={marketingShowcaseCases}
        title="The work should explain the product."
        description="Six projects. Three starting points. One studio."
      />

      <section className="border-b border-black/10" id="method">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-11 sm:px-8 sm:py-13 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.55fr_1.45fr]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">The studio method</p>
              <h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">Decide first. Render second.</h2>
            </div>
            <div className="border-t border-black/10 dark:border-white/10">
              {processSteps.map(([number, label, copy]) => (
                <div key={number} className="grid gap-4 border-b border-black/10 py-7 sm:grid-cols-[70px_0.65fr_1.35fr] sm:items-center dark:border-white/10">
                  <span className="text-[10px] font-black tracking-[0.18em] text-[#d92727]">{number}</span>
                  <h3 className="text-xl font-black tracking-[-0.025em]">{label}</h3>
                  <p className="max-w-xl text-sm leading-7 text-black/52 dark:text-white/48">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900/20" id="workflows">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-13 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">Choose your starting point</p><h2 className="mt-4 text-4xl font-black leading-[0.96] tracking-[-0.05em] sm:text-5xl">Three ways into the studio.</h2></div>
          </div>

          <div className="mt-10 border-y border-black/10 dark:border-white/10">
            {modes.map(({ number, title, copy, image, width, height }) => (
              <StartingPointRow
                key={title}
                number={number}
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

      <section className="border-b border-black/10 bg-[#e9e9e5] dark:border-white/10 dark:bg-zinc-900" id="faq">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 py-13 sm:px-8 sm:py-16 lg:grid-cols-[0.7fr_1.3fr] lg:px-10 lg:py-20">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">FAQ / BEFORE THE PROJECT</p><h2 className="mt-4 text-4xl font-black leading-[0.96] tracking-[-0.05em]">A few practical answers.</h2></div>
          <div className="divide-y divide-black/10 rounded-[1.5rem] border border-black/10 bg-white/45 px-6 dark:divide-white/10 dark:border-white/10 dark:bg-black/10 sm:px-8">
            {faqs.map((item) => <details key={item.q} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-bold sm:text-base"><span>{item.q}</span><ChevronDown className="size-4 shrink-0 text-black/35 transition group-open:rotate-180 dark:text-white/35" /></summary><p className="mt-3 max-w-2xl pr-8 text-sm leading-7 text-black/52 dark:text-white/45">{item.a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="bg-[#101010] text-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-13 sm:px-8 sm:py-16 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-20">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f06a6a]">START A PROJECT</p><h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.92] tracking-[-0.055em] sm:text-6xl">Bring the next video into the studio.</h2></div>
          <Link href={loginHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-black transition hover:bg-zinc-100">Enter YourThumb <ArrowUpRight className="size-4" /></Link>
        </div>
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap gap-x-6 gap-y-2 border-t border-white/10 px-5 py-6 text-[11px] font-semibold text-white/38 sm:px-8 lg:px-10">
          <Link href="/terms" className="transition hover:text-white">Terms of Service</Link>
          <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
          <Link href="/support" className="transition hover:text-white">Support</Link>
        </div>
      </section>
    </main>
  );
}
