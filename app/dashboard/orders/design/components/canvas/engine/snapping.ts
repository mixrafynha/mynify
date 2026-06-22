export interface GuideConfig {
  showVertical: boolean;
  showHorizontal: boolean;
  verticalPosition?: number;
  horizontalPosition?: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: GuideConfig;
}

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SafeAreaLike = {
  width: number;
  height: number;
};

const SNAP_DISTANCE = 8;

function finite(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number): number {
  const safeMin = finite(min, 0);
  const safeMax = Math.max(safeMin, finite(max, safeMin));
  return Math.min(Math.max(finite(value, safeMin), safeMin), safeMax);
}

function rectIntersectsSafeArea(rect: Rect, safeArea: SafeAreaLike) {
  return (
    rect.x < safeArea.width &&
    rect.x + rect.width > 0 &&
    rect.y < safeArea.height &&
    rect.y + rect.height > 0
  );
}

export function snapPosition(
  element: Rect,
  safeArea: SafeAreaLike,
  otherElements: Rect[] = [],
  snapDistance = SNAP_DISTANCE
): SnapResult {
  const width = Math.max(1, finite(element.width, 1));
  const height = Math.max(1, finite(element.height, 1));
  const safeWidth = Math.max(0, finite(safeArea.width, 0));
  const safeHeight = Math.max(0, finite(safeArea.height, 0));
  const x = finite(element.x, 0);
  const y = finite(element.y, 0);

  let bestX = { active: false, dist: Infinity, value: x, guide: 0 };
  let bestY = { active: false, dist: Infinity, value: y, guide: 0 };

  const checkX = (current: number, target: number, value: number) => {
    if (target < 0 || target > safeWidth) return;
    const dist = Math.abs(current - target);
    if (dist <= snapDistance && dist < bestX.dist) {
      bestX = { active: true, dist, value, guide: target };
    }
  };

  const checkY = (current: number, target: number, value: number) => {
    if (target < 0 || target > safeHeight) return;
    const dist = Math.abs(current - target);
    if (dist <= snapDistance && dist < bestY.dist) {
      bestY = { active: true, dist, value, guide: target };
    }
  };

  const left = x;
  const right = x + width;
  const centerX = x + width / 2;
  const top = y;
  const bottom = y + height;
  const centerY = y + height / 2;

  checkX(left, 0, 0);
  checkX(right, safeWidth, safeWidth - width);
  checkX(centerX, safeWidth / 2, safeWidth / 2 - width / 2);

  checkY(top, 0, 0);
  checkY(bottom, safeHeight, safeHeight - height);
  checkY(centerY, safeHeight / 2, safeHeight / 2 - height / 2);

  for (const other of Array.isArray(otherElements) ? otherElements : []) {
    if (!other) continue;

    const ox = finite(other.x, 0);
    const oy = finite(other.y, 0);
    const ow = Math.max(1, finite(other.width, 1));
    const oh = Math.max(1, finite(other.height, 1));
    const otherRect = { x: ox, y: oy, width: ow, height: oh };

    // Guides nunca devem aparecer fora da área de edição.
    if (!rectIntersectsSafeArea(otherRect, { width: safeWidth, height: safeHeight })) continue;

    const otherLeft = clamp(ox, 0, safeWidth);
    const otherRight = clamp(ox + ow, 0, safeWidth);
    const otherCenterX = clamp(ox + ow / 2, 0, safeWidth);
    const otherTop = clamp(oy, 0, safeHeight);
    const otherBottom = clamp(oy + oh, 0, safeHeight);
    const otherCenterY = clamp(oy + oh / 2, 0, safeHeight);

    checkX(left, otherLeft, otherLeft);
    checkX(right, otherRight, otherRight - width);
    checkX(centerX, otherCenterX, otherCenterX - width / 2);
    checkX(left, otherRight, otherRight);
    checkX(right, otherLeft, otherLeft - width);

    checkY(top, otherTop, otherTop);
    checkY(bottom, otherBottom, otherBottom - height);
    checkY(centerY, otherCenterY, otherCenterY - height / 2);
    checkY(top, otherBottom, otherBottom);
    checkY(bottom, otherTop, otherTop - height);
  }

  const snappedX = bestX.active ? bestX.value : x;
  const snappedY = bestY.active ? bestY.value : y;

  return {
    x: snappedX,
    y: snappedY,
    guides: {
      showVertical: bestX.active,
      showHorizontal: bestY.active,
      verticalPosition: bestX.active ? clamp(bestX.guide, 0, safeWidth) : undefined,
      horizontalPosition: bestY.active ? clamp(bestY.guide, 0, safeHeight) : undefined,
    },
  };
}
