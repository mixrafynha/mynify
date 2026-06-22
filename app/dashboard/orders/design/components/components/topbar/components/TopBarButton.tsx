"use client";

import { memo } from "react";
import { iconButtonClass } from "../constants";

interface TopBarButtonProps {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

function TopBarButton({ children, title, onClick, disabled, className = "" }: TopBarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${iconButtonClass} ${className}`}
    >
      <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <span className="relative flex items-center justify-center">{children}</span>
    </button>
  );
}

export default memo(TopBarButton);
