import { task } from "@trigger.dev/sdk/v3";
import { renderPrintFilePng, type DesignSide } from "../shared/design-renderer";
import { uploadR2Object } from "../shared/r2";
import { getServiceSupabase, USER_PRODUCTS_TABLE } from "../shared/supabase";

type Payload = {
  userProductId: string;
  sides?: DesignSide[];
};

function parseJsonIfString<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function ensureDesignData(record: any) {
  const designData = parseJsonIfString<any>(record?.design_data, null);
  if (!designData || typeof designData !== "object") {
    throw new Error(`User product ${record?.id || "unknown"} has no design_data JSON`);
  }
  return designData;
}

function serializeError(error: unknown) {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function withPrintJobState(designData: any, patch: Record<string, unknown>) {
  return {
    ...designData,
    printFileStatus: patch.status || designData.printFileStatus,
    print_file_url:
      typeof patch.primaryUrl === "string"
        ? patch.primaryUrl
        : designData.print_file_url ?? null,
    backgroundJobs: {
      ...(designData.backgroundJobs || {}),
      printFile: patch.status || designData.backgroundJobs?.printFile,
    },
    production: {
      ...(designData.production || {}),
      jobs: {
        ...(designData.production?.jobs || {}),
        printFile: {
          ...(designData.production?.jobs?.printFile || {}),
          ...patch,
        },
      },
    },
  };
}

export const generateDesignPrintFile = task({
  id: "generate-design-print-file",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 60_000,
  },
  run: async (payload: Payload) => {
    if (!payload.userProductId) throw new Error("Missing userProductId");

    const supabase = getServiceSupabase();
    const { data: record, error } = await supabase
      .from(USER_PRODUCTS_TABLE)
      .select("id, design_data, print_files")
      .eq("id", payload.userProductId)
      .single();

    if (error) throw error;

    const designData = ensureDesignData(record);
    const existingPrintFiles = parseJsonIfString<any>(record?.print_files, {});
    const sides = payload.sides?.length
      ? payload.sides
      : (["front", "back"] as DesignSide[]);
    const urls: Partial<Record<DesignSide, string | null>> = {};
    const keys: Partial<Record<DesignSide, string | null>> = {};

    await supabase
      .from(USER_PRODUCTS_TABLE)
      .update({
        design_data: withPrintJobState(designData, {
          status: "processing",
          error: null,
          updatedAt: new Date().toISOString(),
        }),
        print_files: {
          ...existingPrintFiles,
          status: "processing",
          error: null,
        },
      })
      .eq("id", payload.userProductId);

    try {
      for (const side of sides) {
        const png = await renderPrintFilePng({ designData, side });
        if (!png) {
          urls[side] = null;
          keys[side] = null;
          continue;
        }

        const key = `user-products/${payload.userProductId}/print/${side}-${Date.now()}.png`;
        urls[side] = await uploadR2Object({
          key,
          body: png,
          contentType: "image/png",
        });
        keys[side] = key;
      }

      const primaryPrintUrl = urls.front || urls.back || null;
      const nextPrintFiles = {
        ...existingPrintFiles,
        front: urls.front ?? existingPrintFiles.front ?? null,
        back: urls.back ?? existingPrintFiles.back ?? null,
        keys: {
          ...(existingPrintFiles.keys || {}),
          front: keys.front ?? existingPrintFiles.keys?.front ?? null,
          back: keys.back ?? existingPrintFiles.keys?.back ?? null,
        },
        status: primaryPrintUrl ? "ready" : "skipped",
        error: null,
        updated_at: new Date().toISOString(),
      };

      const nextDesignData = withPrintJobState(designData, {
        status: nextPrintFiles.status,
        primaryUrl: primaryPrintUrl,
        frontUrl: nextPrintFiles.front,
        backUrl: nextPrintFiles.back,
        urls,
        keys,
        updatedAt: new Date().toISOString(),
        error: null,
      });

      const { error: updateError } = await supabase
        .from(USER_PRODUCTS_TABLE)
        .update({
          design_data: nextDesignData,
          print_files: nextPrintFiles,
        })
        .eq("id", payload.userProductId);

      if (updateError) throw updateError;

      return { userProductId: payload.userProductId, urls, keys };
    } catch (jobError) {
      const message = serializeError(jobError);
      await supabase
        .from(USER_PRODUCTS_TABLE)
        .update({
          design_data: withPrintJobState(designData, {
            status: "failed",
            error: message,
            updatedAt: new Date().toISOString(),
          }),
          print_files: {
            ...existingPrintFiles,
            status: "failed",
            error: message,
            updated_at: new Date().toISOString(),
          },
        })
        .eq("id", payload.userProductId);
      throw jobError;
    }
  },
});
