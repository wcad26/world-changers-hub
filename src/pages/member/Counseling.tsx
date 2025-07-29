import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Phone, Mail, Clock, User } from 'lucide-react';

export default function MemberCounseling() {
  // Mock data - will be replaced with actual data when backend is implemented
  const counselors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialties: ["Marriage", "Family", "Anxiety"],
      experience: "15 years",
      available: true,
      phone: "(555) 123-4567",
      email: "sarah.johnson@church.org",
      bio: "Specialized in Christian counseling with focus on marriage and family therapy.",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Pastor Michael Chen",
      specialties: ["Spiritual", "Depression", "Youth"],
      experience: "10 years",
      available: true,
      phone: "(555) 987-6543",
      email: "michael.chen@church.org",
      bio: "Youth pastor with counseling certification, specializing in spiritual guidance.",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Dr. Rebecca Martinez",
      specialties: ["Trauma", "Grief", "Women's Issues"],
      experience: "12 years",
      available: false,
      phone: "(555) 456-7890",
      email: "rebecca.martinez@church.org",
      bio: "Licensed therapist with extensive experience in trauma recovery.",
      avatar: "/placeholder.svg"
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      counselor: "Dr. Sarah Johnson",
      date: "2024-12-20",
      time: "2:00 PM",
      type: "Individual",
      location: "Office 201",
      notes: "Marriage counseling session"
    },
    {
      id: 2,
      counselor: "Pastor Michael Chen",
      date: "2024-12-27",
      time: "10:00 AM",
      type: "Spiritual",
      location: "Pastoral Office",
      notes: "Spiritual guidance and prayer"
    }
  ];

  const sessionHistory = [
    {
      id: 1,
      counselor: "Dr. Sarah Johnson",
      date: "2024-12-06",
      type: "Individual",
      status: "Completed",
      notes: "Discussed communication strategies"
    },
    {
      id: 2,
      counselor: "Pastor Michael Chen",
      date: "2024-11-29",
      type: "Spiritual",
      status: "Completed",
      notes: "Prayer and spiritual direction"
    },
    {
      id: 3,
      counselor: "Dr. Sarah Johnson",
      date: "2024-11-22",
      type: "Individual",
      status: "Completed",
      notes: "Initial consultation"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Counseling Services</h1>
      </div>

      <Tabs defaultValue="counselors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="counselors">Available Counselors</TabsTrigger>
          <TabsTrigger value="sessions">My Sessions</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
        </TabsList>

        <TabsContent value="counselors" className="space-y-4">
          <div className="grid gap-4">
            {counselors.map((counselor) => (
              <Card key={counselor.id}>
                <CardHeader>
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={counselor.avatar} alt={counselor.name} />
                      <AvatarFallback>{counselor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{counselor.name}</CardTitle>
                          <CardDescription>{counselor.experience} experience</CardDescription>
                        </div>
                        <Badge variant={counselor.available ? 'default' : 'secondary'}>
                          {counselor.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {counselor.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{counselor.bio}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{counselor.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{counselor.email}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      disabled={!counselor.available}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Book Session
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any counseling sessions scheduled.
                </p>
                <Button variant="outline">Book a Session</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Session with {session.counselor}</CardTitle>
                        <CardDescription>{session.notes}</CardDescription>
                      </div>
                      <Badge variant="default">{session.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{session.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{session.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Reschedule</Button>
                      <Button size="sm" variant="destructive">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {sessionHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Session History</h3>
                <p className="text-muted-foreground">
                  You haven't had any counseling sessions yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessionHistory.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{session.counselor}</h3>
                        <p className="text-sm text-muted-foreground">{session.notes}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                          <Badge variant="outline">{session.type}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">{session.status}</Badge>
                        <Button size="sm" variant="outline" className="mt-2">
                          Book Follow-up
                        </Button>
                      </div>
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