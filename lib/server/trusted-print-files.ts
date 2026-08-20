import { isIP } from "node:net";

export type TrustedPrintFile = {
  type: "default" | "back";
  url: string;
};

export type PrintFileSide = "front" | "back";

export type TrustedPrintFileErrorCode =
  | "PRINT_FILE_CONFIG_INVALID"
  | "PRINT_FILE_FORMAT_INVALID"
  | "PRINT_FILE_KEY_MISSING"
  | "PRINT_FILE_KEY_INVALID"
  | "PRINT_FILE_OWNERSHIP_INVALID"
  | "PRINT_FILE_URL_INVALID"
  | "PRINT_FILE_URL_MISMATCH"
  | "PRINT_FILE_COUNT_INVALID";

export class TrustedPrintFileError extends Error {
  constructor(
    public readonly code: TrustedPrintFileErrorCode,
    public readonly side: PrintFileSide | null = null,
  ) {
    super(code);
    this.name = "TrustedPrintFileError";
  }
}

type ResolveTrustedPrintFilesArgs = {
  printFiles: Record<string, unknown> | null | undefined;
  userId: string;
  userProductId: string;
};

const ALLOWED_EXTENSIONS = "(?:png|jpe?g|webp)";
const SIDES: PrintFileSide[] = ["front", "back"];

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sideUrl(value: unknown) {
  const direct = stringValue(value);
  if (direct) return direct;

  const record = objectValue(value);
  return stringValue(record.url) ?? stringValue(record.publicUrl);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertTrustedBaseUrl(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    throw new TrustedPrintFileError("PRINT_FILE_CONFIG_INVALID");
  }

  let url: URL;
  try {
    url = new URL(rawValue.trim());
  } catch {
    throw new TrustedPrintFileError("PRINT_FILE_CONFIG_INVALID");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const ipHostname = hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
  if (
    url.protocol !== "https:" ||
    !hostname ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    isIP(ipHostname) !== 0 ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new TrustedPrintFileError("PRINT_FILE_CONFIG_INVALID");
  }

  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url;
}

function buildUrl(base: URL, path: string) {
  const basePath = base.pathname.replace(/\/+$/, "");
  const url = new URL(base.toString());
  url.pathname = `${basePath}/${path.replace(/^\/+/, "")}`;
  return url;
}

function assertStoredUrlMatches(storedValue: string | null, expected: URL, side: PrintFileSide) {
  if (!storedValue) return;

  let stored: URL;
  try {
    stored = new URL(storedValue);
  } catch {
    throw new TrustedPrintFileError("PRINT_FILE_URL_INVALID", side);
  }

  if (
    stored.protocol !== "https:" ||
    stored.username ||
    stored.password ||
    (stored.port && stored.port !== "443") ||
    stored.search ||
    stored.hash ||
    stored.hostname.toLowerCase() !== expected.hostname.toLowerCase() ||
    decodeURIComponent(stored.pathname) !== decodeURIComponent(expected.pathname)
  ) {
    throw new TrustedPrintFileError("PRINT_FILE_URL_MISMATCH", side);
  }
}

function resolveR2File(args: {
  key: string;
  storedUrl: string | null;
  side: PrintFileSide;
  userId: string;
  userProductId: string;
}) {
  const { key, storedUrl, side, userId, userProductId } = args;
  const currentJobKey = new RegExp(
    `^user-products/${escapeRegExp(userProductId)}/print/${side}-(?:[0-9]{10,}|[0-9a-f]{8}-[0-9a-f-]{27})\\.${ALLOWED_EXTENSIONS}$`,
    "i",
  );
  const directUploadKey = new RegExp(
    `^users/${escapeRegExp(userId)}/${escapeRegExp(userProductId)}/print/${side}\\.${ALLOWED_EXTENSIONS}$`,
    "i",
  );

  if (!currentJobKey.test(key) && !directUploadKey.test(key)) {
    const belongsToAnotherProduct = /^user-products\/[^/]+\/print\//i.test(key);
    throw new TrustedPrintFileError(
      belongsToAnotherProduct ? "PRINT_FILE_OWNERSHIP_INVALID" : "PRINT_FILE_KEY_INVALID",
      side,
    );
  }

  const r2Base = assertTrustedBaseUrl(
    process.env.R2_PUBLIC_URL ||
      process.env.CLOUDFLARE_R2_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  );
  const expected = buildUrl(r2Base, key);
  assertStoredUrlMatches(storedUrl, expected, side);
  return expected.toString();
}

function resolveSupabaseStorageFile(args: {
  path: string;
  storedUrl: string | null;
  side: PrintFileSide;
  userId: string;
  userProductId: string;
}) {
  const { path, storedUrl, side, userId, userProductId } = args;
  const expectedPath = new RegExp(
    `^${escapeRegExp(userId)}/${escapeRegExp(userProductId)}/print/${side}\\.${ALLOWED_EXTENSIONS}$`,
    "i",
  );

  if (!expectedPath.test(path)) {
    throw new TrustedPrintFileError("PRINT_FILE_OWNERSHIP_INVALID", side);
  }

  const supabaseBase = assertTrustedBaseUrl(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const bucket = (process.env.SUPABASE_DESIGN_BUCKET || "design-assets").trim();
  if (!/^[a-zA-Z0-9._-]{1,63}$/.test(bucket)) {
    throw new TrustedPrintFileError("PRINT_FILE_CONFIG_INVALID", side);
  }

  const expected = buildUrl(
    supabaseBase,
    `storage/v1/object/public/${bucket}/${path}`,
  );
  assertStoredUrlMatches(storedUrl, expected, side);
  return expected.toString();
}

export function resolveTrustedPrintFiles(args: ResolveTrustedPrintFilesArgs): TrustedPrintFile[] {
  const record = objectValue(args.printFiles);
  const keys = objectValue(record.keys);
  const paths = objectValue(record.paths);

  if (Array.isArray(record.files) && record.files.length > 0) {
    throw new TrustedPrintFileError(
      record.files.length > 2
        ? "PRINT_FILE_COUNT_INVALID"
        : "PRINT_FILE_FORMAT_INVALID",
    );
  }

  const files: TrustedPrintFile[] = [];

  for (const side of SIDES) {
    const storedUrl = sideUrl(record[side]);
    const nested = objectValue(record[side]);
    const key =
      stringValue(keys[side]) ??
      stringValue(nested.key) ??
      stringValue(nested.storageKey);
    const path = stringValue(paths[side]) ?? stringValue(nested.path);

    if (!storedUrl && !key && !path) continue;
    if (!key && !path) {
      throw new TrustedPrintFileError("PRINT_FILE_KEY_MISSING", side);
    }
    if (key && path) {
      throw new TrustedPrintFileError("PRINT_FILE_FORMAT_INVALID", side);
    }

    const url = key
      ? resolveR2File({
          key,
          storedUrl,
          side,
          userId: args.userId,
          userProductId: args.userProductId,
        })
      : resolveSupabaseStorageFile({
          path: path!,
          storedUrl,
          side,
          userId: args.userId,
          userProductId: args.userProductId,
        });

    files.push({
      type: side === "front" ? "default" : "back",
      url,
    });
  }

  if (files.length > 2) {
    throw new TrustedPrintFileError("PRINT_FILE_COUNT_INVALID");
  }

  return files;
}
