"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function GelatoSyncPage() {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [productId, setProductId] = useState("");
  const [catalogUid, setCatalogUid] = useState("apparel");
  const [gelatoProductUid, setGelatoProductUid] = useState("");
  const [filters, setFilters] = useState("{}");
  const [state, setState] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const parsedFilters = useMemo(() => {
    try {
      const value = JSON.parse(filters);
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return null;
    }
  }, [filters]);

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
        const json = await res.json();

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

    const res = await fetch(`/api/admin/gelato/catalog-sync?productId=${encodeURIComponent(productId.trim())}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    if (res.ok) setState(json.state ?? null);
  }

  async function runSync() {
    setSyncing(true);
    setError(null);
    setMessage(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/gelato/catalog-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: productId.trim(),
          catalogUid: catalogUid.trim(),
          productUid: gelatoProductUid.trim() || undefined,
          gelatoProductUid: gelatoProductUid.trim() || undefined,
          attributeFilters: parsedFilters ?? {},
        }),
      });

      const json = await res.json();
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Sync failed");
      }

      const lastPayload = json.result ?? json;
      await loadState();

      setResult(JSON.stringify(lastPayload, null, 2));
      setMessage("Sync completed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
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
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700/80">
              Gelato Sync
            </p>
            <h1 className="text-2xl font-black tracking-[-0.05em] text-black">
              Catalog sync console
            </h1>
          </div>
        </div>

        <p className="max-w-2xl text-sm font-semibold leading-6 text-black/55">
          Cola o `productId`, escolhe o `catalogUid` e dispara a sincronização do catálogo Gelato sem tocar no resto do admin.
        </p>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[1fr_1fr]">
        <Field
          label="Product ID"
          value={productId}
          onChange={setProductId}
          placeholder="UUID do produto"
          onBlur={loadState}
        />

        <Field
          label="Gelato Product UID"
          value={gelatoProductUid}
          onChange={setGelatoProductUid}
          placeholder="UID exato do produto Gelato"
        />

        <div>
          <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
            Catalog UID
          </label>
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
              onClick={() => void runSync()}
              disabled={syncing || !productId.trim() || !gelatoProductUid.trim()}
              className="mt-2 inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Sync
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold text-black/35">
            Podes escrever o UID manualmente ou escolher pelas sugestões do Gelato.
          </p>
          <p className="mt-1 text-xs font-semibold text-black/35">
            Este modo faz sync apenas do produto Gelato exato e grava também os países e dados de entrega devolvidos pela API.
          </p>
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
            Attribute filters JSON
          </label>
          <textarea
            value={filters}
            onChange={(e) => setFilters(e.target.value)}
            className="mt-2 min-h-28 w-full rounded-[24px] border border-black/10 bg-black/[0.02] p-4 font-mono text-xs text-black outline-none"
          />
          <p className={`mt-2 text-xs font-semibold ${parsedFilters ? "text-black/40" : "text-rose-600"}`}>
            {parsedFilters ? "JSON valid." : "Invalid JSON."}
          </p>
        </div>
      </section>

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
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">
            Sync state
          </h2>
          <pre className="overflow-auto rounded-[24px] bg-black/[0.03] p-4 text-xs leading-6 text-black/75">
            {JSON.stringify(state, null, 2)}
          </pre>
        </section>
      )}

      {result !== null && (
        <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-black/35">
            Last result
          </h2>
          <pre className="overflow-auto rounded-[24px] bg-black/[0.03] p-4 text-xs leading-6 text-black/75">{result}</pre>
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
      <label className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
        {label}
      </label>
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
