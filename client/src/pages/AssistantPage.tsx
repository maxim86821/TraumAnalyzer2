import Layout from "@/components/Layout";
import AIAssistant from "@/components/AIAssistant";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const AssistantPage = () => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
          <h1 className="text-3xl font-bold mb-4">Bitte anmelden</h1>
          <p className="mb-8 text-muted-foreground text-center max-w-md">
            Um den KI-Assistenten nutzen zu können, müssen Sie angemeldet sein.
          </p>
          <Button onClick={() => setLocation("/auth")}>
            Zur Anmeldung
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AIAssistant />
    </Layout>
  );
};

export default AssistantPage;