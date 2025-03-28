import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

const commonTags = [
  "lucid",
  "nightmare",
  "flying",
  "falling",
  "chase",
  "water",
  "family",
  "childhood",
  "animals",
  "nature"
];

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagsInput({ tags, onChange, placeholder = "Add tag...", maxTags = 20 }: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    // Don't add duplicates or exceed max tags
    if (!tags.includes(trimmedValue) && tags.length < maxTags) {
      onChange([...tags, trimmedValue]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 100); //Small delay to prevent premature closing
  };

  const suggestedTags = commonTags.filter(tag => !tags.includes(tag) && tag.toLowerCase().startsWith(inputValue.toLowerCase()));

  return (
    <div className="w-full relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeTag(tag)}
              className="h-5 w-5 p-0 hover:bg-muted/50"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </Button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={tags.length < maxTags ? placeholder : `Maximum ${maxTags} tags reached`}
          disabled={tags.length >= maxTags}
          className="flex-grow"
        />
        {showSuggestions && (
          <div className="absolute bg-white shadow-md rounded-md mt-1 z-10">
            <ul>
              {suggestedTags.map((tag) => (
                <li key={tag} onClick={() => { setInputValue(tag); addTag(); }}>{tag}</li>
              ))}
            </ul>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={addTag}
          disabled={!inputValue.trim() || tags.length >= maxTags}
        >
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Press Enter or comma to add a tag
      </p>
    </div>
  );
}