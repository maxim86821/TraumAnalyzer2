
import React, { useState } from "react";
import { Calendar } from "./ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Dream {
  id: number;
  title: string;
  date: string;
  tags?: string[];
}

interface DreamCalendarProps {
  dreams: Dream[];
}

export function DreamCalendar({ dreams }: DreamCalendarProps) {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Group dreams by date
  const dreamsByDate = dreams.reduce((acc, dream) => {
    const dreamDate = new Date(dream.date).toISOString().split('T')[0];
    if (!acc[dreamDate]) {
      acc[dreamDate] = [];
    }
    acc[dreamDate].push(dream);
    return acc;
  }, {} as Record<string, Dream[]>);

  // Get dreams for selected date
  const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const dreamsForSelectedDate = dreamsByDate[selectedDateStr] || [];

  // Function to determine which dates have dreams
  const isDreamDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dateStr in dreamsByDate;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Traum-Kalender</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={de}
            modifiers={{
              hasDream: isDreamDate,
            }}
            modifiersClassNames={{
              hasDream: "bg-dream-primary/20 text-dream-primary font-medium",
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {dreamsForSelectedDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Träume am {date && format(date, 'dd. MMMM yyyy', { locale: de })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dreamsForSelectedDate.map((dream) => (
                <div 
                  key={dream.id} 
                  className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/dreams/${dream.id}`)}
                >
                  <h3 className="font-medium">{dream.title}</h3>
                  {dream.tags && dream.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {dream.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-dream-secondary/10 text-dream-secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
