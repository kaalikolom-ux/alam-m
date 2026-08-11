import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";

export const authorQuery = (id: string) => ({
  queryKey: ["author", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("authors")
      .select("id, name_bn, name_en, image_url, bio_bn, bio_en")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export function AuthorCard({ authorId }: { authorId: string }) {
  const { lang, t } = usePrefs();
  const author = useQuery(authorQuery(authorId));
  const a = author.data;
  if (!a) return null;

  const name = lang === "en" && a.name_en ? a.name_en : a.name_bn;
  const bio = lang === "en" && a.bio_en ? a.bio_en : a.bio_bn;

  return (
    <section className="card-soft mt-10 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-5">
      {a.image_url ? (
        <img
          src={a.image_url}
          alt={name}
          loading="lazy"
          className="size-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <UserRound className="size-7" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("author")}
        </p>
        <p className="mt-0.5 font-semibold">{name}</p>
        {bio && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio}</p>}
      </div>
    </section>
  );
}
