import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { PenLine, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptResponse {
  prompts: string[];
}

interface DreamWritingPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  preferredThemes?: string[];
}

export const DreamWritingPrompts: React.FC<DreamWritingPromptsProps> = ({
  onSelectPrompt,
  preferredThemes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Create query param string if preferred themes are provided
  const themesParam =
    preferredThemes && preferredThemes.length > 0
      ? `?themes=${preferredThemes.join(",")}`
      : "";

  // Fetch writing prompts
  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<PromptResponse>({
      queryKey: ["/api/dreams/prompts", preferredThemes],
      enabled: isOpen, // Only fetch when popover is open
    });

  const handlePromptClick = (prompt: string) => {
    onSelectPrompt(prompt);
    setIsOpen(false);
    toast({
      title: "Schreibprompt verwendet",
      description:
        "Der ausgewählte Prompt wurde in dein Traumtagebuch eingefügt.",
      duration: 3000,
    });
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Prompts aktualisiert",
      description: "Neue personalisierte Schreibprompts wurden generiert.",
      duration: 3000,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex gap-2 items-center"
          type="button"
        >
          <PenLine size={16} />
          <span>Schreibprompts</span>
          <Sparkles size={16} className="text-yellow-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Personalisierte Prompts</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-8 w-8"
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin" : ""}
              />
              <span className="sr-only">Neue Prompts</span>
            </Button>
          </div>

          {preferredThemes && preferredThemes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {preferredThemes.map((theme) => (
                <Badge key={theme} variant="outline" className="text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="h-60 rounded-md border p-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isError ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <p>Fehler beim Laden der Prompts.</p>
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0"
                  onClick={() => refetch()}
                >
                  Erneut versuchen
                </Button>
              </div>
            ) : data?.prompts && data.prompts.length > 0 ? (
              <div className="space-y-2">
                {(data.prompts as string[]).map(
                  (prompt: string, index: number) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start font-normal text-sm h-auto py-2 px-3 whitespace-normal text-left"
                      onClick={() => handlePromptClick(prompt)}
                    >
                      {prompt}
                    </Button>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <p>Keine Prompts verfügbar.</p>
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0"
                  onClick={() => refetch()}
                >
                  Prompts generieren
                </Button>
              </div>
            )}
          </ScrollArea>

          <p className="text-xs text-muted-foreground mt-2">
            Wähle einen Prompt, um ihn als Inspiration für deinen Traum zu
            verwenden. Die Prompts werden basierend auf deinen bisherigen
            Träumen personalisiert.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DreamWritingPrompts;
