import { useAuth } from "./auth";
import { useStore } from "./store";
import { useCloudStore } from "./cloudStore";

export type AppState = {
  students: any[];
  pathLength: 5 | 8 | 10;
  theme: string;
  selectedStudentId: string | null;
  boardMembers: any[];
  sharingBusy: boolean;
  sharingError: string | null;
  isPremium: boolean; 
};

export function useAppStore() {
  const { user } = useAuth();
  const localStore = useStore();
  const cloudStore = useCloudStore(user);
  
  const activeStore = user ? cloudStore : localStore;

  // Integrates the premium flag cleanly into the returned combined state object
  return {
    ...activeStore,
    isPremium: (activeStore as any).isPremium ?? false,
  };
}
