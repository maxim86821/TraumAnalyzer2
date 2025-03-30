import React from "react";
import Layout from "@/components/Layout";
import AIAssistant from "@/components/AIAssistant";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const AssistantPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl mb-4">
            Please log in to access the AI Assistant
          </h1>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </Layout>
    );
  }
  console.log('Debug: User is authenticated and accessing the AssistantPage.');

  return (
    <Layout>
      <AIAssistant />
    </Layout>
  );
};

export default AssistantPage;
