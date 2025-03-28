import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDreamSchema, InsertDream } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { CalendarIcon, PlusIcon, TagIcon, XIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";

export default function DreamForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // Initialize the form with default values
  const form = useForm<InsertDream>({
    resolver: zodResolver(insertDreamSchema),
    defaultValues: {
      title: "",
      content: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Das Bild darf maximal 10MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove image preview
  const removeImage = () => {
    setImagePreview(null);
  };
  
  // Add a tag
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle tag input keydown events
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Submit the form
  const onSubmit = async (data: InsertDream) => {
    try {
      setIsSubmitting(true);
      
      // Add the image as base64 if available
      let submitData = imagePreview 
        ? { ...data, imageBase64: imagePreview } 
        : data;
      
      // Add tags if available
      if (tags.length > 0) {
        submitData = { ...submitData, tags };
      }
      
      // Send the dream data to the server
      const response = await apiRequest('POST', '/api/dreams', submitData);
      const newDream = await response.json();
      
      // Invalidate the dreams query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/dreams'] });
      
      // Show success message
      toast({
        title: "Traum gespeichert",
        description: "Dein Traum wurde erfolgreich gespeichert und wird analysiert.",
      });
      
      // Navigate to the dream detail page
      setLocation(`/dreams/${newDream.id}`);
    } catch (error) {
      console.error("Error creating dream:", error);
      toast({
        title: "Fehler",
        description: "Der Traum konnte nicht gespeichert werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-gray-800">Neuen Traum erfassen</h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Traumtitel</FormLabel>
                  <FormControl>
                    <Input placeholder="Gib deinem Traum einen Titel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Datum</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Wähle ein Datum</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trauminhalt</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Beschreibe deinen Traum so detailliert wie möglich..." 
                      className="min-h-[200px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Gib so viele Details wie möglich an, damit die KI-Analyse genauer sein kann.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block mb-2">Traumvisualisierung (optional)</FormLabel>
              {imagePreview ? (
                <div className="relative mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Vorschau" 
                    className="w-full max-h-56 object-cover rounded-md" 
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 bg-white opacity-90 hover:opacity-100"
                    onClick={removeImage}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-dream-primary hover:text-dream-dark focus-within:outline-none">
                        <span>Bild hochladen</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="pl-1">oder per Drag & Drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF bis zu 10MB</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <FormLabel className="block mb-2">Tags hinzufügen (optional)</FormLabel>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Tag eingeben und Enter drücken..."
                    className="flex-grow"
                  />
                  <Button 
                    type="button" 
                    onClick={addTag}
                    variant="outline"
                    className="shrink-0"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="px-3 py-1">
                      <span className="flex items-center gap-1">
                        <TagIcon className="h-3 w-3" />
                        {tag}
                        <XIcon 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </span>
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <div className="text-sm text-muted-foreground italic">
                      Keine Tags hinzugefügt. Gute Tags könnten sein: "alptraum", "luzid", "wiederkehrend", "fliegend", etc.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <Button 
                type="button" 
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setLocation("/")}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit"
                className="bg-dream-primary hover:bg-dream-dark text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Wird gespeichert...
                  </>
                ) : (
                  'Traum speichern & analysieren'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
