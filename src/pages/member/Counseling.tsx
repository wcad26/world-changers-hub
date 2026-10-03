import { MessageCircle, CalendarClock, ShieldCheck, Users, HeartHandshake } from 'lucide-react';
import { ComingSoonPanel } from '@/components/member/MemberUI';

export default function MemberCounseling() {
  return (
    <div className="space-y-4">
      <ComingSoonPanel icon={MessageCircle} title="Online counseling booking is coming"
        text="You'll soon be able to request a confidential session with a pastor or counselor and choose a time that suits you."
        features={[{ icon: CalendarClock, label: 'Pick a time' }, { icon: ShieldCheck, label: 'Confidential' }, { icon: Users, label: 'Pastors & counselors' }, { icon: HeartHandshake, label: 'Follow-up care' }]} />
      <p className="text-center text-sm text-muted-foreground">Need to talk now? Please reach out to your branch leadership or DCG leader directly.</p>
    </div>
  );
}
