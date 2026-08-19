import { NextResponse } from "next/server";
import { JSON_HEADERS } from "./config";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { success: false, error, ...(extra || {}) },
    { status, headers: JSON_HEADERS },
  );
}

export function safeErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      code: record.code,
      message: record.message,
      details: record.details,
      hint: record.hint,
    };
  }

  return { message: String(error) };
}

export function safePublicError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error";
    }
  }
  return String(error);
}
