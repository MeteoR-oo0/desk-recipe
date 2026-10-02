import { useCallback, useEffect, useRef, useState } from "react";
import { initialProject, type ProjectData } from "../types/project";
import { useHistory } from "./useHistory";
import * as storage from "../lib/storage";
import { photoFromBlob, createPhotoProject } from "../lib/project";
export function useProjectState() {
  const testing =
    import.meta.env.DEV && new URLSearchParams(location.search).has("qa");
  const history = useHistory(initialProject()),
    assets = useRef(new Map<string, Blob>()),
    stored = useRef(new Set<string>()),
    queue = useRef(Promise.resolve()),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState<"saving" | "saved" | "error">("saving");
  useEffect(() => {
    if (testing) {
      setReady(true);
      return;
    }
    let active = true;
    (async () => {
      try {
        const p = await storage.restoreProject();
        if (p) {
          if (
            p.photo.id.startsWith("sample") &&
            p.photo.id !== "sample-user-photo"
          ) {
            const sample = initialProject();
            p.photo = sample.photo;
            p.canvas = sample.canvas;
            p.labels = p.labels.map((label) => {
              const template = sample.labels.find(
                (next) =>
                  next.id === label.id ||
                  (label.id === "laptop" && next.id === "speakers"),
              );
              if (!template) return label;
              const oldDefault = [
                "27” Monitor",
                "Laptop Stand",
                "Mechanical Keyboard",
              ].includes(label.productName);
              return {
                ...label,
                id: template.id,
                x: template.x,
                y: template.y,
                arrowTargetX: template.arrowTargetX,
                arrowTargetY: template.arrowTargetY,
                ...(oldDefault
                  ? { brand: template.brand, productName: template.productName }
                  : {}),
              };
            });
            for (const label of sample.labels)
              if (!p.labels.some((existing) => existing.id === label.id))
                p.labels.push(label);
          }
          for (const label of p.labels) label.fontFamily ??= "Zen Maru Gothic";
          const blob = await storage.getImage(p.photo.id);
          if (blob) {
            assets.current.set(p.photo.id, blob);
            stored.current.add(p.photo.id);
          }
          if (active) history.replace(p, true);
        }
      } catch {
        if (active) setStatus("error");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [history.replace]);
  const getOriginal = useCallback(async (id: string, source: string) => {
    const memory = assets.current.get(id);
    if (memory) return memory;
    const blob = await storage.getImage(id).catch(() => undefined);
    if (blob) {
      assets.current.set(id, blob);
      stored.current.add(id);
      return blob;
    }
    if (!id.startsWith("sample")) throw Error("Missing original");
    const response = await fetch(source);
    if (!response.ok) throw Error("Missing image");
    const fetched = await response.blob();
    assets.current.set(id, fetched);
    return fetched;
  }, []);
  useEffect(() => {
    if (testing) {
      setStatus("saved");
      return;
    }
    if (!ready) return;
    let active = true;
    setStatus("saving");
    const project = history.value;
    const timer = setTimeout(() => {
      queue.current = queue.current
        .catch(() => {})
        .then(async () => {
          try {
            if (!stored.current.has(project.photo.id)) {
              const blob = await getOriginal(
                project.photo.id,
                project.photo.previewSrc,
              );
              await storage.saveImage(project.photo.id, blob);
              stored.current.add(project.photo.id);
            }
            await storage.saveProject(project);
            if (active) setStatus("saved");
          } catch {
            if (active) setStatus("error");
          }
        });
    }, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [history.value, ready, getOriginal]);
  const setPhoto = useCallback(
    async (blob: Blob, name: string, project?: ProjectData) => {
      const photo = await photoFromBlob(blob, name);
      assets.current.set(photo.id, blob);
      history.update((current) => createPhotoProject(current, photo, project));
      return photo;
    },
    [history.update],
  );
  return { ...history, status, ready, getOriginal, setPhoto };
}
