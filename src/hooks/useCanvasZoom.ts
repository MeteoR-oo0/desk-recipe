import { useRef, type TouchEvent } from "react";
type Point = { x: number; y: number };
export function useCanvasZoom({
  zoom,
  pan,
  scale,
  size,
  canvas,
  onZoom,
  onPan,
  stopDrag,
  getViewport,
}: {
  zoom: number;
  pan: Point;
  scale: number;
  size: { width: number; height: number };
  canvas: { width: number; height: number };
  onZoom: (v: number) => void;
  onPan: (v: Point) => void;
  stopDrag: () => void;
  getViewport: () => { x: number; y: number; scale: number };
}) {
  const gesture = useRef<{
      distance: number;
      zoom: number;
      anchor: Point;
    } | null>(null),
    suppressed = useRef(false);
  const center = (e: TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect(),
      a = e.touches[0],
      b = e.touches[1];
    return {
      point: {
        x: (a.clientX + b.clientX) / 2 - rect.left,
        y: (a.clientY + b.clientY) / 2 - rect.top,
      },
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    };
  };
  const start = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && !gesture.current) suppressed.current = false;
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const view = getViewport();
      stopDrag();
      suppressed.current = true;
      const c = center(e);
      gesture.current = {
        distance: c.distance,
        zoom,
        anchor: {
          x: (c.point.x - view.x) / view.scale,
          y: (c.point.y - view.y) / view.scale,
        },
      };
    }
  };
  const move = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && gesture.current) {
      e.preventDefault();
      e.stopPropagation();
      const c = center(e),
        g = gesture.current,
        next = Math.min(
          6,
          Math.max(0.5, (g.zoom * c.distance) / Math.max(g.distance, 1)),
        ),
        s = (scale / zoom) * next;
      onZoom(next);
      onPan({
        x: c.point.x - g.anchor.x * s - (size.width - canvas.width * s) / 2,
        y: c.point.y - g.anchor.y * s - (size.height - canvas.height * s) / 2,
      });
    } else if (suppressed.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const end = (e: TouchEvent<HTMLDivElement>) => {
    if (suppressed.current) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (e.touches.length < 2) gesture.current = null;
  };
  return {
    onTouchStartCapture: start,
    onTouchMoveCapture: move,
    onTouchEndCapture: end,
    onTouchCancelCapture: end,
    suppressed,
  };
}
