import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FamilyRelationshipsSection from '@/components/admin/regional/FamilyRelationshipsSection';

const DcgMemberProfile = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const { data: member, isLoading } = useQuery({
    queryKey: ['dcg-member-profile', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          profiles:profile_id (
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            state,
            gender,
            date_of_birth,
            marital_status
          )
        `)
        .eq('id', memberId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  if (isLoading) {
    return (
      <DcgAdminLayout>
        <div className="space-y-4 p-4 md:p-0">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DcgAdminLayout>
    );
  }

  if (!member) {
    return (
      <DcgAdminLayout>
        <div className="p-4 md:p-0">
          <Button variant="ghost" onClick={() => navigate('/dcg/members')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Members
          </Button>
          <p className="text-muted-foreground">Member not found.</p>
        </div>
      </DcgAdminLayout>
    );
  }

  const profile = member.profiles as any;

  return (
    <DcgAdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0 px-[10px]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dcg/members')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {profile?.last_name} {profile?.first_name}
            </h1>
            <p className="text-sm text-muted-foreground">Member Profile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Info */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-3">
              <InfoRow label="Member ID" value={member.member_id} />
              <InfoRow label="Type" value={<Badge>{member.member_type}</Badge>} />
              <InfoRow label="Status" value={<Badge variant={member.status === 'active' ? 'default' : 'secondary'}>{member.status}</Badge>} />
              {profile?.gender && <InfoRow label="Gender" value={profile.gender} />}
              {profile?.date_of_birth && (
                <InfoRow label="Date of Birth" value={new Date(profile.date_of_birth).toLocaleDateString()} />
              )}
              {profile?.marital_status && <InfoRow label="Marital Status" value={profile.marital_status} />}
              {member.join_date && (
                <InfoRow
                  label="Join Date"
                  value={
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(member.join_date).toLocaleDateString()}
                    </span>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-3">
              {profile?.email && (
                <InfoRow
                  label="Email"
                  value={
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {profile.email}
                    </span>
                  }
                />
              )}
              {profile?.phone && (
                <InfoRow
                  label="Phone"
                  value={
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {profile.phone}
                    </span>
                  }
                />
              )}
              {(profile?.address || profile?.city || profile?.state) && (
                <InfoRow
                  label="Address"
                  value={
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[profile.address, profile.city, profile.state].filter(Boolean).join(', ')}
                    </span>
                  }
                />
              )}
            </CardContent>
          </Card>

          {member?.id && (
            <FamilyRelationshipsSection memberId={member.id} readOnly />
          )}
        </div>
      </div>
    </DcgAdminLayout>
  );
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
    <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

export default DcgMemberProfile;
