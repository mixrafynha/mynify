"use client";

import { useCallback, useMemo } from "react";

export function useElementSelection({
  el,
  selectedIds = [],
  setSelectedIds,
  setSelectedId,
  setSelectedElement,
}: any) {
  const selectedIdSet = useMemo(
    () => new Set(Array.isArray(selectedIds) ? selectedIds : []),
    [selectedIds]
  );

  const select = useCallback(
    (multi = false) => {
      if (!setSelectedIds) return;

      if (multi) {
        setSelectedIds((prev: string[]) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.includes(el.id)
            ? list.filter((id) => id !== el.id)
            : [...list, el.id];
        });
      } else {
        setSelectedIds([el.id]);
        setSelectedId?.(el.id);
      }

      setSelectedElement?.(el);
    },
    [el, setSelectedElement, setSelectedId, setSelectedIds]
  );

  return {
    selectedIdSet,
    select,
  };
}
