import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, Target, BookOpen, TrendingUp } from 'lucide-react';
import { useMemberDiscipleshipRelationships, useMemberDiscipleshipStats } from '@/hooks/useDiscipleship';
import { useAuth } from '@/hooks/useAuth';
import { AddProgressDialog } from '@/components/member/discipleship/AddProgressDialog';
import { ScheduleMeetingDialog } from '@/components/member/discipleship/ScheduleMeetingDialog';
import { ProgressSummaryDialog } from '@/components/member/discipleship/ProgressSummaryDialog';
export default function MemberDiscipleship() {
  const {
    memberId
  } = useAuth();
  const {
    data: relationships,
    isLoading: isLoadingRelationships
  } = useMemberDiscipleshipRelationships(memberId || undefined);
  const {
    data: stats,
    isLoading: isLoadingStats
  } = useMemberDiscipleshipStats(memberId || undefined);
  const isLoading = isLoadingRelationships || isLoadingStats;
  if (isLoading) {
    return <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>;
  }

  // Default stats if none exist
  const displayStats = stats || {
    total_disciples: 0,
    active_disciples: 0,
    completed_disciples: 0,
    success_rate: 0
  };
  return <div className="container mx-auto p-6 space-y-6">
      {/* Page heading - hidden on mobile as it shows in layout header */}
      <div className="hidden md:flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">My Discipleship Journey</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-0 my-0">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{displayStats.total_disciples}</p>
                <p className="text-sm text-muted-foreground">Disciples</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{displayStats.active_disciples}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{displayStats.completed_disciples}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{Math.round(displayStats.success_rate)}%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <Progress value={displayStats.success_rate} className="mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mentoring" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mentoring">I'm Mentoring</TabsTrigger>
          <TabsTrigger value="being-mentored">I'm Being Mentored</TabsTrigger>
        </TabsList>

        <TabsContent value="mentoring" className="space-y-4">
          {!relationships?.asMentor?.length ? <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Disciples Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't been assigned any disciples to mentor yet.
                </p>
                <Button variant="outline">Contact Leadership</Button>
              </CardContent>
            </Card> : <div className="grid gap-4">
              {relationships.asMentor.map(relationship => <Card key={relationship.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {relationship.disciple?.profiles?.first_name} {relationship.disciple?.profiles?.last_name}
                        </CardTitle>
                        <CardDescription>
                          Started: {relationship.start_date ? new Date(relationship.start_date).toLocaleDateString() : 'N/A'}
                        </CardDescription>
                      </div>
                      <Badge variant={relationship.status === 'active' ? 'default' : 'secondary'}>
                        {relationship.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {relationship.notes && <p className="text-sm text-muted-foreground mb-4">{relationship.notes}</p>}
                    <div className="flex gap-2 flex-wrap">
                      <AddProgressDialog relationshipId={relationship.id} discipleName={`${relationship.disciple?.profiles?.first_name || ''} ${relationship.disciple?.profiles?.last_name || ''}`}>
                        <Button size="sm" variant="outline">+ Progress</Button>
                      </AddProgressDialog>
                      
                      <ScheduleMeetingDialog discipleName={`${relationship.disciple?.profiles?.first_name || ''} ${relationship.disciple?.profiles?.last_name || ''}`}>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </ScheduleMeetingDialog>
                      
                      <ProgressSummaryDialog relationshipId={relationship.id} discipleName={`${relationship.disciple?.profiles?.first_name || ''} ${relationship.disciple?.profiles?.last_name || ''}`}>
                        <Button size="sm" variant="outline">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Summary
                        </Button>
                      </ProgressSummaryDialog>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </TabsContent>

        <TabsContent value="being-mentored" className="space-y-4">
          {!relationships?.asDisciple?.length ? <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Mentor Assigned</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't been assigned a mentor yet. Contact leadership to get started.
                </p>
                <Button variant="outline">Request Mentor</Button>
              </CardContent>
            </Card> : <div className="grid gap-4">
              {relationships.asDisciple.map(relationship => <Card key={relationship.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {relationship.mentor?.profiles?.first_name} {relationship.mentor?.profiles?.last_name}
                        </CardTitle>
                        <CardDescription>
                          Started: {relationship.start_date ? new Date(relationship.start_date).toLocaleDateString() : 'N/A'}
                        </CardDescription>
                      </div>
                      <Badge variant={relationship.status === 'active' ? 'default' : 'secondary'}>
                        {relationship.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {relationship.notes && <p className="text-sm text-muted-foreground mb-4">{relationship.notes}</p>}
                    <div className="flex gap-2">
                      <ProgressSummaryDialog relationshipId={relationship.id} discipleName="My">
                        <Button size="sm" variant="outline">View My Progress</Button>
                      </ProgressSummaryDialog>
                      <ScheduleMeetingDialog discipleName={`${relationship.mentor?.profiles?.first_name || ''} ${relationship.mentor?.profiles?.last_name || ''}`}>
                        <Button size="sm" variant="outline">Schedule Meeting</Button>
                      </ScheduleMeetingDialog>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </TabsContent>
      </Tabs>
    </div>;
}