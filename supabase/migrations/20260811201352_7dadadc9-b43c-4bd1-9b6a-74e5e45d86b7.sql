CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_bn text NOT NULL,
  title_en text,
  content_bn text,
  content_en text,
  cover_image_url text,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published pages readable" ON public.pages FOR SELECT USING (published = true);
CREATE POLICY "admins read all pages" ON public.pages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage pages" ON public.pages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER pages_touch BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_bn text NOT NULL,
  label_en text,
  url text NOT NULL,
  location text NOT NULL DEFAULT 'header',
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu items readable" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "admins manage menu items" ON public.menu_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER menu_items_touch BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_bn text NOT NULL,
  name_en text,
  description_bn text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admins manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.article_categories (
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, category_id)
);
GRANT SELECT ON public.article_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_categories TO authenticated;
GRANT ALL ON public.article_categories TO service_role;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article categories readable" ON public.article_categories FOR SELECT USING (true);
CREATE POLICY "admins manage article categories" ON public.article_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read messages" ON public.contact_messages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.pages (slug, title_bn, title_en, content_bn, content_en) VALUES
('about', 'আমার পাতা', 'About Me', 'আমি আলম — শব্দের একজন লেখক এবং দৈনন্দিন মুহূর্তের মাঝে লুকানো গল্পগুলোর এক অনুসন্ধানী। আমার লেখার মাধ্যমে আমি ক্ষণিকের ভাবনাগুলোকে এমন বাক্যে রূপ দিতে চাই, যা পাঠের অনেক পরেও মনে রয়ে যায়। শব্দ আমার ক্যানভাস, আর গল্প আমার রঙ — যেগুলো দিয়ে আমি আঁকি।', 'I am Alam — a writer of words and a seeker of the stories hidden inside everyday moments.'),
('contact', 'যোগাযোগ', 'Contact', 'যেকোনো প্রশ্ন, মতামত বা কাজের প্রস্তাবের জন্য নিচের ফর্মটি পূরণ করুন। আমি যত দ্রুত সম্ভব উত্তর দেওয়ার চেষ্টা করব।', 'Fill in the form below and I will get back to you as soon as possible.');

INSERT INTO public.menu_items (label_bn, label_en, url, location, sort_order) VALUES
('হোম', 'Home', '/', 'header', 1),
('আর্টিকেল', 'Articles', '/articles', 'header', 2),
('আমার পাতা', 'About Me', '/about', 'header', 3),
('যোগাযোগ', 'Contact', '/contact', 'header', 4);

INSERT INTO public.categories (slug, name_bn, name_en) VALUES
('golpo', 'গল্প', 'Stories'),
('kobita', 'কবিতা', 'Poetry'),
('provondho', 'প্রবন্ধ', 'Essays');