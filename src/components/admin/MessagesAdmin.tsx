import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";

export function MessagesAdmin() {
  const { t } = usePrefs();
  const list = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-3">
      {list.data?.length === 0 && <p className="text-sm text-muted-foreground">{t("noMessages")}</p>}
      {list.data?.map((m) => (
        <div key={m.id} className="card-soft space-y-1 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {m.name} <span className="text-muted-foreground">· {m.email}</span>
            </p>
            <span className="text-xs text-muted-foreground">
              {new Date(m.created_at).toLocaleDateString("en-GB")}
            </span>
          </div>
          {m.subject && <p className="text-sm font-medium text-primary">{m.subject}</p>}
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
        </div>
      ))}
    </div>
  );
}
