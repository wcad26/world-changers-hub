import React from 'react';
import { useNavigate } from '@/lib/router-compat';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import {
  MessageSquare,
  Bell,
  Phone,
  Heart,
  BookOpen,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentDcg } from '@/hooks/useDcgFinancials';
import { ComingSoonPanel, Panel } from '@/components/admin/dcg/DcgUI';

const DcgCommunication: React.FC = () => {
  const navigate = useNavigate();
  const { userDcg } = useAuth();
  const { data: resolvedDcg } = useCurrentDcg();
  const dcgName = resolvedDcg?.name || userDcg?.name || 'your DCG';

  return (
    <DcgAdminLayout>
      <div className="space-y-4 sm:space-y-5">
        <ComingSoonPanel
          icon={MessageSquare}
          title="DCG Communication Hub"
          text={`Broadcast group updates, send automated gathering reminders, and share study guides with members of ${dcgName} — all from one place.`}
          features={[
            { icon: Bell, label: 'Group Announcements' },
            { icon: Phone, label: 'WhatsApp & SMS Alerts' },
            { icon: Heart, label: 'Prayer Request Board' },
            { icon: BookOpen, label: 'Study & Meeting Guides' },
          ]}
        />

        <Panel>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="font-heading text-sm font-semibold text-foreground">
                  Need to reach a member right now?
                </p>
                <p className="text-xs text-muted-foreground">
                  Open any member profile from your directory to call or message them directly on WhatsApp.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/dcg/members')}
              className="w-full shrink-0 rounded-full sm:w-auto"
            >
              Open Member Directory
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </Panel>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgCommunication;
