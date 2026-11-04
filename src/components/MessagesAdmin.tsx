import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Mail, Trash2, Reply, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";

export function MessagesAdmin() {
  const { t } = usePrefs();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/contact-messages");
      if (!res.ok) throw new Error("বার্তা লোড করা সম্ভব হয়নি");
      return (await res.json()) || [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("চিহ্নিত করা সম্ভব হয়নি");
    },
    onSuccess: () => {
      invalidate();
      toast.success("পঠিত হিসেবে চিহ্নিত করা হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/contact-messages?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("মুছে ফেলা সম্ভব হয়নি");
    },
    onSuccess: () => {
      invalidate();
      toast.success("বার্তা মুছে ফেলা হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!list.data?.length) {
    return <p className="card-soft p-6 text-sm text-muted-foreground">{t("noMessages")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-muted-foreground">
          মোট বার্তা: {list.data.length} টি
        </p>
        <span className="text-[11px] text-muted-foreground">
          ফরোয়ার্ড ইমেইল: <code className="text-primary">contact+notabene.inc@gmail.com</code>
        </span>
      </div>

      {list.data.map((m) => (
        <div
          key={m.id}
          className={`card-soft p-5 transition-all ${
            m.is_read ? "opacity-85" : "border-primary/50 bg-primary/[0.02] shadow-sm"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                <Mail className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{m.name}</p>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {m.email}
                  </a>
                  {!m.is_read && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      নতুন
                    </span>
                  )}
                </div>

                {m.subject && (
                  <p className="mt-1 text-sm font-medium text-foreground/90">{m.subject}</p>
                )}

                <div className="mt-2.5 rounded-lg border border-border/40 bg-background/60 p-3">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                    {m.message}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(m.created_at).toLocaleString("en-GB")}</span>
                  <span>•</span>
                  <span className={m.email_sent ? "text-emerald-500 font-medium" : "text-amber-500"}>
                    {m.email_sent ? `✓ ${t("emailForwarded")}` : `○ ${t("emailNotForwarded")}`}
                  </span>
                </div>
              </div>
            </div>

            {/* অ্যাকশন বাটনসমূহ */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="উত্তর দিন (Reply via Email)"
              >
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(
                    m.subject || "কুরআন অন্বেষা যোগাযোগ"
                  )}`}
                >
                  <Reply className="size-4" />
                </a>
              </Button>

              {!m.is_read ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  title={t("markRead")}
                  onClick={() => markRead.mutate(m.id)}
                >
                  <Check className="size-4" />
                </Button>
              ) : (
                <div className="p-2 text-muted-foreground/40" title="পঠিত">
                  <CheckCheck className="size-4" />
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title={t("delete")}
                onClick={() => remove.mutate(m.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}