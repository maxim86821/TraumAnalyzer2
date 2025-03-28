
import React, { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagsInput({ tags, onChange, placeholder = "Add tag...", maxTags = 20 }: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag();
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
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="w-full">
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
          placeholder={tags.length < maxTags ? placeholder : `Maximum ${maxTags} tags reached`}
          disabled={tags.length >= maxTags}
          className="flex-grow"
        />
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
