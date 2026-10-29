import test from "node:test";
import assert from "node:assert/strict";
import { zipFiles } from "../src/lib/zipFiles.ts";

test("ZIP exports preserve numbered file order, UTF-8 names, bytes and central-directory offsets", async () => {
  const files = [
    { name: "recipe-01.png", blob: new Blob([new Uint8Array([0, 1, 255, 128])]) },
    { name: "画像-02.png", blob: new Blob(["123456789"]) },
    { name: "recipe-03.jpg", blob: new Blob([]) },
    { name: "recipe-04.jpg", blob: new Blob(["last image"]) },
  ];
  const zip = await zipFiles(files), bytes = new Uint8Array(await zip.arrayBuffer()), view = new DataView(bytes.buffer), decoder = new TextDecoder();
  assert.equal(zip.type, "application/zip");
  const end = bytes.length - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50);
  assert.equal(view.getUint16(end + 8, true), 4);
  assert.equal(view.getUint16(end + 10, true), 4);
  let central = view.getUint32(end + 16, true), local = 0;
  const directoryStart = central;
  for (let i = 0; i < files.length; i++) {
    const file = files[i], content = new Uint8Array(await file.blob.arrayBuffer());
    assert.equal(view.getUint32(central, true), 0x02014b50);
    assert.equal(view.getUint32(central + 42, true), local);
    assert.equal(view.getUint16(central + 8, true), 0x0800);
    assert.equal(view.getUint16(central + 10, true), 0);
    const centralNameLength = view.getUint16(central + 28, true);
    assert.equal(decoder.decode(bytes.subarray(central + 46, central + 46 + centralNameLength)), file.name);
    assert.equal(view.getUint32(local, true), 0x04034b50);
    assert.equal(view.getUint16(local + 6, true), 0x0800);
    assert.equal(view.getUint16(local + 8, true), 0);
    assert.equal(view.getUint32(local + 18, true), content.length);
    assert.equal(view.getUint32(local + 22, true), content.length);
    const localNameLength = view.getUint16(local + 26, true);
    assert.equal(localNameLength, centralNameLength);
    assert.equal(decoder.decode(bytes.subarray(local + 30, local + 30 + localNameLength)), file.name);
    const crc = view.getUint32(local + 14, true);
    assert.equal(crc, view.getUint32(central + 16, true));
    if (i === 1) assert.equal(crc, 0xcbf43926); // Standard CRC32 check vector.
    if (i === 2) assert.equal(crc, 0);
    const payload = local + 30 + localNameLength;
    assert.deepEqual(bytes.slice(payload, payload + content.length), content);
    local = payload + content.length;
    central += 46 + centralNameLength;
  }
  assert.equal(local, directoryStart);
  assert.equal(central, end);
  assert.equal(view.getUint32(end + 12, true), end - directoryStart);
});

test("ZIP refuses empty archives, duplicate or unsafe names, and oversized entry sets", async () => {
  const blob = new Blob(["image"]);
  for (const name of ["", " ", ".", "..", "../image.png", "folder/image.png", "folder\\image.png", "C:image.png", "bad\0.png", "bad\n.png"]) {
    await assert.rejects(zipFiles([{ name, blob }]), /Invalid ZIP filename/);
  }
  await assert.rejects(zipFiles([]), /count/);
  await assert.rejects(zipFiles(Array.from({ length: 101 }, (_, i) => ({ name: `${i}.png`, blob }))), /count/);
  await assert.rejects(zipFiles([{ name: "same.png", blob }, { name: "same.png", blob }]), /filename/);
  await assert.rejects(zipFiles([{ name: "large.png", blob: { size: 251 * 1024 * 1024 } }]), /size limit/);
});
