import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CheckIcon, FileTextIcon, ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Dream {
  id: number;
  title: string;
  content: string;
  date: string;
  imageUrl?: string | null;
  analysis?: any;
}

interface DreamExportProps {
  dream: Dream;
}

export function DreamExport({ dream }: DreamExportProps) {
  const [format, setFormat] = useState<string>("markdown");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const { toast } = useToast();

  const exportDream = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Generate content based on format
      let content = "";
      let filename = `traum-${dream.id}-${new Date(dream.date).toISOString().split("T")[0]}`;
      let mimeType = "";
      let fileExtension = "";

      if (format === "markdown") {
        content = generateMarkdown();
        mimeType = "text/markdown";
        fileExtension = "md";
      } else if (format === "pdf") {
        // In a real implementation, you might want to use a PDF library
        // For this example, we'll just use markdown as placeholder
        content = generateMarkdown();
        mimeType = "text/plain";
        fileExtension = "txt";
      } else if (format === "txt") {
        content = generatePlainText();
        mimeType = "text/plain";
        fileExtension = "txt";
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      toast({
        title: "Export erfolgreich",
        description: `Dein Traum wurde als ${format.toUpperCase()} exportiert.`,
      });
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Es gab ein Problem beim Exportieren deines Traums.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      // Reset success state after 3 seconds
      setTimeout(() => setExportSuccess(false), 3000);
    }
  };

  // Helper functions to generate export content
  const generateMarkdown = () => {
    const date = new Date(dream.date).toLocaleDateString("de-DE");
    let md = `# ${dream.title}\n\n`;
    md += `**Datum:** ${date}\n\n`;
    md += `## Inhalt\n\n${dream.content}\n\n`;

    if (dream.analysis) {
      const analysis =
        typeof dream.analysis === "string"
          ? JSON.parse(dream.analysis)
          : dream.analysis;

      md += `## Analyse\n\n`;

      if (analysis.themes && analysis.themes.length > 0) {
        md += `### Themen\n\n`;
        analysis.themes.forEach((theme: string) => {
          md += `- ${theme}\n`;
        });
        md += `\n`;
      }

      if (analysis.emotions && analysis.emotions.length > 0) {
        md += `### Emotionen\n\n`;
        analysis.emotions.forEach(
          (emotion: { name: string; intensity: number }) => {
            md += `- ${emotion.name} (Intensität: ${emotion.intensity * 10}/10)\n`;
          },
        );
        md += `\n`;
      }

      if (analysis.symbols && analysis.symbols.length > 0) {
        md += `### Symbole\n\n`;
        analysis.symbols.forEach(
          (symbol: { symbol: string; meaning: string }) => {
            md += `- **${symbol.symbol}**: ${symbol.meaning}\n`;
          },
        );
        md += `\n`;
      }

      if (analysis.interpretation) {
        md += `### Interpretation\n\n${analysis.interpretation}\n\n`;
      }
    }

    return md;
  };

  const generatePlainText = () => {
    const date = new Date(dream.date).toLocaleDateString("de-DE");
    let text = `${dream.title}\n\n`;
    text += `Datum: ${date}\n\n`;
    text += `Inhalt:\n${dream.content}\n\n`;

    if (dream.analysis) {
      const analysis =
        typeof dream.analysis === "string"
          ? JSON.parse(dream.analysis)
          : dream.analysis;

      text += `Analyse:\n\n`;

      if (analysis.themes && analysis.themes.length > 0) {
        text += `Themen:\n`;
        analysis.themes.forEach((theme: string) => {
          text += `- ${theme}\n`;
        });
        text += `\n`;
      }

      if (analysis.emotions && analysis.emotions.length > 0) {
        text += `Emotionen:\n`;
        analysis.emotions.forEach(
          (emotion: { name: string; intensity: number }) => {
            text += `- ${emotion.name} (Intensität: ${emotion.intensity * 10}/10)\n`;
          },
        );
        text += `\n`;
      }

      if (analysis.interpretation) {
        text += `Interpretation:\n${analysis.interpretation}\n\n`;
      }
    }

    return text;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportiere diesen Traum</CardTitle>
        <CardDescription>
          Lade deinen Traum mit dessen Analyse in verschiedenen Formaten
          herunter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Format auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">
                <div className="flex items-center">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  <span>Markdown (.md)</span>
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  <span>PDF (.pdf)</span>
                </div>
              </SelectItem>
              <SelectItem value="txt">
                <div className="flex items-center">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  <span>Text (.txt)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={exportDream} disabled={isExporting} className="w-full">
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird exportiert...
            </>
          ) : exportSuccess ? (
            <>
              <CheckIcon className="mr-2 h-4 w-4" />
              Exportiert
            </>
          ) : (
            <>
              <FileTextIcon className="mr-2 h-4 w-4" />
              Traum exportieren
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
