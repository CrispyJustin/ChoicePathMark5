import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase";
import { LoginScreen } from "@/components/LoginScreen";
import { ClassBoard } from "@/routes/index";
import { Attendance } from "@/routes/attendance";
import { Settings } from "@/routes/settings";
import "./styles.css";

function SupabaseErrorScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="text-5xl">⚙️</div>
        <h1 className="text-2xl font-extrabold">Supabase not configured</h1>
        <p className="text-sm text-muted-foreground">
          The app requires <code className="font-mono bg-muted px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
          <code className="font-mono bg-muted px-1 rounded">VITE_SUPABASE_ANON_KEY</code> environment variables to be set in Vercel.
        </p>
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (!supabaseConfigured) return <SupabaseErrorScreen />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <>{children}</>;
}

function usePathname() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onNavigate = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onNavigate);
    window.addEventListener("choicepath:navigate", onNavigate);
    return () => {
      window.removeEventListener("popstate", onNavigate);
      window.removeEventListener("choicepath:navigate", onNavigate);
    };
  }, []);

  return path;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

function AppRoutes() {
  const path = usePathname();

  if (path === "/" || path === "") return <ClassBoard />;
  if (path === "/attendance") return <Attendance />;
  if (path === "/settings") return <Settings />;
  if (path === "/present") return <ClassBoard />;

  return <NotFound />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppRoutes />
      </AuthGate>
    </AuthProvider>
  );
}
