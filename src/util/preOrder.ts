/**
 * Max quantity that can be pre-ordered for a product.
 *
 * `upcoming_stock` is precomputed by the backend from the open purchase order
 * (qty - qty_received). An explicit 0 means the PO is fully received — nothing
 * left to pre-order, so the cap is 0 and the product can't be added. A missing
 * value means "not computed" and stays uncapped, matching prior behaviour.
 */
export const getPreOrderMax = (upcomingStock?: number | null): number =>
  upcomingStock === 0 ? 0 : upcomingStock || Infinity;

/**
 * True when a product is marked pre_order but its incoming stock is fully
 * received (explicit 0) — it must not be pre-orderable.
 */
export const isPreOrderExhausted = (product: {
  pre_order?: boolean;
  upcoming_stock?: number | null;
}): boolean => !!product?.pre_order && product?.upcoming_stock === 0;
