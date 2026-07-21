"use client";

import { memo, useMemo } from "react";
import ElementRenderer from "@/shared/rendering/ElementRenderer";
import { getElementBoxStyle } from "@/shared/rendering/elementBox";
import type { PreviewElement } from "./types/preview";
import { getRenderableElement } from "../element/renderAsset";

function PreviewCleanElement({ el }: { el: PreviewElement }) {
  const renderableElement = useMemo(() => getRenderableElement(el), [el]);
  const style = useMemo(
    () => getElementBoxStyle(el as any, { interactive: false, previewMode: true }),
    [el],
  );

  return (
    <div style={style}>
      <ElementRenderer el={renderableElement as any} editing={false} />
    </div>
  );
}

export default memo(PreviewCleanElement);
