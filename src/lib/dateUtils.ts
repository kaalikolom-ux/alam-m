// src/lib/dateUtils.ts

/**
 * Converts any date or ISO string into a local 'YYYY-MM-DDTHH:mm' format
 * suitable for HTML5 `<input type="datetime-local" />`.
 */
export function toDateTimeLocalString(date?: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a 'YYYY-MM-DDTHH:mm' local string from `<input type="datetime-local" />`
 * back into a full ISO string (UTC).
 */
export function fromDateTimeLocalString(localStr?: string | null): string | null {
  if (!localStr || !localStr.trim()) return null;
  const d = new Date(localStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Formats a date into a human-friendly Bengali string with both date and time.
 * E.g., "৮ নভেম্বর ২০২৬, ৯:২৯ AM"
 */
export function formatFullDateTimeBn(date?: string | Date | null): string {
  if (!date) return "তারিখ নির্ধারণ করা হয়নি";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "তারিখ নির্ধারণ করা হয়নি";
  try {
    return d.toLocaleString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return d.toLocaleDateString("bn-BD");
  }
}

/**
 * Formats a date into a human-friendly Bengali date only.
 * E.g., "৮ নভেম্বর ২০২৬"
 */
export function formatDateBn(date?: string | Date | null): string {
  if (!date) return "তারিখ নেই";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "তারিখ নেই";
  try {
    return d.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d.toLocaleDateString("bn-BD");
  }
}
