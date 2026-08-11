import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().trim().email().max(255),
});

export function NewsletterForm() {
  const { t } = usePrefs();
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ email });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid email");
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: parsed.data.email.toLowerCase() });
      if (error && !error.message.includes("duplicate")) throw error;
      return true;
    },
    onSuccess: () => {
      setEmail("");
      toast.success(t("thanks"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <Input
        type="email"
        required
        maxLength={255}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("email")}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {t("subscribe")}
      </Button>
    </form>
  );
}
