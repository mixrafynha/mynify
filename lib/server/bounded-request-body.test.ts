import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseBoundedFormDataBody,
  parseBoundedJsonBody,
  readBoundedRequestBody,
  RequestBodyTooLargeError,
} from "./bounded-request-body";

function request(body: BodyInit, headers?: HeadersInit) {
  return new Request("https://www.ryfio.com/api/upload", {
    method: "POST",
    headers,
    body,
  });
}

function expectTooLarge(error: unknown) {
  assert.ok(error instanceof RequestBodyTooLargeError);
  assert.equal(error.status, 413);
  assert.equal(error.message, "Request body too large");
  return true;
}

test("legitimate JSON body remains byte-for-byte parseable", async () => {
  const body = JSON.stringify({ side: "front", dataUrl: "data:image/png;base64,AAAA" });
  const raw = await readBoundedRequestBody(
    request(body, { "content-type": "application/json" }),
    1024,
  );

  assert.deepEqual(parseBoundedJsonBody(raw), JSON.parse(body));
});

test("body exactly at the effective limit passes", async () => {
  const raw = await readBoundedRequestBody(request("0123456789"), 10);
  assert.equal(new TextDecoder().decode(raw), "0123456789");
});

test("body above the effective limit returns a 413 error", async () => {
  await assert.rejects(
    () => readBoundedRequestBody(request("01234567890"), 10),
    expectTooLarge,
  );
});

test("missing Content-Length cannot bypass the byte limit", async () => {
  const req = request("01234567890");
  req.headers.delete("content-length");

  await assert.rejects(() => readBoundedRequestBody(req, 10), expectTooLarge);
});

test("false smaller Content-Length cannot bypass the byte limit", async () => {
  const req = request("01234567890", { "content-length": "1" });
  await assert.rejects(() => readBoundedRequestBody(req, 10), expectTooLarge);
});

test("chunked oversized stream is cancelled before later processing", async () => {
  let cancelled = false;
  const chunks = ["123456", "789012"];
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = chunks.shift();
      if (chunk) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
    },
    cancel() {
      cancelled = true;
    },
  });
  const req = new Request("https://www.ryfio.com/api/upload", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  await assert.rejects(() => readBoundedRequestBody(req, 10), expectTooLarge);
  assert.equal(cancelled, true);
});

test("declared oversized body is rejected without reading the stream", async () => {
  let read = false;
  const req = {
    headers: new Headers({ "content-length": "11" }),
    body: {
      getReader() {
        read = true;
        throw new Error("body must not be read");
      },
    },
  } as unknown as Request;

  await assert.rejects(() => readBoundedRequestBody(req, 10), expectTooLarge);
  assert.equal(read, false);
});

test("invalid JSON fails before simulated Sharp or R2 work", async () => {
  let heavyProcessingCalled = false;
  const raw = await readBoundedRequestBody(request("{"), 10);

  assert.throws(() => {
    parseBoundedJsonBody(raw);
    heavyProcessingCalled = true;
  }, SyntaxError);
  assert.equal(heavyProcessingCalled, false);
});

test("bounded multipart preserves field names, file name, MIME, and bytes", async () => {
  const input = new FormData();
  input.set("userProductId", "22222222-2222-4222-8222-222222222222");
  input.set("front", new File(["preview-bytes"], "front.png", { type: "image/png" }));
  const req = request(input);
  const raw = await readBoundedRequestBody(req, 1024 * 1024);
  const parsed = await parseBoundedFormDataBody(req, raw);
  const file = parsed.get("front");

  assert.equal(parsed.get("userProductId"), "22222222-2222-4222-8222-222222222222");
  assert.ok(file instanceof File);
  assert.equal(file.name, "front.png");
  assert.equal(file.type, "image/png");
  assert.equal(await file.text(), "preview-bytes");
});

test("all scoped routes use the bounded reader and retain their previous limits", () => {
  const routes = [
    ["app/api/user-products/save-design/route.ts", "12 * 1024 * 1024"],
    ["app/api/products/user-products/save-design/route.ts", "12 * 1024 * 1024"],
    ["app/api/user-products/save-design/mockup-preview/route.ts", "20 * 1024 * 1024"],
    ["app/api/user-products/save-design/upload-production-file/route.ts", "48 * 1024 * 1024"],
    ["app/api/user-products/design-element-image/route.ts", "35 * 1024 * 1024"],
  ] as const;

  for (const [path, limit] of routes) {
    const source = readFileSync(path, "utf8");
    assert.match(source, new RegExp(`MAX_BODY_BYTES = ${limit.replaceAll("*", "\\*")}`));
    assert.match(source, /readBoundedRequestBody\(req, MAX_BODY_BYTES\)/);
    assert.equal(/req\.(?:json|formData)\(\)/.test(source), false);
  }
});

test("mockup ownership still precedes Sharp and R2 processing", () => {
  const source = readFileSync(
    "app/api/user-products/save-design/mockup-preview/route.ts",
    "utf8",
  );
  const ownership = source.indexOf('.from("user_products")');
  const decode = source.indexOf("fileToPreviewBuffer(frontFile)");
  const upload = source.indexOf("uploadBufferToR2({", decode);

  assert.ok(ownership > 0 && ownership < decode);
  assert.ok(decode < upload);
});
