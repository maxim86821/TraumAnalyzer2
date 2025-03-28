import React from "react";
import Layout from "@/components/Layout";
import DreamPatternAnalysis from "@/components/DreamPatternAnalysis";

export default function DreamPatterns() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-dream-dark mb-6">
          Traummuster-Analyse
        </h1>
        <p className="text-gray-600 mb-8 max-w-3xl">
          Erkenne tiefere Muster, wiederkehrende Symbole und emotionale Trends
          in deinen Träumen über Zeit. Diese KI-gestützte Analyse identifiziert
          Zusammenhänge und Entwicklungen, die dir helfen können, ein tieferes
          Verständnis für dein Unterbewusstsein zu gewinnen.
        </p>

        <DreamPatternAnalysis />
      </div>
    </Layout>
  );
}
