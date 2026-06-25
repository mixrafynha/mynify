import path from "path";
import fs from "fs/promises";

async function ensureDebugDir() {
  const dir = path.join(process.cwd(), "public", "debug-mockup");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveDebug(name: string, buffer: Buffer) {
  try {
    const dir = await ensureDebugDir();
    await fs.writeFile(path.join(dir, name), buffer);
  } catch {}
}
