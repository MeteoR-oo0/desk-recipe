import { useEffect, useRef, useState, type PointerEvent } from "react";
import { reorderDestination } from "../lib/labelOrder";

type DragPreview = { id: string; targetId: string | null; edge: "before" | "after"; destination: number };
type Gesture = { pointer: number; id: string; from: number; destination: number; startY: number; moved: boolean; root: HTMLElement; button: HTMLButtonElement };
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
    const from = labels.findIndex(label => label.id === id);
    if (!root || from < 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { pointer: event.pointerId, id, from, destination: from, startY: event.clientY, moved: false, root, button: event.currentTarget };
    setDrag({ id, targetId: null, edge: "before", destination: from });
  };
  const preview = (event: PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current;
    if (!active || event.pointerId !== active.pointer) return;
    if (Math.abs(event.clientY - active.startY) > 8) active.moved = true;
    if (!active.moved) return;
    const rows = Array.from(active.root.querySelectorAll<HTMLElement>("[data-label-id]"));
    if (!rows.length) return;
    const row = rows.find(item => event.clientY < item.getBoundingClientRect().bottom) ?? rows[rows.length - 1];
    const bounds = row.getBoundingClientRect();
    const after = event.clientY >= bounds.top + bounds.height / 2;
    const index = labels.findIndex(label => label.id === row.dataset.labelId);
    if (index < 0) return;
    const destination = reorderDestination(active.from, index, after);
    active.destination = destination;
    const next: DragPreview = { id: active.id, targetId: destination === active.from ? null : row.dataset.labelId!, edge: after ? "after" : "before", destination };
    setDrag(previous => previous?.targetId === next.targetId && previous?.edge === next.edge && previous?.destination === next.destination ? previous : next);
  };
  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current;
    if (!active || event.pointerId !== active.pointer) return;
    if (active.moved) onMove(active.id, active.destination);
    cancel();
  };
  const rowClass = (id: string) => (drag?.id === id ? " reorder-grabbed" : "") + (drag?.targetId === id ? ` reorder-insert-${drag.edge}` : "");
  return { drag, start, preview, finish, cancel, rowClass };
}
