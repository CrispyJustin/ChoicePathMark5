export function Settings() {
  const store = useAppStore();
  const { user, logout } = useAuth();
  // ... your existing states ...
  const [activeTab, setActiveTab] = useState<'settings' | 'privacy'>('settings');
  // ...
import { useState } from "react";
import { AVATAR_OPTIONS, KEY, type Student } from "@/lib/store";
import { THEMES } from "@/lib/themes";
import { AppNav } from "@/components/AppNav";
import { useAppStore } from "@/lib/appStore";
import { useAuth } from "@/lib/auth";

export function Settings() {
  const store = useAppStore();
  const { user, logout } = useAuth();
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState(AVATAR_OPTIONS[0]);
  const [importDone, setImportDone] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  // Read local students for import
  const localStudents: Student[] = (() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.students) ? parsed.students : [];
    } catch {
      return [];
    }
  })();

  const cloudIds = new Set(store.students.map((s) => s.id));
  const toImport = localStudents.filter((s) => !cloudIds.has(s.id));
  const showImport = user && toImport.length > 0 && !importDone;

  // --- Real Ownership Logic Restored ---
  const currentBoardOwnerId = (store as any).currentBoard?.owner_id || (store as any).owner_id;
  
  const isCurrentBoardOwner = user && currentBoardOwnerId
    ? currentBoardOwnerId === user.id
    : true; 

  console.log("Ownership Debug:", {
    boardOwnerUuid: currentBoardOwnerId,
    loggedInUserUuid: user?.id,
    isOwnerResult: isCurrentBoardOwner
  });
  // -------------------------------------

  const handleImport = () => {
    if (
      !confirm(
        `Import ${toImport.length} student${toImport.length > 1 ? "s" : ""} from this device into your cloud board?`,
      )
    )
      return;
    store.bulkImport(toImport);
    setImportDone(true);
  };

  const handleShareBoard = async () => {
    const shareFn = (store as any).shareCurrentBoard;
    if (!shareFn) return;
    setShareMessage(null);
    try {
      await shareFn(shareEmail);
      setShareEmail("");
      setShareMessage("Board shared successfully.");
    } catch (err) {
      setShareMessage(err instanceof Error ? err.message : "Could not share board.");
    }
  };

  const handleRemoveSharedEmail = async (memberId: string, email: string) => {
    const removeFn = (store as any).removeSharedEmail;
    if (!removeFn) return;
    if (!confirm(`Remove ${email} from this board?`)) return;
    setShareMessage(null);
    try {
      await removeFn(memberId);
      setShareMessage("Shared access removed.");
    } catch (err) {
      setShareMessage(err instanceof Error ? err.message : "Could not remove access.");
    }
  };

  const handleLogout = async () => {
    if (!confirm("Sign out of ChoicePath?")) return;
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-4xl mx-auto p-4 space-y-8">
        
        {/* Simple Tab Navigation */}
        <div className="flex gap-4 border-b-2 border-border mb-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 font-bold ${activeTab === 'settings' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 font-bold ${activeTab === 'privacy' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            Privacy Policy
          </button>
        </div>

        {activeTab === 'privacy' ? (
            <div className="bg-card border-2 rounded-2xl p-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
                <p><strong>Effective Date:</strong> July 8, 2026</p>
                <p>ChoicePath is committed to protecting the privacy of educators and their students. We collect only the information necessary to provide our classroom management services.</p>
                <h2 className="font-bold text-foreground">1. Information We Collect</h2>
                <p>We collect your email address for authentication and classroom data (student names, avatars, and progress) that you input.</p>
                <h2 className="font-bold text-foreground">2. Data Security & Sharing</h2>
                <p>We do not sell your data. Access is strictly controlled via Row-Level Security. Data is only shared with those you explicitly invite to your board.</p>
                <h2 className="font-bold text-foreground">3. Your Rights</h2>
                <p>You may edit or delete any data at any time. For questions, please contact us.</p>
            </div>
        ) : (
            <>
                {/* --- PASTE ALL YOUR EXISTING SETTINGS SECTIONS HERE --- */}
                {/* Account Section */}
                {/* Board Sharing Section */}
                {/* Path Length Section */}
                {/* Theme Section */}
                {/* Students Section */}
                {/* Premium Section */}
            </>
        )}
      </main>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-4xl mx-auto p-4 space-y-8">
        <h1 className="text-3xl font-extrabold">Settings</h1>

        {/* Account */}
        {user && (
          <section className="bg-card border-2 rounded-2xl p-5 space-y-3">
            <h2 className="text-xl font-bold">Account</h2>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-semibold">{user.email}</span>
            </p>

            {showImport && (
              <div className="border rounded-xl p-4 bg-muted/40 space-y-2">
                <p className="text-sm font-semibold">
                  📥 {toImport.length} student
                  {toImport.length > 1 ? "s" : ""} found on this device
                </p>
                <p className="text-xs text-muted-foreground">
                  These aren't in your cloud board yet. You can import them now.
                </p>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
                >
                  Import Local Data to Cloud
                </button>
              </div>
            )}

            {importDone && (
              <p className="text-sm text-green-600 font-semibold">
                ✓ Local students imported successfully.
              </p>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-bold text-sm"
            >
              Sign out
            </button>
          </section>
        )}

        {/* Board sharing */}
        {user && (
          <section className="bg-card border-2 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold">Class Board Access</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Share this board with another teacher or aide by email. When they log in with that email, this board will appear as an option for them.
              </p>
            </div>

            {isCurrentBoardOwner ? (
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="teacher@email.com"
                  type="email"
                  className="px-3 py-2 rounded-lg border-2 flex-1 min-w-[220px]"
                />
                <button
                  onClick={handleShareBoard}
                  disabled={!shareEmail.trim() || Boolean((store as any).sharingBusy)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-50"
                >
                  Share Board
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground rounded-xl border-2 p-3 bg-muted/30">
                This board was shared with you. The board owner manages who has access.
              </p>
            )}

            {shareMessage && (
              <p className="text-sm font-semibold text-muted-foreground">{shareMessage}</p>
            )}
            {(store as any).sharingError && (
              <p className="text-sm font-semibold text-destructive">
                {(store as any).sharingError}
              </p>
            )}

            <div className="space-y-2">
              <h3 className="font-bold text-sm">Shared with</h3>
              {((store as any).boardMembers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No one else has access yet.</p>
              ) : (
                <ul className="space-y-2">
                  {((store as any).boardMembers ?? []).map((member: any) => (
                    <li key={member.id} className="flex items-center gap-2 justify-between rounded-xl border-2 p-3">
                      <span className="font-semibold text-sm">{member.member_email}</span>
                      {isCurrentBoardOwner && (
                        <button
                          onClick={() => handleRemoveSharedEmail(member.id, member.member_email)}
                          className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Path length */}
        <section className="bg-card border-2 rounded-2xl p-5">
          <h2 className="text-xl font-bold mb-3">Path Length</h2>
          <div className="flex gap-2">
            {([5, 8, 10] as const).map((n) => (
              <button
                key={n}
                onClick={() => store.setPathLength(n)}
                className={`px-6 py-3 rounded-xl font-bold border-2 ${
                  store.pathLength === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card"
                }`}
              >
                {n} spaces
              </button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section className="bg-card border-2 rounded-2xl p-5">
          <h2 className="text-xl font-bold mb-3">Theme</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => store.setTheme(t.id)}
                className={`p-4 rounded-xl border-2 text-left ${
                  store.theme === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="text-2xl">{t.treasure}</div>
                <div className="font-bold">{t.name}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Students */}
        <section className="bg-card border-2 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-xl font-bold">Students</h2>
          </div>

          <div className="space-y-2 mb-4">
            {store.students.map((s) => (
              <StudentRow
                key={s.id}
                student={s}
                onUpdate={store.updateStudent}
                onDelete={store.deleteStudent}
              />
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold mb-2">Add Student</h3>
            <div className="flex gap-2 flex-wrap items-center">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="First name"
                className="px-3 py-2 rounded-lg border-2 flex-1 min-w-[140px]"
              />
              <AvatarPicker value={newAvatar} onChange={setNewAvatar} />
              <button
                onClick={() => {
                  if (!newName.trim()) return;
                  store.addStudent(newName.trim(), newAvatar);
                  setNewName("");
                }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold"
              >
                Add
              </button>
            </div>
          </div>
        </section>

        {/* Premium Upgrade Area (Replaces old Sponsored Section) */}
        <section className="bg-card border-2 rounded-2xl p-5 border-primary shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            ⭐ ChoicePath Premium
          </h2>
          <p className="text-sm text-muted-foreground">
            Support ChoicePath development and permanently remove all top banner advertisements from your dashboards and shared views.
          </p>
          <div className="pt-1">
            <button
              onClick={() => alert("Stripe checkout module coming soon!")}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Upgrade to Premium — $2.99/mo
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {AVATAR_OPTIONS.map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          className={`text-2xl h-10 w-10 rounded-lg border-2 ${value === a ? "border-primary bg-primary/10" : "border-border"}`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

function StudentRow({ student, onUpdate, onDelete }: { student: Student; onUpdate: (id: string, patch: Partial<Student>) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [avatar, setAvatar] = useState(student.avatar);

  if (editing) {
    return (
      <div className="p-3 rounded-xl border-2 bg-muted/30 space-y-2">
        <div className="flex gap-2 items-center flex-wrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 rounded-lg border-2 flex-1 min-w-[140px]"
          />
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onUpdate(student.id, { name: name.trim() || student.name, avatar });
              setEditing(false);
            }}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 rounded-lg bg-card border-2 text-sm font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border-2 flex-wrap">
      <span className="text-3xl">
        {student.avatar.startsWith("data:") ? "🖼️" : student.avatar}
      </span>
      <span className="font-bold flex-1 min-w-[80px]">{student.name}</span>
      <button
        onClick={() => setEditing(true)}
        className="px-3 py-1.5 rounded-lg bg-card border-2 text-sm font-bold"
      >
        Edit
      </button>
      <button
        onClick={() => {
          if (confirm(`Delete ${student.name}?`)) onDelete(student.id);
        }}
        className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold"
      >
        Delete
      </button>
    </div>
  );
}
