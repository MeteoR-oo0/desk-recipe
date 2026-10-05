import type { ProductLabel } from "../types/project";
export const isLabelVisible = (label: Pick<ProductLabel, "hidden">) => label.hidden !== true;
