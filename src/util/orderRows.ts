/**
 * Expands the saved `order.products` array into the display rows that actually
 * make up the order — matching what Review.tsx shows and what the backend puts
 * on the Zoho estimates (routes/orders.py `_make_line_items`).
 *
 * A "split" product (pre_order in the catalogue but with physical stock) carries
 * TWO independent quantities on a single saved line:
 *   - `quantity`            -> the in-stock portion  (in-stock estimate)
 *   - `pre_order_quantity`  -> the pre-order portion (pre-order estimate)
 * so it can produce two rows. A pure pre-order product (no live stock) carries
 * its whole quantity in `quantity`.
 *
 * Saved order lines don't keep live `stock`, so a split is identified the same
 * way the admin page does it: `pre_order && pre_order_quantity > 0`.
 */
export interface OrderRow {
  [key: string]: any;
  /** Quantity for this row (already resolved from quantity / pre_order_quantity) */
  quantity: number;
  /** True when this row is the pre-order portion (or a pure pre-order line) */
  isPreOrderRow: boolean;
  /**
   * True when this product contributed BOTH a stock row and a pre-order row to
   * this order, i.e. it appears twice in the list. A split product that was
   * ordered entirely as pre-order has only one row, so this stays false.
   */
  hasBothPortions: boolean;
  /** Stable key — a split product yields two rows for the same product_id */
  rowKey: string;
}

export const isSplitOrderProduct = (p: any) =>
  !!p?.pre_order && Number(p?.pre_order_quantity ?? 0) > 0;

export const expandOrderProductRows = (products: any[] = []): OrderRow[] => {
  const rows: OrderRow[] = [];

  products.forEach((p: any, i: number) => {
    const id = String(p?.product_id ?? p?._id ?? i);
    const qty = Number(p?.quantity ?? 0);

    if (isSplitOrderProduct(p)) {
      const preQty = Number(p.pre_order_quantity ?? 0);
      const both = qty > 0 && preQty > 0;
      if (qty > 0) {
        rows.push({
          ...p,
          quantity: qty,
          isPreOrderRow: false,
          hasBothPortions: both,
          rowKey: `${id}-stock`,
        });
      }
      if (preQty > 0) {
        rows.push({
          ...p,
          quantity: preQty,
          isPreOrderRow: true,
          hasBothPortions: both,
          rowKey: `${id}-pre`,
        });
      }
      return;
    }

    // Pure pre-order or plain in-stock product: single row off `quantity`.
    if (qty > 0) {
      rows.push({
        ...p,
        quantity: qty,
        isPreOrderRow: !!p?.pre_order,
        hasBothPortions: false,
        rowKey: `${id}-${p?.pre_order ? 'pre' : 'stock'}`,
      });
    }
  });

  return rows;
};

/** Total units across all rows (stock + pre-order portions). */
export const totalOrderQuantity = (products: any[] = []) =>
  expandOrderProductRows(products).reduce((n, r) => n + r.quantity, 0);
