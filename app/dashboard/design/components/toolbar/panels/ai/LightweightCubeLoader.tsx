"use client";

import { memo } from "react";

function LightweightCubeLoader({ status }: { status: string }) {
  const title = status === "finalizing" ? "Preparing your image" : "Creating your image";

  return (
    <div className="ai-loader-shell">
      <div className="ai-loader-cube" aria-hidden="true">
        <span className="ai-loader-face ai-loader-face-front" />
        <span className="ai-loader-face ai-loader-face-back" />
        <span className="ai-loader-face ai-loader-face-left" />
        <span className="ai-loader-face ai-loader-face-right" />
        <span className="ai-loader-face ai-loader-face-top" />
        <span className="ai-loader-face ai-loader-face-bottom" />
        <span className="ai-loader-hint ai-loader-hint-one" />
        <span className="ai-loader-hint ai-loader-hint-two" />
      </div>

      <div className="mt-5 text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/85">
          {title}
          <span className="ai-loader-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </p>
        <p className="mt-1 text-[11px] font-medium text-white/42">This can take a moment</p>
      </div>

      <style jsx>{`
        .ai-loader-shell {
          display: flex;
          min-height: 172px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.1), transparent 34%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
          padding: 1.25rem 1rem;
        }

        .ai-loader-cube {
          position: relative;
          width: 52px;
          height: 52px;
          transform-style: preserve-3d;
          animation: cube-spin 2.8s linear infinite;
          will-change: transform;
        }

        .ai-loader-face,
        .ai-loader-hint {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.54);
          background: transparent;
          opacity: 0.82;
          backface-visibility: hidden;
        }

        .ai-loader-face-front {
          transform: translateZ(26px);
        }

        .ai-loader-face-back {
          transform: rotateY(180deg) translateZ(26px);
        }

        .ai-loader-face-left {
          transform: rotateY(-90deg) translateZ(26px);
        }

        .ai-loader-face-right {
          transform: rotateY(90deg) translateZ(26px);
        }

        .ai-loader-face-top {
          transform: rotateX(90deg) translateZ(26px);
        }

        .ai-loader-face-bottom {
          transform: rotateX(-90deg) translateZ(26px);
        }

        .ai-loader-hint {
          border-color: rgba(168, 85, 247, 0.22);
          opacity: 0.35;
        }

        .ai-loader-hint-one {
          transform: translate3d(12px, -10px, 0) scale(0.24);
          animation: hint-float 2.4s ease-in-out infinite;
        }

        .ai-loader-hint-two {
          transform: translate3d(-16px, 12px, 0) scale(0.18);
          animation: hint-float 2.9s ease-in-out infinite reverse;
        }

        .ai-loader-dots {
          display: inline-flex;
          gap: 3px;
          margin-left: 4px;
          vertical-align: middle;
        }

        .ai-loader-dots span {
          display: inline-block;
          width: 3px;
          height: 3px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.76);
          animation: dot-fade 1.2s ease-in-out infinite;
        }

        .ai-loader-dots span:nth-child(2) {
          animation-delay: 0.14s;
        }

        .ai-loader-dots span:nth-child(3) {
          animation-delay: 0.28s;
        }

        @keyframes cube-spin {
          0% {
            transform: rotateX(-18deg) rotateY(0deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(-18deg) rotateY(360deg) rotateZ(0deg);
          }
        }

        @keyframes hint-float {
          0%,
          100% {
            opacity: 0.18;
            transform: translate3d(12px, -10px, 0) scale(0.22);
          }
          50% {
            opacity: 0.42;
            transform: translate3d(16px, -14px, 0) scale(0.28);
          }
        }

        @keyframes dot-fade {
          0%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-1px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-loader-cube,
          .ai-loader-hint-one,
          .ai-loader-hint-two,
          .ai-loader-dots span {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(LightweightCubeLoader);
