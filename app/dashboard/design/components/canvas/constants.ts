export const LEGACY_MODE = true;

export const DPI = 300;
export const MM_TO_INCH = 1 / 25.4;

export const MOCKUP_AREA_MM = {
  width: 52,
  height: 64,
};

// editor interno
export const MOCKUP_AREA = LEGACY_MODE
  ? {
      width: 520,
      height: 640,
    }
  : {
      width: Math.round(MOCKUP_AREA_MM.width * MM_TO_INCH * DPI),
      height: Math.round(MOCKUP_AREA_MM.height * MM_TO_INCH * DPI),
    };

// mockup final para imagem/export
export const EXPORT_MOCKUP_AREA = {
  width: 2000,
  height: 2000,
};

export const SAFE_AREA_PADDING = LEGACY_MODE
  ? 1.9
  : Math.round((1.9 / 25.4) * DPI);

export const MIN_VISIBLE_WHEN_DRAGGING = 8;