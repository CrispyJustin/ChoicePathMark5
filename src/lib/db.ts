import { supabase } from "./supabase";
import type { Student } from "./store";

export type DBStudent = {
  id: string;
  board_id: string;
  first_name: string;
  avatar_url: string;
  progress: number;
  is_present: boolean;
  sort_order: number;
};

export function dbToStudent(row: DBStudent): Student {
  return {
    id: row.id,
    name: row.first_name,
    avatar: row.avatar_url ?? "",
    position: row.progress ?? 0,
    present: row.is_present ?? true,
  };
}

export async function getOrCreateBoard(userId: string): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");

  console.log("[ChoicePath] getOrCreateBoard — user id:", userId);

  // Only query the boards table (board_members has a broken RLS policy)
  const { data: owned, error: selectError } = await supabase
    .from("boards")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.error("[ChoicePath] Error querying boards table:", selectError);
    throw new Error("Failed to query boards: " + selectError.message);
  }

  if (owned) {
    console.log("[ChoicePath] Found existing board:", owned.id);
    return owned.id;
  }

  console.log("[ChoicePath] No board found — creating 'My Class Board'...");

  const { data: newBoard, error: insertError } = await supabase
    .from("boards")
    .insert({ name: "My Class Board", owner_id: userId })
    .select("id")
    .single();

  if (insertError || !newBoard) {
    console.error("[ChoicePath] Error creating board:", insertError);
    throw new Error("Failed to create board: " + insertError?.message);
  }

  console.log("[ChoicePath] Created new board:", newBoard.id);
  return newBoard.id;
}

export async function fetchStudents(boardId: string): Promise<Student[]> {
  if (!supabase) return [];

  console.log("[ChoicePath] Fetching students for board:", boardId);

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("board_id", boardId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[ChoicePath] Error fetching students:", error);
    return [];
  }

  console.log("[ChoicePath] Loaded", data?.length ?? 0, "students");
  return (data as DBStudent[]).map(dbToStudent);
}

export async function upsertStudent(
  boardId: string,
  student: Student,
  sortOrder: number,
): Promise<void> {
  if (!supabase) return;

  const row = {
    id: student.id,
    board_id: boardId,
    first_name: student.name,
    avatar_url: student.avatar || null,
    progress: student.position,
    is_present: student.present ?? true,
    sort_order: sortOrder,
  };

  const { error } = await supabase.from("students").upsert(row);
  if (error) {
    console.error("[ChoicePath] Error upserting student:", student.name, error);
  } else {
    console.log("[ChoicePath] Upserted student:", student.name, "sort_order:", sortOrder);
  }
}

export async function updateStudentField(
  id: string,
  fields: Partial<{
    progress: number;
    is_present: boolean;
    first_name: string;
    avatar_url: string;
    sort_order: number;
  }>,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("students").update(fields).eq("id", id);
  if (error) {
    console.error("[ChoicePath] Error updating student", id, fields, error);
  } else {
    console.log("[ChoicePath] Updated student", id, fields);
  }
}

export async function removeStudent(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) {
    console.error("[ChoicePath] Error deleting student", id, error);
  } else {
    console.log("[ChoicePath] Deleted student", id);
  }
}
