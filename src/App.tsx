import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ChatProvider } from "./hooks/useChat";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";
import { applyTheme, getSavedTheme } from "./lib/themes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <ChatProvider>{children}</ChatProvider>;
};

const AppContent = () => {
  useEffect(() => {
    const saved = getSavedTheme();
    console.log('[NEXUS] App startup — applying saved theme:', saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--background');
          const computedPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary');
          const bodyBg = getComputedStyle(document.body).backgroundColor;
          console.log('[NEXUS DEBUG] ================================');
          console.log('[NEXUS DEBUG] data-theme changed to:', newTheme);
          console.log('[NEXUS DEBUG] --background computed:', computedBg);
          console.log('[NEXUS DEBUG] --primary computed:', computedPrimary);
          console.log('[NEXUS DEBUG] body backgroundColor:', bodyBg);
          console.log('[NEXUS DEBUG] ================================');
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    console.log('[NEXUS DEBUG] Initial data-theme:', document.documentElement.getAttribute('data-theme'));
    console.log('[NEXUS DEBUG] Initial --background:', getComputedStyle(document.documentElement).getPropertyValue('--background'));
    console.log('[NEXUS DEBUG] Initial body bg:', getComputedStyle(document.body).backgroundColor);

    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
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
