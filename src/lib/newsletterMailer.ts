import { supabase } from "@/integrations/supabase/client";

export interface NewsletterSettings {
  to_email: string;
  resend_api_key?: string;
  from_email?: string;
  auto_send_on_publish?: boolean;
}

export interface ArticleForNewsletter {
  id?: string;
  title_bn: string;
  title_en?: string | null;
  slug: string;
  excerpt_bn?: string | null;
  excerpt_en?: string | null;
  cover_image_url?: string | null;
  author_id?: string | null;
  authorName?: string | null;
  tags?: string[] | null;
}

const DEFAULT_SENDER = "Quran Explore <onboarding@resend.dev>";
const SITE_BASE_URL = "https://www.quraan.bd";

/**
 * Clean and truncate plain text excerpt from HTML/markdown
 */
function cleanExcerpt(text?: string | null, maxLength = 220): string {
  if (!text) return "";
  const plain = text
    .replace(/<[^>]*>?/gm, " ")
    .replace(/[#*`_~>[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength) + "...";
}

/**
 * Generate a responsive, mobile-optimized HTML email template for article notifications.
 * Uses inline CSS compatible with Gmail, Apple Mail, Outlook, and web clients.
 */
export function renderArticleNewsletterHtml(
  article: ArticleForNewsletter,
  recipientEmail?: string
): string {
  const articleUrl = `${SITE_BASE_URL}/articles/${encodeURIComponent(article.slug)}`;
  const unsubscribeUrl = recipientEmail
    ? `${SITE_BASE_URL}/api/public/newsletter?unsubscribe=${encodeURIComponent(recipientEmail)}`
    : `${SITE_BASE_URL}/api/public/newsletter?unsubscribe=me`;

  const excerpt =
    cleanExcerpt(article.excerpt_bn) ||
    cleanExcerpt(article.excerpt_en) ||
    "কুরআন অন্বেষা (Quran Explore)-এ একটি নতুন গবেষণামূলক বিশ্লেষণধর্মী প্রবন্ধ প্রকাশিত হয়েছে। বিস্তারিত জানতে সম্পূর্ণ প্রবন্ধটি পড়ুন।";

  const author = article.authorName || "আলম এম";
  const tagsList = Array.isArray(article.tags) ? article.tags.slice(0, 3) : [];

  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title_bn}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', 'SolaimanLipi', Arial, sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased; line-height: 1.6;">
  <div style="background-color: #f3f4f6; padding: 24px 12px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
      
      <!-- Top Brand Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 28px 24px; text-align: center;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="text-align: center;">
                <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 20px; padding: 4px 14px; margin-bottom: 12px;">
                  <span style="color: #a7f3d0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    ✨ নতুন গবেষণা প্রকাশনা
                  </span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                  কুরআন অন্বেষা <span style="font-weight: 300; font-size: 18px; color: #d1fae5;">| Quran Explore</span>
                </h1>
                <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 13px;">
                  কুরআন নিয়ে মুক্ত গবেষণা, মননশীল চিন্তাভাবনা ও প্রাসঙ্গিক পর্যালোচনা
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Cover Image (Optional) -->
      ${
        article.cover_image_url
          ? `<tr>
        <td style="padding: 0;">
          <a href="${articleUrl}" target="_blank" style="text-decoration: none; display: block;">
            <img src="${article.cover_image_url}" alt="${article.title_bn}" style="width: 100%; max-height: 280px; object-fit: cover; display: block; border-bottom: 1px solid #e5e7eb;" />
          </a>
        </td>
      </tr>`
          : ""
      }

      <!-- Main Content Area -->
      <tr>
        <td style="padding: 32px 28px 24px 28px;">
          
          <!-- Tags / Categories -->
          ${
            tagsList.length > 0
              ? `<div style="margin-bottom: 14px;">
              ${tagsList
                .map(
                  (t) =>
                    `<span style="display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px; border: 1px solid #a7f3d0; margin-right: 6px; margin-bottom: 4px;">#${t}</span>`
                )
                .join("")}
            </div>`
              : ""
          }

          <!-- Title -->
          <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; line-height: 1.4; color: #111827;">
            <a href="${articleUrl}" target="_blank" style="color: #064e3b; text-decoration: none;">
              ${article.title_bn}
            </a>
          </h2>

          ${
            article.title_en
              ? `<p style="margin: 0 0 16px 0; font-size: 14px; font-style: italic; color: #6b7280;">
              ${article.title_en}
            </p>`
              : ""
          }

          <!-- Author Info -->
          <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
            <span style="font-size: 13px; color: #4b5563; font-weight: 500;">
              ✍️ লেখক: <strong style="color: #1f2937;">${author}</strong>
            </span>
          </div>

          <!-- Excerpt Card -->
          <div style="background-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 4px 8px 8px 4px; padding: 16px 18px; margin-bottom: 26px;">
            <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.7;">
              ${excerpt}
            </p>
          </div>

          <!-- CTA Button -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="text-align: center; padding: 8px 0 20px 0;">
                <a href="${articleUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.35); text-align: center;">
                  👉 সম্পূর্ণ প্রবন্ধটি পড়ুন &nbsp;→
                </a>
              </td>
            </tr>
          </table>

          <p style="margin: 16px 0 0 0; text-align: center; font-size: 12px; color: #9ca3af;">
            লিঙ্ক সরাসরি কাজ না করলে ব্রাউজারে পেস্ট করুন:<br>
            <a href="${articleUrl}" style="color: #059669; word-break: break-all; text-decoration: underline;">${articleUrl}</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
            কুরআন অন্বেষা (Quran Explore Pro) — একটি উন্মুক্ত, অলাভজনক মুক্ত চিন্তামূলক কুরআনিক প্ল্যাটফর্ম।<br>
            ওয়েবসাইট: <a href="${SITE_BASE_URL}" target="_blank" style="color: #059669; text-decoration: none; font-weight: 600;">quraan.bd</a>
          </p>

          <div style="font-size: 12px; color: #9ca3af; margin-bottom: 12px;">
            <a href="${SITE_BASE_URL}" target="_blank" style="color: #6b7280; text-decoration: none; margin: 0 8px;">হোমপেজ</a> •
            <a href="${SITE_BASE_URL}/articles" target="_blank" style="color: #6b7280; text-decoration: none; margin: 0 8px;">সকল প্রবন্ধ</a> •
            <a href="${SITE_BASE_URL}/lexicon" target="_blank" style="color: #6b7280; text-decoration: none; margin: 0 8px;">শব্দার্থ ও অভিধান</a>
          </div>

          <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.4;">
            আপনি এই ইমেইলটি পেয়েছেন কারণ আপনি কুরআন অন্বেষার নিউজলেটারে সাবস্ক্রাইব করেছিলেন।<br>
            ভবিষ্যতে ইমেইল পেতে না চাইলে <a href="${unsubscribeUrl}" style="color: #ef4444; text-decoration: underline;">আনসাবস্ক্রাইব (Unsubscribe)</a> করুন।
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Fetch newsletter settings from site_settings table
 */
export async function getNewsletterSettings(): Promise<NewsletterSettings> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .eq("key", "newsletter_settings")
      .maybeSingle();

    const val = (data?.value ?? {}) as Record<string, any>;
    return {
      to_email: String(val.to_email || "newslater+notabene.inc@gmail.com"),
      resend_api_key: val.resend_api_key ? String(val.resend_api_key).trim() : "",
      from_email: val.from_email ? String(val.from_email).trim() : DEFAULT_SENDER,
      auto_send_on_publish: val.auto_send_on_publish !== false,
    };
  } catch (err) {
    console.error("Failed to load newsletter settings:", err);
    return {
      to_email: "newslater+notabene.inc@gmail.com",
      from_email: DEFAULT_SENDER,
      auto_send_on_publish: true,
    };
  }
}

/**
 * Send an email directly using Resend REST API
 */
export async function sendEmailViaResend({
  apiKey,
  from,
  to,
  subject,
  html,
}: {
  apiKey: string;
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const recipients = Array.isArray(to) ? to : [to];
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || DEFAULT_SENDER,
        to: recipients,
        subject,
        html,
      }),
    });

    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errMsg =
        resData?.message ||
        resData?.error?.message ||
        `Resend API error (${response.status})`;
      return { success: false, error: errMsg };
    }

    return { success: true, data: resData };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Broadcast an article notification email to all active newsletter subscribers.
 */
export async function broadcastArticleNotification(
  article: ArticleForNewsletter
): Promise<{
  success: boolean;
  totalSubscribers: number;
  sentCount: number;
  error?: string;
  notice?: string;
}> {
  try {
    // 1. Load active newsletter subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("email");

    if (subError) {
      console.warn("Could not query newsletter_subscribers directly, proceeding to backend dispatch:", subError);
    }

    const emailList = Array.from(
      new Set(
        (subscribers || [])
          .map((s) => s.email?.trim().toLowerCase())
          .filter((e): e is string => Boolean(e && e.includes("@")))
      )
    );

    // 2. Load settings
    const settings = await getNewsletterSettings();

    // Always include admin notify email in the list if configured
    if (settings.to_email && !emailList.includes(settings.to_email.toLowerCase())) {
      emailList.push(settings.to_email.toLowerCase());
    }

    if (emailList.length === 0) {
      return {
        success: true,
        totalSubscribers: 0,
        sentCount: 0,
        notice: "কোনো সক্রিয় নিউজলেটার গ্রাহক পাওয়া যায়নি।",
      };
    }

    // 3. Check for Resend API key
    const apiKey = settings.resend_api_key;
    if (!apiKey) {
      return {
        success: false,
        totalSubscribers: emailList.length,
        sentCount: 0,
        error:
          "Resend API Key কনফিগার করা নেই। অ্যাডমিন সেটিংস (নিউজলেটার সেটিংস)-এ গিয়ে বিনামূল্যে পাওয়া Resend API Key যুক্ত করুন।",
      };
    }

    const fromEmail = settings.from_email || DEFAULT_SENDER;
    const subject = `[কুরআন অন্বেষা] নতুন প্রবন্ধ: ${article.title_bn}`;

    // Send emails in chunks of 50 (Resend limits single request to 50 recipients or batch)
    let successfulSends = 0;
    const chunkSize = 50;

    for (let i = 0; i < emailList.length; i += chunkSize) {
      const chunk = emailList.slice(i, i + chunkSize);
      // For personal experience and unsubscribe links, individual or bcc
      // Send with Resend
      const result = await sendEmailViaResend({
        apiKey,
        from: fromEmail,
        to: chunk,
        subject,
        html: renderArticleNewsletterHtml(article),
      });

      if (result.success) {
        successfulSends += chunk.length;
      } else {
        console.error("Resend chunk send error:", result.error);
        if (successfulSends === 0 && chunk.length === emailList.length) {
          return {
            success: false,
            totalSubscribers: emailList.length,
            sentCount: 0,
            error: result.error,
          };
        }
      }
    }

    return {
      success: true,
      totalSubscribers: emailList.length,
      sentCount: successfulSends,
    };
  } catch (err: any) {
    console.error("Broadcast article notification error:", err);
    return {
      success: false,
      totalSubscribers: 0,
      sentCount: 0,
      error: err?.message || String(err),
    };
  }
}

/**
 * Send a test newsletter email to the admin or a specified test email
 */
export async function sendTestNewsletterEmail(
  article: ArticleForNewsletter,
  targetEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getNewsletterSettings();
    const apiKey = settings.resend_api_key;

    if (!apiKey) {
      return {
        success: false,
        error: "Resend API Key কনফিগার করা নেই। অনুগ্রহ করে প্রথমে সেটিংস-এ API Key লিখুন।",
      };
    }

    const fromEmail = settings.from_email || DEFAULT_SENDER;
    const subject = `[টেস্ট নোটিফিকেশন] ${article.title_bn}`;
    const html = renderArticleNewsletterHtml(article, targetEmail);

    return await sendEmailViaResend({
      apiKey,
      from: fromEmail,
      to: targetEmail,
      subject,
      html,
    });
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
