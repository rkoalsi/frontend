// Utility function to group products by their base name
// Groups products like "FIDA AUTOBRAKE Leash 5M - S White (Max 12kgs)" and "FIDA AUTOBRAKE Leash 5M - M White (Max 25kgs)"
// into one group based on common parts

export interface Product {
  _id: string;
  name: string;
  brand?: string;
  images?: string[];
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  new?: boolean;
  item_tax_preferences: any;
  upc_code?: string;
  [key: string]: any;
}

export interface ProductGroup {
  groupId: string;
  baseName: string;
  products: Product[];
  primaryProduct: Product; // The first product in the group (used for display)
}

/**
 * Extract the base name from a product name INCLUDING color, but removing only size
 * Examples:
 * "FIDA AUTOBRAKE Leash 5M - S White (Max 12kgs)" -> "FIDA AUTOBRAKE Leash 5M White"
 * "Product Name - L Black (Max 50kgs)" -> "Product Name Black"
 * "Product - S - Camouflage blue" -> "Product Camouflage blue"
 */
function extractBaseName(productName: string): string {
  let baseName = productName;

  // Define size patterns
  // IMPORTANT: Longer sizes must come first to avoid partial matches (XXXXL before XXXL before XXL before XL before L)
  const sizePattern = "(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|S|M|L)";

  // NEW: Remove (SIZE/measurement) pattern first - e.g., (XXL/62CM), (M/32CM), （XL/48CM）
  // Handles both regular parentheses () and full-width parentheses （）
  baseName = baseName.replace(
    new RegExp(
      `[（(]\\s*${sizePattern}\\s*/\\s*\\d+\\s*[Cc]?[Mm]\\s*[)）]`,
      "gi"
    ),
    ""
  );

  // Pattern 1: Remove "-color-SIZE" at the end (reversed order) but keep color
  // Example: "Product -Vibrant Orange-XL" -> "Product Vibrant Orange"
  baseName = baseName.replace(
    new RegExp(`-([A-Za-z][^-]+)-${sizePattern}$`, "gi"),
    " $1"
  );

  // Pattern 2: Remove " SIZE - color" but keep color -> "Product SIZE - color" -> "Product color"
  // Example: "Product XS - Camouflage blue" -> "Product Camouflage blue"
  baseName = baseName.replace(
    new RegExp(`\\s+${sizePattern}\\s+-\\s+`, "gi"),
    " "
  );

  // Pattern 3: Remove " - SIZE color" but keep color -> "Product - SIZE color" -> "Product color"
  // Examples: "Product - XS Blue Coral" -> "Product Blue Coral"
  baseName = baseName.replace(
    new RegExp(`\\s+-\\s+${sizePattern}\\s+`, "gi"),
    " "
  );

  // Pattern 4: Remove "-SIZE-color" but keep color -> "Product-SIZE-color" -> "Product color"
  // Examples: "Product-M-fuchsia" -> "Product fuchsia"
  baseName = baseName.replace(new RegExp(`-${sizePattern}-`, "gi"), " ");

  // Pattern 5: Remove "-SIZE " but keep rest -> "Product-SIZE color" -> "Product color"
  baseName = baseName.replace(new RegExp(`-${sizePattern}\\s+`, "gi"), " ");

  // Pattern 6: Remove "-SIZE" at the very end
  baseName = baseName.replace(new RegExp(`-${sizePattern}$`, "gi"), "");

  // Pattern 7: Remove standalone SIZE at various positions
  baseName = baseName.replace(new RegExp(`\\s+${sizePattern}\\s+`, "gi"), " ");
  baseName = baseName.replace(new RegExp(`\\s+${sizePattern}$`, "gi"), "");
  baseName = baseName.replace(new RegExp(`^${sizePattern}\\s+`, "gi"), "");

  // Pattern 8: Remove SIZE in parentheses at the end -> "Product Name (M)" -> "Product Name"
  baseName = baseName.replace(
    new RegExp(`\\s*\\(${sizePattern}\\)$`, "gi"),
    ""
  );

  // Pattern 9: Remove shoe size indicators like #1, #2, #3, etc.
  // Example: "PRODUCT NAME #4 -Color" -> "PRODUCT NAME -Color"
  baseName = baseName.replace(/\s*#\d+\s*/gi, " ");

  // Pattern 10: Remove measurements like 4.5mm, 6mm, 10mm, etc.
  // Example: "Product 4.5mm-Color" -> "Product -Color"
  baseName = baseName.replace(/\s*\d+\.?\d*mm\s*/gi, " ");

  // Pattern 11: Remove "SIZE-color" pattern at the end (e.g., "Product L-orange" -> "Product orange")
  // This handles cases where size is directly before color with a dash
  baseName = baseName.replace(new RegExp(`\\s+${sizePattern}-`, "gi"), " ");

  // Remove weight indicators like: (Max 12kgs), (Max 25kgs), etc.
  baseName = baseName.replace(/\s*\(Max\s+\d+kgs?\)/gi, "");

  // Remove weight ranges like: (12-25kg), (12-25kgs)
  baseName = baseName.replace(/\s*\(\d+-\d+kgs?\)/gi, "");

  // Clean up extra spaces and dashes
  baseName = baseName.replace(/\s*-+\s*$/g, ""); // Remove trailing dashes
  baseName = baseName.replace(/^\s*-+\s*/g, ""); // Remove leading dashes
  baseName = baseName.replace(/\s*-\s*/g, " - "); // Normalize spacing around dashes
  baseName = baseName.replace(/\s+/g, " ").trim();

  return baseName;
}

/**
 * Check if two product names should be grouped together
 * Returns true if they have the same base name but different sizes/weights
 */
function shouldGroup(name1: string, name2: string): boolean {
  const base1 = extractBaseName(name1);
  const base2 = extractBaseName(name2);

  // Same base name (case-insensitive) and different full names (meaning they have different variants)
  return base1.toLowerCase() === base2.toLowerCase() && name1 !== name2;
}

export interface GroupedProducts {
  groups: ProductGroup[];
  ungrouped: Product[];
}

/**
 * Extract color from product name
 * This matches the backend logic in products.py lines 223-243
 */
function extractColor(productName: string): string {
  // Extract color (last word before parenthesis or end)
  // This mimics the backend MongoDB aggregation logic
  const beforeParenthesis = productName.split("(")[0].trim();
  const words = beforeParenthesis.split(" ");
  return words[words.length - 1] || "";
}

/**
 * Extract size and return a sort order
 * This matches the backend logic in products.py lines 244-279
 */
function getSizeOrder(productName: string): number {
  // Match size pattern: XS, S, M, L, XL, XXL, XXXL, XXXXL with word boundaries
  const sizeMatch = productName.match(
    /\b(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|S|M|L)\b/
  );

  if (!sizeMatch) {
    return 99; // Default for no size found
  }

  const size = sizeMatch[1];

  // Size order mapping (matches backend lines 264-273)
  const sizeOrder: { [key: string]: number } = {
    XXXXS: 1,
    XXXS: 2,
    XXS: 3,
    XS: 4,
    S: 5,
    M: 6,
    L: 7,
    XL: 8,
    XXL: 9,
    XXXL: 10,
    XXXXL: 11,
  };

  return sizeOrder[size] || 99;
}

/**
 * Group products by their base name, separating grouped and ungrouped products
 * @param products - Array of products to group
 * @returns Object with groups array and ungrouped products array
 */
export function groupProductsByName(products: Product[]): GroupedProducts {
  const groups: Map<string, Product[]> = new Map();

  // Group products by their base name (case-insensitive)
  products.forEach((product) => {
    const baseName = extractBaseName(product.name);
    const baseNameLower = baseName.toLowerCase();

    // Find existing key with same lowercase version
    let existingKey: string | undefined;
    groups.forEach((_, key) => {
      if (!existingKey && key.toLowerCase() === baseNameLower) {
        existingKey = key;
      }
    });

    if (existingKey) {
      groups.get(existingKey)!.push(product);
    } else {
      groups.set(baseName, [product]);
    }
  });

  // Separate groups (2+ products) from single products
  const productGroups: ProductGroup[] = [];
  const ungroupedProducts: Product[] = [];

  groups.forEach((groupProducts, baseName) => {
    if (groupProducts.length > 1) {
      // This is a real group with multiple variants
      // Sort to match backend logic: color (ascending), then size (ascending)
      // This matches products.py lines 281-291
      groupProducts.sort((a, b) => {
        // First sort by color (extracted_color in backend)
        const colorA = extractColor(a.name).toLowerCase();
        const colorB = extractColor(b.name).toLowerCase();

        if (colorA !== colorB) {
          return colorA.localeCompare(colorB);
        }

        // Then sort by size order
        const sizeOrderA = getSizeOrder(a.name);
        const sizeOrderB = getSizeOrder(b.name);

        if (sizeOrderA !== sizeOrderB) {
          return sizeOrderA - sizeOrderB;
        }

        // Finally, sort by rate (price) if color and size are the same
        if (a.rate !== b.rate) {
          return a.rate - b.rate;
        }

        // Last resort: alphabetical by full name
        return a.name.localeCompare(b.name);
      });

      productGroups.push({
        groupId: `group-${baseName.replace(/\s+/g, "-").toLowerCase()}`,
        baseName,
        products: groupProducts,
        primaryProduct: groupProducts[0],
      });
    } else {
      // Single product - keep it ungrouped
      ungroupedProducts.push(groupProducts[0]);
    }
  });

  return {
    groups: productGroups,
    ungrouped: ungroupedProducts,
  };
}

/**
 * Flatten product groups back to individual products
 * Useful for reverting grouping
 */
export function flattenProductGroups(groups: ProductGroup[]): Product[] {
  return groups.flatMap((group) => group.products);
}

/**
 * Extract size from product name
 * Examples: "Product - S White" -> "S", "Product - XL Black" -> "XL"
 * "Product - Large" -> "L", "Product - Medium" -> "M"
 */
export function extractSize(productName: string): string | null {
  // First try full word sizes
  const fullWordMatch = productName.match(
    /\s*-\s*(XXX-Large|XX-Large|X-Large|X-Small|Extra Large|Extra Small|Large|Medium|Small)$/i
  );
  if (fullWordMatch) {
    const size = fullWordMatch[1].toLowerCase();
    if (size === "x-large") return "XL";
    if (size === "xx-large") return "XXL";
    if (size === "xxx-large") return "XXXL";
    if (size === "x-small") return "XS";
    if (size === "extra large") return "XL";
    if (size === "extra small") return "XS";
    if (size === "large") return "L";
    if (size === "medium") return "M";
    if (size === "small") return "S";
  }

  // Then try abbreviated sizes
  const sizeMatch = productName.match(/\s*-\s*([SMLX]{1,3})\s+/i);
  return sizeMatch ? sizeMatch[1] : null;
}

/**
 * Extract weight from product name
 * Examples: "(Max 12kgs)" -> "12kg", "(Max 25kgs)" -> "25kg"
 */
export function extractWeight(productName: string): string | null {
  const weightMatch = productName.match(/\(Max\s+(\d+)kgs?\)/i);
  return weightMatch ? `${weightMatch[1]}kg` : null;
}
