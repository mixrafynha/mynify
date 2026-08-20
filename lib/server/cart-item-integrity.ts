export type CartItemIntegrityIssue =
  | "INVALID_PRODUCT_VARIANT"
  | "INVALID_USER_PRODUCT";

function sameId(left: string | null | undefined, right: string | null | undefined) {
  return Boolean(left && right && left.trim() === right.trim());
}

export function validateCartItemIntegrity(input: {
  cartProductId: string;
  variantId: string | null;
  variantProductId: string | null;
  userProductId: string | null;
  resolvedUserProductId: string | null;
  userProductBaseProductId: string | null;
}): CartItemIntegrityIssue | null {
  if (
    input.variantId &&
    !sameId(input.variantProductId, input.cartProductId)
  ) {
    return "INVALID_PRODUCT_VARIANT";
  }

  if (
    input.userProductId &&
    (!sameId(input.resolvedUserProductId, input.userProductId) ||
      !sameId(input.userProductBaseProductId, input.cartProductId))
  ) {
    return "INVALID_USER_PRODUCT";
  }

  return null;
}
