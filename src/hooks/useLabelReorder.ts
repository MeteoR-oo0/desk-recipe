import { useEffect, useRef, useState, type PointerEvent } from "react";
import { reorderDestination } from "../lib/labelOrder";

type DragPreview = {
  id: string; targetId: string | null; edge: "before" | "after"; destination: number;
  bounds: { left: number; top: number; width: number; height: number };
  offsetX: number; offsetY: number; columns: number[];
};
type Gesture = {
  pointer: number; id: string; from: number; destination: number;
  startX: number; startY: number; moved: boolean; root: HTMLElement; button: HTMLButtonElement;
  initial: DragPreview;
};
export type LabelReorder = ReturnType<typeof useLabelReorder>;

export function useLabelReorder(labels: readonly { id: string }[], onMove: (id: string, to: number) => void) {
  const gesture = useRef<Gesture | null>(null);
  const [drag, setDrag] = useState<DragPreview | null>(null);
  const cancel = () => {
    const active = gesture.current;
    gesture.current = null;
    setDrag(null);
    if (active?.button.hasPointerCapture(active.pointer)) active.button.releasePointerCapture(active.pointer);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && gesture.current) { event.preventDefault(); event.stopImmediatePropagation(); cancel(); }
    };
    document.addEventListener("keydown", escape, true);
    window.addEventListener("blur", cancel);
    return () => { document.removeEventListener("keydown", escape, true); window.removeEventListener("blur", cancel); };
  }, []);
  const start = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (!event.isPrimary || event.button !== 0) return;
    const root = event.currentTarget.closest<HTMLElement>("[data-reorder-list]");
    const source = event.currentTarget.closest<HTMLElement>("[data-label-id]");
    const from = labels.findIndex(label => label.id === id);
    if (!root || !source || from < 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = source.getBoundingClientRect();
    const initial: DragPreview = {
      id, targetId: null, edge: "before", destination: from,
      bounds: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      offsetX: 0, offsetY: 0,
      columns: Array.from(source.querySelectorAll("td")).map(cell => cell.getBoundingClientRect().width),
    };
    gesture.current = { pointer: event.pointerId, id, from, destination: from, startX: event.clientX, startY: event.clientY, moved: false, root, button: event.currentTarget, initial };
    setDrag(initial);
  };
  const preview = (event: PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current;
    if (!active || event.pointerId !== active.pointer) return;
    const offsetX = event.clientX - active.startX, offsetY = event.clientY - active.startY;
    if (Math.hypot(offsetX, offsetY) > 8) active.moved = true;
    const next: DragPreview = { ...active.initial, offsetX, offsetY };
    if (!active.moved) { setDrag(next); return; }
    const rows = Array.from(active.root.querySelectorAll<HTMLElement>("[data-label-id]"));
    if (!rows.length) return;
    const row = rows.find(item => event.clientY < item.getBoundingClientRect().bottom) ?? rows[rows.length - 1];
    const bounds = row.getBoundingClientRect();
    const after = event.clientY >= bounds.top + bounds.height / 2;
    const index = labels.findIndex(label => label.id === row.dataset.labelId);
    if (index < 0) return;
    const destination = reorderDestination(active.from, index, after);
    active.destination = destination;
    next.targetId = destination === active.from ? null : row.dataset.labelId!;
    next.edge = after ? "after" : "before";
    next.destination = destination;
    setDrag(next);
  };
  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current;
    if (!active || event.pointerId !== active.pointer) return;
    if (active.moved) onMove(active.id, active.destination);
    cancel();
  };
  const rowClass = (id: string) => (drag?.id === id ? " reorder-source" : "") + (drag?.targetId === id ? ` reorder-insert-${drag.edge}` : "");
  return { drag, start, preview, finish, cancel, rowClass };
}
