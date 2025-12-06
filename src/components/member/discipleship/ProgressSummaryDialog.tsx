import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, MessageCircle, Sparkles, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { useDiscipleshipProgress } from '@/hooks/useDiscipleship';

interface ProgressSummaryDialogProps {
  relationshipId: string;
  discipleName: string;
  children: React.ReactNode;
}

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export function ProgressSummaryDialog({ relationshipId, discipleName, children }: ProgressSummaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('progress');
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  // Fetch real progress data
  const { data: progressNotes = [], isLoading: isLoadingProgress } = useDiscipleshipProgress(open ? relationshipId : undefined);
  
  // Show tabs for mobile and tablet views
  const showTabs = isMobile || isTablet;

  const getMilestoneLabel = (milestone: string) => {
    const labels: Record<string, string> = {
      'first_visit': 'First Visit',
      'second_visit': 'Second Visit',
      'committed': 'Committed to Faith',
      'baptized': 'Baptized',
      'became_member': 'Became Member',
      'serving': 'Now Serving'
    };
    return labels[milestone] || milestone;
  };

  const getMilestoneColor = (milestone: string) => {
    const colors: Record<string, string> = {
      'first_visit': 'bg-blue-100 text-blue-800',
      'second_visit': 'bg-green-100 text-green-800',
      'committed': 'bg-yellow-100 text-yellow-800',
      'baptized': 'bg-purple-100 text-purple-800',
      'became_member': 'bg-orange-100 text-orange-800',
      'serving': 'bg-red-100 text-red-800'
    };
    return colors[milestone] || 'bg-gray-100 text-gray-800';
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      // Mock AI response - in real implementation, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: generateAIResponse(chatInput, progressNotes, discipleName),
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateAIResponse = (input: string, notes: any[], name: string) => {
    const lowerInput = input.toLowerCase();
    const noteCount = notes.length;
    
    if (noteCount === 0) {
      return `No progress has been recorded for ${name} yet. Start by adding their first milestone to track their spiritual journey.`;
    }
    
    const milestones = notes.map(n => getMilestoneLabel(n.milestone)).join(', ');
    
    if (lowerInput.includes('summarize') || lowerInput.includes('summary')) {
      return `Based on the recorded progress, ${name} has achieved ${noteCount} milestone(s): ${milestones}. This shows their dedication to spiritual growth.`;
    }
    
    if (lowerInput.includes('strength') || lowerInput.includes('positive')) {
      return `${name}'s strengths include consistent engagement with the discipleship program. They have demonstrated commitment by reaching ${noteCount} milestone(s) in their journey.`;
    }
    
    if (lowerInput.includes('challenge') || lowerInput.includes('improve')) {
      const lastMilestone = notes[0]?.milestone;
      return `Based on the progress so far, consider focusing on the next steps after "${getMilestoneLabel(lastMilestone || 'first_visit')}". Regular check-ins and encouragement will help maintain momentum.`;
    }
    
    if (lowerInput.includes('next') || lowerInput.includes('recommend')) {
      return `Recommended next steps for ${name}: Continue with regular meetings, encourage deeper Bible study, and identify opportunities for service involvement based on their interests.`;
    }
    
    return `I've analyzed ${name}'s progress. They have ${noteCount} recorded milestone(s). Is there a specific aspect you'd like me to explore further?`;
  };

  const predefinedPrompts = [
    "Summarize their progress",
    "What are their strengths?",
    "What areas need improvement?",
    "What should we focus on next?"
  ];

  const ProgressContent = () => (
    <ScrollArea className="flex-1 pr-2">
      <div className="space-y-3">
        {isLoadingProgress ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : progressNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No progress recorded yet.</p>
            <p className="text-sm mt-2">Add progress milestones to track their journey.</p>
          </div>
        ) : (
          progressNotes.map((note) => (
            <Card key={note.id} className="border-l-4 border-l-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={getMilestoneColor(note.milestone)}>
                    {getMilestoneLabel(note.milestone)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {note.achieved_date ? format(new Date(note.achieved_date), 'MMM dd, yyyy') : 'No date'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {note.notes || 'No notes recorded.'}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );

  const AIChatContent = () => (
    <div className="border rounded-lg flex-1 flex flex-col min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 p-4 min-h-0">
        {chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ask me anything about {discipleName}'s progress!</p>
            <div className="mt-4 space-y-2">
              {predefinedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="mx-1"
                  onClick={() => setChatInput(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {format(message.timestamp, 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <form onSubmit={handleChatSubmit} className="p-3 border-t shrink-0">
        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about their progress..."
            disabled={isAiLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isAiLoading || !chatInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Progress Summary for {discipleName}
          </DialogTitle>
        </DialogHeader>
        
        {showTabs ? (
          // Mobile/Tablet: Tabbed Layout
          <div className="flex-1 min-h-0 p-4 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Progress History
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Insights
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="flex-1 mt-0 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ProgressContent />
              </TabsContent>
              
              <TabsContent value="ai" className="flex-1 mt-0 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
                <AIChatContent />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Desktop: Side-by-side Layout
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 p-4">
            <div className="flex flex-col flex-1 lg:flex-none lg:w-1/2 min-h-0">
              <h3 className="text-lg font-semibold mb-3 shrink-0">Progress History</h3>
              <ProgressContent />
            </div>

            <div className="flex flex-col flex-1 lg:flex-none lg:w-1/2 min-h-0">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">AI Insights</h3>
              </div>
              <AIChatContent />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}