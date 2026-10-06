import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, ExternalLink, MapPin, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { NewsCard } from '@/components/news/NewsCard';
import { latestNewsQueryOptions, newsArticleQueryOptions } from '@/lib/public-site.functions';

export const Route = createFileRoute('/news/$slug')({
  loader: async ({ context, params }) => {
    const article = await context.queryClient.ensureQueryData(newsArticleQueryOptions(params.slug));
    if (!article) throw notFound();
    await context.queryClient.ensureQueryData(latestNewsQueryOptions(4)).catch(() => null);
    return { title: article.title, summary: article.summary, image: article.image_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: 'Story not found | World Changers Association' }, { name: 'robots', content: 'noindex' }] };
    const title = `${loaderData.title} | WCA News`;
    const img = loaderData.image?.startsWith('https://') ? loaderData.image : null;
    return { meta: [
      { title }, { name: 'description', content: loaderData.summary },
      { property: 'og:title', content: title }, { property: 'og:description', content: loaderData.summary },
      { property: 'og:type', content: 'article' }, { name: 'twitter:card', content: 'summary_large_image' },
      ...(img ? [{ property: 'og:image', content: img }, { name: 'twitter:image', content: img }] : []),
    ] };
  },
  notFoundComponent: ArticleNotFound,
  component: ArticlePage,
});

function ArticleNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background"><Navbar />
      <main className="container-custom flex-1 py-40 text-center"><h1 className="text-3xl font-semibold">Story not found</h1><p className="mt-3 text-muted-foreground">It may have been removed or unpublished.</p><Button asChild className="mt-6"><Link to="/news">Back to news</Link></Button></main>
      <Footer /></div>
  );
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: a } = useSuspenseQuery(newsArticleQueryOptions(slug));
  const { data: more } = useSuspenseQuery(latestNewsQueryOptions(4));
  if (!a) return <ArticleNotFound />;
  const related = more.filter((m) => m.id !== a.id).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="relative min-h-[60vh] overflow-hidden bg-event-background text-event-foreground">
          {a.image_url && <img src={a.image_url} alt={a.title} className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-event-background via-event-background/70 to-event-background/20" />
          <div className="container-custom relative flex min-h-[60vh] flex-col justify-end pb-12 pt-32">
            <Link to="/news" className="mb-6 inline-flex w-fit items-center gap-2 text-sm text-event-muted hover:text-event-foreground"><ArrowLeft className="h-4 w-4" />All news</Link>
            <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase text-secondary-foreground">{a.category}</span>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold text-event-foreground sm:text-5xl">{a.title}</h1>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-event-muted">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(a.published_at), 'dd/MM/yyyy')}</span>
              {a.author_name && <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{a.author_name}</span>}
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{a.regions?.name ?? 'Global'}</span>
            </div>
          </div>
        </section>
        <article className="container-custom max-w-3xl py-14">
          <p className="text-xl leading-9 text-foreground">{a.summary}</p>
          {a.content && <div className="mt-8 space-y-5 whitespace-pre-line text-base leading-8 text-muted-foreground">{a.content}</div>}
          {a.external_url && <Button asChild className="mt-8"><a href={a.external_url} target="_blank" rel="noopener noreferrer">Read the full story<ExternalLink /></a></Button>}
        </article>
        {related.length > 0 && (
          <section className="border-t border-border bg-muted/35 py-14">
            <div className="container-custom"><h2 className="mb-8 text-2xl font-semibold">More stories</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <NewsCard key={r.id} item={r} />)}</div></div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
