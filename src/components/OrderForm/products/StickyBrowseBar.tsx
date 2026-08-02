import React, { useMemo, useState } from "react";
import { alpha, Box, Menu, MenuItem, Typography, useTheme } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  getBrandAccent,
  type BrandRailEntry,
} from "../../../util/brandAccent";
import { getNextTarget, type BrowseOrderInput } from "../../../util/browseOrder";

interface StickyBrowseBarProps extends BrowseOrderInput {
  /** Hidden until the real rail has scrolled away. */
  visible: boolean;
  /**
   * False when the bar is dropped inside a container that is already sticky
   * (the catalogue's header), so it doesn't create a second sticky context
   * fighting the first for the same top edge.
   */
  sticky?: boolean;
  /** Distance from the viewport top — app bar, plus sticky search on phones. */
  topOffset?: number | { [breakpoint: string]: number };
  displayNameOf: (brand?: string) => string;
  onSelect: (brand: string, category: string) => void;
  /** The brand half defers to the full browse sheet rather than duplicating it. */
  onOpenBrowse: () => void;
}

/**
 * The condensed rail: a slim "Brand ▾ · Category ▾" bar that takes over once
 * the real rail scrolls off the top. It answers "where am I?" without a scroll
 * and puts both switches one tap away.
 *
 * The brand half opens the browse sheet — the same one the floating button
 * opens — so there is exactly one brand picker in the app.
 */
const StickyBrowseBar: React.FC<StickyBrowseBarProps> = ({
  visible,
  sticky = true,
  topOffset = 0,
  displayNameOf,
  onSelect,
  onOpenBrowse,
  ...order
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";
  const [catAnchor, setCatAnchor] = useState<null | HTMLElement>(null);

  const entry: BrandRailEntry | undefined = useMemo(
    () => order.brandList.find((b) => b.brand === order.activeBrand),
    [order.brandList, order.activeBrand]
  );
  // Browsing by category spans every brand, so no single brand's colour applies.
  const accent = order.groupByCategory
    ? { main: theme.palette.primary.main, soft: alpha(theme.palette.primary.main, 0.12) }
    : getBrandAccent(entry?.brand, entry?.color, mode);

  const categories = order.groupByCategory
    ? order.allCategories ?? []
    : order.categoriesByBrand[order.activeBrand] ?? [];

  const next = useMemo(() => getNextTarget(order), [order]);

  const countOf = (cat: string) =>
    order.groupByCategory
      ? Object.values(order.counts).reduce((s, byCat) => s + (byCat[cat] ?? 0), 0)
      : order.counts[order.activeBrand]?.[cat] ?? 0;

  const pickerSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    minWidth: 0,
    maxWidth: "100%",
    font: "inherit",
    fontSize: "0.78rem",
    fontWeight: 700,
    px: 1,
    py: 0.5,
    borderRadius: 1.5,
    border: "1px solid transparent",
    bgcolor: "action.hover",
    color: "text.primary",
    cursor: "pointer",
    "&:hover": { borderColor: accent.main, color: accent.main },
    "&:focus-visible": {
      outline: "2px solid",
      outlineColor: accent.main,
      outlineOffset: 2,
    },
  } as const;

  const truncate = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  } as const;

  return (
    <Box
      sx={{
        ...(sticky
          ? {
              position: "sticky",
              top: topOffset,
              zIndex: 4,
              mx: { xs: -0.5, md: 0 },
              bgcolor: "background.paper",
              borderBottom: "1px solid",
              borderColor: "divider",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            }
          : {
              borderTop: "1px solid",
              borderColor: "divider",
            }),
        px: { xs: 1, md: 1.5 },
        py: 0.75,
        display: visible ? "flex" : "none",
        alignItems: "center",
        gap: 1,
      }}
      className="no-pdf"
    >
      <Box
        component="button"
        type="button"
        onClick={onOpenBrowse}
        sx={{ ...pickerSx, flexShrink: 1 }}
        aria-label="Change brand"
      >
        <Box
          component="span"
          sx={{
            width: 5,
            height: 15,
            borderRadius: 0.5,
            bgcolor: accent.main,
            flexShrink: 0,
          }}
        />
        <Box component="span" sx={truncate}>
          {order.groupByCategory ? "All brands" : displayNameOf(order.activeBrand)}
        </Box>
        <ExpandMoreIcon sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }} />
      </Box>

      {categories.length > 0 && (
        <>
          <Typography component="span" sx={{ color: "divider", flexShrink: 0 }}>
            ·
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={(e: React.MouseEvent<HTMLElement>) => setCatAnchor(e.currentTarget)}
            sx={{ ...pickerSx, flexShrink: 1 }}
            aria-label="Change category"
          >
            <Box component="span" sx={truncate}>
              {order.activeCategory || categories[0]}
            </Box>
            <ExpandMoreIcon sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }} />
          </Box>
          <Menu
            anchorEl={catAnchor}
            open={Boolean(catAnchor)}
            onClose={() => setCatAnchor(null)}
            slotProps={{ paper: { sx: { maxHeight: 320 } } }}
          >
            {categories.map((cat) => (
              <MenuItem
                key={cat}
                selected={cat === order.activeCategory}
                onClick={() => {
                  setCatAnchor(null);
                  onSelect(order.groupByCategory ? "" : order.activeBrand, cat);
                }}
                sx={{ fontSize: "0.85rem" }}
              >
                {cat} ({countOf(cat)})
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Forward motion without waiting for the bottom of the list. Desktop
          only — on phones the bar has no room for a third control. */}
      {next && (
        <Box
          component="button"
          type="button"
          onClick={() => onSelect(next.brand, next.category)}
          sx={{
            ...pickerSx,
            ml: "auto",
            flexShrink: 0,
            bgcolor: "transparent",
            color: accent.main,
            display: { xs: "none", sm: "inline-flex" },
          }}
        >
          Next: {next.kind === "brand" ? displayNameOf(next.brand) : next.category} →
        </Box>
      )}
    </Box>
  );
};

export default React.memo(StickyBrowseBar);
