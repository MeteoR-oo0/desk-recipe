import { Arrow, Group, Shape } from "react-konva";
import type { ProductLabel } from "../types/project";
import { arrowGeometry, type Box } from "../lib/arrowGeometry";
import {
  cubicHitsBoxes,
  segmentHitsBox,
  routeConnector,
  drawRoundedRoute,
} from "../lib/connectorRouting";
import { loopGeometry } from "../lib/loopGeometry";
import { frameObstacles, type AppearanceObstacle } from "../lib/labelAppearance";
export function ArrowConnector({
  label,
  height,
  obstacles: rawObstacles,
  onSelect,
  scale,
}: {
  label: ProductLabel;
  height: number;
  obstacles: AppearanceObstacle[];
  onSelect: () => void;
  scale: number;
}) {
  const obstacles = frameObstacles(rawObstacles,label.id);
  const box = { x: label.x, y: label.y, width: label.boxWidth ?? 330, height, cornerRadius: label.frame && label.frame.style !== "none" ? label.frame.radius ?? 12 : 0 },
    target = { x: label.arrowTargetX, y: label.arrowTargetY };
  const geometry = arrowGeometry(
    box,
    target,
    label.arrowType,
    label.arrowAnchor,
  );
  if (!geometry) return null;
  const click = (e: any) => {
      e.cancelBubble = true;
      onSelect();
    },
    props = {
      stroke: label.arrowColor,
      fill: label.arrowColor,
      strokeWidth: label.arrowWidth,
      hitStrokeWidth: 22 / scale,
      opacity: label.opacity,
      onClick: click,
      onTap: click,
      lineCap: "round" as const,
      lineJoin: "round" as const,
    };
  const loop = loopGeometry(
    box,
    target,
    label.arrowAnchor,
    label.loopPosition,
    label.loopRadius,
    obstacles,
  );
  return (
    <Group>
      {label.arrowType === "swirl" ? (
        <Shape
          {...props}
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            ctx.moveTo(loop.start.x, loop.start.y);
            for (let index = 0; index < loop.segments.length; index++) {
              const segment = loop.segments[index],
                from = index === 0 ? loop.start : loop.segments[index - 1].end;
              if (
                (index === 0 || index === loop.segments.length - 1) &&
                cubicHitsBoxes(from, segment, obstacles)
              ) {
                drawRoundedRoute(
                  ctx,
                  routeConnector(from, segment.end, obstacles),
                );
                continue;
              }
              ctx.bezierCurveTo(
                segment.c1.x,
                segment.c1.y,
                segment.c2.x,
                segment.c2.y,
                segment.end.x,
                segment.end.y,
              );
            }
            ctx.strokeShape(shape);
            ctx.save();
            ctx.translate(target.x, target.y);
            ctx.rotate(loop.angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, -4);
            ctx.lineTo(-10, 4);
            ctx.closePath();
            ctx.fillStrokeShape(shape);
            ctx.restore();
          }}
        />
      ) : obstacles.some((box) =>
          geometry.points.some(
            (_, index) =>
              index % 2 === 0 &&
              index + 3 < geometry.points.length &&
              segmentHitsBox(
                { x: geometry.points[index], y: geometry.points[index + 1] },
                {
                  x: geometry.points[index + 2],
                  y: geometry.points[index + 3],
                },
                box,
              ),
          ),
        ) ? (
        <Shape
          {...props}
          sceneFunc={(ctx, shape) => {
            const start = { x: geometry.points[0], y: geometry.points[1] },
              path = routeConnector(start, target, obstacles),
              prev = path[path.length - 2],
              angle = Math.atan2(target.y - prev.y, target.x - prev.x);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            drawRoundedRoute(ctx, path, label.arrowType !== "line");
            ctx.strokeShape(shape);
            ctx.save();
            ctx.translate(target.x, target.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, -4);
            ctx.lineTo(-10, 4);
            ctx.closePath();
            ctx.fillStrokeShape(shape);
            ctx.restore();
          }}
        />
      ) : (
        <Arrow
          {...props}
          points={geometry.points}
          tension={geometry.tension}
          pointerLength={9}
          pointerWidth={8}
        />
      )}
    </Group>
  );
}
