export type ZipFile = { name: string; blob: Blob };

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const header = (size: number) => {
  const bytes = new Uint8Array(size);
  return { bytes, view: new DataView(bytes.buffer) };
};

/** ZIP store mode keeps already-compressed PNG/JPEG files unchanged. */
export async function zipFiles(files: readonly ZipFile[]): Promise<Blob> {
  if (!files.length || files.length > 100) throw Error("Invalid ZIP file count");
  const names = new Set<string>(), encoder = new TextEncoder();
  const entries = files.map(file => {
    if (typeof file.name !== "string" || !file.name.trim() || file.name === "." || file.name === ".." || /[\\/:<>"|?*\x00-\x1f\x7f]/.test(file.name) || names.has(file.name)) throw Error("Invalid ZIP filename");
    names.add(file.name);
    const name = encoder.encode(file.name);
    if (name.length > 65535 || !Number.isSafeInteger(file.blob.size) || file.blob.size < 0) throw Error("Invalid ZIP entry");
    return { ...file, name };
  });
  const totalSize = entries.reduce((sum, file) => sum + file.blob.size + 76 + 2 * file.name.length, 22);
  // The export UI only needs four images. Bound memory and stay well inside ZIP32.
  if (totalSize > 250 * 1024 * 1024) throw Error("ZIP exceeds size limit");
  const parts: BlobPart[] = [], directory: BlobPart[] = [];
  let offset = 0, directorySize = 0;
  for (const file of entries) {
    const bytes = new Uint8Array(await file.blob.arrayBuffer()), crc = crc32(bytes);
    const local = header(30), central = header(46);
    local.view.setUint32(0, 0x04034b50, true);
    local.view.setUint16(4, 20, true); // Version needed: ZIP 2.0.
    local.view.setUint16(6, 0x0800, true); // UTF-8 names, no data descriptor.
    local.view.setUint16(12, 0x0021, true); // DOS date: 1980-01-01.
    local.view.setUint32(14, crc, true);
    local.view.setUint32(18, bytes.length, true);
    local.view.setUint32(22, bytes.length, true);
    local.view.setUint16(26, file.name.length, true);
    central.view.setUint32(0, 0x02014b50, true);
    central.view.setUint16(4, 20, true);
    central.view.setUint16(6, 20, true);
    central.view.setUint16(8, 0x0800, true);
    central.view.setUint16(14, 0x0021, true);
    central.view.setUint32(16, crc, true);
    central.view.setUint32(20, bytes.length, true);
    central.view.setUint32(24, bytes.length, true);
    central.view.setUint16(28, file.name.length, true);
    central.view.setUint32(42, offset, true);
    parts.push(local.bytes.buffer, file.name.slice().buffer, bytes.buffer);
    directory.push(central.bytes.buffer, file.name.slice().buffer);
    offset += 30 + file.name.length + bytes.length;
    directorySize += 46 + file.name.length;
  }
  const end = header(22);
  end.view.setUint32(0, 0x06054b50, true);
  end.view.setUint16(8, entries.length, true);
  end.view.setUint16(10, entries.length, true);
  end.view.setUint32(12, directorySize, true);
  end.view.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end.bytes.buffer], { type: "application/zip" });
}
