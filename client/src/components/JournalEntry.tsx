import React, { useState } from "react";
import { JournalEntry as IJournalEntry } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  PencilIcon, 
  TrashIcon, 
  TagIcon, 
  CalendarIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  LockIcon,
  BookOpenIcon
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";

interface JournalEntryProps {
  entry: IJournalEntry;
  onEdit?: (entry: IJournalEntry) => void;
}

export default function JournalEntry({ entry, onEdit }: JournalEntryProps) {
  const { toast } = useToast();
  const [expandContent, setExpandContent] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format date
  const formattedDate = entry.date 
    ? format(new Date(entry.date), 'd. MMMM yyyy', { locale: de })
    : format(new Date(entry.createdAt), 'd. MMMM yyyy', { locale: de });

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/journal/${entry.id}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      
      toast({
        title: "Erfolg",
        description: "Journaleintrag wurde gelöscht",
      });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Journaleintrags",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Content preview
  const contentPreview = entry.content.length > 150 && !expandContent
    ? `${entry.content.substring(0, 150)}...`
    : entry.content;

  // Mood indicator
  const renderMoodIndicator = (mood: number | null | undefined) => {
    if (mood === null || mood === undefined) return null;
    
    const moodColors = [
      "bg-red-500", // 1: Sehr schlecht
      "bg-red-400", // 2
      "bg-orange-400", // 3
      "bg-orange-300", // 4
      "bg-yellow-300", // 5: Neutral
      "bg-yellow-200", // 6
      "bg-green-200", // 7
      "bg-green-300", // 8
      "bg-green-400", // 9
      "bg-green-500", // 10: Sehr gut
    ];
    
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-4 h-4 rounded-full ${moodColors[mood-1]}`}></div>
        <span className="text-xs font-medium">{mood}/10</span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <CardTitle className="flex gap-1.5 items-center">
              <BookOpenIcon className="h-4 w-4 text-gray-600" />
              {entry.title}
              {entry.isPrivate && (
                <LockIcon className="h-3.5 w-3.5 text-gray-400 ml-1" />
              )}
            </CardTitle>
            <div className="flex items-center text-sm text-gray-500 mt-1.5">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>{formattedDate}</span>
              {entry.mood && (
                <div className="ml-4">
                  {renderMoodIndicator(entry.mood)}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-1">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(entry)}
                className="h-8 w-8 p-0"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="sr-only">Bearbeiten</span>
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)} 
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="sr-only">Löschen</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-1 pb-3">
        <p className="whitespace-pre-wrap text-gray-700">
          {contentPreview}
        </p>
        
        {entry.content.length > 150 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpandContent(!expandContent)}
            className="mt-1 h-7 text-xs flex items-center px-2 text-gray-500"
          >
            {expandContent ? (
              <>
                <ChevronUpIcon className="h-3.5 w-3.5 mr-1" />
                Weniger anzeigen
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-3.5 w-3.5 mr-1" />
                Mehr anzeigen
              </>
            )}
          </Button>
        )}
      </CardContent>
      
      {entry.tags && entry.tags.length > 0 && (
        <CardFooter className="pt-0 pb-4 px-6 flex flex-wrap gap-1.5">
          <div className="flex items-center mr-1">
            <TagIcon className="h-3.5 w-3.5 text-gray-400" />
          </div>
          {entry.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600">
              {tag}
            </Badge>
          ))}
        </CardFooter>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Journaleintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du diesen Journaleintrag löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Löschen..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}