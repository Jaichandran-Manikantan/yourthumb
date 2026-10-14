import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";

const SUPPORT_EMAIL = "yourthumbtech@gmail.com";
const GMAIL_COMPOSE_URL =
  "https://mail.google.com/mail/?view=cm&fs=1&to=yourthumbtech@gmail.com";

export const metadata: Metadata = {
  title: "Support",
  description: "Get support for YourThumb and learn who designed the thumbnail workflow.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#f4f4f2] text-[#101010] dark:bg-zinc-950 dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/" aria-label="YourThumb home">
            <BrandMark size={32} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 transition hover:text-black dark:text-white/45 dark:hover:text-white"
          >
            <ArrowLeft className="size-4" /> Back home
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">SUPPORT / YOURTHUMB</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl">Need help? Talk to us.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-black/55 dark:text-white/50">
            YourThumb is a team product built around a thumbnail designer&apos;s real production workflow: decide the story, hook, proof and visual plan before rendering the image.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[1.8rem] border border-black/10 bg-white p-6 shadow-[0_25px_80px_-55px_rgba(0,0,0,.4)] dark:border-white/10 dark:bg-zinc-900 sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-full bg-[#d92727]/10 text-[#d92727]">
              <Mail className="size-5" />
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-[-0.03em]">Contact support</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-black/52 dark:text-white/47">
              For account, billing, generation, Canva, privacy, or general service questions, email the YourThumb team.
            </p>

            <a
              href={GMAIL_COMPOSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white transition hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Open Gmail <ArrowUpRight className="size-4" />
            </a>
            <a
              href={GMAIL_COMPOSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-sm font-semibold text-black/55 underline decoration-black/15 underline-offset-4 transition hover:text-black dark:text-white/50 dark:decoration-white/15 dark:hover:text-white"
            >
              {SUPPORT_EMAIL}
            </a>
          </section>

          <section className="rounded-[1.8rem] border border-black/10 bg-[#101010] p-6 text-white dark:border-white/10 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f06a6a]">WHO DESIGNED THE WORKFLOW</p>
            <h2 className="mt-4 text-3xl font-black leading-[0.95] tracking-[-0.04em]">Built from real thumbnail production experience.</h2>
            <p className="mt-5 text-sm leading-7 text-white/55">
              YourThumb is designed by a thumbnail designer who has worked with YouTube channels reaching nearly 7.5M collective subscribers. The product turns that practical packaging workflow into a repeatable studio process.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-black/55 dark:text-white/50">
          <Link href="/terms" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">Terms of Service <ArrowUpRight className="size-4" /></Link>
          <Link href="/privacy" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">Privacy Policy <ArrowUpRight className="size-4" /></Link>
          <Link href="/" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">YourThumb <ArrowUpRight className="size-4" /></Link>
        </div>
      </section>
    </main>
  );
}
