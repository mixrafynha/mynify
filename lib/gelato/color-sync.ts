import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getGelatoProduct, searchGelatoCatalogProducts } from "@/lib/gelato/catalog-sync";
import { normalizeGelatoColorData, type GelatoNormalizedColor } from "@/lib/gelato/color-normalizer";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type ColorSyncJob = {
  id: string;
  product_id: string;
  catalog_uid: string;
  reference_product_uid: string;
  dry_run: boolean;
  status: string;
  total_items: number;
  processed_items: number;
  updated_items: number;
  pending_items: number;
  error_items: number;
  last_error: string | null;
};

export type ColorSyncProgress = {
  total_items?: number;
  processed_items?: number;
  updated_items?: number;
  pending_items?: number;
  error_items?: number;
  status?: string;
  last_error?: string | null;
  started_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
};

type ColorSyncJobItem = {
  id: string;
  job_id: string;
  product_color_id: string;
  product_variant_id: string;
  gelato_product_uid: string;
  status: string;
  attempts: number;
};

type FamilySearchResult = Record<string, unknown> & {
  productUid?: string | null;
  attributes?: Record<string, unknown> | null;
  dimensions?: Record<string, unknown> | null;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeKey(value: unknown): string {
  return cleanString(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") ?? "";
}

function familyColorKey(value: unknown): string {
  return normalizeKey(value).replace(/-/g, "");
}

function extractColorFromProductUid(productUid: string | null): string | null {
  const value = cleanString(productUid);
  if (!value) return null;
  const match = value.match(/_gco_([^_]+)_/i);
  return match?.[1] ? match[1].replace(/-/g, " ").trim() : null;
}

function matchesFamilyKey(product: Record<string, unknown>, familyKey: string): boolean {
  const attributes = isRecord(product.attributes) ? (product.attributes as Record<string, unknown>) : {};
  return buildFamilyKey(attributes) === familyKey;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildFamilyKey(attributes: Record<string, unknown>): string {
  const parts = [
    attributes.GarmentCategory,
    attributes.GarmentSubcategory,
    attributes.GarmentCut,
    attributes.GarmentQuality,
    attributes.ApparelManufacturer,
    attributes.ApparelManufacturerSKU,
  ];
  return parts.map((value) => normalizeKey(value)).join("|");
}

function extractFamilyAttributes(product: Record<string, unknown>): Record<string, string[]> {
  const attributes = isRecord(product.attributes) ? (product.attributes as Record<string, unknown>) : {};
  // Only include attributes that the apparel catalog search actually accepts as filters.
  const keys = ["GarmentCategory", "GarmentQuality", "ApparelManufacturer", "ApparelManufacturerSKU"];
  const filters: Record<string, string[]> = {};
  for (const key of keys) {
    const value = cleanString(attributes[key]);
    if (value) filters[key] = [value];
  }
  return filters;
}

function mergeColorAttributes(existing: JsonValue | null, colorData: GelatoNormalizedColor, colorKey: string) {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return {
    ...base,
    gelatoColorKey: colorKey,
    color: {
      source: colorData.source,
      attributeUid: colorData.attributeUid,
      attributeValueUid: colorData.attributeValueUid,
      label: colorData.label,
      type: colorData.type,
      primaryHex: colorData.primaryHex,
      hexes: colorData.hexes,
      rgb: colorData.rgb,
      rgbs: colorData.rgbs,
      rawColorData: colorData.rawColorData,
    },
  } as JsonValue;
}

function hasOfficialVisualData(colorData: GelatoNormalizedColor): boolean {
  return Boolean(
    colorData.primaryHex ||
    colorData.hexes.length > 0 ||
    colorData.rgb ||
    colorData.rgbs.length > 0 ||
    colorData.dimensions.currentHex ||
    colorData.dimensions.migrationHex ||
    colorData.dimensions.raw ||
    (colorData.dimensions.sourceKeys.length > 0 && colorData.type !== "unknown") ||
    colorData.type === "heather" ||
    colorData.type === "melange" ||
    colorData.type === "blend" ||
    colorData.type === "multitone" ||
    colorData.type === "pattern"
  );
}

function hasSearchDimensions(value: unknown): value is FamilySearchResult {
  return isRecord(value) && isRecord(value.dimensions) && Object.keys(value.dimensions).length > 0;
}

async function updateColorSyncJobProgress(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  jobId: string,
  progress: ColorSyncProgress,
) {
  const patch: Record<string, unknown> = {};
  if (progress.total_items !== undefined) patch.total_items = progress.total_items;
  if (progress.processed_items !== undefined) patch.processed_items = progress.processed_items;
  if (progress.updated_items !== undefined) patch.updated_items = progress.updated_items;
  if (progress.pending_items !== undefined) patch.pending_items = progress.pending_items;
  if (progress.error_items !== undefined) patch.error_items = progress.error_items;
  if (progress.last_error !== undefined) patch.last_error = progress.last_error;
  if (progress.status !== undefined) patch.status = progress.status;
  if (progress.updated_at !== undefined) patch.updated_at = progress.updated_at;
  if (progress.started_at !== undefined) patch.started_at = progress.started_at;
  if (progress.completed_at !== undefined) patch.completed_at = progress.completed_at;

  const { error } = await supabase
    .from("gelato_color_sync_jobs")
    .update(patch)
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

async function updateColorSyncJobItem(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  itemId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("gelato_color_sync_job_items")
    .update(patch)
    .eq("id", itemId);
  if (error) throw new Error(error.message);
}

export async function planGelatoColorSync(input: {
  productId: string;
  catalogUid: string;
  referenceProductUid: string;
}) {
  const supabase = createSupabaseAdmin();
  const productId = cleanString(input.productId);
  const catalogUid = cleanString(input.catalogUid);
  const referenceProductUid = cleanString(input.referenceProductUid);
  if (!productId || !catalogUid || !referenceProductUid) throw new Error("Missing color sync identifiers.");

  const referenceProduct = await getGelatoProduct(referenceProductUid);
  const referenceProductRecord = referenceProduct as unknown as Record<string, unknown>;
  const familyKey = buildFamilyKey(isRecord(referenceProductRecord.attributes) ? (referenceProductRecord.attributes as Record<string, unknown>) : {});
  const familyFilters = extractFamilyAttributes(referenceProductRecord);
  const familySearchCache = new Map<string, Record<string, unknown>[]>();
  const familySearchSignature = JSON.stringify(familyFilters);

  const { data: colorRows, error: colorError } = await supabase
    .from("product_colors")
    .select("id, product_id, color, color_hex, gelato_color_key, gelato_attributes, gelato_color_data, gelato_color_status, gelato_color_synced_at")
    .eq("product_id", productId);
  if (colorError) throw new Error(colorError.message);

  const colorIds = (colorRows ?? []).map((row) => (isRecord(row) ? String((row as Record<string, unknown>).id ?? "") : "")).filter(Boolean);

  const { data: variantRows, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_color_id, gelato_product_uid, gelato_attributes")
    .in("product_color_id", colorIds.length > 0 ? colorIds : ["00000000-0000-0000-0000-000000000000"])
    .not("gelato_product_uid", "is", null);
  if (variantError) throw new Error(variantError.message);

  const colors = (colorRows ?? []) as Array<{
    id: string;
    product_id: string;
    color: string | null;
    color_hex: string | null;
    gelato_color_key: string | null;
    gelato_attributes: JsonValue | null;
    gelato_color_data: JsonValue | null;
    gelato_color_status: string | null;
    gelato_color_synced_at: string | null;
  }>;
  const rows = (variantRows ?? []) as Array<{
    id: string;
    product_color_id: string;
    gelato_product_uid: string;
    gelato_attributes: JsonValue | null;
  }>;
  const rowsByColor = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = rowsByColor.get(row.product_color_id) ?? [];
    list.push(row);
    rowsByColor.set(row.product_color_id, list);
  }

  const plans = [];
  let familySearchProducts: Record<string, unknown>[] | null = null;
  if (!familySearchCache.has(familySearchSignature)) {
    try {
      const collected: Record<string, unknown>[] = [];
      for (let offset = 0; ; offset += 100) {
        // One paginated family search per family, then reuse results in-memory.
        const searchResponse = await searchGelatoCatalogProducts(
          catalogUid,
          familyFilters as never,
          100,
          offset,
        );
        const products = Array.isArray((searchResponse as Record<string, unknown>).products)
          ? ((searchResponse as Record<string, unknown>).products as Record<string, unknown>[])
          : [];
        const filteredPage = products.filter((product) => buildFamilyKey(isRecord(product.attributes) ? (product.attributes as Record<string, unknown>) : {}) === familyKey);
        collected.push(...filteredPage);
        if (products.length < 100) break;
      }
      const filtered = collected;
      familySearchCache.set(familySearchSignature, filtered);
      familySearchProducts = filtered;
    } catch {
      familySearchCache.set(familySearchSignature, []);
      familySearchProducts = [];
    }
  } else {
    familySearchProducts = familySearchCache.get(familySearchSignature) ?? [];
  }
  const familyIndex = new Map<string, Record<string, unknown>[]>();
  for (const product of familySearchProducts ?? []) {
    const attrs = isRecord(product.attributes) ? (product.attributes as Record<string, unknown>) : {};
    const productColorKey = familyColorKey(attrs.GarmentColor ?? extractColorFromProductUid(cleanString(product.productUid) ?? null));
    const list = familyIndex.get(productColorKey) ?? [];
    list.push(product);
    familyIndex.set(productColorKey, list);
  }

  for (const existingColor of colors) {
    const colorRows = rowsByColor.get(existingColor.id) ?? [];
    const linkedUids = [...new Set(colorRows.map((row) => row.gelato_product_uid).filter(Boolean))];
    const colorKey = normalizeKey(existingColor.gelato_color_key ?? existingColor.color ?? "");
    const lookupKey = familyColorKey(existingColor.gelato_color_key ?? existingColor.color ?? "");
    const familySearchCandidates = familyIndex.get(lookupKey) ?? [];
    const searchRepresentative = familySearchCandidates.find((product) => {
      const attrs = isRecord(product.attributes) ? (product.attributes as Record<string, unknown>) : {};
      return normalizeKey(attrs.GarmentColor) === colorKey || normalizeKey(extractColorFromProductUid(cleanString(product.productUid) ?? null)) === colorKey;
    }) ?? null;
    const representativeUid = cleanString((searchRepresentative as Record<string, unknown> | null)?.productUid) ?? linkedUids[0] ?? null;
    const familyMatch = Boolean(searchRepresentative && representativeUid);
    const invalidLocalColor = !familyMatch && familySearchCandidates.length === 0 && linkedUids.length === 0;
    const resolutionSource = familyMatch ? "family_search" : null;
    const details = searchRepresentative && hasSearchDimensions(searchRepresentative)
      ? searchRepresentative
      : representativeUid
        ? await getGelatoProduct(representativeUid)
        : null;
    const colorData = normalizeGelatoColorData(details ?? {});
    const officialColorKey = normalizeKey(colorData.attributeValueUid ?? colorData.label ?? existingColor.gelato_color_key ?? existingColor.color ?? "");
    const allHexes = colorData.hexes;
    const currentHex = existingColor.color_hex ?? null;
    const hasAnyOfficialVisual = hasOfficialVisualData(colorData);
    const hasMultipleDistinctHexes = new Set(allHexes).size > 1;
    const hasDeterministicPrimary = Boolean(colorData.primaryHex && colorData.primaryHexSourceKey);
    const action =
      invalidLocalColor
        ? "invalid_local_color"
        : familyMatch && hasAnyOfficialVisual
        ? hasMultipleDistinctHexes && !hasDeterministicPrimary
          ? "update"
          : colorData.primaryHex
            ? colorData.primaryHex !== currentHex
              ? "update"
              : "unchanged"
            : currentHex && allHexes.length === 1
              ? allHexes[0] !== currentHex
                ? "update"
                : "unchanged"
              : "update"
        : "pending";

    plans.push({
      product_id: existingColor?.product_id ?? productId,
      product_color_id: existingColor.id,
      color: existingColor?.color ?? null,
      gelato_product_uid: representativeUid,
      gelato_color_key: officialColorKey || colorKey,
      current_color_hex: currentHex,
      all_hex_values: allHexes,
      normalized_primaryHex: colorData.primaryHex,
      normalized_primaryHex_source_key: colorData.primaryHexSourceKey,
      normalized_color_type: colorData.type,
      raw_color_structure: details ?? {},
      action,
      uid_count: linkedUids.length,
      normalized_color: colorData,
      resolution_source: resolutionSource,
      candidate_before_fix: linkedUids.length > 0,
      candidate_after_fix: familyMatch && hasAnyOfficialVisual,
      invalid_local_color: invalidLocalColor,
    });
  }

  return {
    plans,
    totalColors: plans.length,
    productId,
    catalogUid,
    referenceProductUid,
    requests: plans.length > 0 ? 1 : 0,
    deduplicatedRequests: plans.length > 0 ? Math.max(plans.length - 1, 0) : 0,
    familySearchPages: familySearchProducts?.length ? Math.ceil((familySearchProducts.length ?? 0) / 100) : 0,
  };
}

export async function createGelatoColorSyncJob(input: {
  productId: string;
  catalogUid: string;
  referenceProductUid: string;
  dryRun: boolean;
}) {
  const supabase = createSupabaseAdmin();
  const plan = await planGelatoColorSync(input);
  const { data, error } = await supabase
    .from("gelato_color_sync_jobs")
    .insert({
      product_id: plan.productId,
      catalog_uid: plan.catalogUid,
      reference_product_uid: plan.referenceProductUid,
      dry_run: input.dryRun,
      status: "pending",
      total_items: plan.totalColors,
      processed_items: 0,
      updated_items: 0,
      pending_items: 0,
      error_items: 0,
      last_error: null,
    })
    .select("id")
    .single();
  if (error || !data?.id) throw new Error(error?.message || "Failed to create color sync job.");

  const jobId = data.id as string;
  const items = plan.plans.map((item, index) => ({
    job_id: jobId,
    product_color_id: item.product_color_id,
    product_variant_id: item.gelato_product_uid,
    gelato_product_uid: item.gelato_product_uid,
    position: index + 1,
    status: "pending",
    attempts: 0,
  }));
  if (items.length > 0) {
    const { error: itemError } = await supabase.from("gelato_color_sync_job_items").insert(items);
    if (itemError) throw new Error(itemError.message);
  }

  return { jobId, ...plan };
}

export async function processGelatoColorSyncJob(jobId: string) {
  const supabase = createSupabaseAdmin();
  const { data: job, error: jobError } = await supabase
    .from("gelato_color_sync_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError) throw new Error(jobError.message);
  if (!job) throw new Error("Color sync job not found.");
  if (!job.dry_run) {
    const { data: dryRunJob } = await supabase
      .from("gelato_color_sync_jobs")
      .select("id,total_items,status,dry_run")
      .eq("product_id", job.product_id)
      .eq("catalog_uid", job.catalog_uid)
      .eq("reference_product_uid", job.reference_product_uid)
      .eq("dry_run", true)
      .in("status", ["dry_run_completed", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!dryRunJob) {
      throw new Error("Run a dry-run color sync before applying changes.");
    }
  }

  const plan = await planGelatoColorSync({
    productId: String(job.product_id),
    catalogUid: String(job.catalog_uid),
    referenceProductUid: String(job.reference_product_uid),
  });
  const updatePlans = plan.plans.filter((item) => item.action === "update");
  const updatePlanByColorId = new Map(updatePlans.map((item) => [item.product_color_id, item]));
  const invalidLocalByColorId = new Map(
    plan.plans.filter((item) => item.action === "invalid_local_color").map((item) => [item.product_color_id, item]),
  );

  const { data: items, error: itemsError } = await supabase
    .from("gelato_color_sync_job_items")
    .select("*")
    .eq("job_id", jobId)
    .eq("status", "pending");
  if (itemsError) throw new Error(itemsError.message);

  let updated = 0;
  let unchanged = 0;
  let invalidLocal = 0;
  let pending = 0;
  let errorCount = 0;
  const totalItems = (items ?? []).length;
  const startedAt = new Date().toISOString();
  await updateColorSyncJobProgress(supabase, jobId, {
    status: job.dry_run ? "running_dry_run" : "running",
    total_items: totalItems || job.total_items || plan.totalColors,
    processed_items: 0,
    updated_items: 0,
    pending_items: 0,
    error_items: 0,
    started_at: job.dry_run ? job.started_at ?? startedAt : job.started_at ?? startedAt,
    updated_at: startedAt,
  });

  for (const item of (items ?? []) as ColorSyncJobItem[]) {
    try {
      const planned = updatePlanByColorId.get(item.product_color_id) ?? null;
      const invalidLocalPlanned = invalidLocalByColorId.get(item.product_color_id) ?? null;
      if (!planned) {
        pending += 1;
        await updateColorSyncJobItem(supabase, item.id, { status: "skipped", attempts: item.attempts + 1 });
        await updateColorSyncJobProgress(supabase, jobId, {
          processed_items: updated + unchanged + invalidLocal + pending + errorCount,
          updated_items: updated,
          pending_items: pending,
          error_items: errorCount,
          updated_at: new Date().toISOString(),
        });
        continue;
      }

      if (invalidLocalPlanned) {
        invalidLocal += 1;
        await updateColorSyncJobItem(supabase, item.id, { status: "skipped", attempts: item.attempts + 1 });
        await updateColorSyncJobProgress(supabase, jobId, {
          processed_items: updated + unchanged + invalidLocal + pending + errorCount,
          updated_items: updated,
          pending_items: pending,
          error_items: errorCount,
          updated_at: new Date().toISOString(),
        });
        continue;
      }

      const plannedPrimaryHex = planned.normalized_color.primaryHex;
      const hasOfficialVisual = hasOfficialVisualData(planned.normalized_color);
      if (planned.action !== "update" || (!plannedPrimaryHex && !hasOfficialVisual)) {
        pending += 1;
        await updateColorSyncJobItem(supabase, item.id, { status: "skipped", attempts: item.attempts + 1 });
      await updateColorSyncJobProgress(supabase, jobId, {
        processed_items: updated + unchanged + invalidLocal + pending + errorCount,
        updated_items: updated,
        pending_items: pending,
        error_items: errorCount,
        updated_at: new Date().toISOString(),
      });
        continue;
      }

      const { data: existingColor, error: existingError } = await supabase
        .from("product_colors")
        .select("id, color_hex, gelato_attributes, gelato_color_data")
        .eq("id", item.product_color_id)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);

      if (!job.dry_run) {
        const nextStatus = plannedPrimaryHex ? "synced" : hasOfficialVisual ? "synced_multitone" : "pending";
        const updatePatch: Record<string, unknown> = {
          gelato_color_data: planned.normalized_color,
          gelato_color_status: nextStatus,
          gelato_color_synced_at: new Date().toISOString(),
          gelato_attributes: mergeColorAttributes(existingColor?.gelato_attributes ?? null, planned.normalized_color, planned.gelato_color_key),
        };
        if (plannedPrimaryHex) {
          updatePatch.color_hex = plannedPrimaryHex;
        }
        const { error: updateError } = await supabase
          .from("product_colors")
          .update(updatePatch)
          .eq("id", item.product_color_id);
        if (updateError) throw new Error(updateError.message);
      }
      updated += 1;
      await updateColorSyncJobItem(supabase, item.id, { status: "completed", attempts: item.attempts + 1 });
      await updateColorSyncJobProgress(supabase, jobId, {
        processed_items: updated + unchanged + invalidLocal + pending + errorCount,
        updated_items: updated,
        pending_items: pending,
        error_items: errorCount,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      errorCount += 1;
      pending += 1;
      await updateColorSyncJobItem(supabase, item.id, { status: "failed", attempts: item.attempts + 1, error: error instanceof Error ? error.message : String(error) });
      await updateColorSyncJobProgress(supabase, jobId, {
        processed_items: updated + unchanged + invalidLocal + pending + errorCount,
        updated_items: updated,
        pending_items: pending,
        error_items: errorCount,
        updated_at: new Date().toISOString(),
      });
    }
  }

  await supabase.from("gelato_color_sync_jobs").update({
    status: job.dry_run ? "dry_run_completed" : "completed",
    processed_items: updated + unchanged + invalidLocal + pending + errorCount,
    updated_items: updated,
    pending_items: pending,
    error_items: errorCount,
    last_error: errorCount > 0 ? "Some colors could not be synchronized." : null,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId);

  return { jobId, updated, unchanged, invalidLocal, pending, errorCount, dryRun: job.dry_run };
}

export async function readGelatoColorSyncJob(jobId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("gelato_color_sync_jobs").select("*").eq("id", jobId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Color sync job not found.");
  return data as ColorSyncJob;
}
