// DEMO DATA ONLY — placeholder content for designing the Media, Store and Counseling
// member pages. Replace with real queries when those systems are built.

export type MediaKind = 'video' | 'audio' | 'notes';
export interface MediaItem {
  id: string; title: string; speaker: string; series: string; category: string;
  kind: MediaKind; date: string; minutes: number; tone: number; summary: string; featured?: boolean;
}

export const mediaCategories = ['Sunday Celebration', 'Grace School', 'Leadership', 'Worship', 'IGNITE Youth'];

export const mediaItems: MediaItem[] = [
  { id: 'm1', title: 'Walking in Dominion: The Supernatural Mindset', speaker: 'Pastor Whitson Tim', series: 'Kingdom Mindset', category: 'Sunday Celebration', kind: 'video', date: '27/09/2026', minutes: 48, tone: 1, featured: true, summary: 'How renewing the mind positions believers to rule and reign in every sphere of life.' },
  { id: 'm2', title: 'Kingdom Economics, Part 1', speaker: 'Rev. Grace Ekane', series: 'Kingdom Economics', category: 'Grace School', kind: 'audio', date: '20/09/2026', minutes: 36, tone: 2, summary: 'Biblical principles of stewardship, sowing and generosity.' },
  { id: 'm3', title: 'Kingdom Economics, Part 2', speaker: 'Rev. Grace Ekane', series: 'Kingdom Economics', category: 'Grace School', kind: 'audio', date: '21/09/2026', minutes: 41, tone: 2, summary: 'Building wealth with purpose and integrity.' },
  { id: 'm4', title: 'Leading From the Inside Out', speaker: 'Pastor Carine Ngambe', series: 'Servant Leaders', category: 'Leadership', kind: 'video', date: '13/09/2026', minutes: 52, tone: 3, summary: 'Character before charisma: the inner life of a leader.' },
  { id: 'm5', title: 'Night of Worship — Live Session', speaker: 'WCA Worship Team', series: 'Worship Nights', category: 'Worship', kind: 'video', date: '06/09/2026', minutes: 74, tone: 4, summary: 'A full evening of praise and worship recorded live in Douala.' },
  { id: 'm6', title: 'The Power of Faith — Study Notes', speaker: 'Pastor Whitson Tim', series: 'The Power of Faith', category: 'Grace School', kind: 'notes', date: '30/08/2026', minutes: 12, tone: 5, summary: 'Printable outline with scriptures and discussion questions.' },
  { id: 'm7', title: 'Campus Revolution: Your Purpose Now', speaker: 'IGNITE Team', series: 'IGNITE', category: 'IGNITE Youth', kind: 'video', date: '23/08/2026', minutes: 39, tone: 6, summary: 'A call for students to live boldly for Christ on campus.' },
  { id: 'm8', title: 'Divine Health and Wholeness', speaker: 'Rev. Grace Ekane', series: 'Divine Health', category: 'Sunday Celebration', kind: 'audio', date: '16/08/2026', minutes: 45, tone: 7, summary: 'Walking in the healing provided through the finished work of Christ.' },
];

export interface Product {
  id: string; name: string; author: string; category: string; format: string;
  price: number; rating: number; stock: number; tone: number; description: string; featured?: boolean;
}

export const storeCategories = ['Books', 'Devotionals', 'Apparel', 'Audiobooks', 'Bundles'];

export const products: Product[] = [
  { id: 'p1', name: 'The Anointed Vessel', author: 'Pastor Whitson Tim', category: 'Books', format: 'Paperback', price: 7500, rating: 4.9, stock: 24, tone: 1, featured: true, description: 'A practical guide to living a consecrated life that carries God’s presence.' },
  { id: 'p2', name: '365 Days of Grace', author: 'WCA Publications', category: 'Devotionals', format: 'Hardcover', price: 12000, rating: 4.8, stock: 12, tone: 2, description: 'Daily scripture, reflection and prayer for the whole year.' },
  { id: 'p3', name: 'World Changer Tee', author: 'WCA Apparel', category: 'Apparel', format: 'Cotton · S–XXL', price: 6000, rating: 4.7, stock: 40, tone: 3, description: 'Soft cotton t-shirt with the “Change your World” slogan.' },
  { id: 'p4', name: 'Kingdom Economics', author: 'Rev. Grace Ekane', category: 'Audiobooks', format: 'Digital audio', price: 3500, rating: 4.6, stock: 999, tone: 4, description: 'The full Grace School series in audio, ready to download.' },
  { id: 'p5', name: 'Foundation School Pack', author: 'WCA Publications', category: 'Bundles', format: 'Book + workbook', price: 9000, rating: 5, stock: 3, tone: 5, description: 'Everything a new believer needs for Foundation School.' },
  { id: 'p6', name: 'Leaders’ Journal', author: 'WCA Publications', category: 'Books', format: 'Hardcover', price: 5500, rating: 4.5, stock: 0, tone: 6, description: 'A guided journal for DCG leaders and servants.' },
  { id: 'p7', name: 'Retreat 2026 Hoodie', author: 'WCA Apparel', category: 'Apparel', format: 'Fleece · S–XXL', price: 15000, rating: 4.9, stock: 8, tone: 7, description: 'Limited edition hoodie from the 2026 Annual Retreat.' },
  { id: 'p8', name: 'Morning Prayers (FR/EN)', author: 'WCA Publications', category: 'Devotionals', format: 'E-book', price: 2500, rating: 4.4, stock: 999, tone: 1, description: 'Bilingual morning prayers for every day of the month.' },
];

export const demoOrders = [
  { id: 'WCA-ORD-1042', date: '14/09/2026', items: 2, total: 13500, status: 'Ready for pickup', code: 'PK-7731' },
  { id: 'WCA-ORD-0988', date: '02/08/2026', items: 1, total: 7500, status: 'Collected', code: 'PK-6120' },
];

export interface Counselor {
  id: string; name: string; title: string; specialties: string[]; languages: string; next: string; initials: string; tone: number;
}

export const counselingAreas = [
  { key: 'marriage', label: 'Marriage & Family' },
  { key: 'spiritual', label: 'Spiritual Guidance' },
  { key: 'career', label: 'Career & Purpose' },
  { key: 'grief', label: 'Emotional Care & Grief' },
  { key: 'youth', label: 'Youth & Campus' },
];

export const counselors: Counselor[] = [
  { id: 'c1', name: 'Tim Whitson', title: 'Senior Pastor', specialties: ['marriage', 'spiritual'], languages: 'English · French', next: 'Tue 06/10 · 10:00', initials: 'WT', tone: 1 },
  { id: 'c2', name: 'Ekane Grace', title: 'Associate Pastor', specialties: ['grief', 'marriage'], languages: 'English', next: 'Wed 07/10 · 14:00', initials: 'GE', tone: 2 },
  { id: 'c3', name: 'Ngambe Carine', title: 'Pastoral Counselor', specialties: ['career', 'spiritual'], languages: 'English · French', next: 'Thu 08/10 · 16:30', initials: 'CN', tone: 3 },
  { id: 'c4', name: 'Atemkeng Claudia', title: 'Youth Pastor', specialties: ['youth', 'career'], languages: 'French', next: 'Sat 10/10 · 11:00', initials: 'CA', tone: 4 },
];

export const timeSlots = ['09:00', '10:00', '11:30', '14:00', '15:30', '17:00'];

export const demoAppointments = [
  { id: 'a1', counselor: 'Tim Whitson', area: 'Spiritual Guidance', date: '09/10/2026', time: '10:00', format: 'In person', status: 'Confirmed' },
  { id: 'a2', counselor: 'Ekane Grace', area: 'Marriage & Family', date: '12/09/2026', time: '14:00', format: 'Video call', status: 'Completed' },
];

export const counselingFaqs = [
  { q: 'Is everything I share confidential?', a: 'Yes. Sessions are private between you and your counselor, except where someone’s safety is at risk.' },
  { q: 'How does pre-marital counseling work?', a: 'Couples attend a series of sessions with a pastor before the wedding, covering communication, finances and faith.' },
  { q: 'Can I bring a family member?', a: 'Yes — mention it in your booking notes and your counselor will plan for it.' },
  { q: 'Is there a cost?', a: 'No. Pastoral counseling is free for all members and visitors.' },
];

export const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
export const toneVar = (t: number) => `var(--chart-${t})`;
