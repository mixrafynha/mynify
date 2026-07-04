import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type R2UploadResult = {
  key: string | null;
  url: string | null;
};

type R2Env = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

function readEnv(primary: string, aliases: string[] = []) {
  for (const name of [primary, ...aliases]) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return null;
}

function getR2Env(): R2Env {
  const accountId = readEnv("R2_ACCOUNT_ID", [
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_R2_ACCOUNT_ID",
  ]);
  const accessKeyId = readEnv("R2_ACCESS_KEY_ID", [
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "AWS_ACCESS_KEY_ID",
  ]);
  const secretAccessKey = readEnv("R2_SECRET_ACCESS_KEY", [
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "AWS_SECRET_ACCESS_KEY",
  ]);
  const bucketName = readEnv("R2_BUCKET_NAME", ["CLOUDFLARE_R2_BUCKET_NAME"]);
  const publicUrl = readEnv("R2_PUBLIC_URL", [
    "CLOUDFLARE_R2_PUBLIC_URL",
    "NEXT_PUBLIC_R2_PUBLIC_URL",
  ]);

  const missing = [
    ["R2_ACCOUNT_ID", accountId],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["R2_BUCKET_NAME", bucketName],
    ["R2_PUBLIC_URL", publicUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing R2 env vars: ${missing.join(", ")}`);
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucketName: bucketName!,
    publicUrl: publicUrl!.replace(/\/+$/, ""),
  };
}

function createR2Client(env: R2Env) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
}

export function assertR2Env() {
  getR2Env();
}

function describeR2Error(error: unknown) {
  if (!error || typeof error !== "object") return { message: String(error) };

  const record = error as Record<string, unknown>;
  const metadata = record.$metadata as Record<string, unknown> | undefined;

  return {
    name: typeof record.name === "string" ? record.name : undefined,
    code: typeof record.Code === "string" ? record.Code : undefined,
    message:
      typeof record.message === "string" ? record.message : String(error),
    httpStatusCode: metadata?.httpStatusCode,
  };
}

export async function uploadBufferToR2(args: {
  key: string;
  buffer: Buffer;
  contentType: string;
  cacheControl?: string;
}): Promise<R2UploadResult> {
  const env = getR2Env();
  const client = createR2Client(env);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: env.bucketName,
        Key: args.key,
        Body: args.buffer,
        ContentType: args.contentType,
        CacheControl: args.cacheControl || "public, max-age=31536000, immutable",
      }),
    );
  } catch (error) {
    console.error("R2_UPLOAD_FAILED", {
      bucket: env.bucketName,
      endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
      key: args.key,
      contentType: args.contentType,
      error: describeR2Error(error),
    });

    throw error;
  }

  return {
    key: args.key,
    url: `${env.publicUrl}/${args.key.replace(/^\/+/, "")}`,
  };
}
