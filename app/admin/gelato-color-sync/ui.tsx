"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, Play, ShieldCheck, Sparkles } from "lucide-react";

type ProductOption = {
  id: string;
  title: string;
  slug: string;
  colorCount?: number | null;
  lastSyncAt?: string | null;
  syncStatus?: string | null;
};

type DryRunPlan = {
  color: string | null;
  product_id: string;
  product_color_id: string;
  gelato_product_uid: string;
  gelato_color_key: string;
  current_color_hex: string | null;
  all_hex_values: string[];
  normalized_primaryHex: string | null;
  normalized_primaryHex_source_key: string | null;
  normalized_color_type: string;
  normalized_color: {
    primaryHex: string | null;
    hexes: string[];
    type: string;
    rawColorData: unknown;
    attributeUid: string | null;
    attributeValueUid: string | null;
    label: string | null;
    dimensions?: {
      sourceKeys: string[];
      raw: Record<string, unknown> | null;
      currentHex: string | null;
      migrationHex: string | null;
      primaryHex: string | null;
      primaryHexSourceKey: string | null;
      hexes: string[];
    };
  };
  raw_color_structure: Record<string, unknown>;
  action: "unchanged" | "update" | "pending" | "conflict" | "invalid_local_color";
  uid_count: number;
  resolution_source?: string | null;
};

type Job = {
  id: string;
  dry_run: boolean;
  status: string;
  total_items: number;
  processed_items: number;
  updated_items: number;
  pending_items: number;
  error_items: number;
  last_error: string | null;
};

type DryRunResult = {
  jobId: string;
  totalColors: number;
  plans: DryRunPlan[];
  requests?: number;
  deduplicatedRequests?: number;
  uidCountByColor?: Array<{ product_color_id: string; uid_count: number }>;
};

type ProductListResponse = {
  products?: Array<{
    id: string;
    title: string;
    slug?: string | null;
    color_count?: number | null;
    last_color_sync_at?: string | null;
    gelato_color_status?: string | null;
  }>;
};

function readResponsePayload(res: Response) {
  return res.json().catch(() => ({}));
}

function formatDate(value?: string | null) {
  if (!value) return "Never";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function normalizeAction(action: string) {
  if (action === "unchanged" || action === "update" || action === "pending" || action === "conflict" || action === "invalid_local_color") return action;
  return "pending";
}

export default function GelatoColorSyncPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState("75cff129-9984-4e40-88a5-1555db4e2543");
  const [catalogUid, setCatalogUid] = useState("apparel");
  const [referenceProductUid, setReferenceProductUid] = useState("apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_xl_gco_black_gpr_4-0_gildan_64000");
  const [dryRunJob, setDryRunJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [plan, setPlan] = useState<DryRunPlan[]>([]);
  const [dryRunMeta, setDryRunMeta] = useState<DryRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDetails, setOpenDetails] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/admin/products", { credentials: "include", cache: "no-store" });
      const json: ProductListResponse = await readResponsePayload(res);
      if (!active || !res.ok || !Array.isArray(json.products)) return;
      setProducts(
        json.products.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug ?? "",
          colorCount: p.color_count ?? null,
          lastSyncAt: p.last_color_sync_at ?? null,
          syncStatus: p.gelato_color_status ?? null,
        })),
      );
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const selectedProduct = useMemo(() => products.find((item) => item.id === productId) ?? null, [products, productId]);

  const metrics = useMemo(() => {
    const total = plan.length;
    const counts = {
      total,
      matched: total - plan.filter((item) => item.action === "pending" || item.action === "conflict").length,
      unchanged: plan.filter((item) => item.action === "unchanged").length,
      update: plan.filter((item) => item.action === "update").length,
      pending: plan.filter((item) => item.action === "pending").length,
      conflict: plan.filter((item) => item.action === "conflict").length,
      invalidLocal: plan.filter((item) => item.action === "invalid_local_color").length,
      errors: dryRunJob?.error_items ?? 0,
      multitone: plan.filter((item) => item.normalized_color.type !== "solid").length,
    };
    return counts;
  }, [plan, dryRunJob?.error_items]);

  const dryRunValid = Boolean(dryRunJob && dryRunJob.dry_run && dryRunJob.status === "dry_run_completed");
  const readyToApply = dryRunValid && metrics.pending === 0 && metrics.conflict === 0 && metrics.errors === 0 && metrics.invalidLocal === 0;
  const applyCount = metrics.update;

  async function runDryRun() {
    setLoading(true);
    setError(null);
    setMessage(null);
    setDryRunMeta(null);
    setOpenDetails(null);
    try {
      const res = await fetch("/api/admin/gelato-color-sync/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, catalogUid, referenceProductUid, dryRun: true }),
      });
      const json = await readResponsePayload(res);
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Dry run failed");
      setDryRunJob(json.job ?? { id: json.jobId, dry_run: true, status: "pending" });
      setPlan(Array.isArray(json.plans) ? json.plans : []);
      setDryRunMeta(json as DryRunResult);
      setMessage("Dry run concluído para o produto selecionado.");
      const statusRes = await fetch(`/api/admin/gelato-color-sync/status?jobId=${encodeURIComponent(json.jobId)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const statusJson = await readResponsePayload(statusRes);
      if (statusRes.ok && statusJson?.ok) setDryRunJob(statusJson.job ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dry run failed");
    } finally {
      setLoading(false);
    }
  }

  async function runApply() {
    if (!dryRunValid) {
      setError("Apply bloqueado até existir um dry-run válido para este produto.");
      return;
    }
    if (!readyToApply) {
      setError("Apply bloqueado enquanto existirem pending/conflict/errors.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/gelato-color-sync/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, catalogUid, referenceProductUid, dryRun: false }),
      });
      const json = await readResponsePayload(res);
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Apply start failed");
      setApplyJob({ id: json.jobId, dry_run: false, status: "pending", total_items: json.totalColors ?? 0, processed_items: 0, updated_items: 0, pending_items: 0, error_items: 0, last_error: null });
      setMessage(`Apply ${applyCount} color changes iniciado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700/80">Gelato Color Sync</p>
                <h1 className="text-2xl font-black tracking-[-0.05em] text-black">Gelato Color Sync</h1>
              </div>
            </div>
            <p className="max-w-3xl text-sm font-semibold leading-6 text-black/55">
              Execute cores produto por produto, com dry-run obrigatório antes do apply e detalhes da cor carregados só quando necessário.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={readyToApply ? "Ready to apply" : dryRunValid ? "Dry run valid" : "Awaiting dry run"} tone={readyToApply ? "green" : dryRunValid ? "blue" : "amber"} />
              <StatusBadge label={selectedProduct ? selectedProduct.title : "No product selected"} tone="neutral" />
              <StatusBadge label={dryRunJob?.status ?? "idle"} tone="neutral" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/gelato-sync" className="inline-flex h-11 items-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-black text-black transition hover:bg-black/[0.03]">
              Back to Gelato Sync
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[1.4fr_0.9fr_0.9fr]">
        <ProductPicker products={products} value={productId} onChange={setProductId} />
        <div>
          <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">Catalog UID</label>
          <input value={catalogUid} onChange={(e) => setCatalogUid(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 text-sm font-semibold text-black outline-none" />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">Reference UID</label>
          <input value={referenceProductUid} onChange={(e) => setReferenceProductUid(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 text-sm font-semibold text-black outline-none" />
        </div>
        <div className="lg:col-span-3 flex flex-wrap gap-3">
          <button onClick={() => void runDryRun()} disabled={loading || !productId} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Dry Run
          </button>
          <button onClick={() => void runApply()} disabled={loading || !dryRunValid || !readyToApply} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-50">
            <ShieldCheck size={16} />
            {`Apply Changes${applyCount > 0 ? ` (${applyCount})` : ""}`}
          </button>
          <div className="inline-flex h-12 items-center rounded-2xl border border-black/5 bg-black/[0.02] px-4 text-xs font-black uppercase tracking-[0.16em] text-black/55">
            sync all disabled for now
          </div>
        </div>
        {selectedProduct ? (
          <div className="lg:col-span-3 grid gap-3 rounded-[24px] bg-black/[0.02] p-4 text-sm font-semibold text-black/70 sm:grid-cols-4 xl:grid-cols-7">
            <MiniMeta label="Name" value={selectedProduct.title} />
            <MiniMeta label="Colors" value={selectedProduct.colorCount != null ? String(selectedProduct.colorCount) : "—"} />
            <MiniMeta label="Last sync" value={formatDate(selectedProduct.lastSyncAt)} />
            <MiniMeta label="Status" value={selectedProduct.syncStatus ?? "unknown"} />
            <MiniMeta label="Requests" value={String(dryRunMeta?.requests ?? 0)} />
            <MiniMeta label="Deduped" value={String(dryRunMeta?.deduplicatedRequests ?? 0)} />
            <MiniMeta label="Product" value={selectedProduct.slug || selectedProduct.id.slice(0, 8)} />
          </div>
        ) : null}
      </section>

      {(message || error) && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          {message ? <Notice tone="green" icon={<CheckCircle2 size={16} />} text={message} /> : null}
          {error ? <Notice tone="rose" text={error} /> : null}
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Colors" value={metrics.total} />
        <SummaryCard label="Matched" value={metrics.total - metrics.pending - metrics.conflict} />
        <SummaryCard label="Updates" value={metrics.update} />
        <SummaryCard label="Unchanged" value={metrics.unchanged} />
        <SummaryCard label="Multitone" value={metrics.multitone} />
        <SummaryCard label="Invalid Local" value={metrics.invalidLocal} />
        <SummaryCard label="Pending" value={metrics.pending} />
        <SummaryCard label="Conflicts" value={metrics.conflict} />
        <SummaryCard label="Errors" value={metrics.errors} />
      </section>

      {dryRunValid ? (
        <section className={`rounded-[28px] border p-5 shadow-sm ${readyToApply ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black/35">Apply Gate</h2>
              <p className="mt-1 text-sm font-semibold text-black/60">
              {readyToApply ? "Ready to apply" : "Fix pending/conflict/errors/invalid colors before applying."}
            </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black/55">
              {metrics.pending} pending · {metrics.conflict} conflicts · {metrics.invalidLocal} invalid · {metrics.errors} errors
            </div>
          </div>
        </section>
      ) : null}

      {plan.length > 0 ? (
        <>
          <section className="hidden rounded-[28px] border border-black/5 bg-white p-5 shadow-sm lg:block">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black/35">Color Table</h2>
              <p className="text-xs font-semibold text-black/40">Click Details for RAW dimensions.</p>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-black/5">
              <table className="min-w-full divide-y divide-black/5 text-left text-sm">
                <thead className="bg-black/[0.02] text-[11px] uppercase tracking-[0.18em] text-black/45">
                  <tr>
                    <Th>Color</Th>
                    <Th>Current</Th>
                    <Th>Gelato</Th>
                    <Th>Source</Th>
                    <Th>Status</Th>
                    <Th>Details</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 bg-white">
                  {plan.map((item) => {
                    const rowKey = `${item.product_color_id}-${item.gelato_product_uid}`;
                    const isOpen = openDetails === rowKey;
                    return (
                      <tr key={rowKey} className="align-top">
                        <Td>
                          <div className="space-y-1">
                            <div className="font-black text-black">{item.color ?? item.gelato_color_key}</div>
                            <div className="font-mono text-[12px] text-black/45">{item.gelato_color_key}</div>
                          </div>
                        </Td>
                        <Td>
                          <div className="space-y-2">
                            <SwatchRow hex={item.current_color_hex} />
                            <div className="font-mono text-[12px] text-black/60">{item.current_color_hex ?? "null"}</div>
                          </div>
                        </Td>
                        <Td>
                          <div className="space-y-2">
                            <SwatchRow hexes={item.all_hex_values.length ? item.all_hex_values : item.normalized_color?.hexes ?? []} primaryHex={item.normalized_primaryHex} />
                            <div className="font-mono text-[12px] font-black text-black">{item.normalized_primaryHex ?? "null"}</div>
                            <div className="font-mono text-[12px] text-black/60 break-words">{item.all_hex_values.length ? item.all_hex_values.join(", ") : "null"}</div>
                          </div>
                        </Td>
                        <Td className="text-[12px] text-black/65">
                          <div className="space-y-1">
                            <div>{item.normalized_primaryHex_source_key ?? "null"}</div>
                            <div className="text-black/40">{item.normalized_color_type}</div>
                          </div>
                        </Td>
                        <Td>
                          <div className="space-y-2">
                            <ActionBadge action={normalizeAction(item.action)} />
                            <ConfidenceBadge item={item} />
                          </div>
                        </Td>
                        <Td>
                          <button
                            type="button"
                            onClick={() => setOpenDetails(isOpen ? null : rowKey)}
                            className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.02] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-black/70 hover:bg-black/[0.04]"
                          >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Details
                          </button>
                          {isOpen ? (
                            <div className="mt-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3 text-[12px] text-black/70">
                              <div className="mb-2 font-black uppercase tracking-[0.16em] text-black/35">dimensions / raw</div>
                              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-white p-3 text-[11px] leading-5 text-black/65">
                                {JSON.stringify(item.normalized_color?.dimensions?.raw ?? item.raw_color_structure ?? {}, null, 2)}
                              </pre>
                            </div>
                          ) : null}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-3 lg:hidden">
            {plan.map((item) => {
              const rowKey = `${item.product_color_id}-${item.gelato_product_uid}`;
              const isOpen = openDetails === rowKey;
              return (
                <article key={rowKey} className="rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
                  <button type="button" onClick={() => setOpenDetails(isOpen ? null : rowKey)} className="flex w-full items-start justify-between gap-4 text-left">
                    <div>
                      <div className="text-base font-black text-black">{item.color ?? item.gelato_color_key}</div>
                      <div className="mt-1 font-mono text-[12px] text-black/45">{item.gelato_color_key}</div>
                    </div>
                    <ActionBadge action={normalizeAction(item.action)} />
                  </button>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <CompactField label="Current" value={item.current_color_hex ?? "null"} />
                    <CompactField label="Gelato" value={item.normalized_primaryHex ?? "null"} />
                    <div className="col-span-2 flex gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">RYFIO swatch</p>
                        <SwatchRow hex={item.current_color_hex} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">Gelato swatch</p>
                        <SwatchRow hexes={item.all_hex_values.length ? item.all_hex_values : item.normalized_color?.hexes ?? []} primaryHex={item.normalized_primaryHex} />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenDetails(isOpen ? null : rowKey)}
                    className="mt-4 inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.02] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-black/70"
                  >
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Details
                  </button>
                  {isOpen ? (
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-black/[0.02] p-3 text-[11px] leading-5 text-black/65">
                      {JSON.stringify(item.normalized_color?.dimensions?.raw ?? item.raw_color_structure ?? {}, null, 2)}
                    </pre>
                  ) : null}
                </article>
              );
            })}
          </section>
        </>
      ) : null}

      {applyJob ? (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">Apply Job</h2>
          <pre className="overflow-auto rounded-[24px] bg-black/[0.03] p-4 text-xs leading-6 text-black/75">{JSON.stringify(applyJob, null, 2)}</pre>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 text-sm font-semibold text-black outline-none" />
    </div>
  );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-black">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">{label}</p>
      <p className="mt-2 text-xl font-black tracking-[-0.04em] text-black">{value}</p>
    </div>
  );
}

function Notice({ tone, icon, text }: { tone: "green" | "rose"; icon?: React.ReactNode; text: string }) {
  const styles = tone === "green" ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-900" : "border-rose-500/15 bg-rose-500/10 text-rose-900";
  return (
    <div className={`rounded-2xl border p-4 text-sm font-semibold ${styles}`}>
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5">{icon}</span> : null}
        <span>{text}</span>
      </div>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "green" | "blue" | "amber" | "neutral" }) {
  const styles: Record<typeof tone, string> = {
    green: "bg-emerald-500/10 text-emerald-700",
    blue: "bg-blue-500/10 text-blue-700",
    amber: "bg-amber-500/10 text-amber-700",
    neutral: "bg-black/[0.05] text-black/60",
  };
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] ${styles[tone]}`}>{label}</span>;
}

function ProductPicker({ products, value, onChange }: { products: ProductOption[]; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">Product</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 text-sm font-semibold text-black outline-none">
        {products.length === 0 ? <option value={value}>{value || "Loading products..."}</option> : null}
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.title}
            {product.colorCount != null ? ` · ${product.colorCount} colors` : ""}
            {product.syncStatus ? ` · ${product.syncStatus}` : ""}
          </option>
        ))}
      </select>
      {products.length > 0 ? (
        <p className="mt-2 text-xs font-semibold text-black/40">Only the selected product is loaded into the planner.</p>
      ) : null}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    unchanged: "bg-emerald-500/10 text-emerald-700",
    update: "bg-blue-500/10 text-blue-700",
    pending: "bg-amber-500/10 text-amber-700",
    conflict: "bg-rose-500/10 text-rose-700",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${styles[normalizeAction(action)] ?? styles.pending}`}>{normalizeAction(action)}</span>;
}

function ConfidenceBadge({ item }: { item: DryRunPlan }) {
  const confidence = item.normalized_primaryHex ? (item.all_hex_values.length > 1 ? "high" : "medium") : "low";
  const styles: Record<string, string> = {
    high: "bg-emerald-500/10 text-emerald-700",
    medium: "bg-blue-500/10 text-blue-700",
    low: "bg-amber-500/10 text-amber-700",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${styles[confidence]}`}>{confidence}</span>;
}

function SwatchRow({ hex, hexes, primaryHex }: { hex?: string | null; hexes?: string[]; primaryHex?: string | null }) {
  const list = hexes && hexes.length > 0 ? hexes : hex ? [hex] : [];
  if (list.length === 0) {
    return <div className="h-6 w-14 rounded-full border border-dashed border-black/10 bg-black/[0.02]" />;
  }
  if (list.length === 1) {
    return <div className="h-6 w-14 rounded-full border border-black/10" style={{ backgroundColor: list[0] }} />;
  }
  return (
    <div className="relative h-6 w-16 overflow-hidden rounded-full border border-black/10">
      {list.map((value, index) => {
        const left = `${(index / list.length) * 100}%`;
        const width = `${100 / list.length}%`;
        return <div key={`${value}-${index}`} className="absolute inset-y-0" style={{ left, width, backgroundColor: value }} />;
      })}
      {primaryHex ? <div className="absolute inset-y-0 right-0 w-2 bg-black/20" title={`primary ${primaryHex}`} /> : null}
    </div>
  );
}

function CompactField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/[0.02] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">{label}</p>
      <p className="mt-1 break-words font-mono text-[12px] text-black/65">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-black">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-4 ${className}`}>{children}</td>;
}
