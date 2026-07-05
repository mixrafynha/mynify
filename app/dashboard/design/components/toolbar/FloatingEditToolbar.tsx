"use client";

import { memo } from "react";
import DesktopFloatingEditToolbar from "./DesktopFloatingEditToolbar";
import MobileFloatingEditToolbar from "./MobileFloatingEditToolbar";
import type { FloatingEditToolbarProps } from "./FloatingEditToolbarShared";

function FloatingEditToolbar(props: FloatingEditToolbarProps) {
  if (!props.selectedElements.length) return null;

  return (
    <>
      <DesktopFloatingEditToolbar {...props} />
      <MobileFloatingEditToolbar {...props} />
    </>
  );
}

export default memo(FloatingEditToolbar);
