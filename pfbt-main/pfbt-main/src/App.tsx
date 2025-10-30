import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<AuthGuard><DashboardLayout><Dashboard /></DashboardLayout></AuthGuard>} />
          <Route path="/transactions" element={<AuthGuard><DashboardLayout><Transactions /></DashboardLayout></AuthGuard>} />
          <Route path="/categories" element={<AuthGuard><DashboardLayout><Categories /></DashboardLayout></AuthGuard>} />
          <Route path="/reviews" element={<AuthGuard><DashboardLayout><Reviews /></DashboardLayout></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><DashboardLayout><Settings /></DashboardLayout></AuthGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
