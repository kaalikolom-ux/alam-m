CREATE TABLE public.quran_chapters (
  id integer PRIMARY KEY,
  name_simple text NOT NULL,
  name_arabic text NOT NULL,
  translated_name text NOT NULL,
  verses_count integer NOT NULL,
  revelation_place text,
  lang text NOT NULL DEFAULT 'bn',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quran_chapters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_chapters TO authenticated;
GRANT ALL ON public.quran_chapters TO service_role;
ALTER TABLE public.quran_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quran chapters readable" ON public.quran_chapters FOR SELECT USING (true);
CREATE POLICY "admins manage quran chapters" ON public.quran_chapters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.quran_verses (
  surah integer NOT NULL,
  ayah integer NOT NULL,
  text_uthmani text NOT NULL,
  words jsonb NOT NULL DEFAULT '[]'::jsonb,
  bn_text text,
  en_text text,
  audio_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (surah, ayah)
);

GRANT SELECT ON public.quran_verses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_verses TO authenticated;
GRANT ALL ON public.quran_verses TO service_role;
ALTER TABLE public.quran_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quran verses readable" ON public.quran_verses FOR SELECT USING (true);
CREATE POLICY "admins manage quran verses" ON public.quran_verses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.quran_sync_state (
  surah integer PRIMARY KEY,
  verses_synced integer NOT NULL DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quran_sync_state TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_sync_state TO authenticated;
GRANT ALL ON public.quran_sync_state TO service_role;
ALTER TABLE public.quran_sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quran sync state readable" ON public.quran_sync_state FOR SELECT USING (true);
CREATE POLICY "admins manage quran sync state" ON public.quran_sync_state FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER quran_verses_touch BEFORE UPDATE ON public.quran_verses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER quran_chapters_touch BEFORE UPDATE ON public.quran_chapters
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();