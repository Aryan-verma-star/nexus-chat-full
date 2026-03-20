import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";
import { themes, getSavedTheme } from "./lib/themes";

const HSL_THEMES: Record<string, Record<string, string>> = {
  cyber: {
    "--background": "240 33% 4%",
    "--foreground": "240 7% 88%",
    "--primary": "153 100% 50%",
    "--primary-foreground": "240 33% 4%",
    "--secondary": "199 89% 48%",
    "--muted": "240 15% 15%",
    "--muted-foreground": "240 10% 55%",
    "--accent": "258 89% 66%",
    "--card": "240 22% 10%",
    "--card-foreground": "240 7% 88%",
    "--destructive": "344 100% 60%",
  },
  midnight: {
    "--background": "214 27% 8%",
    "--foreground": "214 9% 80%",
    "--primary": "212 100% 67%",
    "--primary-foreground": "214 27% 8%",
    "--secondary": "142 71% 45%",
    "--muted": "215 16% 14%",
    "--muted-foreground": "215 14% 55%",
    "--accent": "263 70% 71%",
    "--card": "214 20% 11%",
    "--card-foreground": "214 9% 80%",
    "--destructive": "0 72% 65%",
  },
  phantom: {
    "--background": "261 28% 7%",
    "--foreground": "252 17% 92%",
    "--primary": "263 70% 71%",
    "--primary-foreground": "261 28% 7%",
    "--secondary": "331 77% 65%",
    "--muted": "261 22% 17%",
    "--muted-foreground": "252 11% 63%",
    "--accent": "186 85% 60%",
    "--card": "261 22% 13%",
    "--card-foreground": "252 17% 92%",
    "--destructive": "350 89% 70%",
  },
};

const applyStoredTheme = () => {
  try {
    const themeName = getSavedTheme();
    const cssVars = themes[themeName];
    const hslVars = HSL_THEMES[themeName];

    if (cssVars) {
      Object.entries(cssVars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
    if (hslVars) {
      Object.entries(hslVars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }

    const stored = localStorage.getItem("nexus_appearance_prefs");
    if (stored) {
      const prefs = JSON.parse(stored);
      if (prefs.fontSize) {
        const sizes: Record<string, string> = { small: "13px", medium: "14px", large: "16px" };
        document.documentElement.style.setProperty("--font-size-base", sizes[prefs.fontSize] || "14px");
      }
      if (prefs.reducedMotion) {
        document.documentElement.style.setProperty("--transition-speed", "0s");
        document.body.classList.add("reduce-motion");
      }
    }

    if (cssVars && cssVars["--bg-primary"]) {
      document.body.style.backgroundColor = cssVars["--bg-primary"];
    }
  } catch {
    // Ignore errors
  }
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  useEffect(() => {
    applyStoredTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default AppContent;
