import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, Image, Clock, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast'; // Assuming a toast component exists
import { apiRequest } from '@/lib/api'; // Assuming an apiRequest function exists


// Gallery view types
type ViewMode = 'grid' | 'masonry' | 'carousel';
type SortOption = 'recent' | 'oldest' | 'emotional' | 'popular';
type FilterCriteria = { 
  searchTerm?: string;
  tags?: string[];
  timeRange?: string;
};

interface ShareSettings {
  isPublic: boolean;
  allowComments: boolean;
  allowInterpretations: boolean;
  anonymousShare: boolean;
}

export default function DreamGalleryPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]); 
  const [availableTags, setAvailableTags] = useState<string[]>([]); 
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    allowComments: true,
    allowInterpretations: true,
    anonymousShare: false
  });

  // Fetch dreams
  const { data: dreams, isLoading, error } = useQuery({
    queryKey: ['/api/dreams', user?.id],
    enabled: !!user,
  });

  // Apply filters and sorting to dream data
  const dreamsArray = Array.isArray(dreams) ? dreams : [];
  const filteredDreams = filterDreams(dreamsArray, filters, selectedTags); 
  const sortedDreams = sortDreams(filteredDreams, sortBy);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Update filters when search term changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, searchTerm }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle tag filter change
  const handleTagFilterChange = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setFilters(prev => ({ ...prev, tags: selectedTags }));
  };

    // Extract unique tags from all dreams for filtering
  useEffect(() => {
    if (dreams?.length > 0) {
      const allTags = new Set<string>();
      dreams.forEach((dream: any) => {
        if (dream.tags && Array.isArray(dream.tags)) {
          dream.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      setAvailableTags(Array.from(allTags));
    }
  }, [dreams]);


  // Handle time range filter change
  const handleTimeRangeChange = (timeRange: string) => {
    setFilters(prev => ({ ...prev, timeRange }));
  };

  const handleShareDream = async (dreamId: number) => {
    try {
      await apiRequest('POST', `/api/community/dreams`, {
        dreamId,
        ...shareSettings
      });
      toast({
        title: 'Erfolg',
        description: 'Traum wurde erfolgreich geteilt',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Teilen des Traums',
        variant: 'destructive'
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-8 mx-auto text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Dream Gallery</h1>
        <p className="mb-4">There was a problem loading your dreams.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // Empty state
  if (!sortedDreams.length) {
    return (
      <div className="container py-8 mx-auto text-center">
        <h1 className="text-2xl font-bold mb-6">Dream Visualization Gallery</h1>
        <Card className="p-8 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">No Dreams Found</h2>
          <p className="text-muted-foreground mb-6">
            {filters.searchTerm || filters.tags?.length || filters.timeRange
              ? "No dreams match your current filters. Try adjusting your search criteria."
              : "You haven't recorded any dreams with visualizations yet."}
          </p>
          <Link href="/dreams/new">
            <Button>Record Your First Dream</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dream Visualization Gallery</h1>

      {/* Filters and controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dreams by content, title, or symbols..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="min-w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="emotional">Most Emotional</SelectItem>
                <SelectItem value="popular">Most Viewed</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={handleTimeRangeChange} defaultValue="all">
              <SelectTrigger className="min-w-[140px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Tag filter */}
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Button key={tag} onClick={() => handleTagFilterChange(tag)} className={`border border-gray-300 px-3 py-1 rounded-md ${selectedTags.includes(tag) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* View mode selection */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="mb-6">
        <TabsList>
          <TabsTrigger value="grid">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Grid View</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="masonry">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Masonry</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="carousel">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Carousel</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Grid View */}
        <TabsContent value="grid" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedDreams.map((dream, index) => (
              <DreamVisualizationCard 
                key={dream.id} 
                dream={dream} 
                index={index}
                viewMode={viewMode}
                onShare={() => handleShareDream(dream.id)} // Added onShare prop
              />
            ))}
          </div>
        </TabsContent>

        {/* Masonry View */}
        <TabsContent value="masonry" className="mt-4">
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {sortedDreams.map((dream, index) => (
              <div key={dream.id} className="break-inside-avoid">
                <DreamVisualizationCard 
                  dream={dream} 
                  index={index}
                  viewMode={viewMode}
                  onShare={() => handleShareDream(dream.id)} // Added onShare prop
                />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Carousel View */}
        <TabsContent value="carousel" className="mt-4">
          <div className="flex overflow-x-auto pb-4 snap-x snap-mandatory gap-4">
            {sortedDreams.map((dream, index) => (
              <div key={dream.id} className="snap-start min-w-[300px] max-w-[400px]">
                <DreamVisualizationCard 
                  dream={dream} 
                  index={index}
                  viewMode={viewMode}
                  onShare={() => handleShareDream(dream.id)} // Added onShare prop
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Dream visualization card component
function DreamVisualizationCard({ dream, index, viewMode, onShare }: { dream: any, index: number, viewMode: ViewMode, onShare: () => void }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
      }
    })
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      className={`h-full ${viewMode === 'masonry' ? 'mb-4' : ''}`}
    >
      <Link href={`/dreams/${dream.id}`}>
        <Card className="overflow-hidden h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          {dream.imageUrl && (
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={dream.imageUrl} 
                alt={dream.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-2 left-3 text-white text-sm font-medium drop-shadow-lg">
                {new Date(dream.date || dream.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{dream.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{dream.content}</p>

            {dream.tags && dream.tags.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1">
                {dream.tags.slice(0, 3).map((tag: string) => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {dream.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                    +{dream.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          <Button onClick={onShare} className="mt-2">Share</Button> {/* Added share button */}
        </Card>
      </Link>
    </motion.div>
  );
}

// Helper function to filter dreams based on criteria
function filterDreams(dreams: any[], criteria: FilterCriteria, selectedTags: string[]): any[] {
  return dreams.filter(dream => {
    // Filter out dreams without images
    if (!dream.imageUrl) return false;

    // Apply search term filter
    if (criteria.searchTerm) {
      const searchTermLower = criteria.searchTerm.toLowerCase();
      const titleMatch = dream.title?.toLowerCase().includes(searchTermLower);
      const contentMatch = dream.content?.toLowerCase().includes(searchTermLower);
      const tagMatch = dream.tags?.some((tag: string) => tag.toLowerCase().includes(searchTermLower));

      if (!titleMatch && !contentMatch && !tagMatch) return false;
    }

    // Apply tag filter
    if (selectedTags && selectedTags.length > 0) { 
      if (!dream.tags || !selectedTags.every(tag => dream.tags.includes(tag))) {
        return false;
      }
    }

    // Apply time range filter
    if (criteria.timeRange && criteria.timeRange !== 'all') {
      const dreamDate = new Date(dream.date || dream.createdAt);
      const now = new Date();

      switch (criteria.timeRange) {
        case 'week':
          if (now.getTime() - dreamDate.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
          break;
        case 'month':
          if (now.getTime() - dreamDate.getTime() > 30 * 24 * 60 * 60 * 1000) return false;
          break;
        case 'year':
          if (now.getTime() - dreamDate.getTime() > 365 * 24 * 60 * 60 * 1000) return false;
          break;
      }
    }

    return true;
  });
}

// Helper function to sort dreams
function sortDreams(dreams: any[], sortOption: SortOption): any[] {
  const dreamsToSort = [...dreams];

  switch (sortOption) {
    case 'recent':
      return dreamsToSort.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    case 'oldest':
      return dreamsToSort.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });
    case 'emotional':
      return dreamsToSort.sort((a, b) => {
        // Sort by emotional intensity if available in the analysis
        const emotionalScoreA = getEmotionalScore(a);
        const emotionalScoreB = getEmotionalScore(b);
        return emotionalScoreB - emotionalScoreA;
      });
    case 'popular':
      // This would ideally use view counts if that feature is implemented
      return dreamsToSort;
    default:
      return dreamsToSort;
  }
}

// Helper function to calculate emotional score from dream analysis
function getEmotionalScore(dream: any): number {
  if (!dream.analysis) return 0;

  try {
    // If analysis is stored as a string, parse it
    const analysis = typeof dream.analysis === 'string' 
      ? JSON.parse(dream.analysis) 
      : dream.analysis;

    // If there are emotions with intensity, calculate average intensity
    if (analysis.emotions && Array.isArray(analysis.emotions)) {
      const emotionIntensities = analysis.emotions
        .map((emotion: any) => emotion.intensity || 0);

      if (emotionIntensities.length) {
        return emotionIntensities.reduce((a: number, b: number) => a + b, 0) / emotionIntensities.length;
      }
    }
  } catch (e) {
    // If parsing fails, return 0
    console.error('Error parsing dream analysis:', e);
  }

  return 0;
}