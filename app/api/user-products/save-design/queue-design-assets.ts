import { tasks } from "@trigger.dev/sdk/v3";
import type { DesignSide } from "../../../../trigger/shared/design-renderer";
import {
  normalizeSavedElements,
  resolveSavedDesignSides,
} from "./design-sides";

type QueueDesignAssetsInput = {
  userProductId: string;
  designData?: any;
  designFront?: any;
  designBack?: any;
};

function sideElements(input: QueueDesignAssetsInput, side: DesignSide) {
  if (side === "front") {
    return input.designData?.sides?.front?.elements ?? input.designFront;
  }

  return input.designData?.sides?.back?.elements ?? input.designBack;
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

  const frontElements = sideElements(input, "front");
  const backElements = sideElements(input, "back");
  const sides = resolveSavedDesignSides({ frontElements, backElements });
  if (!sides.length) {
    console.info("[save-design] trigger queue skipped: no artwork", {
      userProductId: input.userProductId,
      hasDesignDataFrontElements: Array.isArray(input.designData?.sides?.front?.elements),
      hasDesignDataBackElements: Array.isArray(input.designData?.sides?.back?.elements),
      designFrontCount: normalizeSavedElements(input.designFront).length,
      designBackCount: normalizeSavedElements(input.designBack).length,
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
    const triggerErrors = {
      printFile: null,
      thumbnail: "disabled",
    };

    console.info("[save-design] design asset jobs triggered", {
      userProductId: input.userProductId,
      sides,
      printFileRunId: (printRun as any)?.id ?? null,
      thumbnailRunId: null,
      triggerErrors: JSON.stringify(triggerErrors),
    });

    return {
      queued: true,
      sides,
      printFileRunId: (printRun as any)?.id ?? null,
      thumbnailRunId: null,
      triggerErrors,
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
