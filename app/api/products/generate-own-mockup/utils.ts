import { NextResponse } from "next/server";
import type { Box, Side } from "./types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function cleanBase64Image(image: string) {
  return String(image || "").replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

export function normalizeCategory(value: string) {
  const raw = String(value || "tshirt").toLowerCase().trim().replace(/\s+/g, "-");
  if (raw.includes("hoodie") || raw.includes("sweat")) return "hoodie";
  if (raw.includes("mug") || raw.includes("cup")) return "mug";
  if (raw.includes("cap") || raw.includes("hat")) return "cap";
  return "tshirt";
}

export function normalizeSide(value: string): Side {
  return value === "back" ? "back" : "front";
}

export function normalizeBox(value: unknown, fallback: Box): Box {
  const box = value as Partial<Box> | null | undefined;
  if (!box || !Number(box.width) || !Number(box.height)) return fallback;

  return {
    x: Math.round(Number(box.x || 0)),
    y: Math.round(Number(box.y || 0)),
    width: Math.max(1, Math.round(Number(box.width || 1))),
    height: Math.max(1, Math.round(Number(box.height || 1))),
  };
}

export function elementNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
