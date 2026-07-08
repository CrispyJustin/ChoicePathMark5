import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import type { Student } from "./store";
import { MAX_PROGRESS } from "./store";
import { supabase } from "@/lib/supabase"; // Ensure this path points to your supabase client
import {
  getOrCreateBoard,
  fetchStudents,
  upsertStudent,
  updateStudentField,
  removeStudent,
} from "./db";

const LOCAL_KEY = "preschool-behavior-v1";

// Add isPremium to your CloudState type
type CloudState = {
  // ... existing fields ...
  isPremium: boolean; // Add this
};

// ... inside your initial _cloudState ...
let _cloudState: CloudState = {
  // ... existing fields ...
  isPremium: false, // Default to false (Free)
};

// ... (keep readLocalSettings and saveLocalSettings functions as they were) ...
function readLocalSettings(): { pathLength: 5 | 8 | 10; theme: string } {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { pathLength: 8, theme: "treasure-map" };
    const parsed = JSON.parse(raw);
    return {
      pathLength: ([5, 8, 10] as const).includes(parsed.pathLength) ? parsed.pathLength : 8,
      theme: parsed.theme ?? "treasure-map",
    };
  } catch {
    return { pathLength: 8, theme: "treasure-map" };
  }
}

function saveLocalSettings(pathLength: number, theme: string) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...existing, pathLength, theme }));
  } catch {}
}

let _boardId: string | null = null;
let _loadingInProgress = false;

let _cloudState: CloudState = {
  students: [],
  boardMembers: [],
  pathLength: 8,
  theme: "treasure-map",
  selectedStudentId: null,
  hydrated: false,
  loadError: null,
  sharingBusy: false,
  sharingError: null,
};
const _cloudListeners = new Set<() => void>();

function setCloudState(updater: (s: CloudState) => CloudState) {
  _cloudState = updater(_cloudState);
  _cloudListeners.forEach((l) => l());
}

export function useCloudStore(user: User | null) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    _cloudListeners.add(l);
    return () => { _cloudListeners.delete(l); };
  }, []);

  useEffect(() => {
    if (!user) {
      _boardId = null;
      _loadingInProgress = false;
      setCloudState((s) => ({ ...s, students: [], boardMembers: [], hydrated: false }));
      return;
    }

    if (_cloudState.hydrated && _boardId && !_cloudState.loadError) return;
    if (_loadingInProgress) return;

    _loadingInProgress = true;
    const settings = readLocalSettings();
    setCloudState((s) => ({ ...s, ...settings, loadError: null }));

    let cancelled = false;

    getOrCreateBoard(user.id)
      .then(async (boardId) => {
        if (cancelled) return;
        _boardId = boardId;
        
        // Fetch Students and Members in parallel
        const [students, members] = await Promise.all([
          fetchStudents(boardId),
          supabase.from("board_members").select("*").eq("board_id", boardId)
        ]);
        
        if (cancelled) return;
        
        _loadingInProgress = false;
        setCloudState((s) => ({
          ...s,
          students: students ?? [],
          boardMembers: members.data ?? [],
          hydrated: true,
          loadError: null,
        }));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        _loadingInProgress = false;
        setCloudState((s) => ({ ...s, hydrated: true, loadError: err.message }));
      });

    return () => { cancelled = true; _loadingInProgress = false; };
  }, [user?.id]);

  // --- Sharing Functions ---
  const shareCurrentBoard = async (email: string) => {
    if (!_boardId) return;
    setCloudState((s) => ({ ...s, sharingBusy: true, sharingError: null }));
    
    const { data, error } = await supabase
      .from("board_members")
      .insert([{ board_id: _boardId, member_email: email }])
      .select();

    if (error) {
      setCloudState((s) => ({ ...s, sharingBusy: false, sharingError: error.message }));
      throw error;
    }

    setCloudState((s) => ({ 
      ...s, 
      sharingBusy: false, 
      boardMembers: [...s.boardMembers, ...(data || [])] 
    }));
  };

  const removeSharedEmail = async (memberId: string) => {
    setCloudState((s) => ({ ...s, sharingBusy: true, sharingError: null }));
    
    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      setCloudState((s) => ({ ...s, sharingBusy: false, sharingError: error.message }));
      throw error;
    }

    setCloudState((s) => ({ 
      ...s, 
      sharingBusy: false, 
      boardMembers: s.boardMembers.filter(m => m.id !== memberId) 
    }));
  };

  // ... (Keep your existing moveStudent, resetStudent, etc., below here)
  const moveStudent = useCallback((id: string, delta: number) => {
    setCloudState((s) => {
      const students = s.students.map((st) =>
        st.id === id ? { ...st, position: Math.max(0, Math.min(MAX_PROGRESS, st.position + delta)) } : st
      );
      const updated = students.find((st) => st.id === id);
      if (updated) updateStudentField(id, { progress: updated.position }).catch(console.error);
      return { ...s, students };
    });
  }, []);

  const resetStudent = useCallback((id: string) => {
    setCloudState((s) => {
      const students = s.students.map((st) => st.id === id ? { ...st, position: 0 } : st);
      updateStudentField(id, { progress: 0 }).catch(console.error);
      return { ...s, students };
    });
  }, []);

  const resetAll = useCallback(() => {
    setCloudState((s) => {
      const students = s.students.map((st) => ({ ...st, position: 0 }));
      students.forEach((st) => updateStudentField(st.id, { progress: 0 }).catch(console.error));
      return { ...s, students };
    });
  }, []);

  const addStudent = useCallback((name: string, avatar: string) => {
    const newStudent: Student = { id: crypto.randomUUID(), name, avatar, position: 0, present: true };
    setCloudState((s) => {
      const students = [...s.students, newStudent];
      if (_boardId) upsertStudent(_boardId, newStudent, students.length - 1).catch(console.error);
      return { ...s, students };
    });
  }, []);

  const updateStudent = useCallback((id: string, patch: Partial<Student>) => {
    setCloudState((s) => {
      const students = s.students.map((st) => st.id === id ? { ...st, ...patch } : st);
      const fields: Record<string, unknown> = {};
      if (patch.name !== undefined) fields.first_name = patch.name;
      if (patch.avatar !== undefined) fields.avatar_url = patch.avatar;
      if (patch.position !== undefined) fields.progress = patch.position;
      if (patch.present !== undefined) fields.is_present = patch.present;
      if (Object.keys(fields).length > 0) updateStudentField(id, fields as any).catch(console.error);
      return { ...s, students };
    });
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setCloudState((s) => {
      removeStudent(id).catch(console.error);
      return { ...s, students: s.students.filter((st) => st.id !== id), selectedStudentId: s.selectedStudentId === id ? null : s.selectedStudentId };
    });
  }, []);

  const setPathLength = useCallback((len: 5 | 8 | 10) => {
    setCloudState((s) => {
      const students = s.students.map((st) => ({ ...st, position: Math.min(st.position, len) }));
      saveLocalSettings(len, s.theme);
      return { ...s, pathLength: len, students };
    });
  }, []);

  const setTheme = useCallback((theme: string) => {
    setCloudState((s) => {
      saveLocalSettings(s.pathLength, theme);
      return { ...s, theme };
    });
  }, []);

  const setSelectedStudent = useCallback((id: string | null) => {
    setCloudState((s) => ({ ...s, selectedStudentId: id }));
  }, []);

  const setPresent = useCallback((id: string, present: boolean) => {
    setCloudState((s) => {
      const students = s.students.map((st) => st.id === id ? { ...st, present } : st);
      updateStudentField(id, { is_present: present }).catch(console.error);
      return { ...s, students };
    });
  }, []);

  const markAllPresent = useCallback(() => {
    setCloudState((s) => {
      const students = s.students.map((st) => ({ ...st, present: true }));
      students.forEach((st) => updateStudentField(st.id, { is_present: true }).catch(console.error));
      return { ...s, students };
    });
  }, []);

  const bulkImport = useCallback((toImport: Student[]) => {
    setCloudState((s) => {
      const existingIds = new Set(s.students.map((st) => st.id));
      const fresh = toImport.filter((st) => !existingIds.has(st.id));
      if (fresh.length === 0 || !_boardId) return s;
      const students = [...s.students, ...fresh];
      fresh.forEach((st, i) => upsertStudent(_boardId!, st, s.students.length + i).catch(console.error));
      return { ...s, students };
    });
  }, []);

  return {
    ..._cloudState,
    moveStudent,
    resetStudent,
    resetAll,
    addStudent,
    updateStudent,
    deleteStudent,
    setPathLength,
    setTheme,
    setSelectedStudent,
    setPresent,
    markAllPresent,
    bulkImport,
    shareCurrentBoard, // Exposed
    removeSharedEmail  // Exposed
  };
}
