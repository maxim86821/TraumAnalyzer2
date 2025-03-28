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
import { CalendarIcon, PlusIcon, TagIcon, XIcon, SunIcon, MoonIcon, CloudIcon, CloudRainIcon, CloudSunIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import DreamWritingPrompts from "./DreamWritingPrompts";
import { MicIcon, StopIcon } from "lucide-react";
import { useVoiceRecording } from "../hooks/use-voice-recording";
// Placeholder component -  Replace with actual implementation
const TagsInput = ({ tags, onChange, placeholder, maxTags }) => {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeTag(tag)}
              className="h-5 w-5 p-0 hover:bg-muted/50"
            >
              <XIcon className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </Button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={addTag}>
          Add
        </Button>
      </div>
    </div>
  );
};


export default function DreamForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const { isRecording, startRecording, stopRecording, audioURL } = useVoiceRecording();


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
      const response = await apiRequest("POST", "/api/dreams", submitData);
      const newDream = await response.json();

      // Invalidate the dreams query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });

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
                  <div className="flex justify-between items-center">
                    <FormLabel>Trauminhalt</FormLabel>
                    <DreamWritingPrompts
                      onSelectPrompt={(prompt) => {
                        const currentValue = field.value || "";
                        field.onChange(currentValue ? `${currentValue}\n\n${prompt}` : prompt);
                      }}
                      preferredThemes={tags.length > 0 ? tags : undefined}
                    />
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreibe deinen Traum so detailliert wie möglich..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Gib so viele Details wie möglich an, damit die KI-Analyse genauer sein kann.
                    Nutze die Schreibprompts für Inspiration.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block mb-2">Traumvisualisierung (optional)</FormLabel>
              {imagePreview ? (
                <div className="relative mt-2">
                  <img src={imagePreview} alt="Vorschau" className="w-full max-h-56 object-cover rounded-md" />
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
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
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

            <div className="space-y-6">
              <div>
                <FormLabel className="block mb-2">Tags hinzufügen (optional)</FormLabel>
                <TagsInput tags={tags} onChange={setTags} placeholder="Add a tag..." maxTags={10} />
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-medium text-lg mb-4">Stimmungstracking</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="moodBeforeSleep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MoonIcon className="h-4 w-4 text-indigo-600" />
                          Stimmung vor dem Schlafen
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="flex justify-between gap-1 mt-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                <Button
                                  key={value}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={`w-9 h-9 p-0 flex items-center justify-center rounded-full ${
                                    field.value === value
                                      ? value <= 3
                                        ? "bg-red-100 border-red-400 text-red-600"
                                        : value <= 7
                                        ? "bg-amber-100 border-amber-400 text-amber-600"
                                        : "bg-green-100 border-green-400 text-green-600"
                                      : ""
                                  }`}
                                  onClick={() => field.onChange(value)}
                                >
                                  {value <= 3 && field.value === value && (
                                    <CloudRainIcon className="h-4 w-4" />
                                  )}
                                  {value > 3 && value <= 7 && field.value === value && (
                                    <CloudIcon className="h-4 w-4" />
                                  )}
                                  {value > 7 && field.value === value && (
                                    <CloudSunIcon className="h-4 w-4" />
                                  )}
                                  {field.value !== value && value}
                                </Button>
                              ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 px-1">
                              <span className="flex items-center gap-1 text-red-600">
                                <CloudRainIcon className="h-3 w-3" /> Schlecht (1-3)
                              </span>
                              <span className="flex items-center gap-1 text-amber-600">
                                <CloudIcon className="h-3 w-3" /> Neutral (4-7)
                              </span>
                              <span className="flex items-center gap-1 text-green-600">
                                <CloudSunIcon className="h-3 w-3" /> Gut (8-10)
                              </span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Wie hast du dich vor dem Einschlafen gefühlt?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="moodAfterWakeup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SunIcon className="h-4 w-4 text-amber-500" />
                          Stimmung nach dem Aufwachen
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="flex justify-between gap-1 mt-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                <Button
                                  key={value}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={`w-9 h-9 p-0 flex items-center justify-center rounded-full ${
                                    field.value === value
                                      ? value <= 3
                                        ? "bg-red-100 border-red-400 text-red-600"
                                        : value <= 7
                                        ? "bg-amber-100 border-amber-400 text-amber-600"
                                        : "bg-green-100 border-green-400 text-green-600"
                                      : ""
                                  }`}
                                  onClick={() => field.onChange(value)}
                                >
                                  {value <= 3 && field.value === value && (
                                    <CloudRainIcon className="h-4 w-4" />
                                  )}
                                  {value > 3 && value <= 7 && field.value === value && (
                                    <CloudIcon className="h-4 w-4" />
                                  )}
                                  {value > 7 && field.value === value && (
                                    <SunIcon className="h-4 w-4" />
                                  )}
                                  {field.value !== value && value}
                                </Button>
                              ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 px-1">
                              <span className="flex items-center gap-1 text-red-600">
                                <CloudRainIcon className="h-3 w-3" /> Schlecht (1-3)
                              </span>
                              <span className="flex items-center gap-1 text-amber-600">
                                <CloudIcon className="h-3 w-3" /> Neutral (4-7)
                              </span>
                              <span className="flex items-center gap-1 text-green-600">
                                <SunIcon className="h-3 w-3" /> Gut (8-10)
                              </span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Wie hast du dich nach dem Aufwachen gefühlt?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="moodNotes"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Stimmungsnotizen (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notizen zu deiner Stimmung oder Faktoren, die sie beeinflusst haben könnten..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Z.B. Stress, besondere Ereignisse, Medikation, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <Button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? <StopIcon /> : <MicIcon />}
              </Button>
              {audioURL && <audio controls src={audioURL} />}
            </div>

            {/* Hervorgehobener Speichern-Button */}
            <div className="flex flex-col space-y-4 mt-12">
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-dream-primary to-dream-dark hover:from-dream-dark hover:to-dream-primary text-white text-lg py-6 px-8 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 w-full max-w-md flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-3 border-current border-t-transparent"></div>
                      <span className="font-medium">Wird gespeichert...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Traum speichern & analysieren</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setLocation("/")}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}