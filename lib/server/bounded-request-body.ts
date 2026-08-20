export class RequestBodyTooLargeError extends Error {
  readonly status = 413;

  constructor() {
    super("Request body too large");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readBoundedRequestBody(
  req: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  const contentLength = req.headers.get("content-length");
  const declaredLength = contentLength === null ? null : Number(contentLength);

  if (
    declaredLength !== null &&
    Number.isFinite(declaredLength) &&
    declaredLength > maxBytes
  ) {
    throw new RequestBodyTooLargeError();
  }

  if (!req.body) return new Uint8Array();

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;

      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new RequestBodyTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export function parseBoundedJsonBody<T = unknown>(body: Uint8Array): T {
  return JSON.parse(new TextDecoder().decode(body)) as T;
}

export async function parseBoundedFormDataBody(
  req: Request,
  body: Uint8Array,
) {
  const headers = new Headers(req.headers);
  headers.set("content-length", String(body.byteLength));
  const requestBody = new Uint8Array(body.byteLength);
  requestBody.set(body);

  return new Request(req.url, {
    method: req.method,
    headers,
    body: requestBody.buffer,
  }).formData();
}
