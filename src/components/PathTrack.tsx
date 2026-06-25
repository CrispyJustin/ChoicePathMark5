import { getTheme } from "@/lib/themes";
import type { Student } from "@/lib/store";

type Props = {
  student: Student;
  pathLength: number;
  themeId: string;
  size?: "sm" | "md" | "lg";
};

export function PathTrack({ student, pathLength, themeId, size = "md" }: Props) {
  const theme = getTheme(themeId);
  const spaces = Array.from({ length: pathLength + 1 }, (_, i) => i); // includes start (0)

  const cellSize = size === "sm" ? "h-8 w-8 text-base" : size === "md" ? "h-14 w-14 text-2xl" : "h-24 w-24 text-5xl";
  const markerSize = size === "sm" ? "text-lg" : size === "md" ? "text-3xl" : "text-6xl";
  const nameSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-base";
  const reached = student.position >= pathLength;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1 sm:gap-2 py-2 min-w-fit">
        {spaces.map((i) => {
          const isTreasure = i === pathLength;
          const isHere = student.position === i;
          return (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`${markerSize} h-10 flex items-end justify-center`}>
                {isHere && (
                  <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {student.avatar.startsWith("data:") || student.avatar.startsWith("http") ? (
                      <img src={student.avatar} alt={student.name} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-primary" />
                    ) : (
                      <span>{student.avatar}</span>
                    )}
                    <span className={`${nameSize} font-bold text-foreground`}>{student.name}</span>
                  </div>
                )}
              </div>
              <div
                className={`${cellSize} rounded-full flex items-center justify-center border-2 ${
                  isTreasure
                    ? "bg-[var(--theme-treasure-bg)] border-[var(--theme-treasure-border)]"
                    : isHere
                      ? "bg-[var(--theme-space-active)] border-[var(--theme-space-active-border)]"
                      : "bg-[var(--theme-space)] border-[var(--theme-space-border)]"
                }`}
              >
                {isTreasure ? theme.treasure : ""}
              </div>
            </div>
          );
        })}
      </div>
      {reached && (
        <div className="mt-3 text-center text-xl font-bold text-[var(--theme-celebrate)] animate-pulse">
          🎉 Treasure earned! 🎉
        </div>
      )}
    </div>
  );
}
