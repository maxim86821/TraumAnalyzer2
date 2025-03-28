import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/Layout';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  User as UserIcon, 
  Award, 
  Copy, 
  ThumbsUp, 
  Calendar, 
  Eye 
} from 'lucide-react';

// Typen für die Shared Dreams
interface SharedDream {
  id: number;
  userId: number;
  dreamId: number | null;
  title: string;
  content: string;
  imageUrl: string | null;
  tags: string[] | null;
  visibility: 'public' | 'community' | 'private';
  allowComments: boolean;
  allowInterpretations: boolean;
  viewCount: number;
  createdAt: string;
  username?: string;
}

// Typen für Dream Challenges
interface DreamChallenge {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  startDate: string;
  endDate: string;
  isActive: boolean;
  tags: string[] | null;
  createdAt: string;
}

// Typen für Dream Comments
interface DreamComment {
  id: number;
  userId: number;
  sharedDreamId: number;
  text: string;
  isInterpretation: boolean;
  likesCount: number;
  createdAt: string;
  username?: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('shared');

  // Fetch shared dreams with pagination
  const { data: publicDreams, isLoading: isLoadingPublic } = useQuery({
    queryKey: ['/api/community/dreams/public'],
    enabled: activeTab === 'shared',
  });

  // Fetch featured dreams
  const { data: featuredDreams, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['/api/community/dreams/featured'],
    enabled: activeTab === 'featured',
  });

  // Fetch active challenges
  const { data: activeChallenges, isLoading: isLoadingChallenges } = useQuery({
    queryKey: ['/api/community/challenges/active'],
    enabled: activeTab === 'challenges',
  });

  // Fetch user's shared dreams
  const { data: mySharedDreams, isLoading: isLoadingMyDreams } = useQuery({
    queryKey: ['/api/community/dreams/my'],
    enabled: activeTab === 'my-dreams' && !!user,
  });

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-2">Traum-Community</h1>
        <p className="text-muted-foreground mb-6">
          Teile deine Träume, entdecke Interpretationen und nimm an Herausforderungen teil.
        </p>

        <Tabs defaultValue="shared" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="shared">Geteilte Träume</TabsTrigger>
            <TabsTrigger value="featured">Empfohlen</TabsTrigger>
            <TabsTrigger value="challenges">Herausforderungen</TabsTrigger>
            <TabsTrigger value="my-dreams">Meine Beiträge</TabsTrigger>
          </TabsList>

          <TabsContent value="shared" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Geteilte Träume</h2>
              <Button>Teile deinen Traum</Button>
            </div>

            {isLoadingPublic ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Placeholder für geteilte Träume */}
                <SharedDreamCard 
                  dream={{
                    id: 1,
                    userId: 2,
                    dreamId: null,
                    title: 'Flug über eine fremde Stadt',
                    content: 'Ich flog über eine Stadt mit merkwürdigen Gebäuden, die wie Kristalle aussahen. Die Sonne spiegelte sich in ihnen und erzeugte ein faszinierendes Lichtspiel...',
                    imageUrl: null,
                    tags: ['fliegen', 'stadt', 'kristalle'],
                    visibility: 'public',
                    allowComments: true,
                    allowInterpretations: true,
                    viewCount: 24,
                    createdAt: '2025-03-20T14:32:00Z',
                    username: 'traumreisender'
                  }}
                  commentsCount={5}
                />
                <SharedDreamCard 
                  dream={{
                    id: 2,
                    userId: 3,
                    dreamId: null,
                    title: 'Im Labyrinth der Erinnerungen',
                    content: 'Ich befand mich in einem sich ständig verändernden Labyrinth. An jeder Ecke sah ich Szenen aus meiner Vergangenheit, aber leicht verändert...',
                    imageUrl: null,
                    tags: ['labyrinth', 'erinnerungen', 'vergangenheit'],
                    visibility: 'public',
                    allowComments: true,
                    allowInterpretations: true,
                    viewCount: 18,
                    createdAt: '2025-03-25T09:15:00Z',
                    username: 'traumdeuterNRW'
                  }}
                  commentsCount={3}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Empfohlene Traumeinträge</h2>
            
            {isLoadingFeatured ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Placeholder für empfohlene Träume */}
                <SharedDreamCard 
                  dream={{
                    id: 3,
                    userId: 4,
                    dreamId: null,
                    title: 'Die sprechenden Bäume',
                    content: 'In einem alten Wald begannen die Bäume mit mir zu sprechen. Sie erzählten Geschichten von längst vergangenen Zeiten und gaben mir Ratschläge für die Zukunft...',
                    imageUrl: null,
                    tags: ['natur', 'kommunikation', 'weisheit'],
                    visibility: 'public',
                    allowComments: true,
                    allowInterpretations: true,
                    viewCount: 42,
                    createdAt: '2025-03-15T16:20:00Z',
                    username: 'naturträumer'
                  }}
                  commentsCount={8}
                  featured={true}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Aktuelle Herausforderungen</h2>
              <Button variant="outline">Vergangene Herausforderungen</Button>
            </div>
            
            {isLoadingChallenges ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Placeholder für Herausforderungen */}
                <ChallengeCard 
                  challenge={{
                    id: 1,
                    title: 'Wochentema: Wasser',
                    description: 'Achte diese Woche besonders auf Traumsymbole, die mit Wasser zu tun haben. Teile deinen Traum und die Bedeutung, die Wasser darin hatte.',
                    imageUrl: null,
                    difficulty: 'medium',
                    startDate: '2025-03-20T00:00:00Z',
                    endDate: '2025-03-27T23:59:59Z',
                    isActive: true,
                    tags: ['wasser', 'symbolik', 'elemente'],
                    createdAt: '2025-03-19T12:00:00Z'
                  }}
                  submissionsCount={12}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-dreams" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Meine geteilten Träume</h2>
              <Button>Neuen Traum teilen</Button>
            </div>
            
            {!user ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <UserIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-center mb-4">Du musst angemeldet sein, um deine geteilten Träume zu sehen.</p>
                  <Button>Anmelden</Button>
                </CardContent>
              </Card>
            ) : isLoadingMyDreams ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Placeholder für eigene geteilte Träume */}
                <SharedDreamCard 
                  dream={{
                    id: 4,
                    userId: user.id,
                    dreamId: 10,
                    title: 'Reise zum Meeresgrund',
                    content: 'Ich konnte unter Wasser atmen und erkundete den Meeresboden. Seltsame leuchtende Wesen begleiteten mich auf meiner Reise...',
                    imageUrl: null,
                    tags: ['meer', 'unterwasser', 'entdeckung'],
                    visibility: 'public',
                    allowComments: true,
                    allowInterpretations: true,
                    viewCount: 8,
                    createdAt: '2025-03-26T22:10:00Z',
                    username: user.username
                  }}
                  commentsCount={2}
                  isOwner={true}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Komponente für die Anzeige eines geteilten Traums
function SharedDreamCard({ 
  dream, 
  commentsCount = 0, 
  featured = false,
  isOwner = false
}: { 
  dream: SharedDream, 
  commentsCount?: number,
  featured?: boolean,
  isOwner?: boolean
}) {
  return (
    <Card className={featured ? "border-primary shadow-md" : ""}>
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{dream.username?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{dream.username || 'Anonym'}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(dream.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {featured && (
              <Badge variant="secondary" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                Empfohlen
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {dream.visibility === 'public' ? 'Öffentlich' : 
               dream.visibility === 'community' ? 'Community' : 'Privat'}
            </Badge>
          </div>
        </div>
        <CardTitle className="mt-2 text-xl">{dream.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground line-clamp-3">{dream.content}</p>
        
        {dream.tags && dream.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {dream.tags.map((tag, i) => (
              <Badge variant="outline" key={i} className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {dream.viewCount}
          </div>
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            {commentsCount}
          </div>
        </div>
        <div className="flex gap-1">
          {isOwner ? (
            <Button variant="outline" size="sm">
              Bearbeiten
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                Kommentar
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Komponente für die Anzeige einer Herausforderung
function ChallengeCard({ 
  challenge, 
  submissionsCount = 0 
}: { 
  challenge: DreamChallenge, 
  submissionsCount?: number 
}) {
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{challenge.title}</CardTitle>
          <Badge variant={
            challenge.difficulty === 'easy' ? "secondary" : 
            challenge.difficulty === 'medium' ? "default" : 
            "destructive"
          }>
            {challenge.difficulty === 'easy' ? "Leicht" : 
             challenge.difficulty === 'medium' ? "Mittel" : 
             "Schwer"}
          </Badge>
        </div>
        <CardDescription>
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{challenge.description}</p>
        
        {challenge.tags && challenge.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {challenge.tags.map((tag, i) => (
              <Badge variant="outline" key={i} className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
          <span className="text-muted-foreground">
            {daysLeft > 0 
              ? `Noch ${daysLeft} Tage übrig` 
              : "Endet heute"}
          </span>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <ThumbsUp className="h-4 w-4 mr-1 text-muted-foreground" />
          <span className="text-muted-foreground">{submissionsCount} Einreichungen</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="default">Teilnehmen</Button>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}