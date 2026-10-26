import React from 'react';
import { useParams, useNavigate } from '@/lib/router-compat';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, Briefcase, Heart, Shield, Pen, RefreshCw, MessageCircle, TrendingUp, Users } from 'lucide-react';
import { useMembers, MemberWithProfile } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import EditMemberForm from '@/components/admin/regional/EditMemberForm';
import { useQueryClient } from '@tanstack/react-query';
import { useMemberDiscipleshipStats, useDiscipleshipImpactTrend, useMemberDiscipleshipRelationships } from '@/hooks/useDiscipleship';
import { useMemberAttendanceStats } from '@/hooks/useAttendance';
import FamilyRelationshipsSection from '@/components/admin/regional/FamilyRelationshipsSection';
import MemberPhotoUpload from '@/components/admin/regional/MemberPhotoUpload';
import { RingTile, Initials, InfoRow, SheetHeader } from '@/components/admin/regional/RegionalUI';
import { Panel } from '@/components/member/MemberUI';
import { format } from 'date-fns';

const MemberProfile: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { userRegion } = useAuth();
  const queryClient = useQueryClient();
  const { data: members, isLoading, error, refetch } = useMembers(userRegion?.id);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const member = React.useMemo(() => {
    if (!members || !memberId) return null;
    return members.find(m => m.id === memberId);
  }, [members, memberId]);

  // Fetch real discipleship data
  const { data: discipleshipStats } = useMemberDiscipleshipStats(member?.id);
  const { data: impactTrend } = useDiscipleshipImpactTrend(member?.id, userRegion?.id);
  const { data: discipleshipRelationships } = useMemberDiscipleshipRelationships(member?.id);
  
  // Fetch real attendance data
  const { data: attendanceStats } = useMemberAttendanceStats(member?.id, userRegion?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'transferred': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMentorName = () => {
    if (!discipleshipRelationships?.asDisciple || discipleshipRelationships.asDisciple.length === 0) {
      return 'No mentor assigned';
    }
    const activeMentorship = discipleshipRelationships.asDisciple.find((rel: any) => rel.status === 'active');
    if (!activeMentorship?.mentor?.profiles) {
      return 'No active mentor';
    }
    return `${activeMentorship.mentor.profiles.last_name} ${activeMentorship.mentor.profiles.first_name}`;
  };
    const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'M';
  };

  if (isLoading || !userRegion) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading member profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !member) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500">Error loading member profile or member not found.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/regional/members')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Members
            </Button>
          </div>
        </div>
      </>
    );
  }

  const p = member.profiles;
  const activeMentor = discipleshipRelationships?.asDisciple?.find((rel: any) => rel.status === 'active');
  const fmt = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy') : 'Not provided');
  const isActive = !!attendanceStats?.isActiveBasedOnAttendance;
  const rate = Math.round(attendanceStats?.attendanceRate || 0);
  const change = Math.round(attendanceStats?.monthlyChange || 0);

  return (
    <>
      <div className="space-y-5 pb-24 lg:pb-0">
        {/* Top bar */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/admin/regional/members')} aria-label="Back to members"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">Members / Profile</p>
          <button type="button" onClick={() => refetch()} aria-label="Refresh"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
          </button>
          <Button onClick={() => setIsEditDialogOpen(true)} className="h-10 gap-2 rounded-full">
            <Pen className="h-4 w-4" /> <span className="hidden sm:inline">Edit profile</span><span className="sm:hidden">Edit</span>
          </Button>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="relative shrink-0">
              <div className="rounded-full ring-4 ring-primary-foreground/25">
                <Initials size="lg" first={p?.first_name} last={p?.last_name} photo={member.photo_url} />
              </div>
              <MemberPhotoUpload memberId={member.id} currentPhotoUrl={member.photo_url ?? undefined} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-2xl font-bold leading-tight">{p?.last_name} {p?.first_name}</h2>
              {p?.email && <p className="truncate text-sm opacity-85">{p.email}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold capitalize">{member.member_type || 'member'}</span>
                <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold capitalize">{member.status || 'new'}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
                  <Shield className="h-3 w-3" /> {isActive ? 'Active attendee' : 'Inactive attendee'}
                </span>
                {member.member_id && <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">ID {member.member_id}</span>}
              </div>
            </div>
          </div>
          {p?.phone && (
            <div className="relative mt-4 grid grid-cols-2 gap-2 sm:max-w-xs">
              <a href={`tel:${p.phone}`} className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground/15 py-2 text-sm font-semibold hover:bg-primary-foreground/25">
                <Phone className="h-4 w-4" /> Call
              </a>
              <a href={`https://wa.me/${p.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground/15 py-2 text-sm font-semibold hover:bg-primary-foreground/25">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          )}
        </section>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <RingTile icon={Calendar} label={`Attended of ${attendanceStats?.totalEvents || 0}`} value={attendanceStats?.eventsAttended || 0} ring={rate} ringLabel="rate" tone="var(--chart-2)" />
          <RingTile icon={TrendingUp} label="This month" value={`${change >= 0 ? '+' : ''}${change}%`} tone="var(--chart-1)" />
          <RingTile icon={Users} label="Disciples" value={discipleshipStats?.total_disciples || 0} tone="var(--chart-3)" />
          <RingTile icon={Heart} label="Became members" value={`${Math.round(discipleshipStats?.success_rate || 0)}%`} ring={discipleshipStats?.success_rate || 0} ringLabel="success" tone="var(--chart-4)" />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Details */}
          <div className="space-y-5 lg:col-span-1">
            <Panel title="Personal" bodyClassName="py-2">
              <div className="divide-y divide-border">
                <InfoRow icon={Phone} label="Phone" value={p?.phone || 'Not provided'} />
                <InfoRow icon={MapPin} label="Address" value={p?.address || 'Not provided'} />
                <InfoRow icon={Calendar} label="Date of birth" value={fmt(p?.date_of_birth)} />
                <InfoRow icon={User} label="Gender" value={<span className="capitalize">{p?.gender || 'Not provided'}</span>} />
                <InfoRow icon={Briefcase} label="Occupation" value={p?.occupation || 'Not provided'} />
              </div>
            </Panel>
            <Panel title="Membership" bodyClassName="py-2">
              <div className="divide-y divide-border">
                <InfoRow icon={Calendar} label="Joined" value={fmt(member.join_date)} />
                <InfoRow icon={Shield} label="Membership class" value={member.membership_class_completed ? 'Completed' : 'Not completed'} />
                <InfoRow icon={Heart} label="Volunteer" value={member.is_volunteer ? 'Active volunteer' : 'Not a volunteer'} />
                {member.baptism_date && <InfoRow icon={Calendar} label="Baptism" value={fmt(member.baptism_date)} />}
                <InfoRow icon={Calendar} label="Last active" value={attendanceStats?.lastActiveDate ? fmt(attendanceStats.lastActiveDate) : 'No events attended'} />
              </div>
            </Panel>
            <Panel title="Mentor" bodyClassName="py-2">
              <div className="divide-y divide-border">
                <InfoRow icon={User} label="Mentor" value={getMentorName()} />
                <InfoRow icon={Phone} label="Mentor phone" value={activeMentor?.mentor?.profiles?.phone || 'Not provided'} />
              </div>
            </Panel>
            {member.notes && (
              <Panel title="Notes"><p className="whitespace-pre-wrap text-sm text-foreground">{member.notes}</p></Panel>
            )}
          </div>

          <div className="space-y-5 lg:col-span-2">
            <Panel title="Discipleship impact" action={<span className="text-xs text-muted-foreground">Disciples' attendance</span>} bodyClassName="p-2 sm:p-3">
                <div className="h-64 rounded-xl">
                  {impactTrend && impactTrend.length > 0 ? (
                    <div className="h-full w-full">
                      {/* Legend */}
                      <div className="flex justify-between items-center p-4 pb-2">
                        <span className="text-xs text-muted-foreground">Disciples Attendance Over Time</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs">You attended</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-xs">You missed</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chart Container */}
                      <div className="relative h-48 w-full px-2">
                        <svg className="w-full h-full" viewBox="0 0 500 180">
                          {/* Grid lines */}
                          <defs>
                            <pattern id="grid" width="50" height="36" patternUnits="userSpaceOnUse">
                              <path d="M 50 0 L 0 0 0 36" fill="none" stroke="var(--muted-foreground)" strokeOpacity="0.1" strokeWidth="1"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                          
                          {/* Data visualization */}
                          {(() => {
                            const sortedData = [...impactTrend].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
                            const maxAttendance = Math.max(...sortedData.map(d => d.disciples_attended), 1);
                            const xStep = 480 / Math.max(sortedData.length - 1, 1);
                            const leftMargin = 10;
                            
                            // Generate path for line
                            const pathData = sortedData.map((event, index) => {
                              const x = leftMargin + (index * xStep);
                              const y = 160 - ((event.disciples_attended / maxAttendance) * 130);
                              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ');
                            
                            return (
                              <g>
                                {/* Y-axis labels */}
                                {[0, Math.ceil(maxAttendance/2), maxAttendance].map((value, index) => (
                                  <g key={index}>
                                    <text 
                                      x="5"
                                      y={165 - (index * 65)} 
                                      textAnchor="middle" 
                                      className="text-xs fill-muted-foreground"
                                      fontSize="10"
                                    >
                                      {value}
                                    </text>
                                  </g>
                                ))}
                                
                                {/* Trend line */}
                                {sortedData.length > 1 && (
                                  <path
                                    d={pathData}
                                    fill="none"
                                    stroke="var(--primary)"
                                    strokeWidth="2"
                                    className="animate-fade-in"
                                  />
                                )}
                                
                                {/* Data points */}
                                {sortedData.map((event, index) => {
                                  const x = leftMargin + (index * xStep);
                                  const y = 160 - ((event.disciples_attended / maxAttendance) * 130);
                                  const color = event.mentor_attended ? '#22c55e' : '#ef4444';
                                  
                                  return (
                                    <g key={index} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                                      <circle
                                        cx={x}
                                        cy={y}
                                        r="4"
                                        fill={color}
                                        stroke="white"
                                        strokeWidth="2"
                                        className="hover-scale cursor-pointer"
                                      >
                                        <title>{`${event.event_name}: ${event.disciples_attended} disciples attended${event.mentor_attended ? ' (You attended)' : ' (You missed)'}`}</title>
                                      </circle>
                                      
                                      {/* Event date labels (show more labels with better spacing) */}
                                      {sortedData.length <= 8 || index % Math.ceil(sortedData.length / 6) === 0 ? (
                                        <text
                                          x={x}
                                          y="170"
                                          textAnchor="middle"
                                          className="text-xs fill-muted-foreground"
                                          fontSize="9"
                                        >
                                           {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                         </text>
                                       ) : null}
                                     </g>
                                   );
                                 })}
                              </g>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No impact data available</p>
                        <p className="text-xs">Event attendance data needed</p>
                      </div>
                    </div>
                  )}
            </Panel>
            <FamilyRelationshipsSection memberId={member.id} />
          </div>
        </div>

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="lg:max-w-3xl">
            <SheetHeader icon={Pen} title="Edit profile" description="Update personal, spiritual and family details." />
            <DialogHeader className="sr-only">
              <DialogTitle>Edit Member Profile</DialogTitle>
              <DialogDescription>Update member information and details.</DialogDescription>
            </DialogHeader>
            <EditMemberForm member={member} onSuccess={() => setIsEditDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default MemberProfile;