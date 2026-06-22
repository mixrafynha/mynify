"use client";
import { useEffect, useCallback } from "react";

interface UseKeyboardShortcutsProps {
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  onMove?: (dx: number, dy: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onDelete,
  onCopy,
  onPaste,
  onDuplicate,
  onSelectAll,
  onMove,
  onUndo,
  onRedo,
  onEscape,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Não atalhos quando em input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // DELETE
      if (e.key === "Delete" || e.key === "Del") {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // ESCAPE
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }

      // Ctrl/Cmd + C (Copy)
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        onCopy?.();
        return;
      }

      // Ctrl/Cmd + V (Paste)
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        onPaste?.();
        return;
      }

      // Ctrl/Cmd + D (Duplicate)
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        onDuplicate?.();
        return;
      }

      // Ctrl/Cmd + A (Select All)
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        onSelectAll?.();
        return;
      }

      // Ctrl/Cmd + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y (Redo)
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z") || 
          ((e.ctrlKey || e.metaKey) && e.key === "y")) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Arrow Keys (Move)
      const step = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onMove?.(-step, 0);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onMove?.(step, 0);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onMove?.(0, -step);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        onMove?.(0, step);
        return;
      }
    },
    [enabled, onDelete, onCopy, onPaste, onDuplicate, onSelectAll, onMove, onUndo, onRedo, onEscape]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}