import React, { useState } from 'react';
import { useParams, useNavigate } from '@/lib/router-compat';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Briefcase,
  Heart,
  Shield,
  Pen,
  RefreshCw,
  MessageCircle,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentDcg } from '@/hooks/useDcgFinancials';
import { useDcgMemberAttendanceStats } from '@/hooks/useDcgAttendance';
import { useMemberDiscipleshipStats } from '@/hooks/useDiscipleship';
import FamilyRelationshipsSection from '@/components/admin/regional/FamilyRelationshipsSection';
import EditMemberForm from '@/components/admin/regional/EditMemberForm';
import type { MemberWithProfile } from '@/hooks/useMembers';
import {
  RingTile,
  Initials,
  InfoRow,
  Panel,
  RoundButton,
  SheetHeader,
  EmptyState,
} from '@/components/admin/dcg/DcgUI';
import { format } from 'date-fns';

const DcgMemberProfile: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userDcg } = useAuth();
  const { data: resolvedDcg } = useCurrentDcg();
  const dcgId = userDcg?.id || resolvedDcg?.id;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    data: member,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['dcg-member-profile', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(
          `
          *,
          profiles:profile_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            state,
            gender,
            date_of_birth,
            marital_status,
            occupation
          )
        `,
        )
        .eq('id', memberId!)
        .single();
      if (error) throw error;
      return data as unknown as MemberWithProfile;
    },
    enabled: !!memberId,
  });

  const { data: dcgMembership } = useQuery({
    queryKey: ['dcg-membership-detail', dcgId, memberId],
    queryFn: async () => {
      const { data } = await supabase
        .from('dcg_members')
        .select('role, joined_date, is_active')
        .eq('dcg_id', dcgId!)
        .eq('member_id', memberId!)
        .maybeSingle();
      return data;
    },
    enabled: !!dcgId && !!memberId,
  });

  const { data: attendanceStats } = useDcgMemberAttendanceStats(memberId, dcgId);
  const { data: discipleshipStats } = useMemberDiscipleshipStats(memberId);

  if (isLoading) {
    return (
      <DcgAdminLayout>
        <div className="space-y-4">
          <div className="h-10 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-44 animate-pulse rounded-3xl bg-muted" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </DcgAdminLayout>
    );
  }

  if (!member) {
    return (
      <DcgAdminLayout>
        <div className="space-y-4">
          <RoundButton icon={ArrowLeft} label="Back to members" onClick={() => navigate('/dcg/members')} />
          <EmptyState
            icon={User}
            title="Member not found"
            hint="This member profile may have been removed or you may not have access."
          />
        </div>
      </DcgAdminLayout>
    );
  }

  const p = member.profiles as any;
  const fmt = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy') : 'Not provided');
  const fullAddress = [p?.address, p?.city, p?.state].filter(Boolean).join(', ') || 'Not provided';
  const rate = Math.round(attendanceStats?.attendanceRate || 0);
  const monthRate = Math.round(attendanceStats?.thisMonthRate || 0);
  const isActiveAttendee = attendanceStats?.isActiveBasedOnAttendance ?? true;

  return (
    <DcgAdminLayout>
      <div className="space-y-5">
        {/* Top Navigation Bar */}
        <div className="flex items-center gap-2">
          <RoundButton icon={ArrowLeft} label="Back to members" onClick={() => navigate('/dcg/members')} />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
            Members / Profile
          </p>
          <RoundButton icon={RefreshCw} label="Refresh" onClick={() => void refetch()} />
          <Button onClick={() => setIsEditDialogOpen(true)} className="h-11 gap-2 rounded-full px-4 shadow-regal">
            <Pen className="h-4 w-4" />
            <span className="hidden sm:inline">Edit profile</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>

        {/* Gradient Hero Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 left-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />

          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="rounded-full ring-4 ring-primary-foreground/25">
              <Initials size="lg" first={p?.first_name} last={p?.last_name} photo={member.photo_url} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-2xl font-bold leading-tight">
                {p?.last_name} {p?.first_name}
              </h2>
              {p?.email && <p className="truncate text-sm opacity-85">{p.email}</p>}

              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {dcgMembership?.role && (
                  <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold">
                    DCG {dcgMembership.role}
                  </span>
                )}
                <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold capitalize">
                  {member.member_type || 'member'}
                </span>
                <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold capitalize">
                  {member.status || 'new'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
                  <Shield className="h-3 w-3" /> {isActiveAttendee ? 'Active attendee' : 'Inactive attendee'}
                </span>
                {member.member_id && (
                  <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
                    ID {member.member_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {p?.phone && (
            <div className="relative mt-4 grid grid-cols-2 gap-2 sm:max-w-xs">
              <a
                href={`tel:${p.phone}`}
                className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground/15 py-2 text-sm font-semibold transition hover:bg-primary-foreground/25"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
              <a
                href={`https://wa.me/${p.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground/15 py-2 text-sm font-semibold transition hover:bg-primary-foreground/25"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          )}
        </section>

        {/* KPI Ring Tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <RingTile
            icon={Calendar}
            label={`Attended of ${attendanceStats?.totalEvents || 0} DCG`}
            value={attendanceStats?.eventsAttended || 0}
            ring={rate}
            ringLabel="rate"
            tone="var(--chart-2)"
          />
          <RingTile
            icon={TrendingUp}
            label={`This month (${attendanceStats?.thisMonthAttended || 0}/${attendanceStats?.thisMonthTotal || 0})`}
            value={`${monthRate}%`}
            ring={monthRate}
            ringLabel="month"
            tone="var(--chart-1)"
          />
          <RingTile
            icon={Users}
            label="Disciples mentored"
            value={discipleshipStats?.total_disciples || 0}
            tone="var(--chart-3)"
          />
          <RingTile
            icon={Heart}
            label="Milestone success"
            value={`${Math.round(discipleshipStats?.success_rate || 0)}%`}
            ring={discipleshipStats?.success_rate || 0}
            ringLabel="success"
            tone="var(--chart-4)"
          />
        </div>

        {/* Details & Relationships */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-1">
            <Panel title="Personal & Contact" bodyClassName="py-2">
              <div className="divide-y divide-border">
                <InfoRow icon={Phone} label="Phone" value={p?.phone || 'Not provided'} />
                <InfoRow icon={Mail} label="Email" value={p?.email || 'Not provided'} />
                <InfoRow icon={MapPin} label="Address" value={fullAddress} />
                <InfoRow icon={Calendar} label="Date of birth" value={fmt(p?.date_of_birth)} />
                <InfoRow
                  icon={User}
                  label="Gender"
                  value={<span className="capitalize">{p?.gender || 'Not provided'}</span>}
                />
                {p?.marital_status && (
                  <InfoRow
                    icon={Heart}
                    label="Marital status"
                    value={<span className="capitalize">{p.marital_status}</span>}
                  />
                )}
                {p?.occupation && <InfoRow icon={Briefcase} label="Occupation" value={p.occupation} />}
              </div>
            </Panel>

            <Panel title="DCG & Membership" bodyClassName="py-2">
              <div className="divide-y divide-border">
                <InfoRow icon={Users} label="DCG Role" value={dcgMembership?.role || 'Member'} />
                <InfoRow icon={Calendar} label="Joined DCG" value={fmt(dcgMembership?.joined_date)} />
                <InfoRow icon={Calendar} label="Joined Church" value={fmt(member.join_date)} />
                <InfoRow
                  icon={Shield}
                  label="Membership class"
                  value={member.membership_class_completed ? 'Completed' : 'Not completed'}
                />
                <InfoRow
                  icon={Heart}
                  label="Volunteer"
                  value={member.is_volunteer ? 'Active volunteer' : 'Not a volunteer'}
                />
                {member.baptism_date && (
                  <InfoRow icon={Calendar} label="Baptism" value={fmt(member.baptism_date)} />
                )}
                <InfoRow
                  icon={Calendar}
                  label="Last DCG gathering"
                  value={
                    attendanceStats?.lastActiveDate
                      ? fmt(attendanceStats.lastActiveDate)
                      : 'No gatherings recorded'
                  }
                />
              </div>
            </Panel>

            {member.notes && (
              <Panel title="Notes">
                <p className="whitespace-pre-wrap text-sm text-foreground">{member.notes}</p>
              </Panel>
            )}
          </div>

          <div className="space-y-5 lg:col-span-2">
            {/* Recent DCG Gatherings */}
            <Panel
              title="Recent DCG Gatherings"
              action={<span className="text-xs text-muted-foreground">Last 3 recorded</span>}
            >
              {attendanceStats?.last3EventsAttendance && attendanceStats.last3EventsAttendance.length > 0 ? (
                <ul className="divide-y divide-border">
                  {attendanceStats.last3EventsAttendance.map((ev, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{ev.eventName}</p>
                        <p className="text-xs text-muted-foreground">{fmt(ev.eventDate)}</p>
                      </div>
                      {ev.isPresent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/12 px-2.5 py-1 text-xs font-semibold text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          <XCircle className="h-3.5 w-3.5" /> Absent
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No DCG attendance records yet for this member.
                </p>
              )}
            </Panel>

            <FamilyRelationshipsSection memberId={member.id} />
          </div>
        </div>

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl lg:max-w-3xl">
            <SheetHeader
              icon={Pen}
              title="Edit profile"
              description="Update personal, spiritual and family details."
            />
            <DialogHeader className="sr-only">
              <DialogTitle>Edit Member Profile</DialogTitle>
              <DialogDescription>Update member information and details.</DialogDescription>
            </DialogHeader>
            <EditMemberForm
              member={member}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                void queryClient.invalidateQueries({ queryKey: ['dcg-member-profile', memberId] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgMemberProfile;
