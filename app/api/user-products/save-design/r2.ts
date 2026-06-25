import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export type R2UploadResult = {
  key: string | null;
  url: string | null;
};

export function assertR2Env() {
  const required = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ];

  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing R2 env vars: ${missing.join(", ")}`);
  }
}

export async function uploadBufferToR2(args: {
  key: string;
  buffer: Buffer;
  contentType: string;
  cacheControl?: string;
}): Promise<R2UploadResult> {
  assertR2Env();

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: args.key,
      Body: args.buffer,
      ContentType: args.contentType,
      CacheControl: args.cacheControl || "public, max-age=31536000, immutable",
    }),
  );

  return {
    key: args.key,
    url: `${process.env.R2_PUBLIC_URL}/${args.key}`,
  };
}
