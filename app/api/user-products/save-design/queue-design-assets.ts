import { tasks } from "@trigger.dev/sdk/v3";
import type { DesignSide } from "../../../../trigger/shared/design-renderer";

type QueueDesignAssetsInput = {
  userProductId: string;
  designData?: any;
  designFront?: any;
  designBack?: any;
};

function parseJsonIfString<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeElements(value: unknown) {
  const parsed = parseJsonIfString<unknown>(value, value);
  return Array.isArray(parsed) ? parsed : [];
}

function elementHasArtwork(el: any) {
  if (!el || typeof el !== "object" || el.meta?.hidden) return false;

  const type = String(el.type || "");
  if (type === "text") return String(el.text ?? el.content ?? "").trim().length > 0;
  if (type === "image") return true;
  if (type === "shape") return true;

  return false;
}

function elementsHaveArtwork(elements: unknown) {
  return normalizeElements(elements).some(elementHasArtwork);
}

function sideElements(input: QueueDesignAssetsInput, side: DesignSide) {
  if (side === "front") {
    return input.designData?.sides?.front?.elements ?? input.designFront;
  }

  return input.designData?.sides?.back?.elements ?? input.designBack;
}

function sideHasArtwork(input: QueueDesignAssetsInput, side: DesignSide) {
  return elementsHaveArtwork(sideElements(input, side));
}

function serializeQueueError(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function queueDesignAssetJobs(input: QueueDesignAssetsInput) {
  if (!input.userProductId) throw new Error("Missing userProductId");

  const sides = (["front", "back"] as DesignSide[]).filter((side) =>
    sideHasArtwork(input, side),
  );

  if (!sides.length) {
    console.info("[save-design] trigger queue skipped: no artwork", {
      userProductId: input.userProductId,
      hasDesignDataFrontElements: Array.isArray(input.designData?.sides?.front?.elements),
      hasDesignDataBackElements: Array.isArray(input.designData?.sides?.back?.elements),
      designFrontCount: normalizeElements(input.designFront).length,
      designBackCount: normalizeElements(input.designBack).length,
    });

    return { queued: false, reason: "no-artwork", sides: [] as DesignSide[] };
  }

  console.info("[save-design] triggering design asset jobs", {
    userProductId: input.userProductId,
    sides,
  });

  try {
    const printRun = await tasks.trigger("generate-design-print-file", {
      userProductId: input.userProductId,
      sides,
    });

    console.info("[save-design] design asset jobs triggered", {
      userProductId: input.userProductId,
      sides,
      printFileRunId: (printRun as any)?.id ?? null,
    });

    return {
      queued: true,
      sides,
      printFileRunId: (printRun as any)?.id ?? null,
    };
  } catch (error) {
    const message = serializeQueueError(error);

    console.error("[save-design] failed to trigger design asset jobs", {
      userProductId: input.userProductId,
      sides,
      error: message,
    });

    return {
      queued: false,
      reason: "trigger-error",
      error: message,
      sides,
    };
  }
}
