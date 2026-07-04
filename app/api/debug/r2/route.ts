import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type R2Env = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function mask(value: string): string {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function getEnv(): R2Env {
  const accountId = readEnv("R2_ACCOUNT_ID");
  const accessKeyId = readEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = readEnv("R2_BUCKET_NAME");
  const publicUrl = readEnv("R2_PUBLIC_URL");

  const missing = [
    ["R2_ACCOUNT_ID", accountId],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["R2_BUCKET_NAME", bucketName],
    ["R2_PUBLIC_URL", publicUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing R2 env vars: ${missing.join(", ")}`);
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucketName: bucketName!,
    publicUrl: publicUrl!.replace(/\/$/, ""),
  };
}

function createClient(env: R2Env): S3Client {
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

function serializeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const sdkError = error as Error & {
    Code?: string;
    $fault?: string;
    $metadata?: {
      httpStatusCode?: number;
      requestId?: string;
      attempts?: number;
      totalRetryDelay?: number;
    };
  };

  return {
    name: error.name,
    message: error.message,
    code: sdkError.Code,
    fault: sdkError.$fault,
    httpStatusCode: sdkError.$metadata?.httpStatusCode,
    requestId: sdkError.$metadata?.requestId,
    attempts: sdkError.$metadata?.attempts,
    totalRetryDelay: sdkError.$metadata?.totalRetryDelay,
  };
}

export async function GET() {
  const startedAt = Date.now();

  let env: R2Env | null = null;
  let endpoint: string | null = null;
  let key: string | null = null;

  try {
    env = getEnv();
    endpoint = `https://${env.accountId}.r2.cloudflarestorage.com`;
    key = `debug/r2-health-${Date.now()}.txt`;

    console.log("========== R2 DEBUG CONFIG ==========");
    console.log({
      endpoint,
      accountId: env.accountId,
      bucketName: env.bucketName,
      publicUrl: env.publicUrl,
      accessKeyId: mask(env.accessKeyId),
      secretAccessKey: "***",
      key,
    });

    const client = createClient(env);

    await client.send(
      new PutObjectCommand({
        Bucket: env.bucketName,
        Key: key,
        Body: Buffer.from("ryfio-r2-healthcheck", "utf8"),
        ContentType: "text/plain",
        CacheControl: "no-store",
      }),
    );

    await client.send(
      new DeleteObjectCommand({
        Bucket: env.bucketName,
        Key: key,
      }),
    );

    return NextResponse.json({
      ok: true,
      message: "R2 upload and delete worked.",
      durationMs: Date.now() - startedAt,
      config: {
        endpoint,
        accountId: env.accountId,
        bucketName: env.bucketName,
        publicUrl: env.publicUrl,
        accessKeyId: mask(env.accessKeyId),
        secretAccessKey: "***",
      },
      testKey: key,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "R2 diagnostic failed.",
        durationMs: Date.now() - startedAt,
        config: env
          ? {
              endpoint,
              accountId: env.accountId,
              bucketName: env.bucketName,
              publicUrl: env.publicUrl,
              accessKeyId: mask(env.accessKeyId),
              secretAccessKey: "***",
              testKey: key,
            }
          : null,
        error: serializeError(error),
        hints: [
          "401 = wrong Access Key / Secret / Account ID combination, or token is not valid for S3 API.",
          "403 = token valid but missing bucket permission.",
          "404 = bucket name wrong.",
          "R2_BUCKET_NAME must be only the bucket name, not a URL.",
        ],
      },
      { status: 500 },
    );
  }
}