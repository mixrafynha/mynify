import { task } from "@trigger.dev/sdk/v3";

export const generateTemplatePreview = task({
  id: "generate-template-preview",
  run: async (payload: { templateId: string; label?: string | null; category?: string | null }) => {
    // Left intentionally minimal for now.
    // Font previews are implemented in generate-font-preview.ts.
    // Template preview rendering should use the app's real template/canvas renderer,
    // otherwise it risks generating thumbnails that do not match production export.
    return { ok: true, templateId: payload.templateId };
  },
});
