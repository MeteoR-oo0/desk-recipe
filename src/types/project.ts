export type Language = "ja" | "en";
export type NumberStyle = "none" | "plain" | "dot" | "paren" | "circle";
export type TextEffects = {
  shadowEnabled?: boolean; shadowColor?: string; shadowBlur?: number;
  shadowOpacity?: number; shadowOffsetX?: number; shadowOffsetY?: number;
  outlineEnabled?: boolean; outlineColor?: string; outlineWidth?: number;
};
export type LabelFrame = {
  style: "none" | "fill" | "outline" | "glass";
  fillColor?: string; opacity?: number; borderColor?: string;
  borderWidth?: number; radius?: number; blur?: number;
};
export type ArrowAnchor = {
  edge: "top" | "right" | "bottom" | "left";
  t: number;
};
export type ProductLabel = {
  id: string;
  brand: string;
  productName: string;
  description?: string;
  fontSizeDescription?: number;
  fontWeight?: number;
  image?: LabelImage;
  labelNumber?: string;
  price: string;
  showPrice: boolean;
  hidden?: boolean;
  x: number;
  y: number;
  arrowTargetX: number;
  arrowTargetY: number;
  fontSizeBrand: number;
  fontSizeProduct: number;
  fontSizePrice: number;
  fontFamily:
    | "Zen Maru Gothic"
    | "M PLUS Rounded 1c"
    | "Nunito"
    | "Inter"
    | "Montserrat"
    | "Quicksand"
    | "Noto Sans JP"
    | "Noto Serif JP"
    | "Shippori Mincho"
    | "Zen Old Mincho"
    | "Kiwi Maru";
  textColor: string;
  textEffects?: TextEffects;
  frame?: LabelFrame;
  arrowColor: string;
  arrowEffects?: TextEffects;
  arrowWidth: number;
  arrowType: "curve" | "line" | "polyline" | "swirl";
  arrowEnd?: "arrow" | "open-circle" | "filled-circle" | "none";
  arrowEndSize?: number;
  loopRadius?: number;
  loopPosition?: { x: number; y: number };
  boxWidth?: number;
  boxExtraHeight?: number;
  arrowAnchor?: ArrowAnchor;
  align: "left" | "center" | "right";
  opacity: number;
};
export type LabelImage = {
  src: string; name: string; naturalWidth: number; naturalHeight: number;
  x: number; y: number; width: number; opacity: number; shadow?: TextEffects;
};
export type AspectRatio = "Original" | "Custom" | "16:9" | "4:3" | "1:1" | "4:5" | "9:16";
export type CanvasBackground = { mode:"color"|"blur"|"transparent"; color:string; blur:number; image?:string };
export type PriceMode = "individual" | "show" | "hide";
export type Photo = {
  id: string;
  name: string;
  previewSrc: string;
  width: number;
  height: number;
};
export type ProjectData = {
  version: 1;
  photo: Photo;
  canvas: { width: number; height: number; aspectRatio: AspectRatio };
  background?: CanvasBackground;
  labels: ProductLabel[];
  priceMode: PriceMode;
  showTotalPrice?: boolean;
  numberStyle?: NumberStyle;
  tableShowPrices?: boolean;
  priceFormat: "yen" | "suffix" | "number";
  adjustment: { brightness: number; contrast: number; overlay: number; blur?: number };
};
export const makeLabel = (x: number, y: number): ProductLabel => ({
  id: crypto.randomUUID(),
  brand: "Brand",
  productName: "Product Name",
  price: "¥0",
  showPrice: true,
  x,
  y,
  arrowTargetX: x + 160,
  arrowTargetY: y + 140,
  fontSizeBrand: 17,
  fontSizeProduct: 28,
  fontSizePrice: 17,
  fontFamily: "Zen Maru Gothic",
  textColor: "#ffffff",
  arrowColor: "#ffffff",
  arrowWidth: 2,
  arrowType: "curve",
  align: "left",
  opacity: 1,
});
export const initialProject = (): ProjectData => ({
  version: 1,
  photo: {
    id: "sample-user-photo",
    name: "my-desk.png",
    previewSrc:
      (import.meta.env?.BASE_URL ?? "/") + "sample-desk.png?v=user-photo",
    width: 1568,
    height: 1044,
  },
  canvas: { width: 1200, height: 799, aspectRatio: "Original" },
  priceMode: "individual",
  numberStyle: "none",
  priceFormat: "yen",
  adjustment: { brightness: 0, contrast: 0, overlay: 0 },
  labels: [
    {
      ...makeLabel(160, 285),
      id: "monitor",
      brand: "MY WORKSPACE",
      productName: "Dual Monitor Setup",
      price: "¥0",
      showPrice: false,
      arrowTargetX: 460,
      arrowTargetY: 440,
    },
    {
      ...makeLabel(815, 135),
      id: "pc",
      brand: "NZXT",
      productName: "White PC Build",
      price: "¥0",
      showPrice: false,
      arrowTargetX: 1000,
      arrowTargetY: 440,
    },
    {
      ...makeLabel(400, 690),
      id: "keyboard",
      brand: "DESK FAVORITE",
      productName: "Mechanical Keyboard",
      price: "¥0",
      showPrice: false,
      arrowTargetX: 610,
      arrowTargetY: 635,
    },
    {
      ...makeLabel(75, 650),
      id: "speakers",
      brand: "AUDIO",
      productName: "Desktop Speakers",
      price: "¥0",
      showPrice: false,
      arrowTargetX: 175,
      arrowTargetY: 575,
    },
  ],
});
