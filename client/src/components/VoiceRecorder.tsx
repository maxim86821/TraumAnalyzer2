import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Mic,
  Square,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "./ui/progress";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  maxDuration?: number; // Max recording duration in seconds
}

export function VoiceRecorder({
  onTranscription,
  maxDuration = 300,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionError, setTranscriptionError] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prevTime + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Aufnahme fehlgeschlagen",
        description:
          "Bitte erlaube den Zugriff auf dein Mikrofon und versuche es erneut.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Stop all tracks in the stream
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      setIsRecording(false);
      setIsPaused(false);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    stopRecording();
    setRecordingTime(0);
    setAudioUrl(null);
    audioChunksRef.current = [];
  };

  const handleTranscription = async () => {
    if (!audioUrl) return;

    setIsTranscribing(true);
    setTranscriptionError(false);

    try {
      // Create a FormData to send the audio file
      const formData = new FormData();
      const audioBlob = await fetch(audioUrl).then((r) => r.blob());
      formData.append("audio", audioBlob, "recording.webm");

      // Send the audio for transcription
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const result = await response.json();

      if (result.text) {
        onTranscription(result.text);
        toast({
          title: "Transkription erfolgreich",
          description: "Deine Aufnahme wurde erfolgreich in Text umgewandelt.",
        });
      } else {
        throw new Error("No transcription text returned");
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      setTranscriptionError(true);
      toast({
        title: "Transkription fehlgeschlagen",
        description: "Die Aufnahme konnte nicht in Text umgewandelt werden.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traumaufnahme</CardTitle>
        <CardDescription>
          Nimm deinen Traum auf und wandle ihn in Text um
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording timer and progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {isRecording
                ? isPaused
                  ? "Pausiert"
                  : "Aufnahme läuft..."
                : "Bereit"}
            </span>
            <span className="text-sm font-medium">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
          <Progress
            value={(recordingTime / maxDuration) * 100}
            className="h-2"
          />
        </div>

        {/* Audio player if recording is completed */}
        {audioUrl && (
          <div className="pt-2">
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between flex-wrap gap-2">
        {!isRecording && !audioUrl && (
          <Button onClick={startRecording} className="flex-1">
            <Mic className="mr-2 h-4 w-4" />
            Aufnahme starten
          </Button>
        )}

        {isRecording && (
          <>
            {isPaused ? (
              <Button
                onClick={resumeRecording}
                variant="outline"
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Fortsetzen
              </Button>
            ) : (
              <Button
                onClick={pauseRecording}
                variant="outline"
                className="flex-1"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pausieren
              </Button>
            )}

            <Button
              onClick={stopRecording}
              variant="secondary"
              className="flex-1"
            >
              <Square className="mr-2 h-4 w-4" />
              Aufnahme beenden
            </Button>
          </>
        )}

        {audioUrl && (
          <>
            <Button
              onClick={handleTranscription}
              disabled={isTranscribing}
              className="flex-1"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transkribiere...
                </>
              ) : transcriptionError ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Erneut versuchen
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  In Text umwandeln
                </>
              )}
            </Button>

            <Button
              onClick={resetRecording}
              variant="outline"
              className="flex-1"
            >
              Neue Aufnahme
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
