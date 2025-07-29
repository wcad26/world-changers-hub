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
  const { user } = useAuth();
  const { data: relationships, isLoading } = useMemberDiscipleshipRelationships(user?.id);
  const { data: stats } = useMemberDiscipleshipStats(user?.id);

  // Mock data for demo purposes
  const mockStats = {
    total_disciples: 8,
    active_disciples: 6,
    completed_disciples: 2,
    success_rate: 75
  };

  const mockRelationships = {
    asDisciple: [
      {
        id: "1",
        mentor_id: "mentor-1",
        disciple_id: user?.id || "current-user",
        status: "active",
        start_date: "2024-01-15",
        notes: "Working on foundational Bible study and prayer habits. Great progress in understanding Christian principles.",
        mentor: {
          id: "mentor-1",
          member_id: "M001",
          profiles: {
            first_name: "Pastor",
            last_name: "Johnson",
            phone: "(555) 123-4567"
          }
        }
      }
    ],
    asMentor: [
      {
        id: "2",
        mentor_id: user?.id || "current-user",
        disciple_id: "disciple-1",
        status: "active",
        start_date: "2024-03-10",
        notes: "New believer, very eager to learn. Meeting weekly for Bible study and life application.",
        disciple: {
          id: "disciple-1",
          member_id: "M025",
          profiles: {
            first_name: "Sarah",
            last_name: "Williams",
            phone: "(555) 234-5678"
          }
        }
      },
      {
        id: "3",
        mentor_id: user?.id || "current-user",
        disciple_id: "disciple-2",
        status: "active",
        start_date: "2024-02-20",
        notes: "Young adult struggling with faith questions. Focus on apologetics and building confidence in beliefs.",
        disciple: {
          id: "disciple-2",
          member_id: "M032",
          profiles: {
            first_name: "Marcus",
            last_name: "Thompson",
            phone: "(555) 345-6789"
          }
        }
      },
      {
        id: "4",
        mentor_id: user?.id || "current-user",
        disciple_id: "disciple-3",
        status: "active",
        start_date: "2024-01-05",
        notes: "Preparing for baptism. Strong foundation, ready to take next steps in faith journey.",
        disciple: {
          id: "disciple-3",
          member_id: "M018",
          profiles: {
            first_name: "Emily",
            last_name: "Chen",
            phone: "(555) 456-7890"
          }
        }
      },
      {
        id: "5",
        mentor_id: user?.id || "current-user",
        disciple_id: "disciple-4",
        status: "completed",
        start_date: "2023-09-15",
        end_date: "2024-06-15",
        notes: "Successfully completed discipleship program. Now serving in youth ministry and mentoring others.",
        disciple: {
          id: "disciple-4",
          member_id: "M041",
          profiles: {
            first_name: "David",
            last_name: "Rodriguez",
            phone: "(555) 567-8901"
          }
        }
      },
      {
        id: "6",
        mentor_id: user?.id || "current-user",
        disciple_id: "disciple-5",
        status: "completed",
        start_date: "2023-11-20",
        end_date: "2024-08-20",
        notes: "Excellent progress through all milestones. Now leading a small group and actively evangelizing.",
        disciple: {
          id: "disciple-5",
          member_id: "M055",
          profiles: {
            first_name: "Lisa",
            last_name: "Parker",
            phone: "(555) 678-9012"
          }
        }
      }
    ]
  };

  // Use mock data for demo, fallback to real data if available
  const displayStats = stats || mockStats;
  const displayRelationships = (relationships?.asDisciple?.length || relationships?.asMentor?.length) 
    ? relationships 
    : mockRelationships;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">My Discipleship Journey</h1>
      </div>

      {/* Stats Overview */}
      {displayStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{displayStats.total_disciples}</p>
                  <p className="text-sm text-muted-foreground">Total Disciples</p>
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
      )}

      <Tabs defaultValue="mentoring" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mentoring">I'm Mentoring</TabsTrigger>
          <TabsTrigger value="being-mentored">I'm Being Mentored</TabsTrigger>
        </TabsList>

        <TabsContent value="mentoring" className="space-y-4">
          {displayRelationships?.asMentor?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Disciples Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't been assigned any disciples to mentor yet.
                </p>
                <Button variant="outline">Contact Leadership</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {displayRelationships?.asMentor?.map((relationship) => (
                <Card key={relationship.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {relationship.disciple?.profiles?.first_name} {relationship.disciple?.profiles?.last_name}
                        </CardTitle>
                        <CardDescription>
                          Started: {new Date(relationship.start_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={relationship.status === 'active' ? 'default' : 'secondary'}>
                        {relationship.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {relationship.notes && (
                      <p className="text-sm text-muted-foreground mb-4">{relationship.notes}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <AddProgressDialog 
                        relationshipId={relationship.id} 
                        discipleName={`${relationship.disciple?.profiles?.first_name} ${relationship.disciple?.profiles?.last_name}`}
                      >
                        <Button size="sm" variant="outline">+ Progress</Button>
                      </AddProgressDialog>
                      
                      <ScheduleMeetingDialog 
                        discipleName={`${relationship.disciple?.profiles?.first_name} ${relationship.disciple?.profiles?.last_name}`}
                      >
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </ScheduleMeetingDialog>
                      
                      <ProgressSummaryDialog 
                        relationshipId={relationship.id}
                        discipleName={`${relationship.disciple?.profiles?.first_name} ${relationship.disciple?.profiles?.last_name}`}
                      >
                        <Button size="sm" variant="outline">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Summary
                        </Button>
                      </ProgressSummaryDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="being-mentored" className="space-y-4">
          {displayRelationships?.asDisciple?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Mentor Assigned</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't been assigned a mentor yet. Contact leadership to get started.
                </p>
                <Button variant="outline">Request Mentor</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {displayRelationships?.asDisciple?.map((relationship) => (
                <Card key={relationship.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {relationship.mentor?.profiles?.first_name} {relationship.mentor?.profiles?.last_name}
                        </CardTitle>
                        <CardDescription>
                          Started: {new Date(relationship.start_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={relationship.status === 'active' ? 'default' : 'secondary'}>
                        {relationship.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {relationship.notes && (
                      <p className="text-sm text-muted-foreground mb-4">{relationship.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">View Progress</Button>
                      <Button size="sm" variant="outline">Schedule Meeting</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}