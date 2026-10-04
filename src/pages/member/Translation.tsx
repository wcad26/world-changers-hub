import { Languages, Mic, Captions, Headphones, Globe } from 'lucide-react';
import { ComingSoonPanel } from '@/components/member/MemberUI';

export default function MemberTranslation() {
  return (
    <ComingSoonPanel
      icon={Languages}
      title="Live translation is coming"
      text="During meetings, pick your language and press start — everything the speaker says will reach you in your own language, as text and audio, in real time."
      features={[
        { icon: Globe, label: 'Choose your language' },
        { icon: Mic, label: 'Live speaker capture' },
        { icon: Captions, label: 'Real-time captions' },
        { icon: Headphones, label: 'Audio streaming' },
      ]}
    />
  );
}
