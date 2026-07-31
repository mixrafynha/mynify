"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

type CatalogItem = {
  catalogUid: string;
  title: string;
};

type SyncState = {
  catalog_uid?: string | null;
  catalog_title?: string | null;
  gelato_product_uid?: string | null;
  sync_status?: string | null;
  last_synced_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  synced_products_count?: number | null;
  synced_colors_count?: number | null;
  synced_variants_count?: number | null;
};

type SyncJob = {
  id?: string | null;
  status?: string | null;
  total_variants?: number | null;
  processed_variants?: number | null;
  successful_variants?: number | null;
  failed_variants?: number | null;
  completed_variants?: number | null;
  pending_items?: number | null;
  processing_items?: number | null;
  failed_items?: number | null;
  current_item_uid?: string | null;
  current_error?: string | null;
  can_complete?: boolean | null;
  inconsistent?: boolean | null;
  variant_costs?: Array<{
    gelato_product_uid?: string | null;
    name?: string | null;
    color?: string | null;
    size?: string | null;
    cost_fr?: number | string | null;
    currency?: string | null;
    last_synced_at?: string | null;
  }> | null;
};

const TEMPORARY_STATUS_CODES = [408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524];
const PROCESS_RETRY_DELAYS_MS = [2000, 5000, 10000, 20000, 20000];

class RetryableSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableSyncError";
  }
}

function isTemporaryStatus(status: number) {
  return TEMPORARY_STATUS_CODES.includes(status);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readResponsePayload(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  if (!text) return {};
  if (!contentType.includes("application/json")) {
    return {
      error: isTemporaryStatus(res.status)
        ? "Erro temporario de ligacao ao Supabase. A sincronizacao sera retomada."
        : `Unexpected upstream response: ${res.status}`,
      retryable: isTemporaryStatus(res.status),
    };
  }
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: isTemporaryStatus(res.status)
        ? "Erro temporario de ligacao ao Supabase. A sincronizacao sera retomada."
        : `Unexpected upstream response: ${res.status}`,
      retryable: isTemporaryStatus(res.status),
    };
  }
}

export default function GelatoSyncPage() {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [productId, setProductId] = useState("");
  const [catalogUid, setCatalogUid] = useState("apparel");
  const [gelatoProductUid, setGelatoProductUid] = useState("");
  const [state, setState] = useState<SyncState | null>(null);
  const [job, setJob] = useState<SyncJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/gelato/catalogs", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await readResponsePayload(res);
        if (!res.ok) throw new Error(json?.error || "Failed to load catalogs");
        if (active) setCatalogs(Array.isArray(json.catalogs) ? json.catalogs : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load catalogs");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function loadState() {
    if (!productId.trim()) {
      setState(null);
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/gelato/catalog-sync?productId=${encodeURIComponent(productId.trim())}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      const json = await readResponsePayload(res);
      if (res.ok) setState(json.state ?? null);
    } catch {}
  }

  async function readJobStatus(jobId: string) {
    const res = await fetch(`/api/admin/gelato-sync/family/status?jobId=${encodeURIComponent(jobId)}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await readResponsePayload(res);
    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || "Failed to read job status");
    }
    setJob(json.job ?? null);
    return json.job as SyncJob;
  }

  async function processJob(jobId: string) {
    let consecutiveRetries = 0;

    while (true) {
      const res = await fetch("/api/admin/gelato-sync/family/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });
      const json = await readResponsePayload(res);
      const retryable = json?.retryable === true || isTemporaryStatus(res.status);

      if (retryable) {
        consecutiveRetries += 1;
        const status = await readJobStatus(jobId);
        if ((status?.pending_items ?? 0) > 0 && (status?.processing_items ?? 0) === 0) {
          if (consecutiveRetries > PROCESS_RETRY_DELAYS_MS.length) {
            setMessage("Pausado por erro temporario. Clica em Retomar sincronizacao.");
            throw new RetryableSyncError("Pausado por erro temporario. Retoma a sincronizacao com o mesmo job.");
          }
          setMessage("Erro temporario de ligacao ao Supabase. A sincronizacao sera retomada.");
          await sleep(PROCESS_RETRY_DELAYS_MS[consecutiveRetries - 1]);
          continue;
        }
      }

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to process batch");
      }

      consecutiveRetries = 0;
      const status = await readJobStatus(jobId);
      if (status?.status === "completed") break;
      if (status?.status === "completed_with_errors") break;
      if (status?.status === "failed") {
        throw new Error(status.current_error || "Job failed");
      }
    }
  }

  async function runFamilySync() {
    setSyncing(true);
    setError(null);
    setMessage(null);
    setResult(null);

    const exactProductUid = gelatoProductUid.trim();

    try {
      const res = await fetch("/api/admin/gelato-sync/family/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: productId.trim(),
          catalogUid: catalogUid.trim(),
          referenceProductUid: exactProductUid,
        }),
      });

      const json = await readResponsePayload(res);
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Sync failed");
      }

      const jobId = typeof json.jobId === "string" ? json.jobId : "";
      if (!jobId) throw new Error("Missing jobId.");

      localStorage.setItem(`gelato-family-sync:${productId.trim()}`, jobId);
      setResult(JSON.stringify(json, null, 2));
      setMessage("Job created. Processing...");
      const initialStatus = await readJobStatus(jobId);
      if (initialStatus?.status === "failed") {
        throw new Error(initialStatus.current_error || "Job failed to initialize");
      }
      await processJob(jobId);
      const finalStatus = await readJobStatus(jobId);
      const finishedStatus =
        finalStatus?.status === "completed" || finalStatus?.status === "completed_with_errors";
      if (!finishedStatus || !finalStatus?.can_complete) {
        throw new Error(finalStatus?.current_error || "Job did not complete cleanly");
      }
      setMessage(finalStatus.status === "completed_with_errors" ? "Family sync completed with errors." : "Family sync completed.");
      void loadState();
    } catch (err) {
      if (err instanceof RetryableSyncError) {
        setError("Pausado por erro temporario. Usa o mesmo job para retomar a sincronizacao.");
      } else {
        setError(err instanceof Error ? err.message : "Sync failed");
      }
    } finally {
      setSyncing(false);
    }
  }

  async function resumeCurrentJob() {
    const savedJobId = localStorage.getItem(`gelato-family-sync:${productId.trim()}`) ?? job?.id ?? "";
    if (!savedJobId) return;
    setSyncing(true);
    setError(null);
    setMessage("A retomar sincronizacao...");
    try {
      await processJob(savedJobId);
      const finalStatus = await readJobStatus(savedJobId);
      const finishedStatus =
        finalStatus?.status === "completed" || finalStatus?.status === "completed_with_errors";
      if (!finishedStatus || !finalStatus?.can_complete) {
        throw new Error(finalStatus?.current_error || "Job did not complete cleanly");
      }
      setMessage(finalStatus.status === "completed_with_errors" ? "Family sync completed with errors." : "Family sync completed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function resumeJobFromStorage() {
    const savedJobId = localStorage.getItem(`gelato-family-sync:${productId.trim()}`);
    if (!savedJobId) return;
    try {
      await readJobStatus(savedJobId);
    } catch {
      localStorage.removeItem(`gelato-family-sync:${productId.trim()}`);
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-700">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700/80">Gelato Sync</p>
            <h1 className="text-2xl font-black tracking-[-0.05em] text-black">Catalog sync console</h1>
          </div>
        </div>

        <p className="max-w-2xl text-sm font-semibold leading-6 text-black/55">
          Cola o `productId`, escolhe o `catalogUid` e dispara a sincronização da família Gelato sem tocar no resto do admin.
        </p>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[1fr_1fr]">
        <Field
          label="Product ID"
          value={productId}
          onChange={setProductId}
          placeholder="UUID do produto"
          onBlur={() => {
            void loadState();
            void resumeJobFromStorage();
          }}
        />

        <Field
          label="Gelato Product UID"
          value={gelatoProductUid}
          onChange={setGelatoProductUid}
          placeholder="UID exato do produto Gelato"
        />

        <div>
          <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">Catalog UID</label>
          <div className="mt-2">
            <input
              list="gelato-catalogs"
              value={catalogUid}
              onChange={(e) => setCatalogUid(e.target.value)}
              placeholder="Ex: apparel"
              className="h-12 w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 text-sm font-semibold text-black outline-none"
            />
            <datalist id="gelato-catalogs">
              {catalogs.map((catalog) => (
                <option key={catalog.catalogUid} value={catalog.catalogUid}>
                  {catalog.title}
                </option>
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => void runFamilySync()}
              disabled={syncing || !productId.trim() || !gelatoProductUid.trim()}
              className="mt-2 inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Encontrar e sincronizar família
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold text-black/35">
            Introduz o UID de referência da Gelato para sincronizar toda a família.
          </p>
          <p className="mt-1 text-xs font-semibold text-black/35">
            Este modo encontra a família completa, sincroniza variantes, cores e mercados, e continua por lotes pequenos.
          </p>
        </div>

        <div className="lg:col-span-2 rounded-[24px] border border-dashed border-black/10 bg-black/[0.02] p-4 text-xs font-semibold text-black/45">
          O sync de família usa apenas o UID de referência Gelato para descobrir toda a família.
        </div>
      </section>

      {job && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">Job status</h2>
          <pre className="overflow-auto rounded-[24px] bg-black/[0.03] p-4 text-xs leading-6 text-black/75">
            {JSON.stringify(job, null, 2)}
          </pre>
        </section>
      )}

      {job?.variant_costs && job.variant_costs.length > 0 && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">Variant costs</h2>
          <div className="overflow-auto rounded-[24px] border border-black/5">
            <table className="w-full min-w-[760px] text-left text-xs font-semibold text-black/65">
              <thead className="bg-black/[0.03] text-[11px] uppercase tracking-[0.16em] text-black/35">
                <tr>
                  <th className="px-4 py-3">Cor</th>
                  <th className="px-4 py-3">Tamanho</th>
                  <th className="px-4 py-3">UID Gelato</th>
                  <th className="px-4 py-3">Custo FR</th>
                  <th className="px-4 py-3">Moeda</th>
                  <th className="px-4 py-3">Ultima sync</th>
                </tr>
              </thead>
              <tbody>
                {job.variant_costs.slice(0, 80).map((variant) => (
                  <tr key={variant.gelato_product_uid ?? `${variant.color}-${variant.size}`} className="border-t border-black/5">
                    <td className="px-4 py-3">{variant.color ?? "-"}</td>
                    <td className="px-4 py-3">{variant.size ?? "-"}</td>
                    <td className="max-w-[340px] truncate px-4 py-3">{variant.gelato_product_uid ?? "-"}</td>
                    <td className="px-4 py-3">{variant.cost_fr ?? "-"}</td>
                    <td className="px-4 py-3">{variant.currency ?? "-"}</td>
                    <td className="px-4 py-3">{variant.last_synced_at ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(message || error) && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          {message && (
            <div className="mb-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-900">
              <div className="flex items-center gap-2 font-black">
                <ShieldCheck size={16} />
                {message}
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-rose-500/15 bg-rose-500/10 p-4 text-sm font-semibold text-rose-900">
              {error}
              {error.includes("Pausado por erro temporario") && (
                <button
                  type="button"
                  onClick={() => void resumeCurrentJob()}
                  disabled={syncing}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-rose-900 px-3 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Retomar sincronizacao
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {state && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">Sync state</h2>
          <pre className="overflow-auto rounded-[24px] bg-black/[0.03] p-4 text-xs leading-6 text-black/75">
            {JSON.stringify(state, null, 2)}
          </pre>
        </section>
      )}

      {result !== null && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">Last result</h2>
          <pre className="overflow-auto rounded-[24px] bg-black/[0.03] p-4 text-xs leading-6 text-black/75">
            {result}
          </pre>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 text-sm font-semibold text-black outline-none"
      />
    </div>
  );
}
