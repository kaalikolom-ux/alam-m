import { supabase } from "@/integrations/supabase/client";
// src/lib/auth.ts
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  role?: string;
  isAdmin?: boolean;
  totp_enabled?: boolean;
}

export interface Session {
  access_token: string;
  token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  user: User;
}

export interface EdgeUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  isAdmin?: boolean;
  totp_enabled?: boolean;
  user_metadata?: Record<string, any>;
}

export interface EdgeSession {
  token: string;
  user: EdgeUser;
}

const STORAGE_KEY = "quran_anwesha_edge_session";
const TOKEN_KEY = "quran_anwesha_auth_token";
export const SUPER_ADMIN_EMAILS = [
  "notabene.inc@gmail.com",
  "md.khorshed.alam@gmail.com",
  "khorshed.alam@gmail.com",
  "alam.m.contact@gmail.com",
  "alam@wooniche.com",
  "kaali.kolom@gmail.com",
];
export const SUPER_ADMIN_EMAIL = "md.khorshed.alam@gmail.com";
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  if (SUPER_ADMIN_EMAILS.includes(clean)) return true;
  if (
    clean.includes("khorshed") ||
    clean.includes("notabene") ||
    clean.includes("kaali") ||
    clean.endsWith("@wooniche.com")
  ) {
    return true;
  }
  return false;
}

let _currentSession: any = null;
let _sessionLoaded = false;
const _listeners = new Set<(s: any) => void>();

// Helper to convert EdgeSession to compatible Session shape
function toCompatibleSession(raw: any): any {
  if (!raw) return null;
  const user = raw.user || raw;
  const email = (user.email || "").toLowerCase();
  const isSuperAdmin = isSuperAdminEmail(email);
  const isAdmin = isSuperAdmin || user.role === "admin" || user.isAdmin === true;

  const compatibleUser = {
    id: user.id || "anonymous",
    email: user.email,
    user_metadata: {
      name: user.name,
      display_name: user.name || (user.email ? user.email.split("@")[0] : null),
      ...(user.user_metadata || {}),
    },
    app_metadata: {
      role: isSuperAdmin ? "admin" : user.role || "user",
      ...(user.app_metadata || {}),
    },
    role: isSuperAdmin ? "admin" : user.role || "user",
    isAdmin,
    totp_enabled: Boolean(user.totp_enabled),
  };

  return {
    access_token: raw.token || raw.access_token || "",
    token: raw.token || raw.access_token || "",
    token_type: "bearer",
    expires_in: 3600 * 24 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    user: compatibleUser as unknown as User,
  };
}

// Synchronously read existing session from localStorage on client bootstrap
if (typeof window !== "undefined") {
  try {
    // 1. Try alam_m_d1_auth_session first
    const d1Session = localStorage.getItem("alam_m_d1_auth_session");
    if (d1Session) {
      const parsed = JSON.parse(d1Session);
      if (parsed?.user || parsed?.token || parsed?.access_token) {
        _currentSession = toCompatibleSession(parsed);
        _sessionLoaded = true;
      }
    }

    // 2. Try modern Edge session
    if (!_currentSession) {
      const edgeItem = localStorage.getItem(STORAGE_KEY);
      if (edgeItem) {
        const parsed = JSON.parse(edgeItem);
        if (parsed?.user || parsed?.token) {
          _currentSession = toCompatibleSession(parsed);
          _sessionLoaded = true;
        }
      }
    }

    // 2. Fallback to legacy Supabase token if no edge session
    if (!_currentSession) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed?.user) {
              _currentSession = toCompatibleSession(parsed);
              break;
            }
          }
        }
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  // Always mark session as resolved on client bootstrap
  _sessionLoaded = true;

  // Verify session with Edge backend in the background
  const token = getStoredAuthToken();
  if (token) {
    fetch("/api/public/auth", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.user) {
          const sessionObj = { token, user: data.user };
          setCachedSession(toCompatibleSession(sessionObj));
        }
      })
      .catch(() => {});
  }
}

export function getStoredAuthToken(): string {
  if (typeof window === "undefined") return "";
  if (_currentSession?.access_token) return _currentSession.access_token;
  if (_currentSession?.token) return _currentSession.token;

  const direct = localStorage.getItem(TOKEN_KEY);
  if (direct) return direct;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
      if (parsed?.access_token) return parsed.access_token;
    }
  } catch {}

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.token) return parsed.token;
        }
      }
    }
  } catch {}

  try {
    const match = document.cookie.match(/quran_anwesha_token=([^;]+)/);
    if (match) return match[1].trim();
  } catch {}

  return "";
}

export function isJwtExpired(token: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      if (payload.exp && payload.exp * 1000 < Date.now() + 60000) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function ensureValidAuthToken(): Promise<string> {
  const token = getStoredAuthToken();
  return token || "";
}

export function setCachedSession(session: any) {
  _currentSession = toCompatibleSession(session);
  _sessionLoaded = true;

  if (typeof window !== "undefined") {
    try {
      if (_currentSession) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_currentSession)); } catch {}
        if (_currentSession.access_token) {
          try { localStorage.setItem(TOKEN_KEY, _currentSession.access_token); } catch {}
          document.cookie = `quran_anwesha_token=${_currentSession.access_token}; path=/; max-age=${3600 * 24 * 30}; SameSite=Lax; Secure`;
          try {
            document.cookie = `quran_anwesha_token=${_currentSession.access_token}; path=/; domain=.quraan.bd; max-age=${3600 * 24 * 30}; SameSite=Lax; Secure`;
          } catch {}
        }
        if (_currentSession.user?.id) {
          try { localStorage.setItem(`is_admin_${_currentSession.user.id}`, _currentSession.user.isAdmin ? "true" : "false"); } catch {}
        }
      } else {
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        try { localStorage.removeItem(TOKEN_KEY); } catch {}
        try { localStorage.removeItem("alam_m_d1_auth_session"); } catch {}
        try { localStorage.removeItem("alam_m_auth_session"); } catch {}
        document.cookie = "quran_anwesha_token=; path=/; max-age=0; SameSite=Lax; Secure";
        try {
          document.cookie = "quran_anwesha_token=; path=/; domain=.quraan.bd; max-age=0; SameSite=Lax; Secure";
        } catch {}
      }
    } catch {}
  }

  _listeners.forEach((fn) => {
    try { fn(_currentSession); } catch {}
  });
}

export function onAuthChange(callback: (session: Session | null) => void) {
  _listeners.add(callback);
  return () => {
    _listeners.delete(callback);
  };
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(() => _currentSession);
  const [loading, setLoading] = useState<boolean>(() => (typeof window === "undefined" ? true : !_sessionLoaded));

  useEffect(() => {
    const handler = (s: Session | null) => {
      setSession(s);
      setLoading(false);
    };

    setSession(_currentSession);
    setLoading(false);

    _listeners.add(handler);
    return () => {
      _listeners.delete(handler);
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useIsAdmin() {
  const { user } = useSession();
  const query = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour in-memory cache
    gcTime: 1000 * 60 * 120,
    initialData: () => {
      if (!user) return false;
      if (isSuperAdminEmail(user.email)) return true;
      if ((user as any).isAdmin === true || (user as any).role === "admin") return true;
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`is_admin_${user.id}`);
        if (cached === "true") return true;
        if (cached === "false") return false;
      }
      return undefined;
    },
    queryFn: async () => {
      if (isSuperAdminEmail(user?.email)) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`is_admin_${user.id}`, "true");
        }
        return true;
      }
      if ((user as any).isAdmin === true || (user as any).role === "admin") return true;

      // Verify via Edge Auth API
      const token = getStoredAuthToken();
      if (token) {
        try {
          const res = await fetch("/api/public/auth", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            const isAdmin = Boolean(data?.user?.isAdmin || data?.user?.role === "admin");
            if (typeof window !== "undefined") {
              localStorage.setItem(`is_admin_${user.id}`, isAdmin ? "true" : "false");
            }
            return isAdmin;
          }
        } catch {}
      }

      return false;
    },
  });

  const definitelyAdmin =
    isSuperAdminEmail(user?.email) ||
    (user as any)?.isAdmin === true ||
    (user as any)?.role === "admin" ||
    query.data === true;

  return {
    isAdmin: definitelyAdmin,
    loading: definitelyAdmin ? false : (query.isLoading && query.data === undefined),
  };
}

/**
 * Edge Auth API Operations
 */
export async function edgeSignIn(params: { email: string; password: string }) {
  let res: Response;
  try {
    res = await fetch("/api/d1/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signIn", ...params }),
    });
  } catch {
    res = await fetch("/api/public/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", ...params }),
    });
  }
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || data.message || "লগইন ব্যর্থ হয়েছে। সঠিক তথ্য দিন।");
  }
  const session = data.data?.session || data.session;
  if (session) {
    setCachedSession(session);
  }
  return data;
}

export async function edgeVerify2Fa(params: { email: string; code: string; tempToken?: string }) {
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify-2fa", ...params }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "২-ফ্যাক্টর ভেরিফিকেশন ব্যর্থ হয়েছে।");
  }
  return data;
}

export async function edgeSignUp(params: { email: string; password: string; name?: string }) {
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", ...params }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
  }
  return data;
}

export async function edgeGoogleLogin(credential: string) {
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "google-login", credential }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "গুগল লগইন ব্যর্থ হয়েছে।");
  }
  if (data.session) {
    setCachedSession(data.session);
  }
  return data;
}

export async function edgeEnroll2Fa(userEmail?: string) {
  const token = await ensureValidAuthToken();
  const email = userEmail || _currentSession?.user?.email;
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: "2fa-enroll", email, token }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "2FA এনরোলমেন্ট ব্যর্থ হয়েছে।");
  }
  if (data.sessionToken) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(TOKEN_KEY, data.sessionToken);
      } catch {}
    }
    if (_currentSession) {
      _currentSession.token = data.sessionToken;
      _currentSession.access_token = data.sessionToken;
      setCachedSession(_currentSession);
    }
  }
  return data;
}

export async function edgeActivate2Fa(params: { secret: string; code: string; email?: string }) {
  const token = await ensureValidAuthToken();
  const email = params.email || _currentSession?.user?.email;
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: "2fa-activate", email, token, ...params }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "2FA অ্যাক্টিভেশন ব্যর্থ হয়েছে।");
  }
  if (_currentSession?.user) {
    _currentSession.user.totp_enabled = true;
    setCachedSession(_currentSession);
  }
  return data;
}

export async function edgeDisable2Fa(userEmail?: string) {
  const token = await ensureValidAuthToken();
  const email = userEmail || _currentSession?.user?.email;
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: "2fa-disable", email, token }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "2FA নিষ্ক্রিয়করণ ব্যর্থ হয়েছে।");
  }
  if (_currentSession?.user) {
    _currentSession.user.totp_enabled = false;
    setCachedSession(_currentSession);
  }
  return data;
}

export async function edgeGenerateBackupCodes(email?: string) {
  const token = await ensureValidAuthToken();
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action: "generate-backup-codes",
      email: email || _currentSession?.user?.email,
      token,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "নতুন ব্যাকআপ কোড তৈরি ব্যর্থ হয়েছে।");
  }
  return data;
}

export async function edgeGetBackupCodes(email?: string) {
  const token = await ensureValidAuthToken();
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action: "get-backup-codes",
      email: email || _currentSession?.user?.email,
      token,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "ব্যাকআপ কোড আনতে ব্যর্থ হয়েছে।");
  }
  return data;
}

export async function edgeUpdatePhone(phone: string, email?: string) {
  const token = await ensureValidAuthToken();
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action: "update-phone",
      phone,
      email: email || _currentSession?.user?.email,
      token,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "মোবাইল নম্বর সংরক্ষণ ব্যর্থ হয়েছে।");
  }
  return data;
}

export async function edgeSendSmsOtp(email: string) {
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "send-sms-otp", email }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "এসএমএস ওটিপি পাঠাতে ব্যর্থ হয়েছে।");
  }
  return data;
}

export async function edgeVerifySmsOtp(params: { email: string; code: string; tempToken?: string }) {
  const res = await fetch("/api/public/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify-sms-otp", ...params }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "এসএমএস ওটিপি যাচাই ব্যর্থ হয়েছে।");
  }
  if (data.session) {
    setCachedSession(data.session);
  }
  return data;
}

/**
 * অতি দ্রুতগতির (Instant 0ms) লগআউট হেলপার
 */
export async function signOutFast(queryClient?: any) {
  const token = getStoredAuthToken();
  if (token) {
    try {
      void fetch("/api/public/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}
  }

  setCachedSession(null);

  try {
    await supabase.auth.signOut();
  } catch {}

  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("google_one_tap_prompt_dismissed");
      sessionStorage.removeItem("google_one_tap_pill_dismissed");
      window.google?.accounts?.id?.disableAutoSelect?.();
    } catch {}

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("is_admin_") || (k.startsWith("sb-") && k.includes("-auth-token")))) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  }

  if (queryClient) {
    try {
      queryClient.removeQueries({ queryKey: ["is-admin"] });
      queryClient.invalidateQueries({ queryKey: ["is-admin"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    } catch {}
  }
}
