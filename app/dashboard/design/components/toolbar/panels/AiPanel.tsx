"use client";

import { Coins } from "lucide-react";
import AuthPopup from "./AuthPopup";
import AiPromptBox from "./AiPromptBox";
import UserGeneratedImages from "./UserGeneratedImages";
import CreditsModal from "./credits/CreditsModal";
import { useAiImages } from "./ai/useAiImages";
import { useCreditPacks } from "./credits/useCreditPacks";
import type { CanvasImageElementInput } from "./ai/ai.types";

export default function AiPanel({
  createElement,
}: {
  createElement?: (data: CanvasImageElementInput) => void;
}) {
  const ai = useAiImages({ createElement });

  const credits = useCreditPacks({
    source: "editor",
    onUnauthorized: () => ai.setShowAuthPopup(true),
    onNotice: ai.setNotice,
    onError: ai.setError,
  });

    const creditCount = Number(ai.credits ?? credits.balance?.credits ?? 0);
    const creditsAreLoading = ai.credits === null && credits.balanceLoading;
    const hasNoCredits = !creditsAreLoading && creditCount <= 0;

  return (
    <div className="relative min-h-[560px] space-y-3 pb-5 text-white">
    <div className="flex items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={() => ai.setShowCreditsModal(true)}
          className={`group relative min-w-0 flex-1 overflow-hidden rounded-full px-4 py-2 text-left text-[11px] font-black ring-1 shadow-lg transition-all duration-300 active:scale-[0.98] ${
            hasNoCredits
              ? "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-purple-600 text-white ring-fuchsia-400/50 shadow-[0_0_30px_rgba(217,70,239,.45)] hover:scale-[1.02]"
              : "bg-white/5 text-white/45 ring-white/10 hover:bg-white/10"
          }`}
        >
          {hasNoCredits && (
            <>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-purple-600 animate-pulse opacity-40" />

              <span className="absolute inset-0 overflow-hidden rounded-full">
                <span className="absolute -left-1/2 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2.2s_linear_infinite]" />
              </span>
            </>
          )}

          <span className="relative z-10">
            {hasNoCredits
              ? "✨ Unlock AI • Buy Credits"
              : "Create transparent print graphics with AI."}
          </span>
        </button>

        <button
          type="button"
          onClick={() => ai.setShowCreditsModal(true)}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black ring-1 transition active:scale-[0.98] ${
            hasNoCredits
              ? "bg-red-500/15 text-red-200 ring-red-400/25 hover:bg-red-500/25"
              : "bg-violet-500/15 text-violet-200 ring-violet-400/20 hover:bg-violet-500/25"
          }`}
        >
          <Coins size={16} />
          {creditsAreLoading ? "..." : creditCount}
        </button>
    </div>
      <div className="mt-5">
        <AiPromptBox
          prompt={ai.prompt}
          loading={ai.loading}
          notice={ai.loading ? "Creating transparent print asset..." : ai.notice}
          error={ai.error}
          setPrompt={ai.setPrompt}
          setNotice={ai.setNotice}
          setError={ai.setError}
          randomPrompt={ai.randomPrompt}
          generateImage={ai.generateImage}
        />
      </div>

      {ai.loading && (
        <div className="overflow-hidden rounded-3xl border border-violet-400/20 bg-violet-500/10 p-4">
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-violet-400" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200">
                Creating image
              </p>
              <p className="mt-1 text-xs font-semibold text-white/45">
                You can close this panel. The request keeps running.
              </p>
            </div>

            <div className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-white/10 border-t-violet-300" />
          </div>
        </div>
      )}

      <UserGeneratedImages
        images={(Array.isArray(ai.generatedImages) ? ai.generatedImages : []) as any}
        lastAddedSrc={ai.lastAddedSrc}
        limit={ai.savedLimit}
        savedCount={ai.savedCount}
        onAdd={ai.addImageToCanvas}
        onSave={ai.saveImage}
        onDelete={ai.deleteImage}
      />

      {(ai.savingId || ai.deletingId) && (
        <p className="px-1 text-[11px] font-bold text-white/35">
          Updating saved AI images...
        </p>
      )}
      <CreditsModal
        open={ai.showCreditsModal}
        packs={credits.packs}
        loading={credits.loading}
        buyingPackId={credits.buyingPackId}
        checkoutClientSecret={credits.checkoutClientSecret}
        checkoutMessage={credits.checkoutMessage}
        onClose={async () => {
          credits.resetCheckout();
          ai.setShowCreditsModal(false);
          await ai.refreshCredits();
        }}
        onBuy={credits.buyCredits}
        onCancelCheckout={credits.cancelCheckout}
        onCheckoutComplete={async () => {
          await credits.completeCheckout();
          await ai.refreshCredits();
        }}
      />

      <AuthPopup
        open={ai.showAuthPopup}
        variant={ai.authVariant ?? "ai_credits"}
        onClose={() => ai.setShowAuthPopup(false)}
        onSuccess={ai.handleAuthSuccess}
      />
    </div>
  );
}
