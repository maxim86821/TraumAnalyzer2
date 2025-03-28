import { Dream } from "@shared/schema";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { TagIcon } from "lucide-react";

interface DreamCardProps {
  dream: Dream;
}

export default function DreamCard({ dream }: DreamCardProps) {
  // Parse the analysis JSON if it exists
  const analysis = dream.analysis ? JSON.parse(dream.analysis) : null;

  // Use user-defined tags or get the first 3 themes from the analysis
  const userTags = dream.tags || [];
  const themes =
    userTags.length > 0 ? userTags : analysis?.themes?.slice(0, 3) || [];

  // Format date in German
  const formattedDate = format(new Date(dream.date), "d. MMM yyyy", {
    locale: de,
  });

  // Truncate content for preview (100 characters)
  const previewText =
    dream.content.length > 100
      ? `${dream.content.substring(0, 100)}...`
      : dream.content;

  return (
    <Link href={`/dreams/${dream.id}`}>
      <Card className="overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer">
        <div className="h-40 bg-gray-200 overflow-hidden relative">
          {dream.imageUrl ? (
            <img
              src={dream.imageUrl}
              alt="Traumdarstellung"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dream-light text-dream-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
                />
              </svg>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white rounded-full p-1 shadow-sm">
            <p className="text-xs font-medium text-gray-600 px-2">
              {formattedDate}
            </p>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-serif font-bold text-lg text-gray-800">
            {dream.title}
          </h3>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {previewText}
          </p>

          {themes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {themes.map((theme: string, index: number) => {
                // Different styling for user tags vs AI themes
                const isUserTag = userTags.includes(theme);

                if (isUserTag) {
                  return (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      <span className="flex items-center gap-1">
                        <TagIcon className="h-3 w-3" />
                        {theme}
                      </span>
                    </Badge>
                  );
                } else {
                  // Different background colors for variety
                  const colorClasses = [
                    "bg-dream-light text-dream-primary",
                    "bg-blue-50 text-blue-600",
                    "bg-yellow-50 text-yellow-600",
                    "bg-green-50 text-green-600",
                    "bg-purple-50 text-purple-600",
                  ];
                  const colorClass = colorClasses[index % colorClasses.length];

                  return (
                    <span
                      key={index}
                      className={`inline-block ${colorClass} text-xs px-2 py-1 rounded-full font-medium`}
                    >
                      {theme}
                    </span>
                  );
                }
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
