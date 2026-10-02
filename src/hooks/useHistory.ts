import { useCallback, useRef, useState } from "react";
export function useHistory<T>(initial: T) {
  const [value, setValue] = useState(initial),
    current = useRef(initial),
    past = useRef<T[]>([]),
    future = useRef<T[]>([]),
    group = useRef<string | null>(null);
  const replace = useCallback((next: T, reset = false) => {
    current.current = next;
    setValue(next);
    group.current = null;
    if (reset) {
      past.current = [];
      future.current = [];
    }
  }, []);
  const update = useCallback((fn: (v: T) => T, key?: string) => {
    const next = fn(current.current);
    if (next === current.current) return;
    if (!key || group.current !== key) {
      past.current.push(current.current);
      if (past.current.length > 80) past.current.shift();
    }
    future.current = [];
    group.current = key ?? null;
    current.current = next;
    setValue(next);
  }, []);
  const endGroup = useCallback(() => {
    group.current = null;
  }, []);
  const undo = useCallback(() => {
    const next = past.current.pop();
    if (next) {
      future.current.push(current.current);
      replace(next);
    }
  }, [replace]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next) {
      past.current.push(current.current);
      replace(next);
    }
  }, [replace]);
  return {
    value,
    update,
    replace,
    endGroup,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
