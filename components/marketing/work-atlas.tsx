import type { MarketingShowcaseCase } from "@/lib/marketing/showcase";
import { ResultMedia, SourceMedia } from "@/components/marketing/transformation-media";

type WorkAtlasProps = {
  cases: readonly MarketingShowcaseCase[];
  title?: string;
  description?: string;
};

export function WorkAtlas({
  cases,
  title = "The work should explain the product.",
  description = "Real starting material. Real finished thumbnails.",
}: WorkAtlasProps) {
  return (
    <section id="work" className="overflow-hidden border-b border-black/10 bg-[#efefeb] text-[#101010] dark:border-white/10 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto w-full max-w-[1540px] px-4 py-12 sm:px-7 sm:py-14 lg:px-9 lg:py-16">
        <header className="flex flex-col gap-5 border-b border-black/10 pb-7 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d92727]">SELECTED WORK / {String(cases.length).padStart(2, "0")} CASES</p>
            <h2 className="mt-2 text-4xl font-black leading-[0.9] tracking-[-0.065em] sm:text-5xl lg:text-[4.2rem]">{title}</h2>
          </div>
        </header>

        <div>
          {cases.map((item, index) => {
            const reverse = index % 2 === 1;
            return (
              <article key={item.id} className={`relative border-b border-black/10 py-8 last:border-b-0 dark:border-white/10 sm:py-9 lg:py-10 ${index % 2 === 1 ? "bg-white/45" : "bg-transparent"}`}>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <span className="text-[2.8rem] font-black leading-none tracking-[-0.08em] text-black/10 dark:text-white/10 sm:text-[4rem]">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-[-0.045em] sm:text-3xl">{item.title}</h3>
                    </div>
                  </div>
                </div>

                <div className={`flex flex-col gap-7 lg:flex-row lg:items-end lg:gap-9 ${reverse ? "lg:flex-row-reverse" : ""}`}>
                  <figure className="flex w-full shrink-0 flex-col items-start self-start lg:w-[24%]">
                    <SourceMedia source={item} size="large" priority className="self-start" />
                  </figure>

                  <figure className="min-w-0 flex-1">
                    <ResultMedia result={item} size="large" priority className="rounded-[1rem] shadow-[0_22px_55px_-46px_rgba(16,16,16,.5)]" />
                  </figure>
                </div>

              </article>
            );
          })}
        </div>

        <footer className="border-t border-black/10 pt-5 dark:border-white/10">
          <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-black/28 dark:text-white/28">Unofficial demo examples — not endorsements by the people or channels depicted.</p>
        </footer>
      </div>
    </section>
  );
}
