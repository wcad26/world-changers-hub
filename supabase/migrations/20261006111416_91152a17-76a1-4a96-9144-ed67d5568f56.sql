CREATE TABLE public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text NOT NULL DEFAULT '',
  content text,
  image_url text,
  external_url text,
  category text NOT NULL DEFAULT 'News',
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  author_name text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX news_articles_pub_idx ON public.news_articles (is_published, published_at DESC);
GRANT SELECT ON public.news_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_articles TO authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published news is public" ON public.news_articles FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY "Super admins manage all news" ON public.news_articles FOR ALL TO authenticated
  USING (public.is_super_admin_user(auth.uid())) WITH CHECK (public.is_super_admin_user(auth.uid()));
CREATE POLICY "Regional admins manage their region news" ON public.news_articles FOR ALL TO authenticated
  USING (region_id IS NOT NULL AND public.has_regional_permission(auth.uid(), region_id, 'communication_create'))
  WITH CHECK (region_id IS NOT NULL AND public.has_regional_permission(auth.uid(), region_id, 'communication_create'));

CREATE TRIGGER news_articles_set_updated BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();