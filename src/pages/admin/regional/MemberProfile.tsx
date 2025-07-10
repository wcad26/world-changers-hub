import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, Briefcase, Heart, Shield, Pen, RefreshCw } from 'lucide-react';
import { useMembers, MemberWithProfile } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth.tsx';
import EditMemberForm from '@/components/admin/regional/EditMemberForm';
import { useQueryClient } from '@tanstack/react-query';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'transferred': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'M';
  };

  if (isLoading) {
    return (
      <RegionalAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading member profile...</p>
          </div>
        </div>
      </RegionalAdminLayout>
    );
  }

  if (error || !member) {
    return (
      <RegionalAdminLayout>
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
      </RegionalAdminLayout>
    );
  }

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/regional/members')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Button>
          <div className="flex gap-2">
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
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                  {getInitials(member.profiles?.first_name, member.profiles?.last_name)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {member.profiles?.first_name} {member.profiles?.last_name}
                  </h3>
                  <p className="text-muted-foreground">{member.profiles?.email}</p>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Member ID: {member.member_id}</span>
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
              </div>

              <Separator />

              {/* Status Badge */}
              <div className="flex flex-col items-center space-y-2">
                <Badge className={getStatusColor(member.status || 'new')}>
                  {member.status || 'new'}
                </Badge>
                <Badge variant="outline" className="bg-background">
                  <Shield className="h-3 w-3 mr-1" />
                  {member.status === 'active' ? 'Active Member' : 'New Member'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Member Details Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Member Details</CardTitle>
              <p className="text-sm text-muted-foreground">Personal information and member data</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Date of Birth</label>
                    <p className="text-sm">
                      {member.profiles?.date_of_birth 
                        ? new Date(member.profiles.date_of_birth).toLocaleDateString() 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Gender</label>
                    <p className="text-sm capitalize">{member.profiles?.gender || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Occupation</label>
                    <p className="text-sm flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      {member.profiles?.occupation || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Last Active</label>
                    <p className="text-sm">
                      {member.updated_at 
                        ? new Date(member.updated_at).toLocaleDateString() 
                        : 'Not available'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Emergency Contact */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Contact Name</label>
                    <p className="text-sm flex items-center gap-2">
                      <Heart className="h-3 w-3" />
                      {member.profiles?.emergency_contact_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Contact Phone</label>
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {member.profiles?.emergency_contact_phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Membership Information */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Membership Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Membership Class</label>
                    <p className="text-sm">
                      {member.membership_class_completed ? 'Completed' : 'Not completed'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Volunteer Status</label>
                    <p className="text-sm">
                      {member.is_volunteer ? 'Active Volunteer' : 'Not a volunteer'}
                    </p>
                  </div>
                  {member.baptism_date && (
                    <div>
                      <label className="text-xs text-muted-foreground">Baptism Date</label>
                      <p className="text-sm">
                        {new Date(member.baptism_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {member.notes && (
                <>
                  <Separator />
                  <div>
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{member.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline">
            Send Message
          </Button>
          <Button variant="outline">
            View Attendance
          </Button>
        </div>

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Member Profile</DialogTitle>
              <DialogDescription>
                Update member information and details.
              </DialogDescription>
            </DialogHeader>
            {member && (
              <EditMemberForm 
                member={member} 
                onSuccess={() => setIsEditDialogOpen(false)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RegionalAdminLayout>
  );
};

export default MemberProfile;