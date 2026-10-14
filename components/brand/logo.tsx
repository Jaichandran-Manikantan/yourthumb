import { cn } from "@/lib/utils";

export function YourThumbLogo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="20" fill="#FF0000" />
      <rect x="10" y="9" width="20" height="4.8" rx="1.2" fill="white" />
      <path d="M16 16.2V30.2L28.4 23.2L16 16.2Z" fill="white" />
    </svg>
  );
}

export function BrandMark({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <YourThumbLogo size={size} />
      <span className="text-[20px] leading-none font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        YourThumb
      </span>
    </span>
  );
}
