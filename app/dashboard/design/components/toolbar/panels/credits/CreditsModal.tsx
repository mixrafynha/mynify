"use client";

import { useMemo } from "react";
import { Coins, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { CreditPack } from "./credits.types";
import { formatCreditPrice, getPricePerCredit } from "./useCreditPacks";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type Props = {
  open: boolean;
  packs: CreditPack[];
  loading: boolean;
  buyingPackId: string | null;
  checkoutClientSecret?: string | null;
  checkoutMessage?: string;
  onClose: () => void;
  onBuy: (packId: string) => void;
  onCancelCheckout?: () => void;
  onCheckoutComplete?: () => void;
};

export default function CreditsModal({
  open,
  packs,
  loading,
  buyingPackId,
  checkoutClientSecret,
  checkoutMessage,
  onClose,
  onBuy,
  onCancelCheckout,
  onCheckoutComplete,
}: Props) {
  const embeddedOptions = useMemo(
    () =>
      checkoutClientSecret
        ? {
            clientSecret: checkoutClientSecret,
            onComplete: () => {
              onCheckoutComplete?.();
            },
          }
        : undefined,
    [checkoutClientSecret, onCheckoutComplete],
  );

  const bestPackId = useMemo(() => {
    if (!packs.length) return null;

    const highlighted = packs.find((pack) => pack.highlight);
    if (highlighted) return highlighted.id;

    return [...packs].sort((a, b) => getPricePerCredit(a) - getPricePerCredit(b))[0]?.id ?? null;
  }, [packs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/80 px-3 py-4 text-white backdrop-blur-md sm:items-center sm:p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-[#080712] shadow-[0_30px_120px_rgba(168,85,247,.22)] ring-1 ring-white/10">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative border-b border-white/10 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200 ring-1 ring-fuchsia-400/20">
                <Sparkles size={12} />
                AI credits
              </div>

              <h3 className="mt-3 text-3xl font-black leading-none tracking-tight">
                Keep creating
              </h3>

              <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-white/55">
                {checkoutClientSecret
                  ? "Complete the secure Stripe checkout here. Your editor stays open."
                  : "Choose a credit pack and continue generating transparent print graphics."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white/70 ring-1 ring-white/10 transition hover:bg-white/15 active:scale-[0.98]"
            >
              Close
            </button>
          </div>

          {!checkoutClientSecret && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/[0.055] px-3 py-2 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-[11px] font-black text-white/80">
                  <Zap size={13} className="text-fuchsia-200" />
                  Instant top-up
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.055] px-3 py-2 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-[11px] font-black text-white/80">
                  <ShieldCheck size={13} className="text-violet-200" />
                  Secure Stripe
                </div>
              </div>
            </div>
          )}
        </div>

        {checkoutMessage ? (
          <div className="relative mx-4 mt-4 rounded-2xl bg-amber-500/10 p-3 text-xs font-bold text-amber-100 ring-1 ring-amber-400/20">
            {checkoutMessage}
          </div>
        ) : null}

        {checkoutClientSecret && embeddedOptions ? (
          <div className="relative p-3 sm:p-4">
            {!stripePromise ? (
              <div className="rounded-3xl bg-red-500/10 p-4 text-xs font-bold text-red-100 ring-1 ring-red-400/20">
                Stripe publishable key is missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and restart Next.js.
              </div>
            ) : (
            <div className="max-h-[72dvh] overflow-y-auto rounded-3xl bg-white p-2 text-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={embeddedOptions}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>

            )}

            <button
              type="button"
              onClick={onCancelCheckout}
              className="mt-3 w-full rounded-2xl bg-white/[0.07] px-4 py-3 text-xs font-black text-white/70 ring-1 ring-white/10 transition hover:bg-white/[0.1] active:scale-[0.98]"
            >
              Cancel payment
            </button>
          </div>
        ) : (
          <div className="relative grid gap-3 p-4 pt-3">
            {loading ? (
              <div className="rounded-3xl bg-white/[0.055] p-5 text-xs font-bold text-white/45 ring-1 ring-white/10">
                Loading credit packs...
              </div>
            ) : packs.length === 0 ? (
              <div className="rounded-3xl bg-white/[0.055] p-5 text-xs font-bold text-white/45 ring-1 ring-white/10">
                No credit packs available right now.
              </div>
            ) : (
              packs.map((pack) => {
                const unitPrice = getPricePerCredit(pack);
                const buying = buyingPackId === pack.id;
                const isBest = pack.id === bestPackId;

                return (
                  <button
                    key={pack.id}
                    type="button"
                    disabled={buyingPackId !== null}
                    onClick={() => onBuy(pack.id)}
                    className={`group relative overflow-hidden rounded-3xl p-4 text-left ring-1 transition-all duration-300 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${
                      isBest
                        ? "bg-gradient-to-r from-fuchsia-500/25 via-violet-500/25 to-purple-600/20 ring-fuchsia-400/35 shadow-[0_0_34px_rgba(217,70,239,.18)] hover:shadow-[0_0_42px_rgba(217,70,239,.28)]"
                        : "bg-white/[0.055] ring-white/10 hover:bg-white/[0.085]"
                    }`}
                  >
                    {isBest && (
                      <>
                        <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-purple-600/10" />
                        <span className="absolute inset-0 overflow-hidden rounded-3xl">
                          <span className="absolute -left-1/2 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/18 to-transparent animate-[shimmer_2.8s_linear_infinite]" />
                        </span>
                      </>
                    )}

                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black leading-none">{pack.name}</p>
                          {isBest && (
                            <span className="rounded-full bg-fuchsia-400/20 px-2.5 py-1 text-[10px] font-black text-fuchsia-100 ring-1 ring-fuchsia-300/25">
                              Best value
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white ring-1 ring-white/10">
                            <Coins size={12} />
                            {pack.totalCredits} credits
                          </span>

                          {pack.bonusCredits > 0 && (
                            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black text-emerald-100 ring-1 ring-emerald-300/20">
                              +{pack.bonusCredits} bonus
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-[11px] font-semibold text-white/42">
                          {unitPrice.toFixed(2)}€/credit{pack.note ? ` · ${pack.note}` : ""}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-black leading-none">
                          {buying ? "..." : formatCreditPrice(pack.priceCents, pack.currency)}
                        </p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                          Buy now
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
