import { useId, useRef } from "react";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { ChevronDown, ChevronUp, CircleHelp } from "lucide-react";
import type { Translation } from "../lib/i18n";
import "../mobile-bottom-sheet.css";

type MobileTab = "photo" | "label" | "export";

type MobileBottomSheetProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  tab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  t: Translation;
  children: ReactNode;
  onHelp: () => void;
};

export function MobileBottomSheet({
  collapsed,
  onCollapsedChange,
  tab,
  onTabChange,
  t,
  children,
  onHelp,
}: MobileBottomSheetProps) {
  const contentId = useId();
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const toggleLabel = collapsed ? t.sheetExpand : t.sheetCollapse;

  function startGesture(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    // A new press clears a stale flag if the previous swipe produced no click.
    suppressClick.current = false;
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishGesture(event: PointerEvent<HTMLButtonElement>) {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const dx = event.clientX - start.startX;
    const dy = event.clientY - start.startY;
    if (Math.abs(dy) >= 35 && Math.abs(dy) > Math.abs(dx)) {
      suppressClick.current = true;
      onCollapsedChange(dy > 0);
    }
  }

  function cancelGesture(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current?.pointerId === event.pointerId) {
      gesture.current = null;
      suppressClick.current = false;
    }
  }

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    // The synthetic click following a completed swipe must not toggle again.
    // Keyboard activation has detail 0 and remains available after any swipe.
    const ignoreClick = suppressClick.current && event.detail > 0;
    suppressClick.current = false;
    if (!ignoreClick) onCollapsedChange(!collapsed);
  }

  function selectTab(nextTab: MobileTab) {
    onTabChange(nextTab);
    onCollapsedChange(false);
  }

  return (
    <div
      className={`mobile-sheet${collapsed ? " mobile-sheet--collapsed" : ""}`}
    >
      <div className="mobile-sheet-header">
        <button
          type="button"
          className="mobile-sheet-toggle"
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          aria-controls={contentId}
          title={toggleLabel}
          onClick={toggle}
          onPointerDown={startGesture}
          onPointerUp={finishGesture}
          onPointerCancel={cancelGesture}
          onLostPointerCapture={cancelGesture}
        >
          <span className="sheet-grip" aria-hidden="true" />
          <span>{toggleLabel}</span>
          {collapsed ? (
            <ChevronUp size={17} aria-hidden="true" />
          ) : (
            <ChevronDown size={17} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="mobile-sheet-help"
          aria-label={t.tutorial}
          title={t.tutorial}
          onClick={onHelp}
        >
          <CircleHelp size={17} aria-hidden="true" />
          <span>{t.tutorial}</span>
        </button>
      </div>
      <nav className="mobile-tabs" aria-label={t.editor}>
        {(["photo", "label", "export"] as const).map((value, index) => (
          <button
            type="button"
            key={value}
            className={tab === value ? "active" : ""}
            aria-pressed={tab === value}
            aria-controls={contentId}
            onClick={() => selectTab(value)}
          >
            {[t.imageTab, t.editTab, t.exportTab][index]}
          </button>
        ))}
      </nav>
      <div id={contentId} className="mobile-sheet-content" hidden={collapsed}>
        {children}
      </div>
    </div>
  );
}
