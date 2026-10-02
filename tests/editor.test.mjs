import test from "node:test";
import {
  routeConnector,
  segmentHitsBox,
  avoidCircle,
} from "../src/lib/connectorRouting.ts";
import { loopGeometry } from "../src/lib/loopGeometry.ts";
import assert from "node:assert/strict";
import {
  anchorPoint,
  perimeterAnchor,
  automaticAnchor,
  arrowGeometry,
} from "../src/lib/arrowGeometry.ts";
import { exportDimensions, parseProject } from "../src/lib/project.ts";
import { parseClipboardLabel, serializeLabel } from "../src/lib/clipboard.ts";
const label = {
  id: "test",
  brand: "Brand",
  productName: "Keyboard",
  price: "¥19,800",
  showPrice: false,
  x: 100,
  y: 100,
  arrowTargetX: 500,
  arrowTargetY: 500,
  fontSizeBrand: 17,
  fontSizeProduct: 28,
  fontSizePrice: 17,
  fontFamily: "Quicksand",
  textColor: "#ffffff",
  arrowColor: "#ffffff",
  arrowWidth: 2,
  arrowType: "curve",
  align: "left",
  opacity: 1,
  boxWidth: 260,
  boxExtraHeight: 30,
  arrowAnchor: { edge: "left", t: 0.2 },
};
const project = {
  version: 1,
  photo: {
    id: "test",
    name: "desk.png",
    width: 5000,
    height: 2813,
    previewSrc: "data:image/png;base64,AA==",
  },
  canvas: { width: 1200, height: 675, aspectRatio: "16:9" },
  labels: [label],
  priceMode: "hide",
  priceFormat: "yen",
  adjustment: { brightness: 0, contrast: 0, overlay: 0 },
};
test("automatic connections use the nearest outside edge on every side", () => {
  const box = { x: 100, y: 100, width: 300, height: 100 };
  for (const [target, edge] of [
    [{ x: 250, y: 0 }, "top"],
    [{ x: 250, y: 350 }, "bottom"],
    [{ x: 0, y: 150 }, "left"],
    [{ x: 500, y: 150 }, "right"],
  ]) {
    const a = automaticAnchor(box, target);
    assert.equal(a.edge, edge);
    assert.equal(a.t, 0.5);
    const p = anchorPoint(box, a);
    assert.ok(p.x < 100 || p.x > 400 || p.y < 100 || p.y > 200);
  }
});
test("manual border connections retain the chosen side and fraction after resizing", () => {
  const a = perimeterAnchor(
    { x: 100, y: 100, width: 300, height: 100 },
    { x: 86, y: 180 },
  );
  assert.equal(a.edge, "left");
  const point = anchorPoint({ x: 100, y: 100, width: 600, height: 200 }, a);
  assert.equal(point.x, 86);
  assert.ok(point.y > 180);
  const g = arrowGeometry(
    { x: 100, y: 100, width: 600, height: 200 },
    { x: 0, y: 600 },
    "curve",
    a,
  );
  assert.deepEqual(g.points.slice(0, 2), [point.x, point.y]);
});
test("arrows are suppressed when their target is inside the text", () =>
  assert.equal(
    arrowGeometry(
      { x: 100, y: 100, width: 300, height: 100 },
      { x: 250, y: 150 },
      "curve",
    ),
    null,
  ));
test("export dimensions cover 1920 long side and native detail", () => {
  assert.deepEqual(exportDimensions(project, "standard"), {
    width: 1920,
    height: 1080,
    scale: 1.6,
  });
  assert.equal(exportDimensions(project, "original").width, 5000);
  const portrait = {
    ...project,
    canvas: { width: 1200, height: 2133, aspectRatio: "9:16" },
  };
  assert.equal(exportDimensions(portrait, "standard").height, 1920);
  assert.equal(exportDimensions(portrait, "standard").width, 1080);
});
test("project round trip keeps individual prices, manual anchors and font settings", () => {
  const parsed = parseProject(
    JSON.stringify({ project, image: "data:image/png;base64,AA==" }),
  );
  assert.deepEqual(parsed.project.labels[0], label);
  assert.equal(parsed.project.priceMode, "hide");
  for (const patch of [
    { boxWidth: NaN },
    { boxExtraHeight: 10000 },
    { fontFamily: "unknown" },
    { arrowAnchor: { edge: "left", t: 2 } },
    { x: Infinity },
  ])
    assert.throws(() =>
      parseProject(
        JSON.stringify({
          project: { ...project, labels: [{ ...label, ...patch }] },
          image: "data:image/png;base64,AA==",
        }),
      ),
    );
});
test("clipboard preserves label styling and rejects unrelated or malformed payloads", () => {
  assert.deepEqual(parseClipboardLabel(serializeLabel(label)), label);
  assert.equal(parseClipboardLabel("plain text"), null);
  assert.equal(parseClipboardLabel('DESK_RECIPE_LABEL\n{"brand":1}'), null);
  assert.equal(
    parseClipboardLabel(serializeLabel({ ...label, opacity: 30 })),
    null,
  );
});

test("loop uses connected cubic curves and an independent position", () => {
  const box = { x: 100, y: 100, width: 300, height: 100 },
    target = { x: 600, y: 600 },
    center = { x: 470, y: 320 };
  const g = loopGeometry(box, target, { edge: "right", t: 0.3 }, center);
  assert.deepEqual(g.center, center);
  assert.equal(g.segments.length, 6);
  const sized = loopGeometry(
    box,
    target,
    { edge: "right", t: 0.3 },
    center,
    80,
  );
  assert.equal(sized.radius, 80);
  assert.deepEqual(sized.center, center);
  assert.deepEqual(sized.segments[5].end, target);
  const entry = g.segments[0].end,
    end = g.segments[4].end;
  assert.ok(Math.hypot(entry.x - end.x, entry.y - end.y) < 1e-8);
  assert.deepEqual(g.segments[5].end, target);
  for (const part of g.segments.slice(1, 5))
    assert.ok(
      Math.abs(
        Math.hypot(part.end.x - center.x, part.end.y - center.y) - g.radius,
      ) < 1e-6,
    );
  const moved = loopGeometry(
    box,
    target,
    { edge: "right", t: 0.3 },
    { x: 520, y: 300 },
  );
  assert.ok(
    Math.abs(moved.segments[1].end.x - g.segments[1].end.x - 50) < 1e-8,
  );
  assert.ok(
    Math.abs(moved.segments[1].end.y - g.segments[1].end.y + 20) < 1e-8,
  );
});

test("connectors route around text instead of clipping pieces out of the stroke", () => {
  const obstacle = { x: 200, y: 50, width: 100, height: 100 },
    start = { x: 100, y: 100 },
    end = { x: 400, y: 100 },
    route = routeConnector(start, end, [obstacle]);
  assert.ok(route.length > 2);
  assert.deepEqual(route[0], start);
  assert.deepEqual(route.at(-1), end);
  for (let i = 1; i < route.length; i++)
    assert.equal(segmentHitsBox(route[i - 1], route[i], obstacle), false);
  const moved = avoidCircle({ x: 250, y: 120 }, 40, [obstacle]);
  const dx = Math.max(
      obstacle.x - moved.x,
      0,
      moved.x - (obstacle.x + obstacle.width),
    ),
    dy = Math.max(
      obstacle.y - moved.y,
      0,
      moved.y - (obstacle.y + obstacle.height),
    );
  assert.ok(Math.hypot(dx, dy) >= 40);
});
