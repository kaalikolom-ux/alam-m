UPDATE public.menu_items m
SET url = '/c/' || c.slug
FROM public.categories c
WHERE m.url IN ('/' || c.slug, '/' || c.name_bn, '/' || COALESCE(c.name_en, '~none~'));

UPDATE public.menu_items SET url = '/c/golpo' WHERE url IN ('/story', '/golpo');
UPDATE public.menu_items SET url = '/c/kobita' WHERE url IN ('/poem', '/kobita');
UPDATE public.menu_items SET url = '/c/smritikotha' WHERE url IN ('/memory', '/smritikotha');