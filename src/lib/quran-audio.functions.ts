import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CDN = "https://verses.quran.com/Alafasy/mp3";

export const BUCKET = "recitation";

/** Public URL served by our own app (never quran.com). */
export function localAudioPath(surah: number, ayah: number) {
  return `/api/public/recitation/${surah}/${ayah}`;
}

function storagePath(surah: number, ayah: number) {
  return `${String(surah).padStart(3, "0")}/${String(ayah).padStart(3, "0")}.mp3`;
}

/** How much of the recitation already lives in our own storage. */
export const audioMirrorStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count: total } = await supabaseAdmin
    .from("quran_verses")
    .select("surah", { count: "exact", head: true });
  const { count: mirrored } = await supabaseAdmin
    .from("quran_verses")
    .select("surah", { count: "exact", head: true })
    .like("audio_url", "/api/public/recitation/%");
  return { total: total ?? 0, mirrored: mirrored ?? 0 };
});

/**
 * Copy one batch of verse recitations into our own storage bucket and repoint
 * the verse rows at our own endpoint. Returns the next offset (null when done).
 */
export const mirrorAudioBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { surah: number; offset?: number; limit?: number }) => ({
    surah: Math.max(1, Math.min(114, Math.trunc(input.surah))),
    offset: Math.max(0, Math.trunc(input.offset ?? 0)),
    limit: Math.max(1, Math.min(25, Math.trunc(input.limit ?? 15))),
  }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("quran_verses")
      .select("surah, ayah, audio_url")
      .eq("surah", data.surah)
      .order("ayah")
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { done: true, next: null, copied: 0 };

    let copied = 0;
    for (const row of rows) {
      const target = localAudioPath(row.surah, row.ayah);
      if (row.audio_url === target) continue;

      const remote = `${CDN}/${String(row.surah).padStart(3, "0")}${String(row.ayah).padStart(3, "0")}.mp3`;
      const res = await fetch(remote);
      if (!res.ok) throw new Error(`Recitation download failed (${res.status}) for ${row.surah}:${row.ayah}`);
      const bytes = new Uint8Array(await res.arrayBuffer());

      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storagePath(row.surah, row.ayah), bytes, {
          contentType: "audio/mpeg",
          upsert: true,
        });
      if (upErr) throw new Error(upErr.message);

      const { error: updErr } = await supabaseAdmin
        .from("quran_verses")
        .update({ audio_url: target })
        .eq("surah", row.surah)
        .eq("ayah", row.ayah);
      if (updErr) throw new Error(updErr.message);
      copied += 1;
    }

    const next = data.offset + rows.length;
    return { done: rows.length < data.limit, next, copied };
  });
