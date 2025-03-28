import React from "react";
import Layout from "@/components/Layout";
import Achievements from "@/components/Achievements";

export default function AchievementsPage() {
  return (
    <Layout>
      <div className="container mx-auto">
        <Achievements />
      </div>
    </Layout>
  );
}
