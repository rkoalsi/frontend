import React, { useCallback, useMemo } from "react";
import { alpha, Box, Typography, useTheme } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import {
  getBrandAccent,
  type BrandRailEntry,
} from "../../../util/brandAccent";
import {
  getNextTarget,
  getRemainingCategories,
  type BrowseOrderInput,
} from "../../../util/browseOrder";
import BrandMark from "./BrandMark";

interface UpNextProps extends BrowseOrderInput {
  /** "Clearance" surfaces as "Special Offers". */
  displayNameOf: (brand?: string) => string;
  /** Passing "" as the brand keeps category-browse mode's global scope. */
  onSelect: (brand: string, category: string) => void;
  onBackToTop?: () => void;
}

const CHIP_LIMIT = 4;

/**
 * What sits at the bottom of a finished product list. The list used to simply
 * stop with "No more products for X" — a dead end that left changing brand as
 * a scroll all the way back to the rail. This offers the next step instead:
 * the next category in the brand, the rest of them as one-tap chips, and the
 * following brands once the current one is exhausted.
 *
 * Sequencing lives in `util/browseOrder` so this block, the browse sheet and
 * the sticky bar all agree on what "next" means.
 */
const UpNext: React.FC<UpNextProps> = ({
  displayNameOf,
  onSelect,
  onBackToTop,
  ...order
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";

  const next = useMemo(() => getNextTarget(order), [order]);
  const remaining = useMemo(() => getRemainingCategories(order), [order]);

  const entryOf = useCallback(
    (brand: string): BrandRailEntry | undefined =>
      order.brandList.find((b) => b.brand === brand),
    [order.brandList]
  );

  const nextEntry = next ? entryOf(next.brand) : undefined;
  // A next *category* keeps the current brand's accent; a next brand takes its
  // own, so the colour always describes where the tap lands. Browsing by
  // category spans every brand, so there is no brand to borrow from — and
  // showing one would claim the next category belongs to it.
  const accentSource = order.groupByCategory
    ? undefined
    : next?.kind === "brand"
      ? nextEntry
      : entryOf(order.activeBrand);
  const accent = order.groupByCategory
    ? { main: theme.palette.primary.main, soft: alpha(theme.palette.primary.main, 0.12) }
    : getBrandAccent(accentSource?.brand, accentSource?.color, mode);

  const activeLabel = order.groupByCategory
    ? order.activeCategory
    : `${displayNameOf(order.activeBrand)}${
        order.activeCategory ? ` · ${order.activeCategory}` : ""
      }`;

  // Chips after the primary CTA: the rest of this brand's categories, so the
  // list can be skipped through rather than only walked in order. Other
  // brands are deliberately not offered here — the next brand is already the
  // CTA, and the browse sheet covers jumping anywhere else.
  const chips = useMemo(
    () =>
      remaining.slice(1, CHIP_LIMIT + 1).map((c) => ({
        key: `cat-${c.category}`,
        label: `${c.category} (${c.count})`,
        brand: order.groupByCategory ? "" : order.activeBrand,
        category: c.category,
      })),
    [remaining, order.activeBrand, order.groupByCategory]
  );

  // Nothing left anywhere and no way back up — the block would be an empty box.
  if (!next && !onBackToTop) return null;

  return (
    <Box
      sx={{
        mt: 2,
        mb: 1,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: "action.hover",
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.72rem" }}
        >
          {next
            ? `You've reached the end of ${activeLabel}`
            : `That's everything in ${activeLabel}`}
        </Typography>
        {onBackToTop && (
          <Box
            component="button"
            type="button"
            onClick={onBackToTop}
            sx={{
              ml: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              border: "none",
              bgcolor: "transparent",
              cursor: "pointer",
              font: "inherit",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "text.secondary",
              p: 0,
              "&:hover": { color: accent.main },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: accent.main,
                outlineOffset: 2,
              },
            }}
          >
            <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
            Back to top
          </Box>
        )}
      </Box>

      {next && (
        <Box
          component="button"
          type="button"
          onClick={() => onSelect(next.brand, next.category)}
          sx={{
            width: "100%",
            textAlign: "left",
            font: "inherit",
            color: "inherit",
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.5,
            transition: "background-color 0.15s ease",
            "&:hover": { bgcolor: accent.soft },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: accent.main,
              outlineOffset: -2,
            },
          }}
        >
          {order.groupByCategory ? (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "7px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: accent.soft,
              }}
            >
              <CategoryOutlinedIcon sx={{ fontSize: 20, color: accent.main }} />
            </Box>
          ) : (
            <BrandMark
              entry={next.kind === "brand" ? nextEntry : accentSource}
              displayName={displayNameOf(
                next.kind === "brand" ? next.brand : order.activeBrand
              )}
              size={40}
            />
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {next.kind === "brand"
                ? "Next brand"
                : order.groupByCategory
                  ? "Next category"
                  : `Next in ${displayNameOf(order.activeBrand)}`}
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.25 }}
            >
              {next.kind === "brand"
                ? displayNameOf(next.brand)
                : next.category}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {next.count} {next.count === 1 ? "product" : "products"}
              {next.kind === "brand" && next.category ? ` · from ${next.category}` : ""}
            </Typography>
          </Box>
          <ArrowForwardIcon sx={{ color: accent.main, flexShrink: 0 }} />
        </Box>
      )}

      {chips.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
            px: 2,
            py: 1.25,
            borderTop: "1px dashed",
            borderTopColor: "divider",
          }}
        >
          {chips.map((chip) => (
            <Box
              key={chip.key}
              component="button"
              type="button"
              onClick={() => onSelect(chip.brand, chip.category)}
              sx={{
                font: "inherit",
                fontSize: "0.72rem",
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "text.secondary",
                cursor: "pointer",
                transition: "border-color 0.15s ease, color 0.15s ease",
                "&:hover": { borderColor: accent.main, color: accent.main },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: accent.main,
                  outlineOffset: 2,
                },
              }}
            >
              {chip.label}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default React.memo(UpNext);
