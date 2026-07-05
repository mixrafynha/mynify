export type FontPreviewJobPayload = {
  fontId: string;
};

export type FontRecord = {
  id: string;
  family: string;
  file_url: string | null;
  preview_url: string | null;
  preview_status: "pending" | "processing" | "ready" | "failed" | string | null;
};
