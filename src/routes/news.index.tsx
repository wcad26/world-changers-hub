import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Newspaper, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { NewsCard } from '@/components/news/NewsCard';
import { latestNewsQueryOptions } from '@/lib/public-site.functions';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/news/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(latestNewsQueryOptions(60)),
  head: () => ({ meta: [
    { title: 'News & Stories | World Changers Association' },
    { name: 'description', content: 'The latest news, updates and stories from World Changers Association regions around the world.' },
    { property: 'og:title', content: 'News & Stories | World Changers Association' },
    { property: 'og:description', content: 'The latest news, updates and stories from World Changers Association regions around the world.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: NewsIndex,
});

function NewsIndex() {
  const { data: items } = useSuspenseQuery(latestNewsQueryOptions(60));
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const cats = useMemo(() => ['All', ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const shown = items.filter((i) => (cat === 'All' || i.category === cat) && `${i.title} ${i.summary}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24">
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
          <div className="container-custom relative py-14 sm:py-20">
            <p className="text-xs font-semibold uppercase text-secondary">Newsroom</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold sm:text-5xl">News & stories from our movement</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">Updates, testimonies and announcements from every WCA region.</p>
            <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative md:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stories" className="pl-9" /></div>
              <div className="flex flex-wrap gap-2">{cats.map((c) => <button key={c} type="button" onClick={() => setCat(c)} className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors', cat === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}>{c}</button>)}</div>
            </div>
          </div>
        </section>
        <section className="container-custom py-12">
          {shown.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{shown.map((i) => <NewsCard key={i.id} item={i} />)}</div>
          ) : (
            <div className="py-20 text-center"><Newspaper className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No stories found.</p></div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
