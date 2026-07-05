import { task } from "@trigger.dev/sdk/v3";

export const generateTemplatePreview = task({
  id: "generate-template-preview",
  run: async (payload: { templateId: string; label?: string | null; category?: string | null }) => {
    // TODO: implement with your renderer:
    // 1. Read template data by payload.templateId.
    // 2. Render a WebP thumbnail from the template JSON.
    // 3. Upload to R2/Supabase Storage.
    // 4. Update the template row/object with preview_url.
    return { ok: true, templateId: payload.templateId };
  },
});
