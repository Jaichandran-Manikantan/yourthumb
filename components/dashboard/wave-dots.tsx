"use client";

export function WaveDots({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="flex items-end gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="wave-dot size-2.5 rounded-full bg-gradient-to-b from-[#ff526b] to-[#ff7488]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-[#b7aea2]">{label}</p>
    </div>
  );
}
