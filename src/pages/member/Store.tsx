import { ShoppingBag, BookOpen, Library, Package, Heart } from 'lucide-react';
import { ComingSoonPanel } from '@/components/member/MemberUI';

export default function MemberStore() {
  return (
    <ComingSoonPanel icon={ShoppingBag} title="The WCA store & library is coming"
      text="Browse books and resources, borrow from the church library and order items for collection at your branch."
      features={[{ icon: BookOpen, label: 'Books' }, { icon: Library, label: 'Library loans' }, { icon: Package, label: 'Orders' }, { icon: Heart, label: 'Wishlist' }]} />
  );
}
