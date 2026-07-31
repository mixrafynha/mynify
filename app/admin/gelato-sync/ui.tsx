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
};

async function readResponsePayload(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
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
    while (true) {
      const res = await fetch("/api/admin/gelato-sync/family/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });
      const json = await readResponsePayload(res);
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to process batch");
      }

      const status = await readJobStatus(jobId);
      if (status?.status === "completed") break;
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
      if (finalStatus?.status !== "completed" || !finalStatus?.can_complete) {
        throw new Error(finalStatus?.current_error || "Job did not complete cleanly");
      }
      setMessage("Family sync completed.");
      void loadState();
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
