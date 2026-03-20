import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser: setAuthUser } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !displayName || !password) {
      setError("All fields are required");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.register(username, displayName, password);
      if (response.success && response.data?.user) {
        setAuthUser(response.data.user);
        navigate("/chat");
      } else {
        setError(response.error || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background scan-lines">
      <div className="grid-bg absolute inset-0" />

      <button
        onClick={() => navigate("/login")}
        className="absolute left-4 top-4 z-20 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-body text-sm">Back to login</span>
      </button>

      <div className="relative z-10 w-full max-w-[400px] px-6 animate-scale-in">
        <div className="mb-8 text-center">
          <h1 className="font-display text-[28px] font-bold text-primary glow-text tracking-wider">
            JOIN NEXUS
          </h1>
          <p className="mt-2 font-body text-xs uppercase tracking-[3px] text-muted-foreground">
            Create your account
          </p>
        </div>

        <div className="glass rounded-2xl border border-border p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Username (handle)"
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setError(""); }}
                className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 ${
                  error ? "border-destructive" : "border-border focus:border-primary"
                }`}
                autoComplete="username"
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3 3 0 11-6 0 3 3 0 016 0zM6.75 15.75a9 9 0 1118 0" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setError(""); }}
                className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 ${
                  error ? "border-destructive" : "border-border focus:border-primary"
                }`}
                autoComplete="name"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className={`w-full rounded-xl border bg-background py-3 pl-10 pr-12 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 ${
                  error ? "border-destructive" : "border-border focus:border-primary"
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 ${
                  error ? "border-destructive" : "border-border focus:border-primary"
                }`}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="font-body text-xs text-destructive animate-fade-in">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !displayName || !password || !confirmPassword}
              className="press w-full rounded-xl bg-gradient-sent py-3 font-display text-sm font-bold uppercase tracking-[2px] text-primary-foreground transition-all duration-200 hover:brightness-110 disabled:opacity-70"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
