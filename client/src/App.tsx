import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import NewDream from "@/pages/NewDream";
import DreamView from "@/pages/DreamView";
import DreamPatterns from "@/pages/DreamPatterns";
import AchievementsPage from "@/pages/AchievementsPage";
import CalendarView from "@/pages/CalendarView";
import JournalPage from "@/pages/JournalPage";
import SymbolLibraryPage from "@/pages/SymbolLibraryPage";
import ProfilePage from "@/pages/ProfilePage";
import DreamGalleryPage from "@/pages/DreamGalleryPage";
import CommunityPage from "@/pages/CommunityPage";
import AuthPage from "@/pages/auth-page";
import Layout from "@/components/Layout";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => (
        <Layout>
          <Home />
        </Layout>
      )} />
      <ProtectedRoute path="/new" component={() => (
        <Layout>
          <NewDream />
        </Layout>
      )} />
      <ProtectedRoute path="/dreams/:id" component={() => (
        <Layout>
          <DreamView />
        </Layout>
      )} />
      <ProtectedRoute path="/patterns" component={() => <DreamPatterns />} />
      <ProtectedRoute path="/achievements" component={() => <AchievementsPage />} />
      <ProtectedRoute path="/calendar" component={() => (
        <Layout>
          <CalendarView />
        </Layout>
      )} />
      <ProtectedRoute path="/journal" component={() => <JournalPage />} />
      <ProtectedRoute path="/symbols" component={() => <SymbolLibraryPage />} />
      <ProtectedRoute path="/gallery" component={() => (
        <Layout>
          <DreamGalleryPage />
        </Layout>
      )} />
      <ProtectedRoute path="/profile" component={() => (
        <Layout>
          <ProfilePage />
        </Layout>
      )} />
      <ProtectedRoute path="/community" component={() => <CommunityPage />} />
      <Route path="/auth" component={AuthPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
