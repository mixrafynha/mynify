import { useRef, useEffect } from "react";

export function useDrag(elements: any[], setElements: any, setSelectedId: any) {
  const draggingId = useRef<string | null>(null);
  const offset = useRef({ x: 0, y: 0 });

  const startDrag = (e: any, id: string) => {
    draggingId.current = id;
    setSelectedId(id);
    offset.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingId.current) return;

      const dx = e.clientX - offset.current.x;
      const dy = e.clientY - offset.current.y;

      offset.current = { x: e.clientX, y: e.clientY };

      setElements((prev: any) =>
        prev.map((el: any) =>
          el.id === draggingId.current
            ? { ...el, x: el.x + dx, y: el.y + dy }
            : el
        )
      );
    };

    const up = () => (draggingId.current = null);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [setElements]);

  return { startDrag };
}