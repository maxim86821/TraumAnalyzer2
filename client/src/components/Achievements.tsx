import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Award,
  Book,
  Brain,
  Calendar,
  CheckCircle,
  FileText,
  Image,
  Moon,
  Smile,
  Star,
  Tags,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AchievementCategory, AchievementDifficulty } from "@shared/schema";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  iconName: string;
  criteria: {
    type: string;
    threshold: number;
    additionalParams?: Record<string, any>;
  };
  createdAt: string;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  progress: {
    currentValue: number;
    requiredValue: number;
    lastUpdated: string;
    details?: Record<string, any>;
  };
  isCompleted: boolean;
  unlockedAt: string;
  achievement?: Achievement;
}

interface AchievementNotification {
  achievementId: number;
  achievementName: string;
  achievementDescription: string;
  iconName: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  timestamp: string;
}

export default function Achievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAchievements, setNewAchievements] = useState<
    AchievementNotification[]
  >([]);

  // Lade alle Achievements
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/achievements");
      return response.json();
    },
    enabled: !!user,
  });

  // Lade Benutzer-Achievements
  const { data: userAchievements } = useQuery<UserAchievement[]>({
    queryKey: ["/api/achievements/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/achievements/user");
      return response.json();
    },
    enabled: !!user,
  });

  // Überprüfe auf neue Achievements
  const checkAchievementsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/achievements/check");
      return response.json();
    },
    onSuccess: (data) => {
      // Aktualisiere die lokalen Daten
      queryClient.invalidateQueries({
        queryKey: ["/api/achievements/user"],
      });

      // Zeige Benachrichtigungen für neue Achievements
      if (data.newAchievements.length > 0) {
        setNewAchievements(data.newAchievements);

        // Zeige Toast für jedes neue Achievement
        data.newAchievements.forEach((achievement: AchievementNotification) => {
          toast({
            title: `Neuer Erfolg: ${achievement.achievementName}`,
            description: achievement.achievementDescription,
            duration: 5000,
          });
        });
      }
    },
    onError: (error) => {
      console.error("Fehler beim Überprüfen der Achievements:", error);
      toast({
        title: "Fehler",
        description: "Die Achievements konnten nicht überprüft werden.",
        variant: "destructive",
      });
    },
  });

  // Achievements beim Laden der Komponente überprüfen
  useEffect(() => {
    if (user) {
      checkAchievementsMutation.mutate();
    }
  }, [user]);

  // Render-Hilfsfunktionen
  const getIconForAchievement = (iconName: string) => {
    switch (iconName) {
      case "moon":
        return <Moon className="h-6 w-6" />;
      case "book":
        return <Book className="h-6 w-6" />;
      case "calendar-check":
        return <Calendar className="h-6 w-6" />;
      case "award":
        return <Award className="h-6 w-6" />;
      case "tags":
        return <Tags className="h-6 w-6" />;
      case "image":
        return <Image className="h-6 w-6" />;
      case "smile":
        return <Smile className="h-6 w-6" />;
      case "brain":
        return <Brain className="h-6 w-6" />;
      case "trophy":
        return <Trophy className="h-6 w-6" />;
      case "file-text":
        return <FileText className="h-6 w-6" />;
      case "star":
        return <Star className="h-6 w-6" />;
      case "check":
        return <CheckCircle className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  const getCategoryName = (category: AchievementCategory): string => {
    switch (category) {
      case "beginner":
        return "Anfänger";
      case "consistency":
        return "Konsequenz";
      case "exploration":
        return "Erkundung";
      case "insight":
        return "Einsicht";
      case "mastery":
        return "Meisterschaft";
      case "special":
        return "Speziell";
      default:
        return category;
    }
  };

  const getDifficultyColor = (difficulty: AchievementDifficulty): string => {
    switch (difficulty) {
      case "bronze":
        return "bg-amber-700";
      case "silver":
        return "bg-slate-400";
      case "gold":
        return "bg-yellow-400";
      case "platinum":
        return "bg-cyan-300";
      default:
        return "bg-gray-500";
    }
  };

  // Gruppiere Achievements nach Kategorie
  const groupedAchievements = React.useMemo(() => {
    if (!achievements) return {};

    const grouped: Record<string, Achievement[]> = {};

    achievements.forEach((achievement) => {
      if (!grouped[achievement.category]) {
        grouped[achievement.category] = [];
      }
      grouped[achievement.category].push(achievement);
    });

    return grouped;
  }, [achievements]);

  // Finde Benutzer-Achievement zu einem Achievement
  const findUserAchievement = (achievementId: number) => {
    if (!userAchievements) return undefined;
    return userAchievements.find((ua) => ua.achievementId === achievementId);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Erfolge</h1>
        <Button
          onClick={() => checkAchievementsMutation.mutate()}
          disabled={checkAchievementsMutation.isPending}
        >
          Erfolge aktualisieren
        </Button>
      </div>

      {/* Neue Achievements-Benachrichtigungen */}
      {newAchievements.length > 0 && (
        <div className="mb-8 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            Neue Erfolge freigeschaltet!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newAchievements.map((achievement) => (
              <div
                key={achievement.achievementId}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm"
              >
                <div
                  className={`p-2 rounded-full ${getDifficultyColor(achievement.difficulty)}`}
                >
                  {getIconForAchievement(achievement.iconName)}
                </div>
                <div>
                  <h3 className="font-bold">{achievement.achievementName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {achievement.achievementDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setNewAchievements([])}
          >
            Schließen
          </Button>
        </div>
      )}

      {/* Achievement-Kategorien */}
      {Object.entries(groupedAchievements).map(
        ([category, categoryAchievements]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {getCategoryName(category as AchievementCategory)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement) => {
                const userAchievement = findUserAchievement(achievement.id);
                const progress = userAchievement?.progress.currentValue || 0;
                const required = achievement.criteria.threshold;
                const progressPercent = Math.min(
                  100,
                  Math.round((progress / required) * 100),
                );
                const isCompleted = userAchievement?.isCompleted || false;

                return (
                  <Card
                    key={achievement.id}
                    className={`overflow-hidden ${isCompleted ? "border-green-500" : ""}`}
                  >
                    <CardHeader
                      className={`relative ${isCompleted ? "bg-green-50 dark:bg-green-900/30" : ""}`}
                    >
                      {isCompleted && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-3 rounded-full ${getDifficultyColor(achievement.difficulty)}`}
                        >
                          {getIconForAchievement(achievement.iconName)}
                        </div>
                        <div>
                          <CardTitle>{achievement.name}</CardTitle>
                          <CardDescription>
                            <Badge className="mt-1" variant="outline">
                              {getCategoryName(achievement.category)}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm mb-4">{achievement.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Fortschritt</span>
                          <span>
                            {progress} / {required}
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 dark:bg-gray-800/50 pt-3 pb-3 text-xs text-gray-500">
                      {isCompleted && userAchievement && (
                        <span>
                          Erreicht am{" "}
                          {new Date(
                            userAchievement.unlockedAt,
                          ).toLocaleDateString("de-DE")}
                        </span>
                      )}
                      {(!isCompleted || !userAchievement) && (
                        <span>In Bearbeitung</span>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        ),
      )}

      {Object.keys(groupedAchievements).length === 0 && (
        <div className="text-center p-12">
          <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">
            Keine Erfolge verfügbar
          </h3>
          <p className="text-gray-500">Schaue später noch einmal nach.</p>
        </div>
      )}
    </div>
  );
}
