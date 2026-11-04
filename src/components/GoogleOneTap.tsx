import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession, setCachedSession, edgeGoogleLogin } from "@/lib/auth";
import { fetchPublicSettings } from "@/lib/site";

export interface GoogleOneTapConfig {
  enabled: boolean;
  client_id: string;
  auto_select?: boolean;
}

export const DEFAULT_GOOGLE_ONE_TAP_CONFIG: GoogleOneTapConfig = {
  enabled: true,
  client_id:
    (typeof process !== "undefined" && (process.env?.VITE_GOOGLE_CLIENT_ID || process.env?.GOOGLE_CLIENT_ID)) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
    "4921987770-2gui6jbbqngdmeuno3j34m6447h3puav.apps.googleusercontent.com",
  auto_select: false,
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

export function GoogleOneTap() {
  const { user, loading: authLoading } = useSession();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [pillDismissed, setPillDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("google_one_tap_pill_dismissed") === "true";
  });
  const [gisPromptTriggered, setGisPromptTriggered] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Google One Tap Settings from Cloudflare D1 / Public Settings first
  const settingsQuery = useQuery({
    queryKey: ["site-settings-google-one-tap"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<GoogleOneTapConfig> => {
      try {
        const settings = await fetchPublicSettings();
        const val = settings?.google_one_tap_settings as Partial<GoogleOneTapConfig> | undefined;
        if (val && typeof val === "object") {
          return {
            enabled: val.enabled ?? true,
            client_id: val.client_id || DEFAULT_GOOGLE_ONE_TAP_CONFIG.client_id,
            auto_select: val.auto_select ?? false,
          };
        }
      } catch {}
      return DEFAULT_GOOGLE_ONE_TAP_CONFIG;
    },
  });

  const config = settingsQuery.data || DEFAULT_GOOGLE_ONE_TAP_CONFIG;
  const isEnabled = config.enabled && Boolean(config.client_id?.trim());

  // 2. Load Google Identity Services (GIS) script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user || !isEnabled) return;

    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) {
      const onLoad = () => setGisLoaded(true);
      existingScript.addEventListener("load", onLoad);
      return () => existingScript.removeEventListener("load", onLoad);
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    document.head.appendChild(script);
  }, [user, isEnabled]);

  // 3. Initialize Google One Tap Prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user || !isEnabled || !gisLoaded || !config.client_id) return;
    if (gisPromptTriggered) return;

    // Do not show inside admin or embed views
    if (pathname.startsWith("/admin") || pathname.startsWith("/embed")) return;

    const sessionDismissed = sessionStorage.getItem("google_one_tap_prompt_dismissed") === "true";
    if (sessionDismissed) return;

    try {
      window.google?.accounts?.id?.initialize({
        client_id: config.client_id.trim(),
        callback: async (response: { credential: string; select_by?: string }) => {
          if (!response?.credential) return;
          setIsSigningIn(true);
          try {
            const data = await edgeGoogleLogin(response.credential);

            if (data?.session && data?.user) {
              // Check owner admin
              if (data.user.isAdmin || data.user.role === "admin" || data.user.email?.toLowerCase() === "notabene.inc@gmail.com" || data.user.email?.toLowerCase() === "md.khorshed.alam@gmail.com") {
                queryClient.setQueryData(["is-admin", data.user.id], true);
                localStorage.setItem(`is_admin_${data.user.id}`, "true");
              }

              toast.success("🎉 গুগল অ্যাকাউন্ট দিয়ে সফলভাবে সাইন-ইন সম্পন্ন হয়েছে! স্বাগতম।", {
                duration: 4000,
              });

              queryClient.invalidateQueries();
            }
          } catch (signInErr: any) {
            console.error("Google One Tap Sign-In Error:", signInErr);
            toast.error(
              `গুগল সাইন-ইন সম্পন্ন করা যায়নি: ${signInErr?.message || "অনাকাঙ্ক্ষিত ত্রুটি"}`
            );
          } finally {
            setIsSigningIn(false);
          }
        },
        auto_select: config.auto_select ?? false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });

      // Trigger the native Google One Tap prompt
      window.google?.accounts?.id?.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.debug("One Tap not displayed:", notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          console.debug("One Tap skipped:", notification.getSkippedReason());
        } else if (notification.isDismissedMoment()) {
          sessionStorage.setItem("google_one_tap_prompt_dismissed", "true");
        }
      });

      setGisPromptTriggered(true);
    } catch (initErr) {
      console.warn("Google One Tap Init Error:", initErr);
    }
  }, [user, isEnabled, gisLoaded, config, pathname, gisPromptTriggered, queryClient]);

  // Direct Google prompt button trigger
  const handleDirectGoogleLogin = async () => {
    if (config.client_id) {
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      const redirectUri = isLocal
        ? `${window.location.origin}/auth`
        : "https://www.quraan.bd/auth";

      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      const stateParam = currentPath && currentPath !== "/auth" ? encodeURIComponent(currentPath) : "";
      const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(config.client_id.trim())}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${nonce}&prompt=select_account${stateParam ? `&state=${stateParam}` : ""}`;

      window.location.href = googleAuthUrl;
      return;
    }
    window.location.href = "/auth";
  };

  const handleDismissPill = () => {
    setPillDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("google_one_tap_pill_dismissed", "true");
    }
  };

  // If user is already logged in, do not render anything
  if (authLoading || user) return null;

  // Don't show in admin, auth or embed pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth") || pathname.startsWith("/embed")) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id="google-one-tap-portal"
      className="pointer-events-none fixed top-16 sm:top-20 right-3 sm:right-6 z-50 flex flex-col items-end"
    >
      {/* 
        যদি কোনো ব্রাউজারে গুগল আইফ্রেম ব্লক থাকে বা এখনো ট্যাপ না করে থাকে, 
        ভিজিটরের দৃষ্টি আকর্ষণের জন্য স্টাইলিশ টপ-রাইট কুইক গুগল সাইন-ইন নোটিফিকেশন 
      */}
      {!pillDismissed && (
        <aside
          role="region"
          aria-label="গুগল সাইন-ইন সহকারী"
          className="pointer-events-auto max-w-[320px] sm:max-w-[340px] animate-in fade-in slide-in-from-top-3 duration-300 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-2.5 text-card-foreground select-none"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-xl bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-2xs">
                <GoogleLogoSvg className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-xs leading-tight">
                  কুরআন অন্বেষায় সাইন-ইন
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  বুকমার্ক ও পূর্ণ পড়ার সুবিধা নিন
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissPill}
              title="বন্ধ করুন"
              aria-label="বন্ধ করুন"
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            কোনো পাসওয়ার্ড ছাড়াই আপনার জিমেইল (Google) অ্যাকাউন্ট দিয়ে ১-ক্লিকে তাৎক্ষণিক লগইন করুন।
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleDirectGoogleLogin}
              className="flex-1 h-8.5 rounded-xl bg-[#2271b1] hover:bg-[#135e96] text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSigningIn ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <GoogleLogoSvg className="size-3.5 bg-white rounded-full p-0.5" />
              )}
              <span>Google দিয়ে প্রবেশ</span>
            </button>
            <button
              type="button"
              onClick={handleDismissPill}
              className="h-8.5 px-2.5 rounded-xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors cursor-pointer"
            >
              পরে করব
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

export function GoogleLogoSvg({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.57H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.43l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.15c.95-2.83 3.6-4.97 6.72-4.97Z"
      />
    </svg>
  );
}
