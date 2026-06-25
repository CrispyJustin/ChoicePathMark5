import { useState, useEffect, useCallback } from "react";
import { MAX_PROGRESS, type Student } from "@/lib/store";
import { useAppStore } from "@/lib/appStore";
import { AppNav } from "@/components/AppNav";
import { playGreen, playRed, playFanfare, getMuted, toggleMute } from "@/lib/sounds";

const CUBE_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#0ea5e9",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#f43f5e",
  "#06b6d4",
] as const;

const EARNED_COLOR = "#22c55e";

function TenFrame({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(MAX_PROGRESS, value));
  const cubes = Array.from({ length: MAX_PROGRESS }, (_, i) => i);

  return (
    <div className="flex flex-col gap-[2px] w-full">
      {[cubes.slice(0, 5), cubes.slice(5, 10)].map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-[2px] w-full">
          {row.map((i) => {
            const earned = i < filled;
            const isNext = i === filled && filled < MAX_PROGRESS;
            const color = earned ? EARNED_COLOR : CUBE_COLORS[i];
            return (
              <div
                key={i}
                className="flex-1 rounded transition-all duration-150"
                style={{
                  aspectRatio: "1",
                  backgroundColor: color,
                  opacity: earned || isNext ? 1 : 0.52,
                  boxShadow: isNext
                    ? `0 0 0 2px white, 0 0 0 3.5px ${color}, 0 2px 6px ${color}88`
                    : earned
                    ? "inset 0 1px 0 rgba(255,255,255,0.22)"
                    : "none",
                  transform: isNext ? "scale(1.1)" : "scale(1)",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function StudentCard({
  student,
  selected,
  onToggleSelect,
}: {
  student: Student;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const isImg = student.avatar.startsWith("data:") || student.avatar.startsWith("http");

  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 shadow-sm transition-colors cursor-pointer select-none ${
        selected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-border bg-card"
      }`}
      onClick={onToggleSelect}
    >
      {/* Selection indicator */}
      <div
        className={`absolute top-1.5 left-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors z-10 ${
          selected
            ? "border-blue-500 bg-blue-500 text-white"
            : "border-muted-foreground/40 bg-card"
        }`}
        style={{ fontSize: "0.6rem" }}
      >
        {selected && "✓"}
      </div>

      {isImg ? (
        <img
          src={student.avatar}
          alt={student.name}
          className="rounded-full object-cover border-2 border-border mt-0.5"
          style={{ width: "clamp(2.2rem, 4vw, 3.6rem)", height: "clamp(2.2rem, 4vw, 3.6rem)" }}
        />
      ) : (
        <span
          className="leading-none mt-0.5"
          style={{ fontSize: "clamp(1.8rem, 3.6vw, 3.2rem)" }}
          aria-hidden
        >
          {student.avatar}
        </span>
      )}

      <span
        className="font-extrabold text-foreground text-center truncate w-full leading-tight"
        style={{ fontSize: "clamp(0.65rem, 1.1vw, 0.95rem)" }}
      >
        {student.name}
      </span>

      <div className="w-full px-0.5">
        <TenFrame value={student.position} />
      </div>
    </div>
  );
}

export function ClassBoard() {
  const store = useAppStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(() => getMuted());

  const visible = store.students.filter((s) => s.present !== false);
  const absentCount = store.students.length - visible.length;
  const visibleIds = new Set(visible.map((s) => s.id));
  const selectedCount = selected.size;

  // Auto-remove absent students from selection
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visible.map((s) => s.id).join(",")]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const visibleIdKey = visible.map((s) => s.id).join(",");

  const selectAll = useCallback(() => {
    setSelected(new Set(visibleIds));
  }, [visibleIdKey]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const bulkGreen = useCallback(() => {
    const anyReachMax = visible.some((s) => selected.has(s.id) && s.position === MAX_PROGRESS - 1);
    visible.forEach((s) => { if (selected.has(s.id)) store.moveStudent(s.id, 1); });
    if (anyReachMax) playFanfare(); else playGreen();
  }, [selected, visible, store]);

  const bulkRed = useCallback(() => {
    visible.forEach((s) => { if (selected.has(s.id)) store.moveStudent(s.id, -1); });
    playRed();
  }, [selected, visible, store]);

  const resetSelected = useCallback(() => {
    if (selectedCount === 0) return;
    if (!confirm(`Reset progress for ${selectedCount} selected student${selectedCount > 1 ? "s" : ""}?`)) return;
    visible.forEach((s) => { if (selected.has(s.id)) store.resetStudent(s.id); });
  }, [selected, visible, store, selectedCount]);

  if (!store.hydrated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground text-sm animate-pulse">Loading your class…</div>
    </div>;
  }

  if ((store as { loadError?: string | null }).loadError) {
    const err = (store as { loadError: string }).loadError;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-destructive font-semibold text-base">Failed to connect to cloud</div>
        <div className="text-muted-foreground text-sm text-center max-w-md">{err}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />

      {/* Toolbar */}
      <div className="sticky top-[57px] z-10 bg-card/95 backdrop-blur border-b px-3 py-1.5 flex items-center gap-2 flex-wrap">
        <button
          onClick={selectAll}
          disabled={visible.length === 0}
          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-muted hover:bg-muted/70 disabled:opacity-40 transition-colors"
        >
          Select All
        </button>
        <button
          onClick={clearSelection}
          disabled={selectedCount === 0}
          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-muted hover:bg-muted/70 disabled:opacity-40 transition-colors"
        >
          Clear
        </button>

        <span className="text-xs text-muted-foreground font-medium min-w-[6rem]">
          {selectedCount > 0 ? `Selected: ${selectedCount}` : "None selected"}
        </span>

        <div className="flex gap-2 ml-auto flex-wrap">
          <button
            onClick={bulkGreen}
            disabled={selectedCount === 0}
            className="px-3 py-1 rounded-md text-xs font-extrabold bg-green-500 hover:bg-green-600 text-white disabled:opacity-40 transition-colors shadow-sm"
          >
            ✓ Green
          </button>
          <button
            onClick={bulkRed}
            disabled={selectedCount === 0}
            className="px-3 py-1 rounded-md text-xs font-extrabold bg-red-500 hover:bg-red-600 text-white disabled:opacity-40 transition-colors shadow-sm"
          >
            ✗ Red
          </button>
          <button
            onClick={resetSelected}
            disabled={selectedCount === 0}
            className="px-3 py-1 rounded-md text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition-colors shadow-sm"
          >
            ↺ Reset
          </button>
        </div>

        <button
          onClick={() => setMuted(toggleMute())}
          className="px-2.5 py-1 rounded-md text-sm bg-muted hover:bg-muted/70 transition-colors"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          title={muted ? "Unmute sounds" : "Mute sounds"}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        {absentCount > 0 && (
          <a
            href="/attendance"
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted hover:bg-muted/70 text-muted-foreground"
          >
            {absentCount} absent →
          </a>
        )}
      </div>

      <main className="flex-1 p-2 sm:p-3">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="text-muted-foreground text-lg">
              {store.students.length === 0
                ? "No students yet."
                : "All students are marked absent."}
            </p>
            <a
              href={store.students.length === 0 ? "/settings" : "/attendance"}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold"
            >
              {store.students.length === 0 ? "Add students" : "Open Attendance"}
            </a>
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(clamp(115px, 11.5vw, 215px), 1fr))",
            }}
          >
            {visible.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                selected={selected.has(s.id)}
                onToggleSelect={() => toggleSelect(s.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
