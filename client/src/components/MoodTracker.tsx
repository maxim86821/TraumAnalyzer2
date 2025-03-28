import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/use-toast";
import { apiRequest } from "../lib/api";
import { Sun, Moon, SunDim } from "lucide-react";

interface MoodTrackerProps {
  dreamId: number;
  initialMoodData?: {
    beforeSleep?: number;
    afterWakeup?: number;
    notes?: string;
  };
  onSave?: (moodData: any) => void;
}

export function MoodTracker({
  dreamId,
  initialMoodData,
  onSave,
}: MoodTrackerProps) {
  const [beforeSleepMood, setBeforeSleepMood] = useState<number>(
    initialMoodData?.beforeSleep || 5,
  );
  const [afterWakeupMood, setAfterWakeupMood] = useState<number>(
    initialMoodData?.afterWakeup || 5,
  );
  const [notes, setNotes] = useState<string>(initialMoodData?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      const moodData = {
        beforeSleep: beforeSleepMood,
        afterWakeup: afterWakeupMood,
        notes: notes,
      };

      const response = await apiRequest(
        "PATCH",
        `/api/dreams/${dreamId}/mood`,
        moodData,
      );

      toast({
        title: "Stimmung gespeichert",
        description: "Deine Stimmungsdaten wurden erfolgreich gespeichert.",
      });

      if (onSave) {
        onSave(moodData);
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Deine Stimmungsdaten konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get appropriate color class for mood value
  const getMoodColorClass = (value: number) => {
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
    return moodColors[value - 1];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Stimmungs-Tracker</CardTitle>
        <CardDescription>
          Verfolge deine Stimmung vor dem Schlafen und nach dem Aufwachen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Before Sleep Mood */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="before-sleep" className="flex items-center">
              <Moon className="h-4 w-4 mr-2" />
              Stimmung vor dem Schlafen
            </Label>
            <div
              className={`w-5 h-5 rounded-full ${getMoodColorClass(beforeSleepMood)}`}
            ></div>
          </div>
          <Slider
            id="before-sleep"
            min={1}
            max={10}
            step={1}
            value={[beforeSleepMood]}
            onValueChange={(value) => setBeforeSleepMood(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Schlecht (1)</span>
            <span>Neutral (5)</span>
            <span>Ausgezeichnet (10)</span>
          </div>
        </div>

        {/* After Wakeup Mood */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="after-wakeup" className="flex items-center">
              <Sun className="h-4 w-4 mr-2" />
              Stimmung nach dem Aufwachen
            </Label>
            <div
              className={`w-5 h-5 rounded-full ${getMoodColorClass(afterWakeupMood)}`}
            ></div>
          </div>
          <Slider
            id="after-wakeup"
            min={1}
            max={10}
            step={1}
            value={[afterWakeupMood]}
            onValueChange={(value) => setAfterWakeupMood(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Schlecht (1)</span>
            <span>Neutral (5)</span>
            <span>Ausgezeichnet (10)</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="mood-notes" className="flex items-center">
            <SunDim className="h-4 w-4 mr-2" />
            Notizen zu deiner Stimmung
          </Label>
          <Textarea
            id="mood-notes"
            placeholder="Wie hat dein Schlaf deine Stimmung beeinflusst? Hast du etwas Besonderes bemerkt?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Wird gespeichert..." : "Stimmung speichern"}
        </Button>
      </CardContent>
    </Card>
  );
}
