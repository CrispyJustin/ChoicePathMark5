import { useAppStore } from "@/lib/appStore";
import { AppNav } from "@/components/AppNav";

export function Attendance() {
  const store = useAppStore();
  const total = store.students.length;
  const presentCount = store.students.filter((s) => s.present !== false).length;
  const absentCount = total - presentCount;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-3xl font-extrabold">Attendance</h1>
          <div className="text-sm font-semibold text-muted-foreground">
            {presentCount} present · {absentCount} absent · {total} total
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={store.markAllPresent}
            className="py-4 rounded-xl bg-[var(--good)] text-white text-lg font-extrabold shadow active:scale-95 transition-transform"
          >
            ✓ Mark All Present
          </button>
          <button
            onClick={store.markAllPresent}
            className="py-4 rounded-xl bg-muted text-foreground text-lg font-bold border-2 active:scale-95 transition-transform"
          >
            ↺ Reset Attendance
          </button>
        </div>

        {total === 0 ? (
          <p className="text-center text-muted-foreground py-8">No students yet. Add some in Settings.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {store.students.map((s) => {
              const isPresent = s.present !== false;
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 bg-card shadow-sm ${
                    isPresent ? "" : "opacity-60"
                  }`}
                >
                  {s.avatar.startsWith("data:") || s.avatar.startsWith("http") ? (
                    <img src={s.avatar} alt={s.name} className="h-14 w-14 rounded-full object-cover border-2" />
                  ) : (
                    <span className="text-5xl">{s.avatar}</span>
                  )}
                  <span className="text-2xl font-bold flex-1 truncate">{s.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => store.setPresent(s.id, true)}
                      aria-pressed={isPresent}
                      className={`px-5 py-4 rounded-xl text-lg font-extrabold border-2 transition-colors ${
                        isPresent
                          ? "bg-[var(--good)] text-white border-[var(--good)]"
                          : "bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => store.setPresent(s.id, false)}
                      aria-pressed={!isPresent}
                      className={`px-5 py-4 rounded-xl text-lg font-extrabold border-2 transition-colors ${
                        !isPresent
                          ? "bg-[var(--bad)] text-white border-[var(--bad)]"
                          : "bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
