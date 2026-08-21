import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260820234816_save_user_generated_image_atomic.sql";
const routePath = "app/api/user-generated-images/route.ts";
const apiClientPath =
  "app/dashboard/design/components/toolbar/panels/ai/ai.api.ts";

const migration = readFileSync(migrationPath, "utf8");
const route = readFileSync(routePath, "utf8");
const apiClient = readFileSync(apiClientPath, "utf8");

type Row = { id: string; userId: string; isSaved: boolean; savedAt: number | null };

class AtomicSaveModel {
  private readonly locks = new Map<string, Promise<void>>();
  readonly rows: Row[];
  readonly limit: number;

  constructor(rows: Row[], limit = 5) {
    this.rows = rows;
    this.limit = limit;
  }

  async save(userId: string, imageId: string) {
    const previous = this.locks.get(userId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(userId, previous.then(() => current));

    await previous;
    try {
      const savedCount = this.rows.filter((row) => row.userId === userId && row.isSaved).length;
      const row = this.rows.find((item) => item.id === imageId && item.userId === userId);

      if (row?.isSaved) return { result: "already_saved", savedCount };
      if (savedCount >= this.limit) return { result: "limit_reached", savedCount };
      if (!row) return { result: "not_found", savedCount };

      row.isSaved = true;
      row.savedAt = Date.now();
      return { result: "saved", savedCount: savedCount + 1 };
    } finally {
      release();
      if (this.locks.get(userId) === current) this.locks.delete(userId);
    }
  }
}

function rows(userId: string, saved: number, unsavedIds: string[]) {
  return [
    ...Array.from({ length: saved }, (_, index) => ({
      id: `${userId}-saved-${index}`,
      userId,
      isSaved: true,
      savedAt: index + 1,
    })),
    ...unsavedIds.map((id) => ({ id, userId, isSaved: false, savedAt: null })),
  ];
}

test("migration serializes by user before COUNT and keeps the fixed Save limit", () => {
  const lock = migration.indexOf("pg_advisory_xact_lock");
  const count = migration.indexOf("select count(*)", lock);
  const update = migration.indexOf("update public.user_generated_images", count);

  assert.ok(lock > 0 && lock < count && count < update);
  assert.match(migration, /hashtextextended\(p_user_id::text, 0\)/);
  assert.match(migration, /v_saved_limit constant integer := 5/);
  assert.doesNotMatch(migration, /ai_saved_images_limit/);
});

test("normal saves preserve 0/5, 4/5, 5/5, not-found, and ownership behavior", async () => {
  const empty = new AtomicSaveModel(rows("u1", 0, ["a"]));
  assert.deepEqual(await empty.save("u1", "a"), { result: "saved", savedCount: 1 });

  const four = new AtomicSaveModel(rows("u1", 4, ["a"]));
  assert.deepEqual(await four.save("u1", "a"), { result: "saved", savedCount: 5 });

  const full = new AtomicSaveModel(rows("u1", 5, ["a"]));
  assert.deepEqual(await full.save("u1", "a"), { result: "limit_reached", savedCount: 5 });

  const missing = new AtomicSaveModel(rows("u1", 0, []));
  assert.deepEqual(await missing.save("u1", "missing"), { result: "not_found", savedCount: 0 });

  const crossUser = new AtomicSaveModel(rows("u2", 0, ["foreign"]));
  assert.deepEqual(await crossUser.save("u1", "foreign"), { result: "not_found", savedCount: 0 });
  assert.equal(crossUser.rows[0].isSaved, false);
});

test("4 saved plus two simultaneous different images finishes at exactly 5", async () => {
  const model = new AtomicSaveModel(rows("u1", 4, ["a", "b"]));
  const results = await Promise.all([model.save("u1", "a"), model.save("u1", "b")]);

  assert.deepEqual(results.map((item) => item.result).sort(), ["limit_reached", "saved"]);
  assert.equal(model.rows.filter((row) => row.userId === "u1" && row.isSaved).length, 5);
});

test("simultaneous saves of the same image consume one slot and remain idempotent", async () => {
  const model = new AtomicSaveModel(rows("u1", 4, ["a"]));
  const results = await Promise.all([model.save("u1", "a"), model.save("u1", "a")]);

  assert.deepEqual(results.map((item) => item.result).sort(), ["already_saved", "saved"]);
  assert.equal(model.rows.filter((row) => row.userId === "u1" && row.isSaved).length, 5);
  assert.ok(model.rows.find((row) => row.id === "a")?.savedAt);
});

test("different users have independent lock keys and limits", async () => {
  const model = new AtomicSaveModel([
    ...rows("u1", 4, ["a"]),
    ...rows("u2", 4, ["b"]),
  ]);

  const results = await Promise.all([model.save("u1", "a"), model.save("u2", "b")]);
  assert.deepEqual(results.map((item) => item.result), ["saved", "saved"]);
  assert.equal(model.rows.filter((row) => row.userId === "u1" && row.isSaved).length, 5);
  assert.equal(model.rows.filter((row) => row.userId === "u2" && row.isSaved).length, 5);
});

test("RPC is service-role only and direct browser UPDATE remains closed", () => {
  assert.match(migration, /security invoker/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(
    migration,
    /revoke all on function public\.save_user_generated_image_atomic\(uuid, uuid\)[\s\S]*from public, anon, authenticated/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.save_user_generated_image_atomic\(uuid, uuid\)[\s\S]*to service_role/i,
  );
  assert.match(route, /getServiceSupabase\(\)[\s\S]*\.rpc\("save_user_generated_image_atomic"/);
  assert.doesNotMatch(route.slice(route.indexOf("export async function POST"), route.indexOf("export async function DELETE")), /\.from\(TABLE\)[\s\S]*\.update\(/);
});

test("GET, DELETE, frontend request, credits, and generation remain outside the patch", () => {
  assert.match(route, /export async function GET\(\)/);
  assert.match(route, /export async function DELETE\(req: Request\)/);
  assert.match(apiClient, /fetch\("\/api\/user-generated-images", \{[\s\S]*method: "POST"/);
  assert.match(apiClient, /body: JSON\.stringify\(\{[\s\S]*id: item\.id \|\| null/);
  assert.doesNotMatch(migration, /credits|generation credit|replicate/i);
});
