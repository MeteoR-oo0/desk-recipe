import { useEffect, useRef } from "react";
import type { ProjectData, ProductLabel } from "../types/project";
import {formatLabelNumber} from "../lib/labelOrder";
type Context = {
  registerTool: (
    tool: Record<string, unknown>,
    options: { signal: AbortSignal },
  ) => unknown;
};
export function useWebMCP(
  project: ProjectData,
  add: (x: number, y: number, info?: Partial<ProductLabel>) => string,
  update: (id: string, patch: Partial<ProductLabel>) => void,
  setPrice: (mode: ProjectData["priceMode"]) => void,
) {
  const current = useRef({ project, add, update, setPrice });
  current.current = { project, add, update, setPrice };
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context) return;
    const life = new AbortController(),
      settle = () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
    const register = (
      name: string,
      description: string,
      inputSchema: object,
      execute: (input: any) => unknown,
      readOnly = false,
    ) => {
      try {
        Promise.resolve(
          context.registerTool(
            {
              name,
              description,
              inputSchema,
              annotations: {
                readOnlyHint: readOnly,
                untrustedContentHint: true,
              },
              execute: async (input: any) => {
                const result = execute(input);
                await settle();
                return result;
              },
            },
            { signal: life.signal },
          ),
        ).catch(() => {});
      } catch {}
    };
    register(
      "get_project_summary",
      "Read canvas dimensions, price visibility, and current editable labels.",
      { type: "object", properties: {}, additionalProperties: false },
      () => ({
        canvas: current.current.project.canvas,
        priceMode: current.current.project.priceMode,
        numberStyle: current.current.project.numberStyle ?? "none",
        labels: current.current.project.labels.map((label,index)=>{
          const {image,...fields}=label;
          return {...fields,automaticNumber:index+1,displayNumber:formatLabelNumber(index+1,current.current.project.numberStyle),
            ...(image?{image:{name:image.name,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,x:image.x,y:image.y,width:image.width,opacity:image.opacity,shadow:image.shadow}}:{})};
        }),
      }),
      true,
    );
    register(
      "add_product_label",
      "Add a product label at document coordinates. Changes the visible editor.",
      {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          brand: { type: "string" },
          productName: { type: "string" },
          price: { type: "string" },
        },
        required: ["x", "y"],
        additionalProperties: false,
      },
      (input) => {
        const p = current.current.project;
        if (
          !input ||
          !Number.isFinite(input.x) ||
          !Number.isFinite(input.y) ||
          input.x < 0 ||
          input.x > p.canvas.width ||
          input.y < 0 ||
          input.y > p.canvas.height
        )
          throw Error("Coordinates outside canvas");
        const info: Partial<ProductLabel> = {};
        for (const key of ["brand", "productName", "price"] as const) {
          if (input[key] !== undefined) {
            if (typeof input[key] !== "string" || input[key].length > 120)
              throw Error("Invalid text");
            info[key] = input[key];
          }
        }
        return { id: current.current.add(input.x, input.y, info) };
      },
    );
    register(
      "update_product_label",
      "Update brand, product name, price or individual price visibility on an existing label.",
      {
        type: "object",
        properties: {
          id: { type: "string" },
          brand: { type: "string" },
          productName: { type: "string" },
          price: { type: "string" },
          showPrice: { type: "boolean" },
        },
        required: ["id"],
        additionalProperties: false,
      },
      (input) => {
        if (
          !input ||
          !current.current.project.labels.some((l) => l.id === input.id)
        )
          throw Error("Unknown label");
        const patch: Partial<ProductLabel> = {};
        for (const key of ["brand", "productName", "price"] as const) {
          if (input[key] !== undefined) {
            if (typeof input[key] !== "string" || input[key].length > 120)
              throw Error("Invalid text");
            patch[key] = input[key];
          }
        }
        if (input.showPrice !== undefined) {
          if (typeof input.showPrice !== "boolean")
            throw Error("Invalid visibility");
          patch.showPrice = input.showPrice;
        }
        current.current.update(input.id, patch);
        return { id: input.id, updated: true };
      },
    );
    register(
      "set_price_visibility",
      "Set global price visibility while preserving every label’s individual setting.",
      {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["individual", "show", "hide"] },
        },
        required: ["mode"],
        additionalProperties: false,
      },
      (input) => {
        if (!input || !["individual", "show", "hide"].includes(input.mode))
          throw Error("Invalid mode");
        current.current.setPrice(input.mode);
        return { priceMode: input.mode };
      },
    );
    return () => life.abort();
  }, []);
}
