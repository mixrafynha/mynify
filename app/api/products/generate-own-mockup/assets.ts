import path from "path";
import fs from "fs/promises";
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

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const response = await fetch(value, {
      headers: {
        "User-Agent": "Ryfio/1.0",
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
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
