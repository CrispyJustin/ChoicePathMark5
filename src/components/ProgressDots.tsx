import { MAX_PROGRESS } from "@/lib/store";

type Props = {
  value: number;
  size?: "sm" | "md";
};

export function ProgressDots({ value, size = "sm" }: Props) {
  const dotClass = size === "sm" ? "h-3 w-3 sm:h-3.5 sm:w-3.5" : "h-4 w-4";
  const filled = Math.max(0, Math.min(MAX_PROGRESS, value));
  return (
    <div
      className="flex items-center justify-between gap-1 w-full"
      aria-label={`Progress ${filled} of ${MAX_PROGRESS}`}
    >
      {Array.from({ length: MAX_PROGRESS }, (_, i) => (
        <span
          key={i}
          className={`${dotClass} rounded-full border-2 ${
            i < filled
              ? "bg-[var(--theme-space-active)] border-[var(--theme-space-active-border)]"
              : "bg-[var(--theme-space)]/40 border-[var(--theme-space-border)]/60"
          }`}
        />
      ))}
    </div>
  );
}
