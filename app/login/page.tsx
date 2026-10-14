import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BrandMark } from "@/components/brand/logo";
import { TransformationPair } from "@/components/marketing/transformation-pair";
import { signInTransformationCase } from "@/lib/marketing/showcase";

export const metadata: Metadata = {
  title: "Enter the Studio",
  description: "Sign in to YourThumb to create and manage YouTube thumbnails.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error ? String(resolvedParams.error) : undefined;
  const referralCode = resolvedParams?.ref ? String(resolvedParams.ref).trim().toUpperCase() : undefined;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#101010] dark:bg-zinc-950 dark:text-white">
      <div className="grid min-h-screen lg:h-screen lg:min-h-0 lg:grid-cols-[1.04fr_0.96fr] lg:overflow-hidden">
        <section className="relative hidden overflow-hidden bg-[#101010] text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(217,39,39,0.18),transparent_28%),radial-gradient(circle_at_5%_100%,rgba(255,255,255,0.06),transparent_25%)]" />
          <div className="relative mx-auto flex w-full max-w-[700px] flex-col justify-start px-7 py-3.5 xl:px-8">
            <div><Link href="/" aria-label="YourThumb home"><BrandMark size={28} className="[&>span:last-child]:text-white" /></Link></div>

            <div className="mt-28 py-3 xl:mt-32 xl:py-4">
              <h1 className="max-w-xl text-[2.7rem] font-black leading-[0.9] tracking-[-0.06em] xl:text-[3.05rem]">See what the studio actually makes.</h1>
              <p className="mt-2.5 max-w-md text-[12px] leading-5 text-white/48">Real material in. A deliberate thumbnail out.</p>

              <div className="mt-3">
                <TransformationPair item={signInTransformationCase} compact />
              </div>


            </div>


          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-4 lg:min-h-0 lg:px-7 lg:py-3 lg:bg-white dark:lg:bg-zinc-950">
          <div className="w-full max-w-[340px]">
            <div className="mb-5 flex items-center justify-between lg:hidden"><Link href="/" aria-label="YourThumb home"><BrandMark size={30} /></Link><Link href="/" className="text-sm font-semibold text-black/45 hover:text-black dark:text-white/45 dark:hover:text-white">Back home</Link></div>

            <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d92727]">ENTER THE STUDIO</p><h2 className="mt-3 text-4xl font-black leading-[0.94] tracking-[-0.055em]">Start the next project.</h2><p className="mt-4 text-sm leading-7 text-black/48 dark:text-white/45">Sign in with Google and continue into the YourThumb workflow.</p></div>

            {error ? <div className="mt-5 rounded-[1.1rem] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" role="alert">Sign-in failed. Please try again.</div> : null}

            <div className="mt-4 rounded-[1.05rem] border border-black/10 bg-white p-2.5 shadow-[0_22px_60px_-40px_rgba(0,0,0,.35)] dark:border-white/10 dark:bg-zinc-900"><GoogleSignInButton referralCode={referralCode} /></div>
            <p className="mt-4 text-center text-[11px] leading-5 text-black/42 dark:text-white/38">By continuing with Google, you agree to our <Link href="/terms" className="font-semibold underline decoration-black/20 underline-offset-2 transition hover:text-black dark:decoration-white/20 dark:hover:text-white">Terms of Service</Link> and acknowledge our <Link href="/privacy" className="font-semibold underline decoration-black/20 underline-offset-2 transition hover:text-black dark:decoration-white/20 dark:hover:text-white">Privacy Policy</Link>.</p>

            <div className="mt-5 border-t border-black/10 pt-5 dark:border-white/10">
              {[["01", "Bring your context or reference."],["02", "Review the thumbnail direction."],["03", "Render and refine." ]].map(([number, item]) => <div key={number} className="flex items-start gap-4 py-2"><span className="w-6 text-[9px] font-black tracking-[0.14em] text-[#d92727]">{number}</span><span className="text-xs leading-5 text-black/48 dark:text-white/45">{item}</span></div>)}
            </div>

            <Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-black/45 hover:text-black dark:text-white/45 dark:hover:text-white">Back to YourThumb <ArrowUpRight className="size-4" /></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
