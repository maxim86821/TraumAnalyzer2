import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, ArrowLeft, Plus, Archive, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types for our component
interface Conversation {
  id: number;
  userId: number;
  title: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

interface Message {
  id: number;
  conversationId: number;
  content: string;
  role: string;
  timestamp: Date;
  relatedDreamId: number | null;
  relatedJournalId: number | null;
  metadata: any | null;
}

interface ChatRequest {
  conversationId?: number;
  message: string;
  relatedDreamId?: number;
  relatedJournalId?: number;
}

interface ChatResponse {
  conversationId: number;
  message: Message;
  relatedContent?: any;
}

interface RelatedContentProps {
  type: 'dream' | 'journal' | null;
  id: number | null;
  onChange: (type: 'dream' | 'journal' | null, id: number | null) => void;
}

// Component to select related content (dream or journal entry)
const RelatedContentSelector: React.FC<RelatedContentProps> = ({ type, id, onChange }) => {
  const { user } = useAuth();
  
  // Fetch user's dreams for the dropdown
  const { data: dreams } = useQuery({
    queryKey: ['/api/dreams'],
    enabled: !!user,
  });
  
  // Fetch user's journal entries for the dropdown
  const { data: journalEntries } = useQuery({
    queryKey: ['/api/journal'],
    enabled: !!user,
  });
  
  const handleTypeChange = (newType: string) => {
    onChange(newType as 'dream' | 'journal' | null, null);
  };
  
  const handleContentChange = (contentId: string) => {
    onChange(type, parseInt(contentId));
  };
  
  return (
    <div className="flex items-center gap-2 mb-4">
      <Select value={type || 'none'} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Inhalt auswählen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Keiner</SelectItem>
          <SelectItem value="dream">Traum</SelectItem>
          <SelectItem value="journal">Tagebucheintrag</SelectItem>
        </SelectContent>
      </Select>
      
      {type && (
        <Select value={id?.toString() || ''} onValueChange={handleContentChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder={type === 'dream' ? "Traum auswählen" : "Eintrag auswählen"} />
          </SelectTrigger>
          <SelectContent>
            {type === 'dream' && dreams && dreams.map((dream: any) => (
              <SelectItem key={dream.id} value={dream.id.toString()}>
                {dream.title}
              </SelectItem>
            ))}
            {type === 'journal' && journalEntries && journalEntries.map((entry: any) => (
              <SelectItem key={entry.id} value={entry.id.toString()}>
                {entry.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

// Main AI Assistant component
const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [relatedContentType, setRelatedContentType] = useState<'dream' | 'journal' | null>(null);
  const [relatedContentId, setRelatedContentId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Fetch user's conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['/api/assistant/conversations'],
    enabled: !!user,
  });
  
  // Fetch messages for the active conversation
  const { data: conversationData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/assistant/conversations', activeConversationId],
    enabled: !!activeConversationId,
  });
  
  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: () => apiRequest('/api/assistant/conversations', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assistant/conversations'] });
      setActiveConversationId(data.id);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Unterhaltung konnte nicht erstellt werden",
        variant: "destructive",
      });
    }
  });
  
  // Update a conversation (e.g., to archive it)
  const updateConversationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Conversation> }) => 
      apiRequest(`/api/assistant/conversations/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assistant/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Unterhaltung konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  });
  
  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/assistant/conversations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assistant/conversations'] });
      setActiveConversationId(null);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Unterhaltung konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  });
  
  // Send a message to the AI assistant
  const sendMessageMutation = useMutation({
    mutationFn: (chatRequest: ChatRequest) => 
      apiRequest('/api/assistant/chat', { 
        method: 'POST', 
        body: JSON.stringify(chatRequest) 
      }),
    onSuccess: (data: ChatResponse) => {
      setInputMessage('');
      setIsLoading(false);
      
      // If this was a new conversation, set its ID as active
      if (data.conversationId !== activeConversationId) {
        setActiveConversationId(data.conversationId);
      }
      
      // Refresh the conversations list and current conversation
      queryClient.invalidateQueries({ queryKey: ['/api/assistant/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assistant/conversations', data.conversationId] });
    },
    onError: (error) => {
      setIsLoading(false);
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden",
        variant: "destructive",
      });
    }
  });
  
  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationData]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    setIsLoading(true);
    
    const chatRequest: ChatRequest = {
      message: inputMessage,
      conversationId: activeConversationId || undefined,
    };
    
    // Add related content if selected
    if (relatedContentType === 'dream' && relatedContentId) {
      chatRequest.relatedDreamId = relatedContentId;
    } else if (relatedContentType === 'journal' && relatedContentId) {
      chatRequest.relatedJournalId = relatedContentId;
    }
    
    sendMessageMutation.mutate(chatRequest);
  };
  
  // Handle key press (send on Enter, newline on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle related content selection
  const handleRelatedContentChange = (type: 'dream' | 'journal' | null, id: number | null) => {
    setRelatedContentType(type);
    setRelatedContentId(id);
  };
  
  // Create a new conversation
  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };
  
  // Toggle archiving a conversation
  const handleArchiveConversation = (conversation: Conversation) => {
    updateConversationMutation.mutate({
      id: conversation.id,
      data: { isArchived: !conversation.isArchived }
    });
  };
  
  // Format the timestamp for display
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Get all non-archived conversations
  const activeConversations = conversations?.filter((c: Conversation) => !c.isArchived) || [];
  
  // Get all archived conversations
  const archivedConversations = conversations?.filter((c: Conversation) => c.isArchived) || [];
  
  // Get messages for the active conversation
  const messages = conversationData?.messages || [];
  
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar with conversations */}
      {showSidebar && (
        <div className="w-64 h-full border-r bg-card overflow-hidden flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Unterhaltungen</h2>
            <Button variant="ghost" size="icon" onClick={handleNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoadingConversations ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  {activeConversations.length === 0 && archivedConversations.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      <p>Keine Unterhaltungen gefunden</p>
                      <p className="text-sm">Starten Sie eine neue Unterhaltung</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        {activeConversations.map((conversation: Conversation) => (
                          <Button
                            key={conversation.id}
                            variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                            className="w-full justify-start text-left h-auto py-2 overflow-hidden"
                            onClick={() => setActiveConversationId(conversation.id)}
                          >
                            <div className="truncate pr-2">
                              {conversation.title}
                              <p className="text-xs text-muted-foreground truncate">
                                {new Date(conversation.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </Button>
                        ))}
                      </div>
                      
                      {archivedConversations.length > 0 && (
                        <>
                          <Separator className="my-2" />
                          <p className="text-xs text-muted-foreground px-2 py-1">Archivierte Unterhaltungen</p>
                          <div className="space-y-1">
                            {archivedConversations.map((conversation: Conversation) => (
                              <Button
                                key={conversation.id}
                                variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                                className="w-full justify-start text-left h-auto py-2 opacity-60 overflow-hidden"
                                onClick={() => setActiveConversationId(conversation.id)}
                              >
                                <div className="truncate pr-2">
                                  {conversation.title}
                                  <p className="text-xs text-muted-foreground truncate">
                                    {new Date(conversation.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden mr-2"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <ArrowLeft className="h-4 w-4" /> : <span className="w-4"></span>}
            </Button>
            
            <h2 className="font-semibold">
              {activeConversationId ? (
                conversationData?.conversation?.title || "Unterhaltung"
              ) : (
                "Traumdeutungs-Assistent"
              )}
            </h2>
          </div>
          
          {activeConversationId && conversationData?.conversation && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchiveConversation(conversationData.conversation)}
              >
                {conversationData.conversation.isArchived ? (
                  <><RotateCcw className="h-4 w-4 mr-2" /> Wiederherstellen</>
                ) : (
                  <><Archive className="h-4 w-4 mr-2" /> Archivieren</>
                )}
              </Button>
            </div>
          )}
        </div>
        
        {/* Empty state */}
        {!activeConversationId && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <CardTitle>KI-Traumdeutungs-Assistent</CardTitle>
                <CardDescription>
                  Stellen Sie Fragen zu Ihren Träumen, lassen Sie sie analysieren oder erfahren Sie mehr über Traumsymbole und deren Bedeutung.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Der KI-Assistent kann Ihnen helfen bei:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Traumdeutung und -interpretation</li>
                  <li>Erkennen von Traummustern</li>
                  <li>Informationen zu Traumsymbolen</li>
                  <li>Verbindungen zwischen Emotionen und Träumen</li>
                  <li>Tipps für besseres Erinnern an Träume</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={handleNewConversation} className="w-full">
                  Neue Unterhaltung starten
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Messages area */}
        {activeConversationId && (
          <ScrollArea className="flex-1 p-4">
            {isLoadingMessages ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg p-4 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs mt-1 opacity-70 text-right">
                        {formatTimestamp(message.timestamp)}
                      </div>
                      
                      {/* Show badges for related content */}
                      {(message.relatedDreamId || message.relatedJournalId) && (
                        <div className="mt-2 flex gap-1 justify-end">
                          {message.relatedDreamId && (
                            <Badge variant="outline">Bezug: Traum</Badge>
                          )}
                          {message.relatedJournalId && (
                            <Badge variant="outline">Bezug: Tagebuch</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            )}
          </ScrollArea>
        )}
        
        {/* Input area */}
        {activeConversationId && (
          <div className="border-t p-4">
            <RelatedContentSelector
              type={relatedContentType}
              id={relatedContentId}
              onChange={handleRelatedContentChange}
            />
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Schreiben Sie eine Nachricht..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none"
                rows={3}
                disabled={isLoading}
              />
              <Button
                className="self-end"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;