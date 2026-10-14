import { SourceMedia } from "@/components/marketing/transformation-media";
import type { SourceImageData } from "@/components/marketing/transformation-media";

export function StartingPointRow({ number, title, copy, source }: { number: string; title: string; copy: string; source: SourceImageData }) {
  return (
    <article className="flex flex-col gap-6 border-b border-black/10 py-6 last:border-b-0 dark:border-white/10 sm:flex-row sm:items-center sm:gap-7 lg:gap-10 lg:py-7">
      <figure className="w-full shrink-0 sm:w-[270px] lg:w-[320px]">
        <SourceMedia source={source} size="compact" priority />
      </figure>

      <div className="flex min-w-0 flex-1 items-start gap-4 lg:gap-5">
        <span className="pt-1 text-[9px] font-black tracking-[0.16em] text-[#d92727]">{number}</span>
        <div>
          <h3 className="text-2xl font-black tracking-[-0.035em]">{title}</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-black/48 dark:text-white/45">{copy}</p>
        </div>
      </div>
    </article>
  );
}
