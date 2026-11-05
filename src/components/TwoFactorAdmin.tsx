import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Trash2,
  Mail,
  MessageSquare,
  KeyRound,
  Download,
  Printer,
  Eye,
  EyeOff,
  Send
} from "lucide-react";
import { toast } from "sonner";

import {
  edgeEnroll2Fa,
  edgeActivate2Fa,
  edgeDisable2Fa,
  edgeGenerateBackupCodes,
  edgeGetBackupCodes,
  edgeUpdatePhone,
  edgeSendSmsOtp,
  edgeVerifySmsOtp,
  ensureValidAuthToken,
  useSession
} from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePrefs } from "@/lib/prefs";

interface TotpFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function TwoFactorAdmin() {
  const { lang } = usePrefs();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  
  // Enrollment state
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Testing existing factor state
  const [testCode, setTestCode] = useState("");
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  // Unenrolling state
  const [unenrollBusy, setUnenrollBusy] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);

  // Backup Codes State
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesCount, setBackupCodesCount] = useState(0);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [generatingBackupCodes, setGeneratingBackupCodes] = useState(false);
  const [fetchingBackupCodes, setFetchingBackupCodes] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Mobile SMS Recovery State
  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [testSmsCode, setTestSmsCode] = useState("");
  const [sendingTestSms, setSendingTestSms] = useState(false);
  const [verifyingTestSms, setVerifyingTestSms] = useState(false);
  const [smsVerifiedSuccess, setSmsVerifiedSuccess] = useState<boolean | null>(null);
  const [smsCooldown, setSmsCooldown] = useState(0);

  // Test Email State
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState<boolean | null>(null);

  const { user } = useSession();

  // SMS timer countdown
  useEffect(() => {
    if (smsCooldown <= 0) return;
    const timer = setInterval(() => {
      setSmsCooldown((c) => (c > 1 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [smsCooldown]);

  useEffect(() => {
    loadFactors();
  }, [user?.email, user?.totp_enabled]);

  async function loadFactors() {
    setLoading(true);
    try {
      const token = await ensureValidAuthToken();
      let userEmail = user?.email || "";
      if (!userEmail && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("quran_anwesha_edge_session");
          if (raw) {
            const parsed = JSON.parse(raw);
            userEmail = parsed?.user?.email || "";
          }
        } catch {}
      }
      if (!userEmail) userEmail = "notabene.inc@gmail.com";
      const emailQuery = `email=${encodeURIComponent(userEmail)}&`;
      const url = `/api/public/auth?${emailQuery}_t=${Date.now()}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const isTotpActive = Boolean(data?.user?.totp_enabled || (data?.ok && user?.totp_enabled));
        if (isTotpActive) {
          setFactors([
            {
              id: "totp_edge",
              friendly_name: "Google Authenticator",
              factor_type: "totp",
              status: "verified",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
        } else {
          setFactors([]);
        }

        if (data?.user) {
          if (data.user.phone) {
            setPhone(data.user.phone);
            setPhoneInput(data.user.phone);
          }
          if (data.user.maskedPhone) {
            setMaskedPhone(data.user.maskedPhone);
          }
          if (typeof data.user.backupCodesCount === "number") {
            setBackupCodesCount(data.user.backupCodesCount);
          }
        }
      }
    } catch (err: any) {
      console.warn("Failed to load MFA factors:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateBackupCodes() {
    setGeneratingBackupCodes(true);
    try {
      let userEmail = user?.email || "notabene.inc@gmail.com";
      const data = await edgeGenerateBackupCodes(userEmail);
      if (data?.codes) {
        setBackupCodes(data.codes);
        setBackupCodesCount(data.count || data.codes.length);
        setShowBackupCodes(true);
        toast.success(
          lang === "bn"
            ? "🎉 ১০টি নতুন এককালীন ব্যাকআপ কোড তৈরি করা হয়েছে!"
            : "🎉 10 new one-time backup codes generated!"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate backup codes");
    } finally {
      setGeneratingBackupCodes(false);
    }
  }

  async function handleFetchBackupCodes() {
    setFetchingBackupCodes(true);
    try {
      let userEmail = user?.email || "notabene.inc@gmail.com";
      const data = await edgeGetBackupCodes(userEmail);
      if (data?.codes && data.codes.length > 0) {
        setBackupCodes(data.codes);
        setBackupCodesCount(data.count || data.codes.length);
        setShowBackupCodes(true);
        toast.success(lang === "bn" ? "সংরক্ষিত ব্যাকআপ কোড দেখানো হচ্ছে" : "Displaying saved backup codes");
      } else {
        toast.info(lang === "bn" ? "কোনো ব্যাকআপ কোড অবশিষ্ট নেই। নতুন কোড তৈরি করুন।" : "No backup codes found. Please generate new codes.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch backup codes");
    } finally {
      setFetchingBackupCodes(false);
    }
  }

  function handleCopyBackupCodes() {
    if (!backupCodes.length) return;
    const text = `Quran Explore Pro - 2FA Emergency Backup Codes:\n` +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n\nGenerated on: ${new Date().toLocaleString()}\nNote: Each backup code can be used only once.`;
    navigator.clipboard.writeText(text);
    setCopiedBackupCodes(true);
    toast.success(lang === "bn" ? "সবগুলো ব্যাকআপ কোড ক্লিপবোর্ডে কপি করা হয়েছে" : "All backup codes copied to clipboard");
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  }

  function handleDownloadBackupCodes() {
    if (!backupCodes.length) return;
    const text = `========================================\nALAM M (শব্দ আমার ক্যানভাস)\n2FA EMERGENCY BACKUP RECOVERY CODES\n========================================\n\nAccount: ${user?.email || "Admin"}\nGenerated on: ${new Date().toLocaleString()}\n\nEach code below can be used ONCE to sign in if you lose access to Google Authenticator:\n\n` +
      backupCodes.map((c, i) => `[ ${i + 1 < 10 ? "0" + (i + 1) : i + 1} ]  ${c}`).join("\n") +
      `\n\nKeep these codes safe and private!\n========================================\n`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quran-explore-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(lang === "bn" ? "ব্যাকআপ কোড টেক্সট ফাইল ডাউনলোড হয়েছে" : "Backup codes downloaded");
  }

  function handlePrintBackupCodes() {
    if (!backupCodes.length) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Quran Explore Pro - 2FA Backup Codes</title>
          <style>
            body { font-family: monospace; padding: 40px; color: #111; }
            h2 { font-size: 20px; margin-bottom: 4px; font-family: sans-serif; }
            p { font-size: 13px; color: #555; font-family: sans-serif; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 500px; }
            .code { border: 1px solid #ccc; padding: 10px 14px; border-radius: 6px; font-size: 16px; font-weight: bold; background: #fafafa; }
            .footer { margin-top: 30px; font-size: 12px; color: #888; font-family: sans-serif; }
          </style>
        </head>
        <body>
          <h2>Quran Explore Pro — 2FA Backup Codes</h2>
          <p>Account: ${user?.email || "Admin"} | Date: ${new Date().toLocaleDateString()}<br/>Keep these codes safe. Each code can be used once if phone is unavailable.</p>
          <div class="grid">
            ${backupCodes.map((c, i) => `<div class="code">${i + 1}. ${c}</div>`).join("")}
          </div>
          <div class="footer">Printed from quraan.bd admin security settings.</div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function handleSavePhone() {
    if (!phoneInput.trim()) {
      toast.error(lang === "bn" ? "মোবাইল নম্বর লিখুন" : "Please enter mobile number");
      return;
    }
    setSavingPhone(true);
    try {
      let userEmail = user?.email || "notabene.inc@gmail.com";
      const data = await edgeUpdatePhone(phoneInput.trim(), userEmail);
      setPhone(data.phone);
      setMaskedPhone(data.maskedPhone);
      toast.success(
        data.message || (lang === "bn" ? "মোবাইল নম্বর সংরক্ষিত হয়েছে!" : "Phone number saved!")
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to save phone number");
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleSendTestSms() {
    let userEmail = user?.email || "notabene.inc@gmail.com";
    setSendingTestSms(true);
    setSmsVerifiedSuccess(null);
    try {
      const data = await edgeSendSmsOtp(userEmail);
      setSmsCooldown(60);
      toast.success(
        data.message || (lang === "bn" ? "টেস্ট এসএমএস পাঠানো হয়েছে!" : "Test SMS sent!")
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to send test SMS");
    } finally {
      setSendingTestSms(false);
    }
  }

  async function handleVerifyTestSms() {
    if (!testSmsCode.trim() || testSmsCode.trim().length !== 6) {
      toast.error(lang === "bn" ? "৬ সংখ্যার কোড লিখুন" : "Enter 6-digit code");
      return;
    }
    setVerifyingTestSms(true);
    try {
      let userEmail = user?.email || "notabene.inc@gmail.com";
      await edgeVerifySmsOtp({
        email: userEmail,
        code: testSmsCode.trim(),
      });
      setSmsVerifiedSuccess(true);
      toast.success(lang === "bn" ? "মোবাইল নম্বর ও এসএমএস ওটিপি সফলভাবে যাচাই হয়েছে!" : "SMS verified successfully!");
    } catch (err: any) {
      setSmsVerifiedSuccess(false);
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingTestSms(false);
    }
  }

  async function handleSendTestEmail() {
    let userEmail = user?.email || "notabene.inc@gmail.com";
    setSendingTestEmail(true);
    setTestEmailSuccess(null);
    try {
      const res = await fetch("/api/public/auth-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to send email");
      setTestEmailSuccess(true);
      toast.success(lang === "bn" ? "আপনার ইমেইলে টেস্ট ওটিপি পাঠানো হয়েছে!" : "Test OTP sent to email!");
    } catch (err: any) {
      setTestEmailSuccess(false);
      toast.error(err.message || "Failed to send test email");
    } finally {
      setSendingTestEmail(false);
    }
  }

  async function startEnrollment() {
    setEnrollBusy(true);
    setVerifyCode("");
    try {
      let userEmail = user?.email || "";
      if (!userEmail && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("quran_anwesha_edge_session");
          if (raw) {
            const parsed = JSON.parse(raw);
            userEmail = parsed?.user?.email || "";
          }
        } catch {}
      }
      if (!userEmail) userEmail = "notabene.inc@gmail.com";
      const data = await edgeEnroll2Fa(userEmail);
      if (data && data.secret) {
        setFactorId("totp_edge");
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setIsEnrolling(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start 2FA enrollment");
    } finally {
      setEnrollBusy(false);
    }
  }

  async function handleVerifyAndActivate() {
    if (!secret || !verifyCode.trim()) {
      toast.error(lang === "bn" ? "৬ সংখ্যার ওটিপি কোডটি লিখুন" : "Please enter the 6-digit code");
      return;
    }

    setVerifying(true);
    try {
      let userEmail = user?.email || "";
      if (!userEmail && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("quran_anwesha_edge_session");
          if (raw) {
            const parsed = JSON.parse(raw);
            userEmail = parsed?.user?.email || "";
          }
        } catch {}
      }
      if (!userEmail) userEmail = "notabene.inc@gmail.com";
      await edgeActivate2Fa({
        secret,
        code: verifyCode.trim(),
        email: userEmail,
      });

      setFactors([
        {
          id: "totp_edge",
          friendly_name: "Google Authenticator",
          factor_type: "totp",
          status: "verified",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      toast.success(
        lang === "bn"
          ? "🎉 Google Authenticator (2FA) সফলভাবে সক্রিয় করা হয়েছে!"
          : "🎉 Google Authenticator (2FA) successfully activated!"
      );
      setIsEnrolling(false);
      setFactorId(null);
      setQrCode(null);
      setSecret(null);
      setVerifyCode("");

      // Clear emergency reset flag if any
      try {
        if (user?.email) {
          void fetch(`/api/public/auth-otp?email=${encodeURIComponent(user.email)}&action=clear-reset`);
        }
      } catch {}

      await loadFactors();
    } catch (err: any) {
      toast.error(
        err.message?.includes("Invalid") || err.message?.includes("mismatch") || err.message?.includes("ভুল")
          ? (lang === "bn" ? "ভুল কোড! অনুগ্রহ করে বর্তমান ৬ সংখ্যার কোডটি পুনরায় পরীক্ষা করুন।" : "Invalid code. Please re-check the 6-digit code.")
          : err.message || "Verification failed"
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleTestCode() {
    let userEmail = user?.email || "";
    if (!userEmail && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("quran_anwesha_edge_session");
        if (raw) {
          const parsed = JSON.parse(raw);
          userEmail = parsed?.user?.email || "";
        }
      } catch {}
    }
    if (!userEmail) userEmail = "notabene.inc@gmail.com";

    if (!factors[0] || !testCode.trim()) return;
    setTesting(true);
    setTestSuccess(null);
    try {
      const res = await fetch("/api/public/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-2fa",
          email: userEmail,
          code: testCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Invalid code");
      }

      setTestSuccess(true);
      toast.success(
        lang === "bn"
          ? "সঠিক কোড! Google Authenticator নিখুঁতভাবে কাজ করছে।"
          : "Code verified! Google Authenticator is working perfectly."
      );
    } catch (err: any) {
      setTestSuccess(false);
      toast.error(lang === "bn" ? "কোডটি ভুল অথবা মেয়াদোত্তীর্ণ।" : "Invalid or expired code.");
    } finally {
      setTesting(false);
    }
  }

  async function handleDisable2FA() {
    if (!factors[0]) return;
    setUnenrollBusy(true);
    try {
      let userEmail = user?.email || "";
      if (!userEmail && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("quran_anwesha_edge_session");
          if (raw) {
            const parsed = JSON.parse(raw);
            userEmail = parsed?.user?.email || "";
          }
        } catch {}
      }
      if (!userEmail) userEmail = "notabene.inc@gmail.com";

      await edgeDisable2Fa(userEmail);
      setFactors([]);

      // Clear emergency reset flag if any
      try {
        void fetch(`/api/public/auth-otp?email=${encodeURIComponent(userEmail)}&action=clear-reset`);
      } catch {}

      toast.success(lang === "bn" ? "2FA সুরক্ষা নিষ্ক্রিয় করা হয়েছে।" : "2FA disabled successfully.");
      setShowConfirmDisable(false);
      await loadFactors();
    } catch (err: any) {
      toast.error(err.message || "2FA নিষ্ক্রিয় করতে সমস্যা হয়েছে");
    } finally {
      setUnenrollBusy(false);
    }
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success(lang === "bn" ? "সিক্রেট কী কপি করা হয়েছে" : "Secret key copied");
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <p className="text-sm">2FA সিকিউরিটি কনফিগারেশন লোড হচ্ছে...</p>
      </div>
    );
  }

  const isEnabled = factors.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${isEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
            {isEnabled ? <ShieldCheck className="size-8" /> : <ShieldAlert className="size-8" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {lang === "bn" ? "দ্বি-স্তর বিশিষ্ট নিরাপত্তা (2FA) / Google Authenticator" : "Two-Factor Authentication (2FA) / Google Authenticator"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {lang === "bn"
                ? "Google Authenticator অ্যাপের মাধ্যমে প্রতি ৩০ সেকেন্ডে ডায়নামিক ৬ সংখ্যার OTP কোড বাধ্যতামূলক করে সুপার অ্যাডমিন অ্যাকাউন্টটিকে ব্রুট-ফোর্স বা পাসওয়ার্ড লিকের হাত থেকে শতভাগ সুরক্ষিত রাখুন।"
                : "Secure your super admin account against unauthorized access and brute-force attacks with dynamic 30-second time-based OTP codes."}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isEnabled
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
            }`}
          >
            <span className={`size-2 rounded-full ${isEnabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {isEnabled ? (lang === "bn" ? "সক্রিয় রয়েছে (Protected)" : "Active") : (lang === "bn" ? "নিষ্ক্রিয় (Disabled)" : "Disabled")}
          </span>
        </div>
      </div>

      {/* STATE 1: ALREADY ENABLED */}
      {isEnabled && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <h3 className="text-base font-semibold text-foreground">
                {lang === "bn" ? "আপনার অ্যাকাউন্টে Google Authenticator সংযুক্ত রয়েছে" : "Google Authenticator is configured"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground block">সুরক্ষার ধরন (Method)</span>
                <span className="font-semibold text-foreground mt-0.5 block flex items-center gap-1.5">
                  <Smartphone className="size-4 text-primary" /> TOTP Authenticator
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground block">স্ট্যাটাস (Status)</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  যাচাইকৃত ও কার্যকর
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground block">সংযুক্ত হয়েছে (Enrolled At)</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {new Date(factors[0].created_at).toLocaleDateString("bn-BD")}
                </span>
              </div>
            </div>

            {/* Emergency Email Backup Card */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Mail className="size-4 shrink-0" />
                <span>{lang === "bn" ? "জরুরি ইমেইল ব্যাকআপ সক্রিয় রয়েছে" : "Emergency Email Backup Active"}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "আপনার মোবাইল ফোন হারিয়ে গেলে বা নষ্ট হয়ে গেলে চিন্তার কোনো কারণ নেই। লগইন পেজের 'ইমেইলে ব্যাকআপ কোড পাঠান' অপশন ব্যবহার করে আপনার নিবন্ধিত ইমেইলে ওটিপি পাঠিয়ে সহজেই লগইন এবং প্রয়োজনে পুরনো ডিভাইস রিসেট করতে পারবেন।"
                  : "If your phone is lost or damaged, you can request an emergency 6-digit backup code to your registered email on the login screen to sign in and reset 2FA."}
              </p>
            </div>

            {/* Test Verification Tool */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {lang === "bn" ? "লাইভ কোড পরীক্ষা (Test Authenticator Code)" : "Test Authenticator Code"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {lang === "bn"
                      ? "আপনার ফোনের Google Authenticator-এর বর্তমান ৬ সংখ্যার কোডটি লিখে যাচাই করুন।"
                      : "Enter current 6-digit code to verify your app synchronization."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 max-w-sm">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-center tracking-widest text-base h-10"
                />
                <Button
                  onClick={handleTestCode}
                  disabled={testing || testCode.length !== 6}
                  size="sm"
                  className="shrink-0"
                >
                  {testing ? <Loader2 className="size-4 animate-spin mr-1" /> : <Check className="size-4 mr-1" />}
                  {lang === "bn" ? "পরীক্ষা করুন" : "Verify"}
                </Button>
              </div>

              {testSuccess === true && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> কোডটি সঠিক! ডিভাইসটি প্রস্তুত।
                </p>
              )}
              {testSuccess === false && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="size-3.5" /> ভুল কোড! সময় বা অ্যাপ সিঙ্ক চেক করুন।
                </p>
              )}
            </div>

            {/* Disable 2FA Action */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                ফোন পরিবর্তন বা অন্য কোনো প্রয়োজনে 2FA বন্ধ করতে পারেন।
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDisable(true)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 className="size-3.5 mr-1" />
                {lang === "bn" ? "2FA নিষ্ক্রিয় করুন" : "Disable 2FA"}
              </Button>
            </div>
          </div>

          {/* Confirm Disable Modal */}
          {showConfirmDisable && (
            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold text-sm">
                <AlertTriangle className="size-5 shrink-0" />
                <span>আপনি কি নিশ্চিতভাবে 2FA সুরক্ষা নিষ্ক্রিয় করতে চান?</span>
              </div>
              <p className="text-xs text-muted-foreground">
                এটি বন্ধ করলে আপনার অ্যাকাউন্ট শুধুমাত্র পাসওয়ার্ড দিয়ে লগইন করা যাবে, যা অ্যাকাউন্টের নিরাপত্তা হ্রাস করতে পারে।
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisable2FA}
                  disabled={unenrollBusy}
                >
                  {unenrollBusy ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  হ্যাঁ, নিষ্ক্রিয় করুন
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmDisable(false)}
                >
                  বাতিল
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: NOT ENABLED & NOT ENROLLING */}
      {!isEnabled && !isEnrolling && (
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs text-center space-y-6">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <QrCode className="size-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-foreground">
              {lang === "bn" ? "Google Authenticator সেটআপ শুরু করুন" : "Set up Google Authenticator"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === "bn"
                ? "আপনার মোবাইল ফোনের Google Authenticator অ্যাপ দিয়ে একটি QR কোড স্ক্যান করে অতি সহজেই ২-ফ্যাক্টর নিরাপত্তা চালু করুন।"
                : "Protect your admin account with Time-based One-Time Password (TOTP) verification."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto text-xs text-muted-foreground">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <span className="font-bold text-foreground block text-sm">১. অ্যাপ খুলুন</span>
              <span>মোবাইলে Google Authenticator অ্যাপটি ওপেন করুন।</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <span className="font-bold text-foreground block text-sm">২. কোড স্ক্যান</span>
              <span>QR কোডটি ক্যামেরা দিয়ে স্ক্যান করুন বা সিক্রেট কী লিখুন।</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <span className="font-bold text-foreground block text-sm">৩. কোড যাচাই</span>
              <span>অ্যাপে আসা ৬ সংখ্যার ওটিপি দিয়ে সক্রিয় করুন।</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={startEnrollment}
              disabled={enrollBusy}
              size="lg"
              className="px-6 font-semibold shadow-xs"
            >
              {enrollBusy ? <Loader2 className="size-5 animate-spin mr-2" /> : <Smartphone className="size-5 mr-2" />}
              {lang === "bn" ? "Google Authenticator যুক্ত করুন" : "Set up Authenticator"}
            </Button>
          </div>
        </div>
      )}

      {/* STATE 3: ENROLLING (SHOW QR CODE & VERIFY INPUT) */}
      {!isEnabled && isEnrolling && (
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <QrCode className="size-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                {lang === "bn" ? "ধাপ ১: Google Authenticator অ্যাপে স্ক্যান করুন" : "Step 1: Scan with Google Authenticator"}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEnrolling(false)}
              className="text-xs text-muted-foreground"
            >
              বাতিল করুন
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: QR Code Box */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-white border border-border shadow-xs text-black">
              {qrCode ? (
                qrCode.startsWith("data:") ? (
                  <img src={qrCode} alt="2FA QR Code" className="size-52 object-contain" />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: qrCode }}
                    className="size-52 flex items-center justify-center [&>svg]:size-full"
                  />
                )
              ) : (
                <div className="size-52 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="size-8 animate-spin" />
                </div>
              )}
              <span className="text-[11px] text-gray-500 mt-2 font-sans font-medium text-center">
                Google Authenticator দিয়ে স্ক্যান করুন
              </span>
            </div>

            {/* Right: Secret Key & Verification Form */}
            <div className="space-y-5">
              {/* Manual Secret Key */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {lang === "bn" ? "ক্যামেরা দিয়ে স্ক্যান করতে না পারলে এই সিক্রেট কী-টি ব্যবহার করুন:" : "Manual Secret Key:"}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-lg bg-muted border border-border font-mono text-xs text-foreground tracking-wider select-all break-all flex-1">
                    {secret}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySecret}
                    className="shrink-0 h-10 px-3"
                    title="Copy Key"
                  >
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>

              {/* Step 2: 6-Digit Code Input */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <Label className="text-sm font-semibold text-foreground block">
                  {lang === "bn" ? "ধাপ ২: অ্যাপে প্রদর্শিত ৬ সংখ্যার কোডটি লিখুন" : "Step 2: Enter the 6-digit code"}
                </Label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-center tracking-[0.5em] text-xl font-bold h-12 max-w-xs"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Google Authenticator অ্যাপে প্রদর্শিত ৬ ডিজিটের কোডটি লিখে নিচের বাটনে ক্লিক করুন।
                </p>

                <div className="pt-2">
                  <Button
                    onClick={handleVerifyAndActivate}
                    disabled={verifying || verifyCode.length !== 6}
                    size="lg"
                    className="w-full sm:w-auto px-8 font-semibold shadow-xs"
                  >
                    {verifying ? <Loader2 className="size-5 animate-spin mr-2" /> : <ShieldCheck className="size-5 mr-2" />}
                    {lang === "bn" ? "যাচাই করুন ও ২FA সক্রিয় করুন" : "Verify & Activate 2FA"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ONE-TIME BACKUP RECOVERY CODES */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {lang === "bn" ? "এককালীন ব্যাকআপ কোড (Backup Recovery Codes)" : "One-Time Backup Recovery Codes"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "bn"
                  ? "মোবাইল ফোন কাছে না থাকলে এই কোডগুলো দিয়ে সরাসরি লগইন করতে পারবেন।"
                  : "Use these one-time codes to sign in if you ever lose access to your authenticator app."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                backupCodesCount > 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {backupCodesCount > 0 ? `${backupCodesCount}টি কোড উপলব্ধ` : "কোনো কোড নেই"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleGenerateBackupCodes}
            disabled={generatingBackupCodes}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs"
          >
            {generatingBackupCodes ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="size-4 mr-1.5" />
            )}
            {backupCodesCount > 0 ? "নতুন ১০টি কোড জেনারেট করুন" : "১০টি ব্যাকআপ কোড জেনারেট করুন"}
          </Button>

          {backupCodesCount > 0 && !showBackupCodes && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchBackupCodes}
              disabled={fetchingBackupCodes}
            >
              {fetchingBackupCodes ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : (
                <Eye className="size-4 mr-1.5" />
              )}
              কোডগুলো দেখুন
            </Button>
          )}

          {showBackupCodes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBackupCodes(false)}
              className="text-xs text-muted-foreground"
            >
              <EyeOff className="size-4 mr-1.5" />
              লুকান
            </Button>
          )}
        </div>

        {showBackupCodes && backupCodes.length > 0 && (
          <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/80">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="size-3.5 text-amber-500" />
                আপনার অবশিষ্ট ব্যাকআপ কোডসমূহ ({backupCodes.length}টি):
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBackupCodes}
                  className="h-8 text-xs px-2.5"
                  title="সবগুলো কপি করুন"
                >
                  {copiedBackupCodes ? (
                    <Check className="size-3.5 text-emerald-500 mr-1" />
                  ) : (
                    <Copy className="size-3.5 mr-1" />
                  )}
                  {copiedBackupCodes ? "কপি হয়েছে" : "কপি করুন"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBackupCodes}
                  className="h-8 text-xs px-2.5"
                  title="টেক্সট ফাইল ডাউনলোড করুন"
                >
                  <Download className="size-3.5 mr-1" />
                  ডাউনলোড (.txt)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintBackupCodes}
                  className="h-8 text-xs px-2.5"
                  title="প্রিন্ট করুন"
                >
                  <Printer className="size-3.5 mr-1" />
                  প্রিন্ট
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-center">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-card border border-border shadow-2xs text-xs font-bold tracking-wider select-all text-foreground hover:border-amber-500/50 transition-colors"
                >
                  <span className="text-[10px] text-muted-foreground block font-sans font-normal mb-0.5">
                    #{idx + 1}
                  </span>
                  {code}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/20">
              💡 <strong>পরামর্শ:</strong> এই কোডগুলো একটি নিরাপদ স্থানে লিখে বা ডাউনলোড করে সংরক্ষণ করুন। প্রতিবার একটি কোড লগইনে ব্যবহারের পর তা স্বয়ংক্রিয়ভাবে বাতিল হয়ে যাবে।
            </p>
          </div>
        )}
      </div>

      {/* SECTION 3: MOBILE SMS OTP RECOVERY */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {lang === "bn" ? "মোবাইল এসএমএস রিকভারি (SMS OTP)" : "Mobile SMS OTP Recovery"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "bn"
                  ? "লগইনের সময় আপনার মোবাইল ফোনে ৬ সংখ্যার জরুরি ওটিপি এসএমএস পাঠানো হবে।"
                  : "Receive dynamic 6-digit verification codes on your mobile phone."}
              </p>
            </div>
          </div>
          <div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                phone
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {phone ? "মোবাইল সংযুক্ত" : "সংযুক্ত নেই"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5 max-w-md">
            <Label htmlFor="phoneInput" className="text-xs font-semibold">
              {lang === "bn" ? "মোবাইল নম্বর (বাংলাদেশ বা আন্তর্জাতিক)" : "Mobile Number (BD / International)"}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="phoneInput"
                type="tel"
                placeholder="017XXXXXXXX বা +88017XXXXXXXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="h-10 text-sm font-mono"
              />
              <Button
                onClick={handleSavePhone}
                disabled={savingPhone || !phoneInput.trim()}
                size="sm"
                className="shrink-0 h-10 px-4 font-medium"
              >
                {savingPhone ? <Loader2 className="size-4 animate-spin mr-1" /> : <Check className="size-4 mr-1" />}
                সংরক্ষণ করুন
              </Button>
            </div>
            {maskedPhone && (
              <p className="text-[11px] text-muted-foreground">
                বর্তমান সংরক্ষিত নম্বর:{" "}
                <span className="font-mono font-semibold text-foreground">{maskedPhone}</span>
              </p>
            )}
          </div>

          {phone && (
            <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    {lang === "bn" ? "লাইভ এসএমএস টেস্ট (Send Test SMS OTP)" : "Test SMS OTP Delivery"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "bn"
                      ? "আপনার নম্বরে একটি টেস্ট ওটিপি কোড পাঠিয়ে এসএমএস গেটওয়ে যাচাই করুন।"
                      : "Send a live verification SMS to verify gateway delivery."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendTestSms}
                  disabled={sendingTestSms || smsCooldown > 0}
                  className="text-xs shrink-0"
                >
                  {sendingTestSms ? (
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                  ) : (
                    <Send className="size-3.5 mr-1" />
                  )}
                  {smsCooldown > 0 ? `পুনরায় পাঠান (${smsCooldown}s)` : "টেস্ট এসএমএস পাঠান"}
                </Button>
              </div>

              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={testSmsCode}
                  onChange={(e) => setTestSmsCode(e.target.value.replace(/\D/g, ""))}
                  className="h-9 font-mono text-center tracking-widest text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleVerifyTestSms}
                  disabled={verifyingTestSms || testSmsCode.length !== 6}
                  className="shrink-0 h-9 text-xs"
                >
                  {verifyingTestSms ? (
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="size-3.5 mr-1" />
                  )}
                  যাচাই করুন
                </Button>
              </div>

              {smsVerifiedSuccess === true && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> এসএমএস ওটিপি সফলভাবে যাচাই হয়েছে! আপনার নম্বর প্রস্তুত।
                </p>
              )}
              {smsVerifiedSuccess === false && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="size-3.5" /> কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: EMERGENCY EMAIL BACKUP OTP */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Mail className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {lang === "bn" ? "জরুরি ইমেইল ওটিপি (Email OTP)" : "Emergency Email Backup OTP"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "bn"
                  ? "ডিভাইস হারিয়ে গেলে বা কোনো ব্যাকআপ না থাকলে ইমেইলে ওটিপি কোড দিয়ে লগইন ও রিসেট করা যাবে।"
                  : "Fallback OTP delivered directly to your verified admin email address via Resend."}
              </p>
            </div>
          </div>
          <div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              সর্বদা সক্রিয় (Active)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            সংযুক্ত ইমেইল ঠিকানা:{" "}
            <span className="font-semibold text-foreground">
              {user?.email || "notabene.inc@gmail.com"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestEmail}
            disabled={sendingTestEmail}
            className="text-xs shrink-0"
          >
            {sendingTestEmail ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Send className="size-3.5 mr-1" />
            )}
            টেস্ট ইমেইল ওটিপি পাঠান
          </Button>
        </div>

        {testEmailSuccess === true && (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> টেস্ট ওটিপি কোডটি আপনার ইনবক্সে পাঠানো হয়েছে!
          </p>
        )}
      </div>
    </div>
  );
}
