import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

const SESSION_STORAGE_KEY = "qe_visitor_session_id_v1";
const SESSION_LAST_ACTIVE_KEY = "qe_visitor_last_active_v1";
const SESSION_ACTIVE_SEC_KEY = "qe_visitor_active_sec_v1";
const HEARTBEAT_INTERVAL_MS = 60000; // 60 seconds
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes standard web session timeout
const INTERACTION_IDLE_LIMIT_MS = 3 * 60 * 1000; // Pause counter after 3 minutes of zero interaction

const BOT_UA_REGEX =
  /bot|crawler|spider|slurp|facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|linkedinbot|discordbot|embedly|pinterest|slackbot|vkshare|w3c_validator|redditbot|applebot|bingpreview|headlesschrome|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|curl|wget|python-requests|axios|go-http-client|okhttp|apache-httpclient|scrapy|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|yandex|baiduspider|duckduckbot|ia_archiver|sogou|exabot/i;

export function isBotClient(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return true;
  if ((navigator as any).webdriver) return true;
  const ua = navigator.userAgent || "";
  if (!ua || BOT_UA_REGEX.test(ua)) return true;
  return false;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const now = Date.now();
    const lastActiveRaw = Number(sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY) || "0");
    let id = sessionStorage.getItem(SESSION_STORAGE_KEY);

    // Expire session and start fresh if idle for more than 30 minutes
    if (!id || (lastActiveRaw > 0 && now - lastActiveRaw > SESSION_IDLE_TIMEOUT_MS)) {
      id = "vs_" + now.toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(SESSION_STORAGE_KEY, id);
      sessionStorage.setItem(SESSION_ACTIVE_SEC_KEY, "0");
    }
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(now));
    return id;
  } catch {
    return "vs_" + Date.now().toString(36);
  }
}

export function getAnalyticsEndpoint(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (
      origin.startsWith("capacitor://") ||
      origin.startsWith("ionic://") ||
      origin.startsWith("file:") ||
      (window as any).Capacitor !== undefined
    ) {
      return "https://www.quraan.bd/api/public/analytics";
    }
  }
  return "/api/public/analytics";
}

export function formatNumberBn(n: number): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => bnDigits[Number(d)]);
}

export function formatDurationBn(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSec = seconds % 60;

  if (hours > 0) {
    return `${formatNumberBn(hours)} ঘণ্টা ${formatNumberBn(minutes)} মিনিট`;
  }
  if (minutes > 0) {
    return `${formatNumberBn(minutes)} মিনিট ${formatNumberBn(remainingSec)} সেকেন্ড`;
  }
  return `${formatNumberBn(remainingSec)} সেকেন্ড`;
}

export function formatDurationEn(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSec = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSec}s`;
  }
  return `${remainingSec}s`;
}

/**
 * Client-side visitor tracker hook
 * - Skips automated bots and headless crawlers
 * - Measures true active engaged time (pauses when tab is hidden or user is idle > 3m)
 * - Resets session automatically after 30 minutes of background inactivity
 * - Sends periodic heartbeats and flushes state on beforeunload / visibilitychange
 */
export function useVisitorTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSecondsRef = useRef(0);
  const lastInteractionRef = useRef(Date.now());
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    if (typeof window === "undefined" || isBotClient()) return;

    // Initialize session and restore active seconds within current 30m session
    getOrCreateSessionId();
    try {
      const savedSec = Number(sessionStorage.getItem(SESSION_ACTIVE_SEC_KEY) || "0");
      if (savedSec > 0 && savedSec < 7200) {
        activeSecondsRef.current = savedSec;
      }
    } catch {}

    const endpoint = getAnalyticsEndpoint();

    const markInteraction = () => {
      const now = Date.now();
      // If returning after >30m idle, rotate session ID and reset counter
      try {
        const lastActiveRaw = Number(sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY) || "0");
        if (lastActiveRaw > 0 && now - lastActiveRaw > SESSION_IDLE_TIMEOUT_MS) {
          getOrCreateSessionId();
          activeSecondsRef.current = 0;
        }
        sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(now));
      } catch {}
      lastInteractionRef.current = now;
    };

    const sendPing = (isClosing = false) => {
      const sessionId = getOrCreateSessionId();
      try {
        sessionStorage.setItem(SESSION_ACTIVE_SEC_KEY, String(activeSecondsRef.current));
      } catch {}

      const payload = JSON.stringify({
        sessionId,
        path: window.location.pathname,
        title: document.title,
        duration: activeSecondsRef.current,
        referrer: document.referrer || "",
        isClosing,
      });

      if (isClosing && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        try {
          const blob = new Blob([payload], { type: "application/json" });
          const sent = navigator.sendBeacon(endpoint, blob);
          if (sent) return;
        } catch {}
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: isClosing,
      }).catch(() => {});
    };

    // 1. Initial ping on mount (deferred to idle so it never competes with initial critical paint)
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => sendPing(false));
    } else {
      setTimeout(() => sendPing(false), 2500);
    }

    // 2. Active duration counter (counts only when tab is visible AND user interacted recently)
    const secondTimer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastInteractionRef.current <= INTERACTION_IDLE_LIMIT_MS
      ) {
        activeSecondsRef.current += 1;
        try {
          sessionStorage.setItem(SESSION_ACTIVE_SEC_KEY, String(activeSecondsRef.current));
          sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(Date.now()));
        } catch {}
      }
    }, 1000);

    // 3. Periodic heartbeat every 60s when visible and active
    const heartbeatTimer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastInteractionRef.current <= INTERACTION_IDLE_LIMIT_MS
      ) {
        sendPing(false);
      }
    }, HEARTBEAT_INTERVAL_MS);

    // 4. Tab visibility change & beforeunload
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendPing(true);
      } else {
        markInteraction();
        sendPing(false);
      }
    };

    const handleBeforeUnload = () => {
      sendPing(true);
    };

    const interactionEvents = ["scroll", "pointerdown", "keydown", "touchstart", "mousemove"];
    for (const evt of interactionEvents) {
      window.addEventListener(evt, markInteraction, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.clearInterval(secondTimer);
      window.clearInterval(heartbeatTimer);
      for (const evt of interactionEvents) {
        window.removeEventListener(evt, markInteraction);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Ping immediately when route pathname changes
  useEffect(() => {
    if (typeof window === "undefined" || isBotClient()) return;
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      lastInteractionRef.current = Date.now();
      const sessionId = getOrCreateSessionId();
      const endpoint = getAnalyticsEndpoint();
      const payload = JSON.stringify({
        sessionId,
        path: pathname,
        title: document.title,
        duration: activeSecondsRef.current,
        referrer: document.referrer || "",
        isClosing: false,
      });

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}

export function VisitorTrackerMount() {
  useVisitorTracker();
  return null;
}
