import path from "path";
import fs from "fs/promises";
import { fetchSafeRemoteImageBuffer } from "@/lib/server/safe-remote-image";
import { cleanBase64Image } from "./utils";
import type { Side } from "./types";

export async function loadImageBuffer(src: string) {
  const value = String(src || "").trim();

  if (!value) {
    throw new Error("Empty image src");
  }

  if (value.startsWith("data:image")) {
    return Buffer.from(cleanBase64Image(value), "base64");
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
    if (!value.startsWith("https://")) {
      throw new Error("Unsupported remote image URL.");
    }

    const image = await fetchSafeRemoteImageBuffer(value);
    return image.buffer;
  }

  if (value.startsWith("/")) {
    return fs.readFile(path.join(process.cwd(), "public", value.replace(/^\//, "")));
  }

  return fs.readFile(path.join(process.cwd(), "public", value));
}

export async function findMockupFile(category: string, side: Side) {
  const dir = path.join(process.cwd(), "public", "mockups");

  const candidates = [
    path.join(dir, `${category}-${side}.png`),
    path.join(dir, `${category}_${side}.png`),
    path.join(dir, category, `${side}.png`),
    path.join(dir, category, `${category}-${side}.png`),
    path.join(dir, `tshirt-${side}.png`),
    path.join(dir, "tshirt", `${side}.png`),
  ];

  for (const file of candidates) {
    try {
      await fs.access(file);
      return file;
    } catch {}
  }

  throw new Error(`No mockup PNG found for category=${category}, side=${side}`);
}
