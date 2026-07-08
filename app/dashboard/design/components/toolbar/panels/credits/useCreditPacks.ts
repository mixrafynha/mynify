"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createAiCreditsEmbeddedCheckout, fetchAiCredits, fetchCreditPacks } from "./credits.api";
import type { CheckoutSource, CreditPack, CreditsBalance } from "./credits.types";

export function getPricePerCredit(pack: Pick<CreditPack, "priceCents" | "totalCredits">) {
  return pack.totalCredits > 0 ? pack.priceCents / 100 / pack.totalCredits : 0;
}

export function formatCreditPrice(cents: number, currency = "EUR") {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency });
}

type UseCreditPacksArgs = {
  source: CheckoutSource;
  onUnauthorized?: () => void;
  onNotice?: (message: string) => void;
  onError?: (message: string) => void;
};

export function useCreditPacks({ source, onUnauthorized, onNotice, onError }: UseCreditPacksArgs) {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [balance, setBalance] = useState<CreditsBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string>("");

  const loadPacks = useCallback(async () => {
    try {
      setLoading(true);
      setPacks(await fetchCreditPacks());
    } catch {
      setPacks([]);
      onError?.("Could not load credit packs.");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const loadBalance = useCallback(async () => {
    try {
      setBalanceLoading(true);
      setBalance(await fetchAiCredits());
    } catch {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPacks();
    void loadBalance();
  }, [loadPacks, loadBalance]);

  const buyCredits = useCallback(
    async (packId: string) => {
      try {
        setBuyingPackId(packId);
        setCheckoutMessage("");
        setCheckoutClientSecret(null);
        setCheckoutSessionId(null);
        onNotice?.("Preparing secure checkout...");

        const { response, data } = await createAiCreditsEmbeddedCheckout(packId, source);

        if (response.status === 401) {
          onUnauthorized?.();
          return;
        }

        if (!response.ok || !data.clientSecret) {
          throw new Error(data.error || "Could not create checkout session");
        }

        setCheckoutClientSecret(data.clientSecret);
        setCheckoutSessionId(data.sessionId || null);
        onNotice?.("Checkout ready.");
      } catch {
        onError?.("Could not open credits checkout.");
      } finally {
        setBuyingPackId(null);
      }
    },
    [onError, onNotice, onUnauthorized, source],
  );

  const cancelCheckout = useCallback(() => {
    setCheckoutClientSecret(null);
    setCheckoutSessionId(null);
    setCheckoutMessage("Payment was cancelled. No credits were added.");
    onNotice?.("Payment was cancelled. No credits were added.");
  }, [onNotice]);

  const resetCheckout = useCallback(() => {
    setCheckoutClientSecret(null);
    setCheckoutSessionId(null);
    setCheckoutMessage("");
  }, []);

 const completeCheckout = useCallback(async () => {
  setCheckoutClientSecret(null);
  setCheckoutSessionId(null);
  setCheckoutMessage("Payment complete. Updating credits...");
  onNotice?.("Payment complete. Updating credits...");

  // Espera o webhook atualizar o saldo
  for (let i = 0; i < 10; i++) {
    await loadBalance();

    const latest = await fetchAiCredits();

    if (
      latest &&
      balance &&
      Number(latest.credits) > Number(balance.credits)
    ) {
      setBalance(latest);
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}, [balance, loadBalance, onNotice]);

  return useMemo(
    () => ({
      packs,
      balance,
      loading,
      balanceLoading,
      buyingPackId,
      checkoutClientSecret,
      checkoutSessionId,
      checkoutMessage,
      loadPacks,
      loadBalance,
      buyCredits,
      cancelCheckout,
      resetCheckout,
      completeCheckout,
    }),
    [
      packs,
      balance,
      loading,
      balanceLoading,
      buyingPackId,
      checkoutClientSecret,
      checkoutSessionId,
      checkoutMessage,
      loadPacks,
      loadBalance,
      buyCredits,
      cancelCheckout,
      resetCheckout,
      completeCheckout,
    ],
  );
}
