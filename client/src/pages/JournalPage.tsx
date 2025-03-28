import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { JournalEntry as JournalEntryType } from "@shared/schema";
import Layout from "../components/Layout";
import JournalForm from "../components/JournalForm";
import JournalEntry from "../components/JournalEntry";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusIcon, 
  BookOpenIcon, 
  SearchIcon, 
  FilterIcon, 
  XIcon, 
  CalendarIcon,
  SortAscIcon,
  TagIcon
} from "lucide-react";
import { Badge } from "../components/ui/badge";

export default function JournalPage() {
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntryType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Fetch journal entries
  const { data: journalEntries = [], isLoading, isError } = useQuery({
    queryKey: ["/api/journal"],
    queryFn: async () => {
      const response = await fetch("/api/journal");
      if (!response.ok) {
        throw new Error("Failed to fetch journal entries");
      }
      return response.json();
    },
  });

  // Function to extract all unique tags from entries
  const extractTags = () => {
    const allTags = new Set<string>();
    journalEntries.forEach((entry: JournalEntryType) => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags);
  };

  // Filter and sort entries
  const filteredEntries = journalEntries
    .filter((entry: JournalEntryType) => {
      // Text search
      const matchesSearch = searchQuery === "" || 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Tag filter
      const matchesTag = !selectedTag || 
        (entry.tags && entry.tags.includes(selectedTag));
      
      return matchesSearch && matchesTag;
    })
    .sort((a: JournalEntryType, b: JournalEntryType) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Handle edit
  const handleEdit = (entry: JournalEntryType) => {
    setEditingEntry(entry);
    setShowNewEntryForm(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center text-gray-800">
              <BookOpenIcon className="mr-2 h-6 w-6 text-primary" />
              Mein Journal
            </h1>
            
            <Button 
              onClick={() => {
                setEditingEntry(null);
                setShowNewEntryForm(true);
              }}
              className="flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              Neuer Eintrag
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Führe dein persönliches Journal für Gedanken, Ziele und tägliche Reflexionen, parallel zu deinem Traumtagebuch.
          </p>
        </header>

        {/* Search and filter bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Einträge durchsuchen..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-3 flex items-center"
                onClick={() => setSearchQuery("")}
              >
                <XIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleSortOrder}
              className="flex items-center gap-1"
            >
              <SortAscIcon className="h-4 w-4" />
              {sortOrder === "desc" ? "Neueste zuerst" : "Älteste zuerst"}
            </Button>
            
            {selectedTag && (
              <Badge className="gap-1 items-center h-9 px-3">
                <TagIcon className="h-3 w-3" />
                {selectedTag}
                <button
                  onClick={() => setSelectedTag(null)}
                  className="ml-1 text-xs opacity-70 hover:opacity-100"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {(searchQuery || selectedTag) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 h-9"
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </div>

        {/* Tag filters */}
        {extractTags().length > 0 && (
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <TagIcon className="h-3.5 w-3.5 mr-1" />
              Tags:
            </div>
            <div className="flex flex-wrap gap-2">
              {extractTags().map((tag) => (
                <Badge 
                  key={tag} 
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          // Loading state
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          // Error state
          <div className="py-8 text-center">
            <p className="text-red-500">Fehler beim Laden der Journaleinträge</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-2"
            >
              Neu laden
            </Button>
          </div>
        ) : filteredEntries.length === 0 ? (
          // No entries state
          <div className="py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            {searchQuery || selectedTag ? (
              <div>
                <p className="text-gray-500 mb-3">Keine Einträge gefunden, die deinen Filtern entsprechen.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                >
                  Filter zurücksetzen
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-3">Du hast noch keine Journaleinträge erstellt.</p>
                <Button 
                  onClick={() => {
                    setEditingEntry(null);
                    setShowNewEntryForm(true);
                  }}
                >
                  Ersten Eintrag erstellen
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Journal entries
          <div className="space-y-4">
            {filteredEntries.map((entry: JournalEntryType) => (
              <JournalEntry 
                key={entry.id} 
                entry={entry} 
                onEdit={handleEdit} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog for creating/editing journal entries */}
      <Dialog open={showNewEntryForm} onOpenChange={setShowNewEntryForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Journaleintrag bearbeiten" : "Neuer Journaleintrag"}
            </DialogTitle>
          </DialogHeader>
          <JournalForm 
            existingEntry={editingEntry || undefined} 
            onSuccess={() => {
              setShowNewEntryForm(false);
              setEditingEntry(null);
            }}
            onCancel={() => {
              setShowNewEntryForm(false);
              setEditingEntry(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}