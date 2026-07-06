import { tasks } from "@trigger.dev/sdk/v3";
import type { DesignSide } from "../../../../trigger/shared/design-renderer";

type QueueDesignAssetsInput = {
  userProductId: string;
  designData?: any;
};

function sideHasArtwork(designData: any, side: DesignSide) {
  const elements = designData?.sides?.[side]?.elements;
  return Array.isArray(elements)
    ? elements.some((el) => el && !el.meta?.hidden && ["image", "text", "shape"].includes(String(el.type || "")))
    : false;
}

export async function queueDesignAssetJobs(input: QueueDesignAssetsInput) {
  if (!input.userProductId) throw new Error("Missing userProductId");

  const sides = (["front", "back"] as DesignSide[]).filter((side) =>
    sideHasArtwork(input.designData, side),
  );

  if (!sides.length) return { queued: false, reason: "no-artwork" };

  await Promise.all([
    tasks.trigger("generate-checkout-thumbnail", {
      userProductId: input.userProductId,
      side: sides.includes("front") ? "front" : sides[0],
    }),
    tasks.trigger("generate-design-print-file", {
      userProductId: input.userProductId,
      sides,
    }),
  ]);

  return { queued: true, sides };
}
