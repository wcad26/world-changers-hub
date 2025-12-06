-- Create bible_versions table to track all versions (stored and API-based)
CREATE TABLE public.bible_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  is_stored boolean NOT NULL DEFAULT false,
  api_id text, -- API.Bible version ID for API-based versions
  description text,
  copyright_info text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create bible_books table (66 books)
CREATE TABLE public.bible_books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_number integer NOT NULL,
  name text NOT NULL,
  name_fr text,
  abbreviation text NOT NULL,
  testament text NOT NULL CHECK (testament IN ('OT', 'NT')),
  chapters_count integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(book_number)
);

-- Create bible_verses table for stored versions
CREATE TABLE public.bible_verses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id uuid NOT NULL REFERENCES public.bible_versions(id) ON DELETE CASCADE,
  book_number integer NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(version_id, book_number, chapter, verse)
);

-- Create indexes for performance
CREATE INDEX idx_bible_verses_lookup ON public.bible_verses(version_id, book_number, chapter);
CREATE INDEX idx_bible_verses_version ON public.bible_verses(version_id);
CREATE INDEX idx_bible_books_testament ON public.bible_books(testament);

-- Enable RLS
ALTER TABLE public.bible_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

-- RLS policies - members can read Bible content
CREATE POLICY "Members can view bible versions"
ON public.bible_versions FOR SELECT
USING (is_active = true);

CREATE POLICY "Members can view bible books"
ON public.bible_books FOR SELECT
USING (true);

CREATE POLICY "Members can view bible verses"
ON public.bible_verses FOR SELECT
USING (true);

-- Super admins can manage all Bible content
CREATE POLICY "Super admins can manage bible versions"
ON public.bible_versions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage bible books"
ON public.bible_books FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage bible verses"
ON public.bible_verses FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert Bible versions (3 stored + 4 API-based)
INSERT INTO public.bible_versions (code, name, language, is_stored, api_id, description, display_order) VALUES
('KJV', 'King James Version', 'en', true, NULL, 'Public domain English translation from 1611', 1),
('LSG', 'Louis Segond 1910', 'fr', true, NULL, 'Traduction française du domaine public', 2),
('DARBY', 'Darby Bible', 'fr', true, NULL, 'Traduction française par John Nelson Darby', 3),
('NIV', 'New International Version', 'en', false, 'bba9f40183526463-01', 'Modern English translation', 4),
('NKJV', 'New King James Version', 'en', false, 'de4e12af7f28f599-02', 'Updated King James Version', 5),
('NLT', 'New Living Translation', 'en', false, 'c315fa9f71d4af3a-01', 'Easy-to-read modern translation', 6),
('AMP', 'Amplified Bible', 'en', false, '06125adad2d5898a-01', 'Expanded translation with nuances', 7);

-- Insert all 66 books of the Bible
INSERT INTO public.bible_books (book_number, name, name_fr, abbreviation, testament, chapters_count) VALUES
-- Old Testament (39 books)
(1, 'Genesis', 'Genèse', 'Gen', 'OT', 50),
(2, 'Exodus', 'Exode', 'Exo', 'OT', 40),
(3, 'Leviticus', 'Lévitique', 'Lev', 'OT', 27),
(4, 'Numbers', 'Nombres', 'Num', 'OT', 36),
(5, 'Deuteronomy', 'Deutéronome', 'Deu', 'OT', 34),
(6, 'Joshua', 'Josué', 'Jos', 'OT', 24),
(7, 'Judges', 'Juges', 'Jdg', 'OT', 21),
(8, 'Ruth', 'Ruth', 'Rut', 'OT', 4),
(9, '1 Samuel', '1 Samuel', '1Sa', 'OT', 31),
(10, '2 Samuel', '2 Samuel', '2Sa', 'OT', 24),
(11, '1 Kings', '1 Rois', '1Ki', 'OT', 22),
(12, '2 Kings', '2 Rois', '2Ki', 'OT', 25),
(13, '1 Chronicles', '1 Chroniques', '1Ch', 'OT', 29),
(14, '2 Chronicles', '2 Chroniques', '2Ch', 'OT', 36),
(15, 'Ezra', 'Esdras', 'Ezr', 'OT', 10),
(16, 'Nehemiah', 'Néhémie', 'Neh', 'OT', 13),
(17, 'Esther', 'Esther', 'Est', 'OT', 10),
(18, 'Job', 'Job', 'Job', 'OT', 42),
(19, 'Psalms', 'Psaumes', 'Psa', 'OT', 150),
(20, 'Proverbs', 'Proverbes', 'Pro', 'OT', 31),
(21, 'Ecclesiastes', 'Ecclésiaste', 'Ecc', 'OT', 12),
(22, 'Song of Solomon', 'Cantique des Cantiques', 'Sng', 'OT', 8),
(23, 'Isaiah', 'Ésaïe', 'Isa', 'OT', 66),
(24, 'Jeremiah', 'Jérémie', 'Jer', 'OT', 52),
(25, 'Lamentations', 'Lamentations', 'Lam', 'OT', 5),
(26, 'Ezekiel', 'Ézéchiel', 'Ezk', 'OT', 48),
(27, 'Daniel', 'Daniel', 'Dan', 'OT', 12),
(28, 'Hosea', 'Osée', 'Hos', 'OT', 14),
(29, 'Joel', 'Joël', 'Jol', 'OT', 3),
(30, 'Amos', 'Amos', 'Amo', 'OT', 9),
(31, 'Obadiah', 'Abdias', 'Oba', 'OT', 1),
(32, 'Jonah', 'Jonas', 'Jon', 'OT', 4),
(33, 'Micah', 'Michée', 'Mic', 'OT', 7),
(34, 'Nahum', 'Nahum', 'Nah', 'OT', 3),
(35, 'Habakkuk', 'Habacuc', 'Hab', 'OT', 3),
(36, 'Zephaniah', 'Sophonie', 'Zep', 'OT', 3),
(37, 'Haggai', 'Aggée', 'Hag', 'OT', 2),
(38, 'Zechariah', 'Zacharie', 'Zec', 'OT', 14),
(39, 'Malachi', 'Malachie', 'Mal', 'OT', 4),
-- New Testament (27 books)
(40, 'Matthew', 'Matthieu', 'Mat', 'NT', 28),
(41, 'Mark', 'Marc', 'Mrk', 'NT', 16),
(42, 'Luke', 'Luc', 'Luk', 'NT', 24),
(43, 'John', 'Jean', 'Jhn', 'NT', 21),
(44, 'Acts', 'Actes', 'Act', 'NT', 28),
(45, 'Romans', 'Romains', 'Rom', 'NT', 16),
(46, '1 Corinthians', '1 Corinthiens', '1Co', 'NT', 16),
(47, '2 Corinthians', '2 Corinthiens', '2Co', 'NT', 13),
(48, 'Galatians', 'Galates', 'Gal', 'NT', 6),
(49, 'Ephesians', 'Éphésiens', 'Eph', 'NT', 6),
(50, 'Philippians', 'Philippiens', 'Php', 'NT', 4),
(51, 'Colossians', 'Colossiens', 'Col', 'NT', 4),
(52, '1 Thessalonians', '1 Thessaloniciens', '1Th', 'NT', 5),
(53, '2 Thessalonians', '2 Thessaloniciens', '2Th', 'NT', 3),
(54, '1 Timothy', '1 Timothée', '1Ti', 'NT', 6),
(55, '2 Timothy', '2 Timothée', '2Ti', 'NT', 4),
(56, 'Titus', 'Tite', 'Tit', 'NT', 3),
(57, 'Philemon', 'Philémon', 'Phm', 'NT', 1),
(58, 'Hebrews', 'Hébreux', 'Heb', 'NT', 13),
(59, 'James', 'Jacques', 'Jas', 'NT', 5),
(60, '1 Peter', '1 Pierre', '1Pe', 'NT', 5),
(61, '2 Peter', '2 Pierre', '2Pe', 'NT', 3),
(62, '1 John', '1 Jean', '1Jn', 'NT', 5),
(63, '2 John', '2 Jean', '2Jn', 'NT', 1),
(64, '3 John', '3 Jean', '3Jn', 'NT', 1),
(65, 'Jude', 'Jude', 'Jud', 'NT', 1),
(66, 'Revelation', 'Apocalypse', 'Rev', 'NT', 22);