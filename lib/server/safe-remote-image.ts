import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const DEFAULT_ALLOWED_REMOTE_IMAGE_HOSTS = [
  "pub-32be62cb2f1f47048c590acdfa322022.r2.dev",
  "evrizmiyecvhgfmhtuyr.supabase.co",
];

function readUrlHost(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    return new URL(value.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function allowedHosts() {
  return new Set(
    [
      ...DEFAULT_ALLOWED_REMOTE_IMAGE_HOSTS,
      readUrlHost(process.env.R2_PUBLIC_URL),
      readUrlHost(process.env.CLOUDFLARE_R2_PUBLIC_URL),
      readUrlHost(process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL),
      readUrlHost(process.env.NEXT_PUBLIC_R2_PUBLIC_URL),
      readUrlHost(process.env.NEXT_PUBLIC_SUPABASE_URL),
      readUrlHost(process.env.SUPABASE_URL),
    ].filter((host): host is string => Boolean(host)),
  );
}

function ipv4ToNumber(ip: string) {
  return ip.split(".").reduce((total, part) => (total << 8) + Number(part), 0) >>> 0;
}

function isPrivateOrLocalAddress(address: string) {
  if (address === "::1" || address.toLowerCase() === "localhost") return true;
  if (address.toLowerCase().startsWith("fe80:")) return true;
  if (address.toLowerCase().startsWith("fc") || address.toLowerCase().startsWith("fd")) {
    return true;
  }

  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) return false;

  const numeric = ipv4ToNumber(address);
  const inRange = (base: string, maskBits: number) => {
    const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
    return (numeric & mask) === (ipv4ToNumber(base) & mask);
  };

  return (
    inRange("0.0.0.0", 8) ||
    inRange("10.0.0.0", 8) ||
    inRange("127.0.0.0", 8) ||
    inRange("169.254.0.0", 16) ||
    inRange("172.16.0.0", 12) ||
    inRange("192.168.0.0", 16) ||
    inRange("224.0.0.0", 4)
  );
}

async function assertSafeHostname(hostname: string) {
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isPrivateOrLocalAddress(hostname)
  ) {
    throw new Error("Blocked remote image host.");
  }

  if (isIP(hostname)) return;

  const records = await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateOrLocalAddress(record.address))) {
    throw new Error("Blocked remote image DNS target.");
  }
}

async function validateRemoteImageUrl(rawUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid remote image URL.");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (parsed.protocol !== "https:" || !hostname) {
    throw new Error("Blocked remote image protocol.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Blocked remote image credentials.");
  }

  if (parsed.port && parsed.port !== "443") {
    throw new Error("Blocked remote image port.");
  }

  if (!allowedHosts().has(hostname)) {
    throw new Error("Blocked remote image host.");
  }

  await assertSafeHostname(hostname);
  return parsed;
}

export async function validateSafeRemoteImageUrl(rawUrl: string, redirectCount = 0): Promise<string> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error("Remote image redirect limit exceeded.");
  }

  const url = await validateRemoteImageUrl(rawUrl);
  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      accept: "image/webp,image/png,image/jpeg",
      "user-agent": "Ryfio/1.0",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Remote image redirect missing location.");
    return validateSafeRemoteImageUrl(new URL(location, url).toString(), redirectCount + 1);
  }

  if (!response.ok) {
    throw new Error("Remote image validation failed.");
  }

  const contentType = normalizeContentType(response);
  if (contentType && !ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error("Unsupported remote image content type.");
  }

  const contentLengthHeader = response.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
  if (contentLength !== null && Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new Error("Remote image exceeds byte limit.");
  }

  return url.toString();
}

function normalizeContentType(response: Response) {
  return response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
}

async function readLimitedResponse(response: Response) {
  const contentType = normalizeContentType(response);
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error("Unsupported remote image content type.");
  }

  const contentLengthHeader = response.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
  if (contentLength !== null && Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new Error("Remote image exceeds byte limit.");
  }

  if (!response.body) {
    const fallback = Buffer.from(await response.arrayBuffer());
    if (fallback.length > MAX_IMAGE_BYTES) throw new Error("Remote image exceeds byte limit.");
    if (!fallback.length) throw new Error("Empty remote image response.");
    return { buffer: fallback, contentType };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error("Remote image exceeds byte limit.");
    }

    chunks.push(value);
  }

  if (total === 0) throw new Error("Empty remote image response.");

  return { buffer: Buffer.concat(chunks), contentType };
}

export async function fetchSafeRemoteImageBuffer(
  rawUrl: string,
  redirectCount = 0,
): Promise<{ buffer: Buffer; contentType: string }> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error("Remote image redirect limit exceeded.");
  }

  const url = await validateRemoteImageUrl(rawUrl);
  const response = await fetch(url, {
    headers: {
      accept: "image/webp,image/png,image/jpeg",
      "user-agent": "Ryfio/1.0",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Remote image redirect missing location.");
    return fetchSafeRemoteImageBuffer(new URL(location, url).toString(), redirectCount + 1);
  }

  if (!response.ok) {
    throw new Error("Remote image fetch failed.");
  }

  return readLimitedResponse(response);
}

export async function fetchSafeRemoteImageDataUrl(rawUrl: string) {
  const image = await fetchSafeRemoteImageBuffer(rawUrl);
  return `data:${image.contentType};base64,${image.buffer.toString("base64")}`;
}
