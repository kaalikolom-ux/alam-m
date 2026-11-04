import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  Clock,
  Search,
  Download,
  RefreshCw,
  Copy,
  Check,
  Mail,
  LogIn,
  Calendar,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Filter,
  ExternalLink,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Save,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { GoogleLogoSvg } from "./GoogleOneTap";

export const MIGRATION_SQL = `-- Supabase Auth & Users Activity Sync Migration
-- Safe & Resilient (No ON CONFLICT dependencies)

-- 1. Ensure columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Allow authenticated users to insert/update their own profile
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
CREATE POLICY "own profile insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Allow admins to read all profiles
DROP POLICY IF EXISTS "admins read all profiles" ON public.profiles;
CREATE POLICY "admins read all profiles" ON public.profiles 
FOR SELECT TO authenticated 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR auth.uid() = id
  OR (SELECT lower(email) FROM auth.users WHERE id = auth.uid()) = 'notabene.inc@gmail.com'
);

-- 4. Allow admins to read all user_roles so roles can be displayed in the user list
DROP POLICY IF EXISTS "admins read all user_roles" ON public.user_roles;
CREATE POLICY "admins read all user_roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  OR auth.uid() = user_id
  OR (SELECT lower(email) FROM auth.users WHERE id = auth.uid()) = 'notabene.inc@gmail.com'
);

-- 5. Automatically assign admin role to owner in user_roles (Safe: No ON CONFLICT clause)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE lower(email) = 'notabene.inc@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.users.id AND ur.role::text = 'admin'
  );

-- 6. Update existing profiles with real-time auth data
UPDATE public.profiles p
SET 
  email = COALESCE(u.email, p.email),
  display_name = COALESCE(p.display_name, (u.raw_user_meta_data->>'display_name'), (u.raw_user_meta_data->>'full_name'), split_part(u.email, '@', 1)),
  last_sign_in_at = COALESCE(u.last_sign_in_at, p.last_sign_in_at),
  email_confirmed_at = COALESCE(u.email_confirmed_at, p.email_confirmed_at),
  provider = COALESCE(p.provider, u.raw_app_meta_data->>'provider', CASE WHEN lower(u.email) LIKE '%@gmail.com' THEN 'google' ELSE 'email' END)
FROM auth.users u
WHERE p.id = u.id;

-- 7. Insert all missing accounts from auth.users into profiles (Safe: No ON CONFLICT clause)
INSERT INTO public.profiles (id, email, display_name, created_at, last_sign_in_at, email_confirmed_at, provider)
SELECT 
  u.id, 
  u.email, 
  COALESCE(u.raw_user_meta_data->>'display_name', (u.raw_user_meta_data->>'full_name'), split_part(u.email, '@', 1)),
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  COALESCE(u.raw_app_meta_data->>'provider', CASE WHEN lower(u.email) LIKE '%@gmail.com' THEN 'google' ELSE 'email' END)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 8. Trigger to sync auth.users last_sign_in_at and provider into public.profiles on every sign-in
CREATE OR REPLACE FUNCTION public.handle_user_auth_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_sign_in_at = COALESCE(NEW.last_sign_in_at, profiles.last_sign_in_at),
    email_confirmed_at = COALESCE(NEW.email_confirmed_at, profiles.email_confirmed_at),
    email = COALESCE(NEW.email, profiles.email),
    provider = COALESCE(profiles.provider, NEW.raw_app_meta_data->>'provider', CASE WHEN lower(NEW.email) LIKE '%@gmail.com' THEN 'google' ELSE 'email' END)
  WHERE id = NEW.id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, display_name, created_at, last_sign_in_at, email_confirmed_at, provider)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', (NEW.raw_user_meta_data->>'full_name'), split_part(NEW.email, '@', 1)),
      NEW.created_at,
      NEW.last_sign_in_at,
      NEW.email_confirmed_at,
      COALESCE(NEW.raw_app_meta_data->>'provider', CASE WHEN lower(NEW.email) LIKE '%@gmail.com' THEN 'google' ELSE 'email' END)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_auth_sync();

-- 9. Pure SQL Function to fetch the full accounts and login activity list directly from auth.users
CREATE OR REPLACE FUNCTION public.get_admin_users_list()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  provider text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    u.id,
    u.email::text,
    COALESCE(p.display_name, (u.raw_user_meta_data->>'display_name'), split_part(u.email::text, '@', 1))::text AS display_name,
    COALESCE(r.role::text, CASE WHEN lower(u.email::text) = 'notabene.inc@gmail.com' THEN 'admin' ELSE 'user' END)::text AS role,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    COALESCE(u.raw_app_meta_data->>'provider', 'email')::text AS provider
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id AND r.role::text = 'admin'
  WHERE (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role::text = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM auth.users o 
      WHERE o.id = auth.uid() AND lower(o.email) = 'notabene.inc@gmail.com'
    )
  )
  ORDER BY COALESCE(u.last_sign_in_at, u.created_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_list() TO anon;`;

export interface RegisteredUser {
  id: string;
  email: string;
  display_name?: string | null;
  role: "admin" | "user" | string;
  created_at: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  provider?: string | null;
}

interface RegisteredUsersAdminProps {
  onSelectUserForPerms?: (user: { id: string; email?: string }) => void;
  onGoToRoles?: () => void;
}

export function RegisteredUsersAdmin({
  onSelectUserForPerms,
  onGoToRoles,
}: RegisteredUsersAdminProps) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useSession();
  const [copiedSql, setCopiedSql] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loginFilter, setLoginFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent_signup" | "recent_login" | "name">("recent_signup");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Google One Tap Configuration State
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [googleOneTapEnabled, setGoogleOneTapEnabled] = useState<boolean>(true);
  const [savingGoogleSettings, setSavingGoogleSettings] = useState<boolean>(false);
  const [showGoogleGuide, setShowGoogleGuide] = useState<boolean>(false);

  // Fetch Google One Tap settings from site_settings via Edge API
  const googleSettingsQuery = useQuery({
    queryKey: ["admin-site-settings-google-one-tap"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/settings");
        if (res.ok) {
          const json = await res.json();
          if (json?.google_one_tap_settings) {
            return typeof json.google_one_tap_settings === "string"
              ? JSON.parse(json.google_one_tap_settings)
              : json.google_one_tap_settings;
          }
        }
      } catch {}
      return null;
    },
  });

  useEffect(() => {
    if (googleSettingsQuery.data) {
      const val = googleSettingsQuery.data;
      if (typeof val.enabled === "boolean") setGoogleOneTapEnabled(val.enabled);
      if (typeof val.client_id === "string") setGoogleClientId(val.client_id);
    }
  }, [googleSettingsQuery.data]);

  const handleSaveGoogleSettings = async () => {
    setSavingGoogleSettings(true);
    try {
      const res = await fetch("/api/public/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "google_one_tap_settings",
          value: {
            enabled: googleOneTapEnabled,
            client_id: googleClientId.trim(),
            auto_select: false,
          },
        }),
      });
      if (!res.ok) throw new Error("সংরক্ষণ ব্যর্থ হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings-google-one-tap"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-google-one-tap"] });
      toast.success("🎉 গুগল ওয়ান ট্যাপ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      toast.error("সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে: " + (err?.message || "ত্রুটি"));
    } finally {
      setSavingGoogleSettings(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopiedSql(true);
    toast.success("সম্পূর্ণ SQL স্ক্রিপ্ট কপি হয়েছে! Supabase SQL Editor-এ পেস্ট করে Run করুন।");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // 1. Fetch Users List (Tries RPC first, then falls back to profiles + user_roles)
  const usersQuery = useQuery({
    queryKey: ["admin-registered-users-list"],
    queryFn: async (): Promise<{ users: RegisteredUser[]; source: "rpc" | "profiles" }> => {
      // 0. Fetch directly from Cloudflare D1 (Edge-first, sub-1ms, zero-dependency)
      try {
        const res = await fetch("/api/public/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "admin-users-list" }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.ok && Array.isArray(json.users) && json.users.length > 0) {
            return { users: json.users, source: "rpc" };
          }
        }
      } catch {}

      // A. Try RPC function
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_admin_users_list" as any);
        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          const formatted: RegisteredUser[] = rpcData.map((u: any) => ({
            id: u.id,
            email: u.email || "",
            display_name: u.display_name,
            role: u.role || "user",
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            email_confirmed_at: u.email_confirmed_at,
            provider: u.provider || (u.email?.toLowerCase().endsWith("@gmail.com") ? "google" : "email"),
          }));
          return { users: formatted, source: "rpc" };
        }
      } catch {
        // fall back to profiles table
      }

      // B. Fallback: Query profiles and user_roles directly
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      const rolesMap = new Map<string, string>();
      (rolesRes.data || []).forEach((r: any) => {
        rolesMap.set(r.user_id, r.role);
      });

      const profilesList: any[] = profilesRes.data || [];
      const formatted: RegisteredUser[] = profilesList.map((p) => {
        const userRole = rolesMap.get(p.id) || (p.email?.toLowerCase() === "notabene.inc@gmail.com" ? "admin" : "user");
        const prov = (p as any).provider || (p.email?.toLowerCase().endsWith("@gmail.com") ? "google" : "email");
        return {
          id: p.id,
          email: p.email || "",
          display_name: p.display_name,
          role: userRole,
          created_at: p.created_at,
          last_sign_in_at: (p as any).last_sign_in_at || null,
          email_confirmed_at: (p as any).email_confirmed_at || null,
          provider: prov,
        };
      });

      // Augment with currentUser if logged in (guarantees the active admin/user appears with login timestamp)
      if (currentUser) {
        const existingIdx = formatted.findIndex(
          (u) => u.id === currentUser.id || (u.email && u.email.toLowerCase() === currentUser.email?.toLowerCase())
        );
        if (existingIdx >= 0) {
          if (!formatted[existingIdx].last_sign_in_at && currentUser.last_sign_in_at) {
            formatted[existingIdx].last_sign_in_at = currentUser.last_sign_in_at;
          }
          if (currentUser.email?.toLowerCase() === "notabene.inc@gmail.com") {
            formatted[existingIdx].role = "admin";
          }
        } else {
          formatted.unshift({
            id: currentUser.id,
            email: currentUser.email || "",
            display_name: currentUser.user_metadata?.display_name || (currentUser.email ? currentUser.email.split("@")[0] : "Admin"),
            role: currentUser.email?.toLowerCase() === "notabene.inc@gmail.com" ? "admin" : "user",
            created_at: currentUser.created_at || new Date().toISOString(),
            last_sign_in_at: currentUser.last_sign_in_at || new Date().toISOString(),
            email_confirmed_at: (currentUser as any).email_confirmed_at || null,
            provider: (currentUser as any).app_metadata?.provider || (currentUser.email?.toLowerCase().endsWith("@gmail.com") ? "google" : "email"),
          });
        }
      }

      return { users: formatted, source: "profiles" };
    },
  });

  const users = usersQuery.data?.users || [];
  const isRpcSource = usersQuery.data?.source === "rpc";

  // 2. Computed Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const standardUsers = users.filter((u) => u.role !== "admin").length;
    
    // Google vs Email provider count
    const googleUsers = users.filter((u) => {
      const p = (u.provider || "").toLowerCase();
      return p === "google" || u.email.toLowerCase().endsWith("@gmail.com");
    }).length;
    const emailUsers = total - googleUsers;

    // Logged in at least once
    const loggedInCount = users.filter((u) => Boolean(u.last_sign_in_at)).length;

    // New signups in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSignups = users.filter((u) => new Date(u.created_at).getTime() >= thirtyDaysAgo).length;

    return {
      total,
      admins,
      standardUsers,
      googleUsers,
      emailUsers,
      loggedInCount,
      recentSignups,
    };
  }, [users]);

  // 3. Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const emailMatch = u.email.toLowerCase().includes(query);
        const nameMatch = (u.display_name || "").toLowerCase().includes(query);
        const idMatch = u.id.toLowerCase().includes(query);
        if (!emailMatch && !nameMatch && !idMatch) return false;
      }

      // Role filter
      if (roleFilter !== "all") {
        if (u.role !== roleFilter) return false;
      }

      // Provider filter
      if (providerFilter !== "all") {
        const isGoogle = (u.provider || "").toLowerCase() === "google" || u.email.toLowerCase().endsWith("@gmail.com");
        if (providerFilter === "google" && !isGoogle) return false;
        if (providerFilter === "email" && isGoogle) return false;
      }

      // Login status filter
      if (loginFilter === "logged_in") {
        if (!u.last_sign_in_at) return false;
      } else if (loginFilter === "never") {
        if (u.last_sign_in_at) return false;
      } else if (loginFilter === "recent_7d") {
        if (!u.last_sign_in_at) return false;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(u.last_sign_in_at).getTime() < sevenDaysAgo) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "recent_signup") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "recent_login") {
        const timeA = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        const timeB = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === "name") {
        const nameA = a.display_name || a.email;
        const nameB = b.display_name || b.email;
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  }, [users, searchTerm, roleFilter, loginFilter, sortBy]);

  // 4. Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  // 5. Copy UID helper
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("ইউজার আইডি (UID) কপি করা হয়েছে!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 5.1 Update User Role (Cloudflare D1 + Supabase sync)
  const handleRoleChange = async (targetUser: RegisteredUser, newRole: string) => {
    if (targetUser.email?.toLowerCase() === "notabene.inc@gmail.com") {
      toast.error("সুপার অ্যাডমিনের রোল পরিবর্তন করা সম্ভব নয়।");
      return;
    }
    setUpdatingRoleId(targetUser.id);
    try {
      const res = await fetch("/api/public/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin-update-user-role",
          userId: targetUser.id,
          email: targetUser.email,
          role: newRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "রোল আপডেট ব্যর্থ হয়েছে");
      }

      // Also sync to Supabase if available as backup
      try {
        await supabase.from("user_roles").upsert(
          { user_id: targetUser.id, role: newRole },
          { onConflict: "user_id" }
        );
      } catch {}

      toast.success(
        `ব্যবহারকারী ${targetUser.email}-এর রোল সফলভাবে "${newRole === "admin" ? "অ্যাডমিন (Admin)" : "ব্যবহারকারী (User)"}" করা হয়েছে!`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-registered-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    } catch (err: any) {
      toast.error("রোল আপডেট ত্রুটি: " + (err?.message || "ব্যর্থ হয়েছে"));
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // 6. Export to CSV
  const handleExportCsv = () => {
    if (filteredUsers.length === 0) {
      toast.error("এক্সপোর্ট করার মতো কোনো ইউজার পাওয়া যায়নি।");
      return;
    }

    const headers = ["User ID", "Email", "Display Name", "Role", "Registered At", "Last Sign In At", "Email Confirmed At", "Provider"];
    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.email}"`,
      `"${(u.display_name || "").replace(/"/g, '""')}"`,
      `"${u.role}"`,
      `"${u.created_at}"`,
      `"${u.last_sign_in_at || "Never"}"`,
      `"${u.email_confirmed_at || "Pending"}"`,
      `"${u.provider || "email"}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registered_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`সফলভাবে ${filteredUsers.length} জন ইউজারের তথ্য CSV হিসেবে ডাউনলোড হয়েছে!`);
  };

  // Format relative or date string in Bengali
  const formatTimeBn = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "এইমাত্র";
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    if (diffDays === 1) return "গতকাল";
    if (diffDays < 7) return `${diffDays} দিন আগে`;

    return date.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c3c4c7] dark:border-[#3c434a] pb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
            <Users className="size-5 text-[#2271b1]" />
            <span>নিবন্ধিত অ্যাকাউন্ট ও সাইন-ইন তালিকা</span>
          </h2>
          <p className="text-xs text-[#646970] dark:text-[#a7aaad] mt-1">
            ওয়েবসাইটে একাউন্ট খোলা, সাইন আপ করা এবং সর্বশেষ লগইন করা সকল ব্যবহারকারীর তথ্য ও রেকর্ড।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-registered-users-list"] })}
            disabled={usersQuery.isFetching}
            className="h-8 text-xs cursor-pointer border-[#c3c4c7] dark:border-[#3c434a]"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${usersQuery.isFetching ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredUsers.length === 0}
            className="h-8 text-xs cursor-pointer border-[#c3c4c7] dark:border-[#3c434a] text-[#2271b1] hover:bg-[#2271b1]/10"
          >
            <Download className="size-3.5 mr-1.5" />
            <span>CSV এক্সপোর্ট ({filteredUsers.length})</span>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS (৪টি মূল পরিসংখ্যান কার্ড) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* কার্ড ১: মোট একাউন্ট */}
        <div className="p-4 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#646970] dark:text-[#a7aaad]">
              মোট নিবন্ধিত অ্যাকাউন্ট
            </span>
            <div className="p-2 rounded-lg bg-[#2271b1]/10 text-[#2271b1]">
              <Users className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1d2327] dark:text-white mt-2">
            {metrics.total} <span className="text-xs font-normal text-muted-foreground">জন</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
            <span>সাধারণ ইউজার: {metrics.standardUsers}</span>
            <span>&bull;</span>
            <span className="text-[#2271b1] font-medium">অ্যাডমিন: {metrics.admins}</span>
          </div>
        </div>

        {/* কার্ড ২: গুগল একাউন্ট (Google One Tap/OAuth) */}
        <div className="p-4 rounded border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-[#1e1e1e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#646970] dark:text-[#a7aaad]">
              গুগল সাইন-ইন অ্যাকাউন্ট
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <GoogleLogoSvg className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {metrics.googleUsers} <span className="text-xs font-normal text-muted-foreground">জন</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>ইমেইল: {metrics.emailUsers}</span>
            <span>&bull;</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {metrics.total > 0 ? `${Math.round((metrics.googleUsers / metrics.total) * 100)}% গুগল ব্যবহারকারী` : "০%"}
            </span>
          </div>
        </div>

        {/* কার্ড ৩: লগইন রেকর্ড পাওয়া গেছে */}
        <div className="p-4 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#646970] dark:text-[#a7aaad]">
              লগইন রেকর্ড পাওয়া গেছে
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <LogIn className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {metrics.loggedInCount} <span className="text-xs font-normal text-muted-foreground">জন</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {metrics.total > 0 ? `${Math.round((metrics.loggedInCount / metrics.total) * 100)}% অ্যাকাউন্ট অন্তত একবার লগইন করেছে` : "লগইন তথ্য পর্যবেক্ষণ"}
          </div>
        </div>

        {/* কার্ড ৪: নতুন সাইন আপ (গত ৩০ দিন) */}
        <div className="p-4 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#646970] dark:text-[#a7aaad]">
              নতুন সাইন আপ (৩০ দিন)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {metrics.recentSignups} <span className="text-xs font-normal text-muted-foreground">জন</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            গত ৩০ দিনে নতুন একাউন্ট খুলেছেন
          </div>
        </div>
      </div>

      {/* GOOGLE ONE TAP CONFIGURATION & MANAGEMENT CARD */}
      <div className="p-4 sm:p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/60 dark:border-blue-800/40">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-white dark:bg-[#1e1e1e] border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 shadow-xs">
              <GoogleLogoSvg className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">গুগল ওয়ান ট্যাপ (Google One Tap) সাইন-ইন সুবিধা</h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  googleOneTapEnabled && googleClientId.trim()
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                }`}>
                  {googleOneTapEnabled && googleClientId.trim() ? "ওয়েবসাইটে সক্রিয় (Active)" : "ক্লায়েন্ট আইডি বাকি (Setup Required)"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ভিজিটর ওয়েবসাইটে প্রবেশ করলেই ব্রাউজারের ডান দিকের ওপরের কোনায় Gmail দিয়ে এক ক্লিকে সাইন-ইন করার সুবিধা।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] px-3 py-1.5 rounded-lg border border-border shadow-2xs">
              <span className="text-xs font-medium text-foreground">সুবিধা চালু রাখুন:</span>
              <Switch
                checked={googleOneTapEnabled}
                onCheckedChange={setGoogleOneTapEnabled}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-8 space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-[#2271b1]" />
              <span>Google OAuth Web Client ID (গুগল ক্লায়েন্ট আইডি)</span>
            </label>
            <Input
              placeholder="যেমন: 1234567890-abcdefg12345.apps.googleusercontent.com"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              className="h-9 text-xs font-mono bg-white dark:bg-[#1e1e1e]"
            />
          </div>

          <div className="lg:col-span-4 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={savingGoogleSettings}
              onClick={handleSaveGoogleSettings}
              className="h-9 px-4 text-xs bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer shadow-xs flex-1"
            >
              {savingGoogleSettings ? (
                <>
                  <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" />
                  <span>সেটিংস সেভ করুন</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGoogleGuide(!showGoogleGuide)}
              className="h-9 text-xs border-blue-200 dark:border-blue-800 bg-white dark:bg-[#1e1e1e] cursor-pointer"
            >
              <span>নির্দেশিকা</span>
              {showGoogleGuide ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Expandable Step-by-step Google One Tap instructions */}
        {showGoogleGuide && (
          <div className="rounded-xl border border-blue-200/80 dark:border-blue-800/80 bg-white dark:bg-[#1e1e1e] p-4 text-xs space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#2271b1]" />
                <span>কীভাবে Google Web Client ID তৈরি করবেন? (২ মিনিটের সহজ গাইড)</span>
              </div>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#2271b1] hover:underline"
              >
                <span>Google Cloud Credentials খুলুন</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="space-y-2.5 text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">১</span>
                <p><strong className="text-foreground">Google Cloud Console-এ যান:</strong> <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-[#2271b1] underline">console.cloud.google.com/apis/credentials</a> পেজে গিয়ে আপনার গুগল অ্যাকাউন্ট দিয়ে লগইন করুন এবং একটি প্রজেক্ট সিলেক্ট করুন।</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">২</span>
                <p><strong className="text-foreground">OAuth Client ID তৈরি করুন:</strong> উপরে <strong>"+ Create Credentials"</strong> বাটনে ক্লিক করে <strong>"OAuth client ID"</strong> নির্বাচন করুন। Application type ড্রপডাউনে <strong>"Web application"</strong> সিলেক্ট করুন।</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">৩</span>
                <div className="space-y-1">
                  <p><strong className="text-foreground">Authorized JavaScript origins-এ ডোমেইনগুলো যুক্ত করুন:</strong></p>
                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border select-all">https://www.quraan.bd</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border select-all">https://www.quraan.bd</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border select-all">https://wooniche.com</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border select-all">https://www.wooniche.com</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border select-all">http://localhost:5173</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">৪</span>
                <p><strong className="text-foreground">Client ID সংরক্ষণ:</strong> <strong>"Create"</strong> বাটনে চাপলে আপনার একটি Client ID তৈরি হবে (যেমন: <code>...apps.googleusercontent.com</code>)। সেটি কপি করে উপরের বক্সে পেস্ট করে <strong>"সেটিংস সেভ করুন"</strong> বাটনে ক্লিক করুন।</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">৫</span>
                <p><strong className="text-foreground">Supabase Authentication এ সক্রিয়করণ:</strong> <a href="https://supabase.com/dashboard/project/djoshusyzfsndnmwpoxd/auth/providers" target="_blank" rel="noopener noreferrer" className="text-[#2271b1] underline">Supabase Dashboard Providers</a> পেজে Google এনাবল করে Client ID ও Secret বসিয়ে সেভ করুন।</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUPABASE AUTH SYNC NOTIFICATION BANNER */}
      {!isRpcSource ? (
        <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 shadow-xs space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-sm text-amber-800 dark:text-amber-300">
                <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Supabase লাইভ সাইন-ইন হিস্ট্রি সক্রিয় করুন</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed max-w-3xl">
                Supabase-এর ডেটাবেজ নিরাপত্তা আর্কিটেকচার অনুযায়ী সকল অ্যাকাউন্টের স্বয়ংক্রিয় লগইন হিস্ট্রি (`auth.users`) এক্সেস করতে মাত্র ১ বার নিচের SQL কোডটি Supabase SQL Editor-এ রান করতে হবে। কোডটি রান করার সাথে সাথে আপনার এইমাত্র লগইন করা ইমেইলসহ সকল অ্যাকাউন্টের লাইভ রেকর্ড এখানে স্বয়ংক্রিয়ভাবে চলে আসবে।
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopySql}
                className="h-8 text-xs border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-100 cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="size-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                    <span>কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1" />
                    <span>১-ক্লিকে SQL কপি করুন</span>
                  </>
                )}
              </Button>

              <a
                href="https://supabase.com/dashboard/project/djoshusyzfsndnmwpoxd/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-medium transition-colors shadow-xs"
              >
                <ExternalLink className="size-3.5" />
                <span>Supabase SQL Editor খুলুন</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span className="font-medium">Supabase Auth লাইভ সিঙ্ক সক্রিয়</span>
            <span className="hidden sm:inline text-muted-foreground">&bull; সরাসরি auth.users থেকে রিয়েল-টাইম তথ্য প্রদর্শিত হচ্ছে</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono">
            RPC Active
          </span>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* সার্চ বক্স */}
          <div className="relative flex-1">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder="ইমেইল, নাম বা ইউজার আইডি (UUID) দিয়ে অনুসন্ধান করুন..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs border-[#c3c4c7] dark:border-[#3c434a]"
            />
          </div>

          {/* ফিল্টার গ্রুপ */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* রোল ফিল্টার */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>রোল:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-background px-2.5 text-xs cursor-pointer"
              >
                <option value="all">সকল রোল</option>
                <option value="admin">অ্যাডমিন (Admin)</option>
                <option value="user">ইউজার (User)</option>
              </select>
            </div>

            {/* মাধ্যম (Provider) ফিল্টার */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="size-3.5" />
              <span>লগইন মাধ্যম:</span>
              <select
                value={providerFilter}
                onChange={(e) => {
                  setProviderFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-background px-2.5 text-xs cursor-pointer"
              >
                <option value="all">সকল মাধ্যম</option>
                <option value="google">গুগল অ্যাকাউন্ট (Google)</option>
                <option value="email">ইমেইল ও পাসওয়ার্ড (Email)</option>
              </select>
            </div>

            {/* লগইন স্ট্যাটাস ফিল্টার */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <LogIn className="size-3.5" />
              <span>লগইন:</span>
              <select
                value={loginFilter}
                onChange={(e) => {
                  setLoginFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-background px-2.5 text-xs cursor-pointer"
              >
                <option value="all">সকল অবস্থা</option>
                <option value="logged_in">লগইন করেছেন</option>
                <option value="recent_7d">গত ৭ দিনে সক্রিয়</option>
                <option value="never">কখনো লগইন করেননি</option>
              </select>
            </div>

            {/* সাজানো (Sort) */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>সাজান:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-background px-2.5 text-xs cursor-pointer"
              >
                <option value="recent_signup">সাম্প্রতিক সাইন আপ</option>
                <option value="recent_login">সর্বশেষ লগইন</option>
                <option value="name">নাম / ইমেইল</option>
              </select>
            </div>
          </div>
        </div>

        {/* ফিল্টার ফলাফল পরিসংখ্যান */}
        <div className="flex items-center justify-between text-xs text-[#646970] dark:text-[#a7aaad] pt-2 border-t border-[#f0f0f1] dark:border-[#2c3338]">
          <span>
            প্রদর্শিত হচ্ছে <strong>{filteredUsers.length}</strong> জন ব্যবহারকারী (মোট {users.length} জনের মধ্যে)
          </span>
          {(searchTerm || roleFilter !== "all" || loginFilter !== "all" || providerFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setLoginFilter("all");
                setProviderFilter("all");
              }}
              className="text-[#2271b1] hover:underline cursor-pointer"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* USER TABLE (ব্যবহারকারী তালিকা) */}
      <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#f6f7f7] dark:bg-[#2c3338] text-[#1d2327] dark:text-white border-b border-[#c3c4c7] dark:border-[#3c434a] uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">ব্যবহারকারী (User / Email)</th>
                <th className="p-3.5 w-32 text-center">লগইন মাধ্যম</th>
                <th className="p-3.5 w-24 text-center">রোল (Role)</th>
                <th className="p-3.5 w-40">অ্যাকাউন্ট তৈরি (Signed Up)</th>
                <th className="p-3.5 w-44">সর্বশেষ লগইন (Last Sign-in)</th>
                <th className="p-3.5 w-28 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1] dark:divide-[#2c3338]">
              {usersQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-[#2271b1]" />
                    <span>ব্যবহারকারী তালিকা লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="font-semibold text-foreground">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
                    <p className="text-xs mt-1">আপনার সার্চ বা ফিল্টার শর্ত অনুযায়ী কোনো একাউন্ট মেলেনি।</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const serial = (page - 1) * pageSize + idx + 1;
                  const initial = (user.display_name || user.email || "U").charAt(0).toUpperCase();
                  const isAdmin = user.role === "admin";
                  const isGoogleUser = (user.provider || "").toLowerCase() === "google" || user.email.toLowerCase().endsWith("@gmail.com");
                  const lastLoginText = formatTimeBn(user.last_sign_in_at);
                  const signupText = formatTimeBn(user.created_at);

                  return (
                    <tr 
                      key={user.id}
                      className="hover:bg-[#f6f7f7] dark:hover:bg-[#262c30] transition-colors"
                    >
                      {/* ক্রমিক নং */}
                      <td className="p-3.5 text-center font-mono text-muted-foreground">
                        {serial}
                      </td>

                      {/* ব্যবহারকারী ও ইমেইল */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {/* অবতার ব্যাজ */}
                          <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin 
                              ? "bg-[#2271b1] text-white shadow-xs" 
                              : isGoogleUser
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                          }`}>
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-xs truncate max-w-[200px] sm:max-w-xs">
                                {user.display_name || user.email.split("@")[0]}
                              </span>
                              {user.email_confirmed_at && (
                                <span title="ইমেইল ভেরিফাইড" className="text-emerald-600 inline-flex items-center">
                                  <CheckCircle2 className="size-3" />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground text-[11px] mt-0.5">
                              <span className="truncate max-w-[180px] sm:max-w-xs font-mono">{user.email}</span>
                              <span>&bull;</span>
                              <button
                                type="button"
                                onClick={() => handleCopyId(user.id)}
                                title="ইউজার আইডি কপি করুন"
                                className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-[#2271b1]/10 hover:text-[#2271b1] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              >
                                {copiedId === user.id ? (
                                  <>
                                    <Check className="size-2.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">কপি হয়েছে</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-2.5" />
                                    <span>{user.id.slice(0, 8)}...</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* লগইন মাধ্যম (Provider) */}
                      <td className="p-3.5 text-center">
                        {isGoogleUser ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 shadow-2xs">
                            <GoogleLogoSvg className="size-3 shrink-0" />
                            <span>Google</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Mail className="size-3 shrink-0 text-muted-foreground" />
                            <span>ইমেইল</span>
                          </span>
                        )}
                      </td>

                      {/* রোল */}
                      <td className="p-3.5 text-center">
                        {user.email?.toLowerCase() === "notabene.inc@gmail.com" ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#2271b1]/15 text-[#2271b1] border border-[#2271b1]/30 shadow-2xs"
                            title="মূল সিস্টেম সুপার অ্যাডমিন (অপরিবর্তনীয়)"
                          >
                            <ShieldCheck className="size-3 text-[#2271b1]" />
                            <span>Super Admin</span>
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <select
                              value={user.role || "user"}
                              disabled={updatingRoleId === user.id}
                              onChange={(e) => handleRoleChange(user, e.target.value)}
                              aria-label={`Change role for ${user.email}`}
                              className={`h-7 px-2 text-xs font-semibold rounded border cursor-pointer transition-all shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#2271b1] ${
                                isAdmin
                                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-bold"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <option value="user">User (ব্যবহারকারী)</option>
                              <option value="admin">Admin (অ্যাডমিন)</option>
                            </select>
                            {updatingRoleId === user.id && (
                              <RefreshCw className="size-3 animate-spin text-[#2271b1] shrink-0" />
                            )}
                          </div>
                        )}
                      </td>

                      {/* অ্যাকাউন্ট তৈরির তারিখ */}
                      <td className="p-3.5">
                        <div className="text-foreground font-medium text-xs">
                          {new Date(user.created_at).toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-muted-foreground text-[11px] mt-0.5 flex items-center gap-1">
                          <Clock className="size-3" />
                          <span>{signupText || "তারিখ সংরক্ষিত"}</span>
                        </div>
                      </td>

                      {/* সর্বশেষ লগইন */}
                      <td className="p-3.5">
                        {user.last_sign_in_at ? (
                          <div>
                            <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{lastLoginText}</span>
                            </div>
                            <div className="text-muted-foreground text-[11px] font-mono mt-0.5">
                              {new Date(user.last_sign_in_at).toLocaleDateString("bn-BD", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                            <span>লগইন রেকর্ড নেই</span>
                          </span>
                        )}
                      </td>

                      {/* অ্যাকশন বাটন */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* ইমেইল বাটন */}
                          <a
                            href={`mailto:${user.email}`}
                            title="সরাসরি ইমেইল পাঠান"
                            className="p-1.5 rounded hover:bg-[#2271b1]/10 text-muted-foreground hover:text-[#2271b1] transition-colors"
                          >
                            <Mail className="size-3.5" />
                          </a>

                          {/* পারমিশন বাটন */}
                          {onSelectUserForPerms && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="ইউজার পারমিশন সেটিংস"
                              onClick={() => onSelectUserForPerms({ id: user.id, email: user.email })}
                              className="h-7 px-2 text-xs text-[#2271b1] hover:bg-[#2271b1]/10 cursor-pointer"
                            >
                              <SlidersHorizontal className="size-3 mr-1" />
                              <span>পারমিশন</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="bg-[#f6f7f7] dark:bg-[#2c3338] px-4 py-3 border-t border-[#c3c4c7] dark:border-[#3c434a] flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              পৃষ্ঠা {page} / {totalPages} (মোট {filteredUsers.length} জন)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 text-xs px-2 cursor-pointer"
              >
                আগের পৃষ্ঠা
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 text-xs px-2 cursor-pointer"
              >
                পরের পৃষ্ঠা
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* HELPFUL NOTE / DOCUMENTATION */}
      <div className="p-4 rounded-xl border border-border/80 bg-secondary/30 text-xs text-foreground/80 leading-relaxed flex items-start gap-3">
        <Sparkles className="size-4 text-[#2271b1] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">💡 অ্যাকাউন্ট ও সাইন-ইন ট্র্যাকিং সংক্রান্ত তথ্য:</p>
          <p>
            কোনো পাঠক যখন ওয়েবসাইটে গুগল দিয়ে লগইন করেন বা ইমেইল দিয়ে সাইন আপ করেন, তখন সাথে সাথে Supabase Auth ও Profiles টেবিলে রেকর্ড সংরক্ষিত হয়।
            যে কোনো ইউজারের আইডি (UUID) ব্যবহার করে আপনি <strong>"ইউজার রোল ও পারমিশন"</strong> ট্যাব থেকে তাকে অ্যাডমিন বানাতে পারেন অথবা বিশেষ কুরআনিক কনটেন্ট অ্যাক্সেসের পারমিশন প্রদান করতে পারেন।
          </p>
        </div>
      </div>
    </div>
  );
}
