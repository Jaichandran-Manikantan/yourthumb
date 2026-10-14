import type { MarketingShowcaseCase } from "@/lib/marketing/showcase";
import { ResultMedia, SourceMedia } from "@/components/marketing/transformation-media";

export function TransformationPair({ item, compact = false }: { item: MarketingShowcaseCase; compact?: boolean }) {
  return (
    <article className={compact ? "text-white" : "rounded-[1.4rem] border border-white/10 bg-[#111] p-4 text-white shadow-[0_30px_70px_-55px_rgba(0,0,0,.75)] sm:p-5"}>
      <div className="mb-2 flex items-end justify-between gap-4 border-b border-white/10 pb-2">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#f06a6a]">{item.workflow}</p>
          <h3 className="mt-1 text-xs font-black uppercase tracking-[-0.02em] sm:text-sm">{item.title}</h3>
        </div>

      </div>

      <div className={compact ? "flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4" : "flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5"}>
        <figure className={compact ? "flex w-full shrink-0 flex-col items-start sm:w-[29%]" : "flex w-full shrink-0 flex-col items-start sm:w-[23%]"}>
          <SourceMedia source={item} size={compact ? "compact" : "large"} priority fitToContainer />
                  </figure>

        <figure className="min-w-0 flex-1">
          <ResultMedia result={item} size={compact ? "large" : "large"} priority className="rounded-[1rem]" />
        </figure>
      </div>
    </article>
  );
}
