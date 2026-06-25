import sharp from "sharp";
import { cleanBase64Image } from "./utils";
import { saveDebug } from "./debug";
import type { OutputArea } from "./types";

export async function renderDesignImageLayer(args: {
  designImage: string;
  outputArea: OutputArea;
}) {
  const input = Buffer.from(cleanBase64Image(args.designImage), "base64");

  await saveDebug("01-design-input.png", input);

  const layer = await sharp(input)
    .resize({
      width: args.outputArea.width,
      height: args.outputArea.height,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await saveDebug("02-design-layer.png", layer);

  return layer;
}
