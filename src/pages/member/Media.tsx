import { Play, Mic, Video, Headphones, Bookmark } from 'lucide-react';
import { ComingSoonPanel } from '@/components/member/MemberUI';

export default function MemberMedia() {
  return (
    <ComingSoonPanel icon={Play} title="Sermons & teachings are on the way"
      text="Soon you'll be able to watch and listen to WCA messages, save favourites and pick up where you left off."
      features={[{ icon: Mic, label: 'Sermons' }, { icon: Video, label: 'Videos' }, { icon: Headphones, label: 'Audio teachings' }, { icon: Bookmark, label: 'Bookmarks' }]} />
  );
}
