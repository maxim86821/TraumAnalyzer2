import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Dream } from "@shared/schema";
import { Button } from "@/components/ui/button";
import DreamDetail from "@/components/DreamDetail.new";
import { ArrowLeftIcon, TrashIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DreamView() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Konvertiere die ID in eine Zahl oder verwende 0 als Fallback
  const dreamId = id ? parseInt(id) : 0;
  console.log("DreamView Component - Traum-ID:", id, "Parsed ID:", dreamId);

  // Fetch the dream by ID with explicit details to ensure correct data retrieval
  const {
    data: fetchedDream,
    isLoading,
    error,
  } = useQuery<Dream>({
    queryKey: ["/api/dreams", dreamId],
    enabled: dreamId > 0, // Nur abfragen, wenn eine gültige ID vorhanden ist
    // Stelle sicher, dass die Daten frisch abgerufen werden
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 Minuten Cache (renamed from cacheTime in React Query v5)
    // Direkter API-Aufruf statt des Standard-Fetchers
    queryFn: async () => {
      // Direkter Fetch-Aufruf statt des Standard-Fetchers für mehr Kontrolle
      const response = await fetch(`/api/dreams/${dreamId}`);
      if (!response.ok) {
        throw new Error("Fehler beim Laden des Traums");
      }
      const data = await response.json();
      // Debugging Info
      console.log("Raw dream data from server:", {
        id: data?.id,
        content: data?.content
          ? data.content.substring(0, 20) + "..."
          : "No content",
        analysis: data?.analysis ? "Analysis present" : "No analysis",
        analysisType: data?.analysis ? typeof data.analysis : "undefined",
      });
      return data;
    },
  });

  // Sicherer Umgang mit Dream-Objekten und den IDs
  const dream = fetchedDream
    ? {
        ...fetchedDream,
        // Normalisiere die ID statt sie zu prüfen - wichtig: Stelle sicher, dass es immer eine positive Zahl ist
        id: Number(fetchedDream.id) || dreamId, // Verwende die ID aus dem URL-Parameter als Fallback
      }
    : null;

  console.log(
    "DreamView Component - Normalized Dream:",
    dream
      ? {
          id: dream.id,
          title: dream.title,
          idType: typeof dream.id,
        }
      : null,
  );

  // Handle dream deletion
  const handleDeleteDream = async () => {
    try {
      setIsDeleting(true);

      // Überprüfen, ob dreamId gültig ist
      if (!dreamId || dreamId <= 0) {
        throw new Error("Ungültige Traum-ID");
      }

      console.log("Deleting dream with ID:", dreamId);
      const response = await apiRequest("DELETE", `/api/dreams/${dreamId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fehler beim Löschen des Traums");
      }

      // Invalidate the dreams list to update it
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });

      toast({
        title: "Traum gelöscht",
        description: "Dein Traum wurde erfolgreich gelöscht.",
      });

      // Navigate back to home
      setLocation("/");
    } catch (error) {
      console.error("Error deleting dream:", error);
      toast({
        title: "Fehler",
        description:
          "Der Traum konnte nicht gelöscht werden: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-primary"></div>
        <p className="mt-4 text-gray-600">Traum wird geladen...</p>
      </div>
    );
  }

  if (error || !dream) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Traum nicht gefunden
        </h3>
        <p className="text-gray-500 mb-4">
          Der gesuchte Traum existiert nicht oder konnte nicht geladen werden.
        </p>
        <Button
          onClick={() => setLocation("/")}
          className="bg-dream-primary hover:bg-dream-dark text-white"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/")}
          className="flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Zurück
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Traum löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Traum wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Der Traum
                wird dauerhaft aus deinem Tagebuch entfernt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDream}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? "Wird gelöscht..." : "Traum löschen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {dream && <DreamDetail dream={dream} />}
    </div>
  );
}
