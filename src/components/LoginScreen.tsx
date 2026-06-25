import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const { login, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const err = await login(email, password);
      if (err) setError(err.message);
    } else {
      const err = await signUp(email, password);
      if (err) {
        setError(err.message);
      } else {
        setSignedUp(true);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-3xl font-extrabold">ChoicePath</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Preschool behavior tracker
          </p>
        </div>

        {signedUp ? (
          <div className="bg-card border-2 rounded-2xl p-6 text-center space-y-3">
            <div className="text-3xl">📧</div>
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <strong>{email}</strong>. Click it
              to verify your account, then sign in.
            </p>
            <button
              onClick={() => {
                setSignedUp(false);
                setMode("login");
              }}
              className="text-sm text-primary underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-card border-2 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-xl font-bold">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="teacher@school.com"
                  className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-lg disabled:opacity-60 transition-opacity"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <div className="text-center text-sm">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="text-primary font-semibold underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="text-primary font-semibold underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
