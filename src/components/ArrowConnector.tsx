import { Arrow, Group, Shape, Circle } from "react-konva";
import type { ProductLabel } from "../types/project";
import { arrowGeometry, type Box } from "../lib/arrowGeometry";
import {
  cubicHitsBoxes,
  segmentHitsBox,
  routeConnector,
  drawRoundedRoute,
} from "../lib/connectorRouting";
import { loopGeometry } from "../lib/loopGeometry";
import { frameObstacles, arrowEffects, type AppearanceObstacle } from "../lib/labelAppearance";
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
  const effects=arrowEffects(label);
  const shadow={shadowEnabled:effects.shadowEnabled,shadowColor:effects.shadowColor,shadowBlur:effects.shadowBlur,shadowOpacity:effects.shadowOpacity,shadowOffsetX:effects.shadowOffsetX,shadowOffsetY:effects.shadowOffsetY};
  const outlined=effects.outlineEnabled && effects.outlineWidth>0;
  const end=label.arrowEnd??"arrow", circular=end==="open-circle"||end==="filled-circle", radius=6;
  const connector=(lineProps:typeof props & typeof shadow)=>(<>
    <Group clipFunc={circular?ctx=>{ctx.beginPath();ctx.rect(-100000,-100000,200000,200000);ctx.moveTo(target.x+radius,target.y);ctx.arc(target.x,target.y,radius,0,Math.PI*2,true);ctx.closePath();}:undefined}>
      {label.arrowType === "swirl" ? (
        <Shape
          {...lineProps}
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
            if(end!=="arrow") return;
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
          {...lineProps}
          sceneFunc={(ctx, shape) => {
            const start = { x: geometry.points[0], y: geometry.points[1] },
              path = routeConnector(start, target, obstacles),
              prev = path[path.length - 2],
              angle = Math.atan2(target.y - prev.y, target.x - prev.x);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            drawRoundedRoute(ctx, path, label.arrowType !== "line");
            ctx.strokeShape(shape);
            if(end!=="arrow") return;
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
          {...lineProps}
          points={geometry.points}
          tension={geometry.tension}
          pointerLength={9}
          pointerWidth={8}
          pointerAtEnding={end==="arrow"}
        />
      )}
    </Group>
    {circular&&<Circle {...lineProps} name="arrow-end-marker" x={target.x} y={target.y}
      radius={end==="open-circle"?radius+(lineProps.strokeWidth-label.arrowWidth)/4:radius}
      strokeWidth={end==="open-circle"?label.arrowWidth+(lineProps.strokeWidth-label.arrowWidth)/2:lineProps.strokeWidth}
      fillEnabled={end==="filled-circle"}/>}
  </>);
  return <Group>{outlined && connector({...props,...shadow,stroke:effects.outlineColor,fill:effects.outlineColor,strokeWidth:label.arrowWidth+effects.outlineWidth*2})}{connector({...props,...shadow,shadowEnabled:effects.shadowEnabled&&!outlined})}</Group>;
}
