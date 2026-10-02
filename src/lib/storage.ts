import type { ProjectData } from "../types/project";
let database: Promise<IDBDatabase> | undefined;
function db() {
  return (database ??= new Promise((resolve, reject) => {
    const req = indexedDB.open("desk-recipe", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("projects");
      req.result.createObjectStore("images");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}
async function get<T>(store: string, key: string): Promise<T | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = database.transaction(store).objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function put(store: string, key: string, value: unknown) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export const saveImage = (id: string, blob: Blob) => put("images", id, blob);
export const getImage = (id: string) => get<Blob>("images", id);
export const saveProject = (project: ProjectData) =>
  put("projects", "latest", project);
export const restoreProject = () => get<ProjectData>("projects", "latest");
