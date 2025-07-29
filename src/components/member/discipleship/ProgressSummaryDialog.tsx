import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, MessageCircle, Sparkles, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ProgressSummaryDialogProps {
  relationshipId: string;
  discipleName: string;
  children: React.ReactNode;
}

// Mock progress data
const mockProgressNotes = [
  {
    id: '1',
    milestone: 'first_visit',
    achieved_date: '2024-03-15',
    notes: 'Attended first service. Very engaged during worship and sermon. Asked thoughtful questions about faith.',
    created_at: '2024-03-15'
  },
  {
    id: '2',
    milestone: 'second_visit',
    achieved_date: '2024-03-22',
    notes: 'Returned for second visit. Brought a friend! Participated in altar call prayer. Showing genuine interest.',
    created_at: '2024-03-22'
  },
  {
    id: '3',
    milestone: 'committed',
    achieved_date: '2024-04-05',
    notes: 'Made commitment to Christ during Easter service. Very emotional and sincere. Started attending Bible study.',
    created_at: '2024-04-05'
  },
  {
    id: '4',
    milestone: 'baptized',
    achieved_date: '2024-05-12',
    notes: 'Baptized today! Family attended to support. Testimony was powerful and moving. Growing in faith daily.',
    created_at: '2024-05-12'
  }
];

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export function ProgressSummaryDialog({ relationshipId, discipleName, children }: ProgressSummaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const getMilestoneLabel = (milestone: string) => {
    const labels = {
      'first_visit': 'First Visit',
      'second_visit': 'Second Visit',
      'committed': 'Committed to Faith',
      'baptized': 'Baptized',
      'became_member': 'Became Member',
      'serving': 'Now Serving'
    };
    return labels[milestone as keyof typeof labels] || milestone;
  };

  const getMilestoneColor = (milestone: string) => {
    const colors = {
      'first_visit': 'bg-blue-100 text-blue-800',
      'second_visit': 'bg-green-100 text-green-800',
      'committed': 'bg-yellow-100 text-yellow-800',
      'baptized': 'bg-purple-100 text-purple-800',
      'became_member': 'bg-orange-100 text-orange-800',
      'serving': 'bg-red-100 text-red-800'
    };
    return colors[milestone as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
    setIsLoading(true);

    try {
      // Mock AI response for now
      // In a real implementation, this would call the Supabase Edge Function
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: generateMockAIResponse(chatInput, mockProgressNotes),
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
      setIsLoading(false);
    }
  };

  const generateMockAIResponse = (input: string, progressNotes: any[]) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('summarize') || lowerInput.includes('summary')) {
      return `Based on ${discipleName}'s progress notes, here's a summary: They started their faith journey in March 2024 with their first visit to church, showing immediate engagement and curiosity. Within just two months, they progressed from first-time visitor to committed believer and were baptized in May. This shows exceptional spiritual growth and dedication. Their journey demonstrates strong faith development with active participation in church activities and Bible study.`;
    }
    
    if (lowerInput.includes('strength') || lowerInput.includes('positive')) {
      return `${discipleName}'s key strengths include: 1) Quick spiritual growth - progressed from visitor to baptized in just 2 months, 2) High engagement - actively participates and asks thoughtful questions, 3) Evangelistic heart - brought friends to church early in their journey, 4) Authentic faith - emotional and sincere commitment during Easter service, 5) Family support - had family present for baptism, showing strong relational foundation.`;
    }
    
    if (lowerInput.includes('challenge') || lowerInput.includes('area') || lowerInput.includes('improve')) {
      return `Potential areas for continued growth: 1) Leadership development - consider opportunities for ${discipleName} to serve and lead others, 2) Deeper Bible study - they show curiosity, so advanced study materials could benefit them, 3) Mentorship training - given their evangelistic nature, they could mentor newcomers, 4) Service involvement - their passion could be channeled into specific ministry roles.`;
    }
    
    if (lowerInput.includes('next') || lowerInput.includes('recommend')) {
      return `Recommended next steps for ${discipleName}: 1) Enroll in membership classes to become an official member, 2) Join a small group or Bible study for deeper community, 3) Explore service opportunities that match their gifts and interests, 4) Consider discipleship training to mentor others, 5) Continue building their biblical foundation through systematic study.`;
    }
    
    return `I've analyzed ${discipleName}'s progress notes. They show excellent spiritual growth with consistent engagement and authentic faith development. Their journey from first visit to baptism in just 2 months is remarkable. They demonstrate strong potential for leadership and mentoring others. Is there a specific aspect of their progress you'd like me to explore further?`;
  };

  const predefinedPrompts = [
    "Summarize their progress",
    "What are their strengths?",
    "What areas need improvement?",
    "What should we focus on next?"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Progress Summary for {discipleName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 p-4">
          {/* Progress Notes Section */}
          <div className="flex flex-col flex-1 lg:flex-none lg:w-1/2 min-h-0">
            <h3 className="text-lg font-semibold mb-3 shrink-0">Progress History</h3>
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-3">
                {mockProgressNotes.map((note, index) => (
                  <Card key={note.id} className="border-l-4 border-l-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getMilestoneColor(note.milestone)}>
                          {getMilestoneLabel(note.milestone)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.achieved_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">{note.notes}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* AI Chat Section */}
          <div className="flex flex-col flex-1 lg:flex-none lg:w-1/2 min-h-0">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Insights</h3>
            </div>
            
            <div className="border rounded-lg flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Chat Messages */}
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
                    {isLoading && (
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

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about their progress..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}