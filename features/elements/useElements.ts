import { useCallback } from "react";

type Props = {
  setElements: any;
  selectedId: string | null;
};

export function useElements({ setElements, selectedId }: Props) {
  const addText = useCallback(() => {
    setElements((prev: any) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "text",
        text: "Edit me",
        x: 120,
        y: 120,
        meta: {
          fontSize: 24,
          fontFamily: "Arial",
          color: "#111",
        },
      },
    ]);
  }, [setElements]);

  const addElement = useCallback(
    (el: any) => {
      setElements((prev: any) => [
        ...prev,
        { ...el, id: crypto.randomUUID() },
      ]);
    },
    [setElements]
  );

  const updateSelected = useCallback(
    (patch: any) => {
      if (!selectedId) return;

      setElements((prev: any) =>
        prev.map((el: any) =>
          el.id === selectedId
            ? {
                ...el,
                ...patch,
                meta: {
                  ...(el.meta ?? {}),
                  ...(patch.meta ?? {}),
                },
              }
            : el
        )
      );
    },
    [setElements, selectedId]
  );

  return {
    addText,
    addElement,
    updateSelected,
  };
}