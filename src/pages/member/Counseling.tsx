import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Phone, Mail, Clock, User, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function MemberCounseling() {
  const { toast } = useToast();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Mock available dates and times for each counselor
  const getAvailableDates = (counselorId: number) => {
    const today = new Date();
    const availableDates = [];
    
    // Generate next 30 days, excluding weekends
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Exclude weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        availableDates.push(date);
      }
    }
    
    return availableDates;
  };

  const getAvailableTimes = () => {
    return [
      '9:00 AM',
      '10:00 AM', 
      '11:00 AM',
      '2:00 PM',
      '3:00 PM',
      '4:00 PM'
    ];
  };

  const handleBookSession = (counselor: any) => {
    setSelectedCounselor(counselor);
    setSelectedDate(undefined);
    setSelectedTime('');
    setBookingDialogOpen(true);
  };

  const handleConfirmBooking = () => {
    if (selectedDate && selectedTime && selectedCounselor) {
      toast({
        title: "Session Booked Successfully!",
        description: `Your session with ${selectedCounselor.name} has been scheduled for ${format(selectedDate, 'PPP')} at ${selectedTime}.`,
      });
      setBookingDialogOpen(false);
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedCounselor(null);
    }
  };

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
                      onClick={() => handleBookSession(counselor)}
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

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book a Session</DialogTitle>
            <DialogDescription>
              {selectedCounselor && `Schedule a counseling session with ${selectedCounselor.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      if (!selectedCounselor) return true;
                      const availableDates = getAvailableDates(selectedCounselor.id);
                      return !availableDates.some(availableDate => 
                        availableDate.toDateString() === date.toDateString()
                      );
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Time</label>
              <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose available time" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTimes().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Counselor Info */}
            {selectedCounselor && (
              <div className="p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedCounselor.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedCounselor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Specialties: {selectedCounselor.specialties.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking}
              disabled={!selectedDate || !selectedTime}
            >
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}