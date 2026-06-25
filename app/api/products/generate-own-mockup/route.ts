import sharp from "sharp";
import { FALLBACK_PRINT_BOX } from "./config";
import { findMockupFile } from "./assets";
import { saveDebug } from "./debug";
import { renderDesignImageLayer } from "./renderDesign";
import { renderElementsLayer } from "./renderElements";
import { json, normalizeBox, normalizeCategory, normalizeSide } from "./utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const category = normalizeCategory(body.category || body.productType || "tshirt");
    const side = normalizeSide(body.side || "front");

    const designImage = body.designImage || body.garmentImage || body.image || null;

    const outputArea = {
      width: Math.max(
        1,
        Number(body.mockupArea?.width || body.exportArea?.width || body.editorArea?.width || 1024)
      ),
      height: Math.max(
        1,
        Number(body.mockupArea?.height || body.exportArea?.height || body.editorArea?.height || 1024)
      ),
    };

    const fallbackPrintBox = FALLBACK_PRINT_BOX[category]?.[side] || FALLBACK_PRINT_BOX.tshirt.front;
    const printBox = normalizeBox(body.printBox, fallbackPrintBox);
    const safeArea = normalizeBox(body.safeArea, printBox);
    const hasDesignImage = typeof designImage === "string" && designImage.startsWith("data:image");

    console.log("MOCKUP API RECEIVED", {
      productId: body.productId,
      category,
      side,
      hasDesignImage,
      designImageLength: typeof designImage === "string" ? designImage.length : 0,
      designImageStart: typeof designImage === "string" ? designImage.slice(0, 40) : null,
      elements: Array.isArray(body.elements) ? body.elements.length : 0,
      renderMode: hasDesignImage ? "designImage-only" : "elements-fallback",
      printBox,
      safeArea,
      outputArea,
    });

    if (!hasDesignImage) {
      return json({ success: false, error: "Missing designImage data URL." }, 400);
    }

    const mockupFile = await findMockupFile(category, side);

    const base = await sharp(mockupFile)
      .resize({
        width: outputArea.width,
        height: outputArea.height,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await saveDebug("00-base-mockup.png", base);

    const designLayer = await renderDesignImageLayer({
      designImage,
      outputArea,
    });

    const elementLayer = null;

    if (Array.isArray(body.elements) && body.elements.length) {
      console.log("ELEMENTS IGNORED BECAUSE DESIGN_IMAGE_IS_SOURCE_OF_TRUTH", {
        elements: body.elements.length,
      });
    }

    const compositeInputs: sharp.OverlayOptions[] = [
      { input: designLayer, left: 0, top: 0, blend: "over" },
    ];

    if (elementLayer) {
      compositeInputs.push({
        input: elementLayer,
        left: 0,
        top: 0,
        blend: "over",
      });
    }

    const finalBuffer = await sharp(base)
      .composite(compositeInputs)
      .png()
      .toBuffer();

    await saveDebug("04-final-mockup.png", finalBuffer);

    const localImage = `data:image/png;base64,${finalBuffer.toString("base64")}`;

    return json({
      success: true,
      provider: "server-png-composite-design-image-only",
      mockupImages: [localImage],
      imageUrls: [localImage],
      images: [localImage],
      imageUrl: localImage,
      mockupUrl: localImage,
      localGarmentImage: localImage,
      localMockupImages: [localImage],
      count: 1,
      isAi: false,
      debug: {
        category,
        side,
        mockupFile,
        printBox,
        safeArea,
        outputArea,
        hasElementLayer: Boolean(elementLayer),
        renderMode: "designImage-only",
        ignoredElements: Array.isArray(body.elements) ? body.elements.length : 0,
        debugFiles: [
          "/debug-mockup/00-base-mockup.png",
          "/debug-mockup/01-design-input.png",
          "/debug-mockup/02-design-layer.png",
          "/debug-mockup/04-final-mockup.png",
        ],
      },
    });
  } catch (error: any) {
    console.error("OWN MOCKUP ERROR FULL:", {
      message: error?.message,
      stack: error?.stack,
    });

    return json(
      {
        success: false,
        error: error?.message || "Failed to generate mockup",
      },
      500
    );
  }
}
