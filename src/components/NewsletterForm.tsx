import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const { lang } = usePrefs();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(lang === "bn" ? "সঠিক ইমেইল লিখুন" : "Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
      if (error) {
        if (error.code === "23505") {
          toast.info(lang === "bn" ? "আপনি আগেই সাবস্ক্রাইব করেছেন!" : "You are already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success(lang === "bn" ? "ধন্যবাদ সাবস্ক্রাইব করার জন্য!" : "Thank you for subscribing!");
        setEmail("");
      }
    } catch (err: any) {
      toast.error(err.message || (lang === "bn" ? "ব্যর্থ হয়েছে" : "Failed to subscribe"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full items-center">
      <Input
        type="email"
        placeholder={lang === "bn" ? "আপনার ইমেইল অ্যাড্রেস..." : "Your email address..."}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-11 w-full rounded-full border-border/80 bg-background/60 pl-4 pr-14 text-xs backdrop-blur-sm focus-visible:ring-1 focus-visible:ring-primary"
      />
      <Button
        type="submit"
        disabled={loading}
        size="icon"
        className="absolute right-1.5 top-1.5 size-8 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        aria-label="Subscribe"
      >
        <Send className="size-3.5" />
      </Button>
    </form>
  );
}