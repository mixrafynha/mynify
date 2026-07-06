import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function readEnv(primary: string, ...fallbacks: string[]) {
  for (const name of [primary, ...fallbacks]) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

function requireEnv(label: string, value: string | undefined) {
  if (!value) throw new Error(`Missing R2 environment variable: ${label}`);
  return value;
}

function getR2Config() {
  const accountId = readEnv("R2_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_R2_ACCOUNT_ID");
  const accessKeyId = readEnv("R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnv("R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  const bucket = readEnv("R2_BUCKET", "R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET");
  const publicBaseUrl = readEnv("R2_PUBLIC_URL", "CLOUDFLARE_R2_PUBLIC_URL", "CLOUDFLARE_R2_PUBLIC_BASE_URL");

  return {
    accountId: requireEnv("R2_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID", accountId),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID or CLOUDFLARE_R2_ACCESS_KEY_ID", accessKeyId),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY or CLOUDFLARE_R2_SECRET_ACCESS_KEY", secretAccessKey),
    bucket: requireEnv("R2_BUCKET/R2_BUCKET_NAME or CLOUDFLARE_R2_BUCKET_NAME", bucket),
    publicBaseUrl: requireEnv("R2_PUBLIC_URL or CLOUDFLARE_R2_PUBLIC_URL", publicBaseUrl).replace(/\/+$/, ""),
  };
}

export function getR2Client() {
  const config = getR2Config();

  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function uploadR2Object(args: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}) {
  const config = getR2Config();
  const client = getR2Client();
  const key = args.key.replace(/^\/+/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: args.body,
      ContentType: args.contentType,
      CacheControl: args.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );

  return `${config.publicBaseUrl}/${key}`;
}
