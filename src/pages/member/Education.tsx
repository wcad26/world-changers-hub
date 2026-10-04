import { GraduationCap, BookOpen, Award, CalendarClock, Users } from 'lucide-react';
import { ComingSoonPanel } from '@/components/member/MemberUI';

export default function MemberEducation() {
  return (
    <ComingSoonPanel
      icon={GraduationCap}
      title="WCA School is on its way"
      text="Enroll in courses, study at your own pace, track your progress and earn certificates — all from your member account."
      features={[
        { icon: BookOpen, label: 'Course catalogue' },
        { icon: Users, label: 'Easy enrollment' },
        { icon: CalendarClock, label: 'Lessons & schedules' },
        { icon: Award, label: 'Certificates' },
      ]}
    />
  );
}
