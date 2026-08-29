import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";

export function usePage(slug: string) {
  return useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("slug, title_bn, title_en, content_bn, content_en, cover_image_url")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function PageBody({
  slug,
  fallbackTitle,
  showNotFound = false,
}: {
  slug: string;
  fallbackTitle: string;
  showNotFound?: boolean;
}) {
  const { t, lang } = usePrefs();
  const page = usePage(slug);

  const title =
    (lang === "en" ? page.data?.title_en || page.data?.title_bn : page.data?.title_bn) ?? fallbackTitle;
  const content = lang === "en" ? page.data?.content_en || page.data?.content_bn : page.data?.content_bn;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-center text-3xl font-semibold sm:text-4xl">{title}</h1>
      {page.data?.cover_image_url && (
        <img
          src={page.data.cover_image_url}
          alt={title}
          loading="lazy"
          className="mt-8 w-full rounded-xl border border-border/70 object-cover"
        />
      )}
      {page.isLoading && <p className="mt-6 text-center text-sm text-muted-foreground">{t("loading")}</p>}
      {!page.isLoading && !page.data && showNotFound && (
        <p className="mt-6 text-center text-sm text-muted-foreground">{t("pageNotFound")}</p>
      )}
      {content && (
        <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/85">
          {content.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {para}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
