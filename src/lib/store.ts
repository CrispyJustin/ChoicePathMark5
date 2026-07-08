import { useEffect, useState, useCallback } from "react";

export type Student = {
  id: string;
  name: string;
  avatar: string; // emoji or data url
  position: number;
  present?: boolean; // defaults to true when undefined
};

export type BoardMember = {
  id: string;
  member_email: string;
};

export type AppState = {
  students: Student[];
  pathLength: 5 | 8 | 10;
  theme: string;
  selectedStudentId: string | null;
  // Cloud / Sharing properties
  boardMembers: BoardMember[];
  sharingBusy: boolean;
  sharingError: string | null;
};

export const KEY = "preschool-behavior-v1";
export const MAX_PROGRESS = 10;

const DEFAULT_AVATARS = ["🦊", "🐻", "🐼", "🐯", "🦁", "🐸", "🐵", "🐰", "🐨", "🐮", "🦄", "🐧"];
const SAMPLE_NAMES = ["Ava", "Liam", "Mia", "Noah", "Zoe", "Eli", "Luna", "Theo"];

const STABLE_IDS = SAMPLE_NAMES.map((_, i) => `default-student-${i}`);

function defaultState(): AppState {
  return {
    students: SAMPLE_NAMES.map((name, i) => ({
      id: STABLE_IDS[i],
      name,
      avatar: DEFAULT_AVATARS[i % DEFAULT_AVATARS.length],
      position: 0,
      present: true,
    })),
    pathLength: 8,
    theme: "treasure-map",
    selectedStudentId: null,
    boardMembers: [],
    sharingBusy: false,
    sharingError: null,
  };
}

function loadFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = defaultState();
      fresh.students = fresh.students.map((s) => ({ ...s, id: crypto.randomUUID() }));
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.students) {
      const fresh = defaultState();
      fresh.students = fresh.students.map((s) => ({ ...s, id: crypto.randomUUID() }));
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    // Safeguard missing share arrays on parse
    if (!parsed.boardMembers) parsed.boardMembers = [];
    parsed.sharingBusy = false;
    parsed.sharingError = null;
    return parsed;
  } catch {
    return defaultState();
  }
}

const listeners = new Set<() => void>();
let state: AppState | null = null;

function getState(): AppState {
  if (state === null) state = defaultState();
  return state;
}

function setState(updater: (s: AppState) => AppState) {
  state = updater(getState());
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export function useStore() {
  const [hydrated, setHydrated] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    state = loadFromStorage();
    setHydrated(true);
    setTick((t) => t + 1);

    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const s = getState();

  const moveStudent = useCallback((id: string, delta: number) => {
    setState((s) => ({
      ...s,
      students: s.students.map((st) =>
        st.id === id
          ? { ...st, position: Math.max(0, Math.min(MAX_PROGRESS, st.position + delta)) }
          : st,
      ),
    }));
  }, []);

  const resetStudent = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      students: s.students.map((st) => (st.id === id ? { ...st, position: 0 } : st)),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState((s) => ({ ...s, students: s.students.map((st) => ({ ...st, position: 0 })) }));
  }, []);

  const addStudent = useCallback((name: string, avatar: string) => {
    setState((s) => ({
      ...s,
      students: [...s.students, { id: crypto.randomUUID(), name, avatar, position: 0 }],
    }));
  }, []);

  const updateStudent = useCallback((id: string, patch: Partial<Student>) => {
    setState((s) => ({
      ...s,
      students: s.students.map((st) => (st.id === id ? { ...st, ...patch } : st)),
    }));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      students: s.students.filter((st) => st.id !== id),
      selectedStudentId: s.selectedStudentId === id ? null : s.selectedStudentId,
    }));
  }, []);

  const setPathLength = useCallback((len: 5 | 8 | 10) => {
    setState((s) => ({
      ...s,
      pathLength: len,
      students: s.students.map((st) => ({ ...st, position: Math.min(st.position, len) })),
    }));
  }, []);

  const setTheme = useCallback((theme: string) => {
    setState((s) => ({ ...s, theme }));
  }, []);

  const setSelectedStudent = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedStudentId: id }));
  }, []);

  const setPresent = useCallback((id: string, present: boolean) => {
    setState((s) => ({
      ...s,
      students: s.students.map((st) => (st.id === id ? { ...st, present } : st)),
    }));
  }, []);

  const markAllPresent = useCallback(() => {
    setState((s) => ({ ...s, students: s.students.map((st) => ({ ...st, present: true })) }));
  }, []);

  // Merges unique local items smoothly into global state
  const bulkImport = useCallback((incomingStudents: Student[]) => {
    setState((s) => {
      const existingIds = new Set(s.students.map((st) => st.id));
      const filteredIncoming = incomingStudents.filter((st) => !existingIds.has(st.id));
      return {
        ...s,
        students: [...s.students, ...filteredIncoming],
      };
    });
  }, []);

  // Share Board handling
  const shareCurrentBoard = useCallback(async (email: string) => {
    if (!email.trim()) return;
    
    setState((s) => ({ ...s, sharingBusy: true, sharingError: null }));
    
    // Simulate API database roundtrip processing latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    setState((s) => {
      const alreadyShared = s.boardMembers.some((m) => m.member_email.toLowerCase() === email.toLowerCase());
      if (alreadyShared) {
        return { ...s, sharingBusy: false, sharingError: "This email already has access to the board." };
      }
      
      const newMember: BoardMember = {
        id: crypto.randomUUID(),
        member_email: email.trim(),
      };
      
      return {
        ...s,
        boardMembers: [...s.boardMembers, newMember],
        sharingBusy: false,
        sharingError: null,
      };
    });
  }, []);

  // Remove shared access handling
  const removeSharedEmail = useCallback(async (memberId: string) => {
    setState((s) => ({ ...s, sharingBusy: true, sharingError: null }));
    
    await new Promise((resolve) => setTimeout(resolve, 500));

    setState((s) => ({
      ...s,
      boardMembers: s.boardMembers.filter((m) => m.id !== memberId),
      sharingBusy: false,
      sharingError: null,
    }));
  }, []);

  return {
    ...s,
    hydrated,
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
    shareCurrentBoard,
    removeSharedEmail,
  };
}

export const AVATAR_OPTIONS = DEFAULT_AVATARS;
