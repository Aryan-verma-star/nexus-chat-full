import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const THEMES = {
  cyber: {
    bgPrimary: "#0a0a0f",
    bgSecondary: "#12121a",
    accentPrimary: "#00ff88",
    accentSecondary: "#0ea5e9",
    background: "240 33% 4%",
    primary: "153 100% 50%",
  },
  midnight: {
    bgPrimary: "#0d1117",
    bgSecondary: "#161b22",
    accentPrimary: "#58a6ff",
    accentSecondary: "#3fb950",
    background: "214 27% 8%",
    primary: "212 100% 67%",
  },
  phantom: {
    bgPrimary: "#13111c",
    bgSecondary: "#1a1730",
    accentPrimary: "#a78bfa",
    accentSecondary: "#f472b6",
    background: "261 28% 7%",
    primary: "263 70% 71%",
  },
};

const applyStoredTheme = () => {
  try {
    const stored = localStorage.getItem("nexus_appearance_prefs");
    if (stored) {
      const prefs = JSON.parse(stored);
      const theme = THEMES[prefs.theme as keyof typeof THEMES];
      if (theme) {
        document.documentElement.style.setProperty("--bg-primary", theme.bgPrimary);
        document.documentElement.style.setProperty("--bg-secondary", theme.bgSecondary);
        document.documentElement.style.setProperty("--accent-primary", theme.accentPrimary);
        document.documentElement.style.setProperty("--accent-secondary", theme.accentSecondary);
        document.documentElement.style.setProperty("--background", theme.background);
        document.documentElement.style.setProperty("--primary", theme.primary);
      }

      if (prefs.fontSize) {
        const sizes = { small: "13px", medium: "14px", large: "16px" };
        document.documentElement.style.setProperty("--font-size-base", sizes[prefs.fontSize as keyof typeof sizes] || "14px");
      }

      if (prefs.reducedMotion) {
        document.documentElement.style.setProperty("--transition-speed", "0s");
        document.body.classList.add("reduce-motion");
      }
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
