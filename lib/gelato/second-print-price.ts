type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function numericCost(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const SECOND_PRINT_FEE_EUR = 7.5;

export function hasVisiblePrintElements(elements: unknown) {
  return Array.isArray(elements) && elements.some((element) => {
    const record = asRecord(element);
    const meta = asRecord(record?.meta);
    return meta?.hidden !== true &&
      ["image", "text", "shape"].includes(String(record?.type || ""));
  });
}

export function resolveSecondPrintCharge(args: {
  hasFrontDesign?: boolean;
  hasBackDesign?: boolean;
}): number {
  void args.hasFrontDesign;
  return args.hasBackDesign ? SECOND_PRINT_FEE_EUR : 0;
}
