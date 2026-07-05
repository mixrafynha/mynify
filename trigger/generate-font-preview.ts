import { task } from "@trigger.dev/sdk/v3";

export const generateFontPreview = task({
  id: "generate-font-preview",
  run: async (payload: { fontId: string; family?: string | null; category?: string | null }) => {
    // TODO: implement with your storage/database layer:
    // 1. Read the font file URL by payload.fontId from Supabase.
    // 2. Render the preview text into a small WebP/PNG using sharp/Satori or your renderer.
    // 3. Upload to R2/Supabase Storage.
    // 4. Update the font row with preview_url.
    return { ok: true, fontId: payload.fontId };
  },
});
