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

/** Demo videos shown on the Media page until the YouTube channel is linked. */
import type { MediaVideo } from '@/lib/media.functions';
export const demoMediaVideos: MediaVideo[] = [
  { id: 'aqz-KE-bpKQ', title: 'Walking in Dominion — Sunday Celebration Service', description: 'A powerful message on walking in the dominion God has given every believer.\n\nRecorded live at WCA Douala during the Sunday Celebration Service.', published: '2026-10-18T09:00:00Z', thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg', views: 12400, channel: 'WCA Media' },
  { id: 'LXb3EKWsInQ', title: 'Grace School: The Finished Work of Christ (Part 3)', description: 'Part 3 of our Grace School series on the finished work of Christ and what it means for your daily life.', published: '2026-10-11T09:00:00Z', thumbnail: 'https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg', views: 8300, channel: 'WCA Media' },
  { id: 'eRsGyueVLvQ', title: 'IGNITE Youth: Bold Faith for a New Generation', description: 'Highlights and message from the IGNITE Campus Revolution youth gathering.', published: '2026-10-04T09:00:00Z', thumbnail: 'https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg', views: 5100, channel: 'WCA Media' },
  { id: 'YE7VzlLtp-4', title: 'Worship Night: Sounds of Heaven (Full Session)', description: 'An evening of worship and prayer with the WCA worship team.', published: '2026-09-27T18:00:00Z', thumbnail: 'https://i.ytimg.com/vi/YE7VzlLtp-4/hqdefault.jpg', views: 15600, channel: 'WCA Media' },
];

export interface LibraryBook {
  id: string; title: string; author: string; genre: string; pages: number; tone: number;
  price: number; rentPerWeek: number; copies: number; available: number; description: string;
}

export const libraryGenres = ['Christian living', 'Prayer', 'Leadership', 'Bible study', 'Family'];

export const libraryBooks: LibraryBook[] = [
  { id: 'b1', title: 'The Anointed Vessel', author: 'Pastor Whitson Tim', genre: 'Christian living', pages: 212, tone: 1, price: 7500, rentPerWeek: 500, copies: 6, available: 4, description: 'Living a consecrated life that carries God’s presence.' },
  { id: 'b2', title: 'Prayer That Moves Mountains', author: 'Rev. Grace Ekane', genre: 'Prayer', pages: 180, tone: 2, price: 6000, rentPerWeek: 500, copies: 4, available: 0, description: 'A practical school of prayer for every believer.' },
  { id: 'b3', title: 'Servant Leadership', author: 'WCA Publications', genre: 'Leadership', pages: 240, tone: 3, price: 8000, rentPerWeek: 700, copies: 5, available: 2, description: 'Leading DCGs and teams with the heart of Christ.' },
  { id: 'b4', title: 'Through the Gospels', author: 'Ngambe Carine', genre: 'Bible study', pages: 320, tone: 4, price: 9500, rentPerWeek: 700, copies: 3, available: 3, description: 'A 90-day guided study through Matthew, Mark, Luke and John.' },
  { id: 'b5', title: 'Building a Godly Home', author: 'Pastor Whitson Tim', genre: 'Family', pages: 198, tone: 5, price: 7000, rentPerWeek: 500, copies: 4, available: 1, description: 'Marriage, parenting and faith at home.' },
  { id: 'b6', title: 'Grace for Today', author: 'WCA Publications', genre: 'Christian living', pages: 150, tone: 6, price: 5000, rentPerWeek: 400, copies: 8, available: 6, description: 'Short readings to strengthen your walk with God.' },
];

export const demoRentals = [
  { id: 'r1', bookId: 'b3', borrowed: '01/10/2026', due: '15/10/2026', status: 'Active' },
];
