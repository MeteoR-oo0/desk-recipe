export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const isSupportedImage = (file: Pick<Blob, "type">) => IMAGE_TYPES.some(type => type === file.type);

// Files are accepted directly; text URLs and HTML never trigger a remote fetch.
export function imageFromTransfer(data: Pick<DataTransfer, "files" | "items"> | null): File | null {
  if (!data) return null;
  const file = Array.from(data.files ?? []).find(isSupportedImage);
  if (file) return file;
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== "file" || !isSupportedImage(item)) continue;
    const image = item.getAsFile();
    if (image) return image;
  }
  return null;
}
export const transferHasFiles = (data: Pick<DataTransfer, "types" | "items"> | null) => !!data &&
  (Array.from(data.types ?? []).includes("Files") || Array.from(data.items ?? []).some(item => item.kind === "file"));

export async function readClipboardImage(read: () => Promise<readonly Pick<ClipboardItem,"types"|"getType">[]> = () => navigator.clipboard.read()): Promise<File | null> {
  const items = await read();
  for (const item of items) {
    const type = IMAGE_TYPES.find(type => item.types.includes(type));
    if (type) {
      const blob = await item.getType(type);
      return new File([blob], `clipboard-image.${type === "image/jpeg" ? "jpg" : type.split("/")[1]}`, { type });
    }
  }
  return null;
}
