// Where "next" goes when you reach the end of a product list.
//
// Both the order form (Products.tsx) and the public catalogue
// (catalogues/all_products.tsx) walk the catalogue the same way: finish every
// category in the current brand, then roll into the first category of the next
// brand on the rail. Keeping that rule here means the end-of-list block, the
// browse sheet and the sticky bar can never disagree about what comes next.

import { isCollectionKey, type BrandRailEntry } from './brandAccent';

export interface BrowseTarget {
  brand: string;
  category: string;
  /** 'category' stays inside the current brand; 'brand' moves to the next one. */
  kind: 'category' | 'brand';
  count: number;
}

export interface BrowseOrderInput {
  /** Rail order — collections first, then brands, exactly as rendered. */
  brandList: BrandRailEntry[];
  categoriesByBrand: { [brand: string]: string[] };
  /** productCounts — per brand, per category. */
  counts: { [brand: string]: { [category: string]: number } };
  activeBrand: string;
  activeCategory: string;
  /**
   * Order form only: browsing by category across every brand. There is no
   * brand to exhaust in that mode, so "next" walks `allCategories` instead.
   */
  groupByCategory?: boolean;
  allCategories?: string[];
}

const countOf = (
  counts: BrowseOrderInput['counts'],
  brand: string,
  category: string
) => counts[brand]?.[category] ?? 0;

/**
 * `categoriesByBrand` is filled in lazily — a brand's categories only arrive
 * once someone visits it. The counts payload, though, covers every brand from
 * the start and is keyed by category, so it stands in until the real list
 * lands. Without this the browse sheet would show most of the rail as having
 * no categories at all.
 *
 * Collections are left alone: their sub-navigation is the synthetic
 * "All Products", not the categories their products happen to fall into.
 */
export function withCountsFallback(
  categoriesByBrand: { [brand: string]: string[] },
  counts: { [brand: string]: { [category: string]: number } }
): { [brand: string]: string[] } {
  const merged = { ...categoriesByBrand };
  Object.keys(counts).forEach((brand) => {
    if (merged[brand]?.length) return;
    merged[brand] = isCollectionKey(brand)
      ? ['All Products']
      : Object.keys(counts[brand] ?? {}).sort();
  });
  return merged;
}

/** Every product in a brand, summed across its categories. */
export const brandTotal = (
  counts: BrowseOrderInput['counts'],
  brand: string
) =>
  counts[brand]
    ? Object.values(counts[brand]).reduce((a, b) => a + b, 0)
    : 0;

/** Total across every brand for one category — the category-browse counterpart. */
const categoryTotal = (
  counts: BrowseOrderInput['counts'],
  category: string
) =>
  Object.values(counts).reduce(
    (sum, byCategory) => sum + (byCategory[category] ?? 0),
    0
  );

/**
 * Categories in the current brand that come after the active one.
 *
 * An active category the brand doesn't list — the catalogue's synthetic
 * "All Products", or a stale value left over from a search — means the brand
 * has nothing left to show, so nothing is returned and the caller falls
 * through to the next brand.
 */
export function getRemainingCategories(
  input: BrowseOrderInput
): { category: string; count: number }[] {
  const { categoriesByBrand, counts, activeBrand, activeCategory } = input;

  if (input.groupByCategory) {
    const all = input.allCategories ?? [];
    const idx = all.indexOf(activeCategory);
    if (idx === -1) return [];
    return all.slice(idx + 1).map((category) => ({
      category,
      count: categoryTotal(counts, category),
    }));
  }

  const categories = categoriesByBrand[activeBrand] ?? [];
  const idx = categories.indexOf(activeCategory);
  if (idx === -1) return [];
  return categories.slice(idx + 1).map((category) => ({
    category,
    count: countOf(counts, activeBrand, category),
  }));
}

/**
 * Brands after the current one on the rail, each with its first category
 * pre-resolved so selecting one lands on real products rather than an empty
 * brand with no category chosen.
 */
export function getUpcomingBrands(
  input: BrowseOrderInput,
  limit = 3
): { entry: BrandRailEntry; category: string; count: number }[] {
  const { brandList, categoriesByBrand, counts, activeBrand } = input;
  const idx = brandList.findIndex((b) => b.brand === activeBrand);
  // An unknown active brand starts the walk at the top of the rail rather
  // than returning nothing.
  const rest = idx === -1 ? brandList : brandList.slice(idx + 1);
  return rest.slice(0, limit).map((entry) => ({
    entry,
    category: categoriesByBrand[entry.brand]?.[0] ?? '',
    count: brandTotal(counts, entry.brand),
  }));
}

/**
 * The single thing to offer at the bottom of the list: the next category in
 * this brand, or the next brand once the categories run out. Null when the
 * rail itself is exhausted.
 */
export function getNextTarget(input: BrowseOrderInput): BrowseTarget | null {
  const remaining = getRemainingCategories(input);
  if (remaining.length > 0) {
    const [first] = remaining;
    return {
      brand: input.groupByCategory ? '' : input.activeBrand,
      category: first.category,
      kind: 'category',
      count: first.count,
    };
  }

  // Category-browse mode has no brands to fall through to.
  if (input.groupByCategory) return null;

  const [nextBrand] = getUpcomingBrands(input, 1);
  if (!nextBrand) return null;
  return {
    brand: nextBrand.entry.brand,
    category: nextBrand.category,
    kind: 'brand',
    count: nextBrand.count,
  };
}
