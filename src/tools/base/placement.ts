import type { PDFFont, PDFPage } from "@cantoo/pdf-lib";

/**
 * A page as the reader sees it. Pages can carry a /Rotate entry, so "the
 * bottom of the page" on screen may be the left edge in PDF coordinates.
 * Tools place things in visual coordinates (origin bottom-left, as shown)
 * and this maps them onto the page.
 */
export type VisualPage = {
  width: number;
  height: number;
  /** The page's own rotation, clockwise, in degrees. */
  rotation: 0 | 90 | 180 | 270;
  toPage: (x: number, y: number) => { x: number; y: number };
};

export function visualPage(page: PDFPage): VisualPage {
  const { x: left, y: bottom, width, height } = page.getCropBox();
  const rotation = (((page.getRotation().angle % 360) + 360) % 360) as VisualPage["rotation"];
  const sideways = rotation === 90 || rotation === 270;

  return {
    width: sideways ? height : width,
    height: sideways ? width : height,
    rotation,
    toPage(x, y) {
      switch (rotation) {
        case 90:
          return { x: left + width - y, y: bottom + x };
        case 180:
          return { x: left + width - x, y: bottom + height - y };
        case 270:
          return { x: left + y, y: bottom + height - x };
        default:
          return { x: left + x, y: bottom + y };
      }
    },
  };
}

type TextPlacement = { text: string; font: PDFFont; size: number };

/**
 * Where to call drawText so that text appears upright to the reader, starting at the
 * visual point (x, y) on its baseline and turned by `angle` degrees counterclockwise.
 */
export function uprightText(view: VisualPage, x: number, y: number, angle = 0) {
  return { ...view.toPage(x, y), rotate: angle + view.rotation };
}

/** The visual baseline start that centers text on (cx, cy), turned by `angle` degrees. */
export function centeredStart({ text, font, size }: TextPlacement, cx: number, cy: number, angle = 0) {
  const width = font.widthOfTextAtSize(text, size);
  const capHeight = font.heightAtSize(size, { descender: false });
  const radians = (angle * Math.PI) / 180;
  const halfWidth = width / 2;
  const halfHeight = capHeight / 2;
  return {
    x: cx - halfWidth * Math.cos(radians) + halfHeight * Math.sin(radians),
    y: cy - halfWidth * Math.sin(radians) - halfHeight * Math.cos(radians),
  };
}

/**
 * Standard PDF fonts only cover Latin text, and drawing anything else silently
 * produces the wrong glyphs. Returns the first character the font can't draw.
 */
export function unsupportedCharacter(font: PDFFont, text: string): string | null {
  const supported = new Set(font.getCharacterSet());
  for (const character of text) {
    if (!supported.has(character.codePointAt(0)!)) return character;
  }
  return null;
}
