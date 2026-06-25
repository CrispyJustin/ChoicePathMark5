import { useAuth } from "./auth";
import { useStore } from "./store";
import { useCloudStore } from "./cloudStore";

export function useAppStore() {
  const { user } = useAuth();
  const localStore = useStore();
  const cloudStore = useCloudStore(user);
  return user ? cloudStore : localStore;
}
