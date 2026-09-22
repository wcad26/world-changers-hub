import React from 'react';
import { useParams, useNavigate } from '@/lib/router-compat';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, Briefcase, Heart, Shield, Pen, RefreshCw, ArrowRightLeft, History } from 'lucide-react';
import { useMemberById } from '@/hooks/useAllMembers';
import EditMemberForm from '@/components/admin/regional/EditMemberForm';
import { useQueryClient } from '@tanstack/react-query';
import { useMemberDiscipleshipStats, useDiscipleshipImpactTrend, useMemberDiscipleshipRelationships } from '@/hooks/useDiscipleship';
import { useMemberAttendanceStats } from '@/hooks/useAttendance';
import MemberPhotoUpload from '@/components/admin/regional/MemberPhotoUpload';
import TransferMemberDialog from '@/components/admin/super/TransferMemberDialog';
import { useMemberTransferHistory } from '@/hooks/useMemberTransfer';
import FamilyRelationshipsSection from '@/components/admin/regional/FamilyRelationshipsSection';

const SuperMemberProfile: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: member, isLoading, error, refetch } = useMemberById(memberId);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = React.useState(false);

  // Fetch real discipleship data
  const { data: discipleshipStats } = useMemberDiscipleshipStats(member?.id);
  const { data: impactTrend } = useDiscipleshipImpactTrend(member?.id, member?.region_id);
  const { data: discipleshipRelationships } = useMemberDiscipleshipRelationships(member?.id);
  
  // Fetch real attendance data
  const { data: attendanceStats } = useMemberAttendanceStats(member?.id, member?.region_id);
  const { data: transferHistory = [] } = useMemberTransferHistory(member?.id);

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

  if (isLoading) {
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
              onClick={() => navigate('/admin/super/members')}
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/super/members')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsTransferDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer Region
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Pen className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button 
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Member Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  {member.photo_url ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                      <img 
                        src={member.photo_url} 
                        alt={`${member.profiles?.last_name} ${member.profiles?.first_name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                      {getInitials(member.profiles?.first_name ?? undefined, member.profiles?.last_name ?? undefined)}
                    </div>
                  )}
                  <MemberPhotoUpload 
                    memberId={member.id}
                    currentPhotoUrl={member.photo_url ?? undefined}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {member.profiles?.last_name} {member.profiles?.first_name}
                  </h3>
                  <p className="text-muted-foreground">{member.profiles?.email}</p>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Mentor: {getMentorName()}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined: {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                {member.profiles?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{member.profiles.phone}</span>
                  </div>
                )}

                {member.profiles?.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{member.profiles.address}</span>
                  </div>
                )}
                
                {member.regions && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Region: {member.regions.name}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Status Badge */}
              <div className="flex flex-col items-center space-y-2">
                <Badge className={getStatusColor(member.status || 'new')}>
                  {member.status || 'new'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`bg-background ${
                    attendanceStats?.isActiveBasedOnAttendance 
                      ? 'text-green-600 border-green-200' 
                      : 'text-red-600 border-red-200'
                  }`}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {attendanceStats?.isActiveBasedOnAttendance ? 'Active Member' : 'Inactive Member'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Member Attendance Summary Dashboard */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Attendance & Impact Summary</CardTitle>
              <p className="text-sm text-muted-foreground">Track member's engagement and discipleship impact</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground">Events Attended</div>
                  <div className="text-2xl font-bold text-primary">
                    {attendanceStats?.eventsAttended || 0}
                  </div>
                  <div className="text-xs text-green-600">
                    of {attendanceStats?.totalEvents || 0} total
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground">Attendance Rate</div>
                  <div className="text-2xl font-bold text-primary">
                    {attendanceStats?.attendanceRate ? `${Math.round(attendanceStats.attendanceRate)}%` : '0%'}
                  </div>
                  <div className={`text-xs ${
                    (attendanceStats?.monthlyChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {attendanceStats?.monthlyChange ? 
                      `${attendanceStats.monthlyChange >= 0 ? '+' : ''}${Math.round(attendanceStats.monthlyChange)}% this month` : 
                      'No change'
                    }
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground">Disciples</div>
                  <div className="text-2xl font-bold text-primary">
                    {discipleshipStats?.total_disciples || 0}
                  </div>
                  <div className="text-xs text-blue-600">Total disciples</div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                  <div className="text-2xl font-bold text-primary">
                    {discipleshipStats?.success_rate ? `${Math.round(discipleshipStats.success_rate)}%` : '0%'}
                  </div>
                  <div className="text-xs text-green-600">Became members</div>
                </div>
              </div>

              <Separator />

              {/* Discipleship Impact Trend */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Discipleship Impact Trend</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Shows how event attendance impacts disciples' participation
                </p>
                <div className="h-64 border rounded-lg bg-muted/20">
                  {impactTrend && impactTrend.length > 0 ? (
                    <div className="h-full w-full">
                      {/* Legend */}
                      <div className="flex justify-between items-center p-4 pb-2">
                        <span className="text-xs text-muted-foreground">Disciples Attendance Over Time</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs">Attended</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-xs">Missed</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chart Container */}
                      <div className="relative h-48 w-full px-2">
                        <svg className="w-full h-full" viewBox="0 0 500 180">
                          {/* Grid lines */}
                          <defs>
                            <pattern id="grid" width="50" height="36" patternUnits="userSpaceOnUse">
                              <path d="M 50 0 L 0 0 0 36" fill="none" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.1" strokeWidth="1"/>
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
                                    stroke="hsl(var(--primary))"
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
                                        <title>{`${event.event_name}: ${event.disciples_attended} disciples attended${event.mentor_attended ? ' (Attended)' : ' (Missed)'}`}</title>
                                      </circle>
                                      
                                      {/* Event date labels */}
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
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No discipleship impact data available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Member Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">
                    {member.profiles?.date_of_birth 
                      ? new Date(member.profiles.date_of_birth).toLocaleDateString() 
                      : 'Not provided'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="text-sm font-medium capitalize">{member.profiles?.gender || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="text-sm font-medium">{member.profiles?.occupation || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Active</p>
                  <p className="text-sm font-medium">
                    {member.updated_at 
                      ? new Date(member.updated_at).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Membership Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Membership Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Membership Class</p>
                  <Badge variant={member.membership_class_completed ? "default" : "outline"}>
                    {member.membership_class_completed ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Volunteer Status</p>
                  <Badge variant={member.is_volunteer ? "default" : "outline"}>
                    {member.is_volunteer ? 'Active' : 'Not Active'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Baptism Date</p>
                  <p className="text-sm font-medium">
                    {member.baptism_date 
                      ? new Date(member.baptism_date).toLocaleDateString() 
                      : 'Not baptized'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {member.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Notes</h3>
                  <p className="text-sm text-muted-foreground">{member.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transfer History */}
        {transferHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transfer History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transferHistory.map((transfer: any) => (
                  <div key={transfer.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 text-sm space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{transfer.from_region?.name}</Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge>{transfer.to_region?.name}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transfer.old_member_code} → {transfer.new_member_code}
                      </p>
                      {transfer.reason && (
                        <p className="text-xs"><strong>Reason:</strong> {transfer.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(transfer.transferred_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Family Relationships */}
        {member && (
          <FamilyRelationshipsSection memberId={member.id} />
        )}

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Member Profile</DialogTitle>
              <DialogDescription>
                Update member information and save changes.
              </DialogDescription>
            </DialogHeader>
            <EditMemberForm 
              member={member}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Transfer Member Dialog */}
        {member && (
          <TransferMemberDialog
            open={isTransferDialogOpen}
            onOpenChange={setIsTransferDialogOpen}
            member={member}
            onSuccess={() => refetch()}
          />
        )}
      </div>
    </>
  );
};

export default SuperMemberProfile;
