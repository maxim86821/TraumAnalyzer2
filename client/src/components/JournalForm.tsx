import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { XIcon, PlusIcon, TagIcon, BookOpenIcon, CalendarIcon } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";
import { JournalEntry } from "@shared/schema";

interface JournalFormProps {
  existingEntry?: JournalEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function JournalForm({ existingEntry, onSuccess, onCancel }: JournalFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(existingEntry?.title || "");
  const [content, setContent] = useState(existingEntry?.content || "");
  const [tags, setTags] = useState<string[]>(existingEntry?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [mood, setMood] = useState<number | undefined>(existingEntry?.mood || undefined);
  const [date, setDate] = useState<string>(existingEntry?.date 
    ? format(new Date(existingEntry.date), 'yyyy-MM-dd') 
    : format(new Date(), 'yyyy-MM-dd')
  );
  const [isPrivate, setIsPrivate] = useState(existingEntry?.isPrivate !== false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add a new tag
  const addTag = () => {
    if (newTag.trim() !== "" && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Fehler",
        description: "Titel und Inhalt sind erforderlich",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const journalData = {
        title,
        content,
        tags,
        mood,
        date: new Date(date),
        isPrivate,
        ...(existingEntry?.relatedDreamIds ? { relatedDreamIds: existingEntry.relatedDreamIds } : {})
      };

      if (existingEntry) {
        // Update
        await apiRequest("PATCH", `/api/journal/${existingEntry.id}`, journalData);
        toast({
          title: "Erfolg",
          description: "Journaleintrag aktualisiert",
        });
      } else {
        // Create
        await apiRequest("POST", "/api/journal", journalData);
        toast({
          title: "Erfolg",
          description: "Journaleintrag erstellt",
        });
      }

      // Invalidate queries to refetch journal entries
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      
      // Reset form if not editing an existing entry
      if (!existingEntry) {
        setTitle("");
        setContent("");
        setTags([]);
        setMood(undefined);
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsPrivate(true);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern des Journaleintrags",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="journal-title" className="block text-sm font-medium text-gray-700">
              Titel
            </label>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40 h-8 text-sm"
              />
            </div>
          </div>
          <Input
            id="journal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mein Journaleintrag..."
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="journal-content" className="block text-sm font-medium text-gray-700 mb-2">
            Inhalt
          </label>
          <Textarea
            id="journal-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Schreibe deine Gedanken, Ziele oder Reflexionen..."
            className="min-h-[200px] resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TagIcon className="w-4 h-4 mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="px-2 py-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-gray-500 italic">Keine Tags</span>
              )}
            </div>
            <div className="flex">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyPress}
                placeholder="Neuer Tag..."
                className="mr-2"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stimmung (1-10)
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max="10"
                value={mood || ""}
                onChange={(e) => setMood(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="1-10"
                className="w-24"
              />
              {mood && (
                <div className={`w-5 h-5 rounded-full ${
                  mood >= 8 ? 'bg-green-500' : 
                  mood >= 6 ? 'bg-green-400' : 
                  mood >= 5 ? 'bg-yellow-300' : 
                  mood >= 3 ? 'bg-orange-400' : 
                  'bg-red-500'
                }`}></div>
              )}
              <span className="text-sm text-gray-500">
                {mood 
                  ? mood >= 8 ? 'Sehr gut' 
                    : mood >= 6 ? 'Gut' 
                    : mood >= 5 ? 'Neutral' 
                    : mood >= 3 ? 'Nicht so gut' 
                    : 'Schlecht' 
                  : 'Keine Angabe'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="journal-private"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="journal-private" className="ml-2 block text-sm text-gray-700">
            Privater Eintrag (nur für dich sichtbar)
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Speichern...
              </>
            ) : (
              <>
                <BookOpenIcon className="h-4 w-4" />
                {existingEntry ? "Aktualisieren" : "Speichern"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}