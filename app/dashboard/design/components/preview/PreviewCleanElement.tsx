"use client";

import { memo, useMemo } from "react";
import ElementRenderer from "@/shared/rendering/ElementRenderer";
import { getElementBoxStyle } from "@/shared/rendering/elementBox";
import type { PreviewElement } from "./types/preview";

function PreviewCleanElement({ el }: { el: PreviewElement }) {
  const style = useMemo(
    () => getElementBoxStyle(el as any, { interactive: false, previewMode: true }),
    [el],
  );

  return (
    <div style={style}>
      <ElementRenderer el={el as any} editing={false} />
    </div>
  );
}

export default memo(PreviewCleanElement);
