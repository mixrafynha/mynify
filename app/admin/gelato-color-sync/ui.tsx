"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Play, ShieldCheck, Sparkles } from "lucide-react";

type ProductOption = { id: string; title: string; slug: string };
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
  action: "unchanged" | "update" | "pending" | "conflict";
  uid_count: number;
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

function readResponsePayload(res: Response) {
  return res.json().catch(() => ({}));
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

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/admin/products`, { credentials: "include", cache: "no-store" });
      const json = await readResponsePayload(res);
      if (active && res.ok && Array.isArray(json.products)) {
        setProducts(json.products.map((p: any) => ({ id: p.id, title: p.title, slug: p.slug })));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const total = plan.length;
    return {
      total,
      unchanged: plan.filter((item) => item.action === "unchanged").length,
      update: plan.filter((item) => item.action === "update").length,
      pending: plan.filter((item) => item.action === "pending").length,
      conflict: plan.filter((item) => item.action === "conflict").length,
      errors: dryRunJob?.error_items ?? 0,
      multitone: plan.filter((item) => item.normalized_color.type !== "solid").length,
    };
  }, [plan, dryRunJob?.error_items]);

  const dryRunValid = Boolean(dryRunJob && dryRunJob.dry_run && dryRunJob.status === "dry_run_completed");

  async function runDryRun() {
    setLoading(true);
    setError(null);
    setMessage(null);
    setDryRunMeta(null);
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
      setMessage("Dry run concluído.");
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
      setError("Apply bloqueado até existir um dry-run válido para este produto/família.");
      return;
    }
    setLoading(true);
    setError(null);
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
      setMessage("Apply job criado, mas não foi executado automaticamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setLoading(false);
    }
  }

  async function syncAllColors() {
    await runDryRun();
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-emerald-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700/80">Gelato Color Sync</p>
            <h1 className="text-2xl font-black tracking-[-0.05em] text-black">Dry run e apply separados</h1>
          </div>
        </div>
        <p className="max-w-3xl text-sm font-semibold leading-6 text-black/55">
          Este fluxo sincroniza apenas cores. O sync principal permanece intacto.
        </p>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-3">
        <ProductPicker products={products} value={productId} onChange={setProductId} />
        <Field label="Catalog UID" value={catalogUid} onChange={setCatalogUid} />
        <Field label="Reference UID" value={referenceProductUid} onChange={setReferenceProductUid} />
        <div className="lg:col-span-3 flex flex-wrap gap-3">
          <button onClick={() => void runDryRun()} disabled={loading} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-black text-white disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Dry Run
          </button>
          <button onClick={() => void runApply()} disabled={loading || !dryRunValid} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-black text-black disabled:opacity-50">
            <ShieldCheck size={16} />
            Apply
          </button>
          <button onClick={() => void syncAllColors()} disabled={loading} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-50">
            Sync All Colors
          </button>
        </div>
        <div className="lg:col-span-3 grid gap-3 rounded-[24px] bg-black/[0.02] p-4 text-sm font-semibold text-black/70 sm:grid-cols-6">
          <Metric label="Total" value={metrics.total} />
          <Metric label="Processed" value={dryRunJob?.processed_items ?? 0} />
          <Metric label="Unchanged" value={metrics.unchanged} />
          <Metric label="Update" value={metrics.update} />
          <Metric label="Pending" value={metrics.pending} />
          <Metric label="Conflict" value={metrics.conflict} />
          <Metric label="Errors" value={metrics.errors} />
          <Metric label="Multitone" value={metrics.multitone} />
          <Metric label="Requests" value={dryRunMeta?.requests ?? 0} />
          <Metric label="Deduped" value={dryRunMeta?.deduplicatedRequests ?? 0} />
        </div>
      </section>

      {(message || error) && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          {message && <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-900"><div className="flex items-center gap-2 font-black"><CheckCircle2 size={16} />{message}</div></div>}
          {error && <div className="rounded-2xl border border-rose-500/15 bg-rose-500/10 p-4 text-sm font-semibold text-rose-900">{error}</div>}
        </section>
      )}

      {dryRunMeta && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">Dry Run Summary</h2>
          <div className="grid gap-3 text-sm font-semibold text-black/70 sm:grid-cols-3">
            <SummaryStat label="totalColors" value={dryRunMeta.totalColors} />
            <SummaryStat label="requests" value={dryRunMeta.requests ?? 0} />
            <SummaryStat label="requestsDeduplicated" value={dryRunMeta.deduplicatedRequests ?? 0} />
          </div>
        </section>
      )}

      {plan.length > 0 && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">Color Report</h2>
          <div className="overflow-hidden rounded-[24px] border border-black/5">
            <table className="min-w-full divide-y divide-black/5 text-left text-sm">
              <thead className="bg-black/[0.02] text-[11px] uppercase tracking-[0.18em] text-black/45">
                <tr>
                  <Th>Color</Th>
                  <Th>gelato_color_key</Th>
                  <Th>Current RYFIO HEX</Th>
                  <Th>Gelato primaryHex</Th>
                  <Th>All Gelato HEX values</Th>
                  <Th>Primary source key</Th>
                  <Th>Color type</Th>
                  <Th>Confidence</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 bg-white">
                {plan.map((item) => (
                  <tr key={`${item.product_color_id}-${item.gelato_product_uid}`} className="align-top">
                    <Td>
                      <div className="space-y-2">
                        <div className="font-black text-black">{item.color ?? item.gelato_color_key}</div>
                        <Swatches hex={item.current_color_hex} label="current" />
                      </div>
                    </Td>
                    <Td className="font-mono text-[12px] text-black/65">{item.gelato_color_key}</Td>
                    <Td>
                      <div className="space-y-2">
                        <div className="font-mono text-[12px] text-black/65">{item.current_color_hex ?? "null"}</div>
                        <Swatches hex={item.current_color_hex} label="ryfio" />
                      </div>
                    </Td>
                    <Td>
                      <div className="space-y-2">
                        <div className="font-mono text-[12px] font-black text-black">{item.normalized_primaryHex ?? "null"}</div>
                        <Swatches hexes={item.normalized_color?.hexes ?? []} primaryHex={item.normalized_primaryHex} label="gelato" />
                      </div>
                    </Td>
                    <Td className="font-mono text-[12px] text-black/65">{item.all_hex_values.length ? item.all_hex_values.join(", ") : "null"}</Td>
                    <Td className="font-mono text-[12px] text-black/65">{item.normalized_primaryHex_source_key ?? "null"}</Td>
                    <Td className="text-[12px] text-black/65">{item.normalized_color_type}</Td>
                    <Td>
                      <ConfidenceBadge item={item} />
                    </Td>
                    <Td>
                      <ActionBadge action={item.action} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {applyJob && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">Apply Job</h2>
          <pre className="overflow-auto rounded-[24px] bg-black/[0.03] p-4 text-xs leading-6 text-black/75">{JSON.stringify(applyJob, null, 2)}</pre>
        </section>
      )}
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">{label}</p>
      <p className="mt-1 text-lg font-black text-black">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">{label}</p>
      <p className="mt-1 text-lg font-black text-black">{value}</p>
    </div>
  );
}

function ProductPicker({ products, value, onChange }: { products: ProductOption[]; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">Product</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 text-sm font-semibold text-black outline-none">
        {products.length === 0 ? <option value={value}>{value}</option> : null}
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.title}
          </option>
        ))}
      </select>
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
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${styles[action] ?? styles.pending}`}>{action}</span>;
}

function ConfidenceBadge({ item }: { item: DryRunPlan }) {
  const confidence = item.normalized_primaryHex ? item.all_hex_values.length > 1 ? "high" : "medium" : "low";
  const styles: Record<string, string> = {
    high: "bg-emerald-500/10 text-emerald-700",
    medium: "bg-blue-500/10 text-blue-700",
    low: "bg-amber-500/10 text-amber-700",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${styles[confidence]}`}>{confidence}</span>;
}

function Swatches({ hex, hexes, primaryHex, label }: { hex?: string | null; hexes?: string[]; primaryHex?: string | null; label: string }) {
  const list = hexes && hexes.length > 0 ? hexes : hex ? [hex] : [];
  if (list.length === 0) {
    return <div className="h-6 w-10 rounded-full border border-dashed border-black/10 bg-black/[0.02]" aria-label={`${label} swatch empty`} />;
  }
  if (list.length === 1) {
    return <div className="h-6 w-10 rounded-full border border-black/10" style={{ backgroundColor: list[0] }} aria-label={`${label} swatch ${list[0]}`} />;
  }
  const gradient = `linear-gradient(90deg, ${list.map((value, index) => `${value} ${Math.round((index / list.length) * 100)}%, ${value} ${Math.round(((index + 1) / list.length) * 100)}%`).join(", ")})`;
  return (
    <div className="relative h-6 w-14 overflow-hidden rounded-full border border-black/10" style={{ background: gradient }} aria-label={`${label} multitone swatch`}>
      {primaryHex ? <div className="absolute inset-y-0 right-0 w-2 bg-black/25" title={`primary ${primaryHex}`} /> : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-black">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-4 ${className}`}>{children}</td>;
}
