import { useState, useMemo } from "react";
import { Circle, Group, Rect, Text, Line, Image as CanvasImage } from "react-konva";
import { ArrowConnector } from "./ArrowConnector";
import type { PriceMode, ProductLabel as Label } from "../types/project";
import { loopGeometry } from "../lib/loopGeometry";
import {
  anchorPoint,
  automaticAnchor,
  perimeterAnchor,
  type Box,
} from "../lib/arrowGeometry";
import { labelLayout, fontStack, formatPrice } from "../lib/labelLayout";
import { textEffects, frameSettings, rgba, frameObstacles, type AppearanceObstacle } from "../lib/labelAppearance";
import { glassBackdrop, roundedClip } from "../lib/glassBackdrop";
import { numberedBrand } from "../lib/labelOrder";
export function ProductLabel({
  label,
  selected,
  priceMode,
  priceFormat,
  onSelect,
  onChange,
  scale,
  bounds,
  obstacles,
  panMode,
  fontRevision,
  photoPixels,
  overlay = 0,
}: {
  label: Label;
  selected: boolean;
  priceMode: PriceMode;
  priceFormat: string;
  onSelect: () => void;
  onChange: (patch: Partial<Label>) => void;
  scale: number;
  bounds: { width: number; height: number };
  obstacles: AppearanceObstacle[];
  panMode: boolean;
  fontRevision: number;
  photoPixels?: HTMLImageElement | HTMLCanvasElement | null;
  overlay?: number;
}) {
  const [draft, setDraft] = useState<Partial<Label>>({}),
    display = { ...label, ...draft },
    show =
      priceMode === "show" || (priceMode === "individual" && label.showPrice),
    layout = labelLayout(
      { ...display, price: formatPrice(label.price, priceFormat) },
      show,
    ),
    numeric = label.price.replace(/[¥￥円,\s]/g, "");
  const price = /^\d+(\.\d+)?$/.test(numeric)
    ? (priceFormat === "yen" ? "¥" : "") +
      Number(numeric).toLocaleString("ja-JP") +
      (priceFormat === "suffix" ? "円" : "")
    : label.price;
  const box = {
      x: display.x,
      y: display.y,
      width: layout.width,
      height: layout.height,
      cornerRadius: label.frame && label.frame.style !== "none" ? label.frame.radius ?? 12 : 0,
    },
    start = anchorPoint(
      box,
      display.arrowAnchor ??
        automaticAnchor(box, {
          x: display.arrowTargetX,
          y: display.arrowTargetY,
        }),
    );
  const loop = loopGeometry(
    box,
    { x: display.arrowTargetX, y: display.arrowTargetY },
    display.arrowAnchor,
    display.loopPosition,
    display.loopRadius,
    frameObstacles(obstacles.map((b) =>
      b.id === label.id
        ? {
            ...b,
            x: display.x,
            y: display.y,
            width: layout.width,
            height: layout.height,
          }
        : b,
    ),label.id),
  );
  const resize = (point: { x: number; y: number }) => {
    const boxWidth = Math.round(
        Math.max(
          120,
          Math.min(
            800,
            bounds.width - display.x - 14,
            point.x - display.x - 14,
          ),
        ),
      ),
      natural = labelLayout(
        {
          ...display,
          boxWidth,
          boxExtraHeight: 0,
          price: formatPrice(label.price, priceFormat),
        },
        show,
      ).height;
    return {
      boxWidth,
      boxExtraHeight: Math.round(
        Math.max(0, Math.min(300, point.y - display.y - 14 - natural)),
      ),
    };
  };
  const effects = textEffects(label), frame = frameSettings(label);
  const frameWidth = layout.width + 28, frameHeight = layout.height + 28;
  const glass = useMemo(() => frame.style === "glass" && photoPixels
    ? glassBackdrop(photoPixels, bounds, overlay, display, layout.height) : null,
    [frame.style, frame.blur, photoPixels, bounds.width, bounds.height, overlay, display.x, display.y, layout.width, layout.height]);
  const textProps = {
    shadowEnabled: effects.shadowEnabled, shadowColor: effects.shadowColor,
    shadowBlur: effects.shadowBlur, shadowOpacity: effects.shadowOpacity,
    shadowOffsetX: effects.shadowOffsetX, shadowOffsetY: effects.shadowOffsetY,
    stroke: effects.outlineColor, strokeWidth: effects.outlineWidth,
    strokeEnabled: effects.outlineEnabled, fillAfterStrokeEnabled: true,
    shadowForStrokeEnabled: false, lineJoin: "round" as const,
  };
  const font = fontStack(label.fontFamily),
    bound = (x: number, y: number, target = false) => ({
      x: Math.max(0, Math.min(bounds.width - (target ? 0 : layout.width), x)),
      y: Math.max(0, Math.min(bounds.height - (target ? 0 : layout.height), y)),
    });
  return (
    <>
      <ArrowConnector
        label={display}
        onSelect={onSelect}
        scale={scale}
        height={layout.height}
        obstacles={obstacles.map((b) =>
          b.id === label.id
            ? {
                ...b,
                x: display.x,
                y: display.y,
                width: layout.width,
                height: layout.height,
              }
            : b,
        )}
      />
      <Group
        name="product-label"
        id={label.id}
        x={display.x}
        y={display.y}
        draggable={!panMode}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onDragStart={onSelect}
        onDragMove={(e) => {
          const p = bound(e.target.x(), e.target.y());
          e.target.position(p);
          setDraft({ x: p.x, y: p.y });
        }}
        onDragEnd={(e) => {
          const p = bound(e.target.x(), e.target.y());
          e.target.position(p);
          onChange({ x: p.x, y: p.y });
          setDraft({});
        }}
        opacity={label.opacity}
      >
        <Rect
          x={-12}
          y={-10}
          width={layout.width + 24}
          height={layout.height + 20}
          fill="rgba(0,0,0,0.001)"
        />
        {frame.style === "glass" && glass && <Group clipFunc={ctx=>roundedClip(ctx,frameWidth,frameHeight,frame.radius)}>
          <CanvasImage name="glass-backdrop" glassLabelId={label.id} image={glass} x={-14} y={-14} width={frameWidth} height={frameHeight}/>
        </Group>}
        {frame.style !== "none" && <Rect name="label-frame" x={-14} y={-14} width={frameWidth} height={frameHeight}
          cornerRadius={frame.radius} fill={frame.style === "outline" ? undefined : rgba(frame.fillColor,frame.opacity)}
          stroke={frame.borderColor} strokeWidth={frame.borderWidth} strokeEnabled={frame.borderWidth > 0}/ >}
        {selected && (
          <Rect
            name="editor-decoration"
            x={-14}
            y={-14}
            width={layout.width + 28}
            height={layout.height + 28}
            stroke="#b1f0d3"
            strokeWidth={1 / scale}
            dash={[5 / scale, 4 / scale]}
            cornerRadius={frame.style === "none" ? 6 : frame.radius}
            listening={false}
          />
        )}
        <Text
          key={`brand-${fontRevision}`}
          text={numberedBrand(label)}
          width={layout.width}
          lineHeight={1.2}
          fontSize={label.fontSizeBrand}
          fontFamily={font}
          fill={label.textColor}
          align={label.align}
          {...textProps}
          shadowOpacity={label.textEffects?.shadowOpacity ?? 0.35}
        />
        <Text
          key={`product-${fontRevision}`}
          y={layout.productY}
          text={label.productName}
          width={layout.width}
          lineHeight={1.2}
          fontSize={label.fontSizeProduct}
          fontStyle="bold"
          fontFamily={font}
          fill={label.textColor}
          align={label.align}
          {...textProps}
        />
        {show && (
          <Text
            key={`price-${fontRevision}`}
            y={layout.priceY}
            text={price}
            width={layout.width}
            lineHeight={1.2}
            fontSize={label.fontSizePrice}
            fontFamily={font}
            fill={label.textColor}
            align={label.align}
            {...textProps}
          />
        )}
      </Group>
      {selected && label.arrowType === "swirl" && (
        <Group
          name="editor-decoration"
          x={loop.center.x}
          y={loop.center.y}
          draggable={!panMode}
          onClick={(e) => {
            e.cancelBubble = true;
          }}
          onTap={(e) => {
            e.cancelBubble = true;
          }}
          onDragMove={(e) => {
            const p = bound(e.target.x(), e.target.y(), true);
            e.target.position(p);
            setDraft({ loopPosition: p });
          }}
          onDragEnd={(e) => {
            onChange({ loopPosition: bound(e.target.x(), e.target.y(), true) });
            setDraft({});
          }}
        >
          <Rect
            x={-5 / scale}
            y={-5 / scale}
            width={10 / scale}
            height={10 / scale}
            fill="#dcecff"
            stroke="#3476b6"
            strokeWidth={1.5 / scale}
            rotation={45}
            offsetX={0}
            offsetY={0}
            hitStrokeWidth={32 / scale}
          />
        </Group>
      )}
      {selected && (
        <Group
          name="editor-decoration"
          x={display.x + layout.width + 14}
          y={display.y + layout.height + 14}
          draggable={!panMode}
          onMouseEnter={(e) => {
            e.target.getStage()!.container().style.cursor = "nwse-resize";
          }}
          onMouseLeave={(e) => {
            e.target.getStage()!.container().style.cursor = "default";
          }}
          onClick={(e) => {
            e.cancelBubble = true;
          }}
          onTap={(e) => {
            e.cancelBubble = true;
          }}
          onDragMove={(e) => setDraft(resize(e.target.position()))}
          onDragEnd={(e) => {
            onChange(resize(e.target.position()));
            setDraft({});
          }}
        >
          <Rect
            x={-6 / scale}
            y={-6 / scale}
            width={12 / scale}
            height={12 / scale}
            fill="white"
            stroke="#377460"
            strokeWidth={1.5 / scale}
            hitStrokeWidth={26 / scale}
          />
          <Line
            points={[-2 / scale, 3 / scale, 3 / scale, -2 / scale]}
            stroke="#377460"
            strokeWidth={1 / scale}
            listening={false}
          />
        </Group>
      )}
      {selected && (
        <Rect
          name="editor-decoration"
          x={start.x - 4 / scale}
          y={start.y - 4 / scale}
          width={8 / scale}
          height={8 / scale}
          fill="#d5fbe6"
          stroke="#377460"
          strokeWidth={1.5 / scale}
          hitStrokeWidth={32 / scale}
          draggable={!panMode}
          onClick={(e) => {
            e.cancelBubble = true;
          }}
          onTap={(e) => {
            e.cancelBubble = true;
          }}
          onDragMove={(e) => {
            const anchor = perimeterAnchor(box, {
                x: e.target.x() + 4 / scale,
                y: e.target.y() + 4 / scale,
              }),
              p = anchorPoint(box, anchor);
            e.target.position({ x: p.x - 4 / scale, y: p.y - 4 / scale });
            setDraft({ arrowAnchor: anchor });
          }}
          onDragEnd={(e) => {
            const anchor = perimeterAnchor(box, {
              x: e.target.x() + 4 / scale,
              y: e.target.y() + 4 / scale,
            });
            onChange({ arrowAnchor: anchor });
            setDraft({});
          }}
        />
      )}
      {selected && (
        <Circle
          name="editor-decoration"
          x={display.arrowTargetX}
          y={display.arrowTargetY}
          radius={label.arrowEnd === "open-circle" || label.arrowEnd === "filled-circle" ? (label.arrowEndSize??12)/2 + (label.arrowEffects?.outlineEnabled ? label.arrowEffects.outlineWidth ?? 1 : 0) + 4 / scale : 4 / scale}
          fill={label.arrowEnd === "open-circle" || label.arrowEnd === "filled-circle" ? "rgba(255,255,255,0)" : "#fff"}
          stroke="#377460"
          strokeWidth={2 / scale}
          hitStrokeWidth={38 / scale}
          draggable={!panMode}
          onClick={(e) => {
            e.cancelBubble = true;
          }}
          onTap={(e) => {
            e.cancelBubble = true;
          }}
          onDragMove={(e) => {
            const p = bound(e.target.x(), e.target.y(), true);
            e.target.position(p);
            setDraft({ arrowTargetX: p.x, arrowTargetY: p.y });
          }}
          onDragEnd={(e) => {
            const p = bound(e.target.x(), e.target.y(), true);
            e.target.position(p);
            onChange({ arrowTargetX: p.x, arrowTargetY: p.y });
            setDraft({});
          }}
        />
      )}
    </>
  );
}
