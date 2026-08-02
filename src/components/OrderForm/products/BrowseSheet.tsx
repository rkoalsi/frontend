import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Drawer from "../../common/ResponsiveDrawer";
import {
  getBrandAccent,
  isCollectionKey,
  type BrandRailEntry,
} from "../../../util/brandAccent";
import { brandTotal } from "../../../util/browseOrder";
import BrandMark from "./BrandMark";

interface BrowseSheetProps {
  open: boolean;
  onClose: () => void;
  /** Every rail entry, in rail order. */
  entries: BrandRailEntry[];
  categoriesByBrand: { [brand: string]: string[] };
  /** productCounts — per brand, per category. */
  counts: { [brand: string]: { [category: string]: number } };
  activeBrand: string;
  activeCategory: string;
  displayNameOf: (brand?: string) => string;
  /** Selecting always resolves to a concrete brand + category pair. */
  onSelect: (brand: string, category: string) => void;
}

/**
 * The whole rail, reachable from any scroll position.
 *
 * The brand rail only exists at the top of the page, so switching brand from
 * three hundred products down meant scrolling all the way back up. This is the
 * same information as the rail — every brand, its categories, its counts —
 * opened from the floating button beside the cart. Selecting a brand expands
 * its categories in place; selecting a category navigates and closes.
 */
const BrowseSheet: React.FC<BrowseSheetProps> = ({
  open,
  onClose,
  entries,
  categoriesByBrand,
  counts,
  activeBrand,
  activeCategory,
  displayNameOf,
  onSelect,
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";
  const [filter, setFilter] = useState("");
  // Which brand's categories are showing. Defaults to wherever the user
  // already is, so the sheet opens on their current position.
  const [expanded, setExpanded] = useState(activeBrand);
  const activeRowRef = useRef<HTMLDivElement | null>(null);

  // Re-opening the sheet should always show the current position, not the
  // state left over from the last time it was open.
  useEffect(() => {
    if (open) {
      setFilter("");
      setExpanded(activeBrand);
    }
  }, [open, activeBrand]);

  // Scroll the current brand into view — with thirty brands it is otherwise
  // off-screen the moment the list is long enough to matter.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      activeRowRef.current?.scrollIntoView({ block: "center" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [open]);

  const query = filter.trim().toLowerCase();

  // Matching categories as well as brand names means "treats" finds every
  // brand that carries them, which is how people actually look for things.
  const visible = useMemo(() => {
    if (!query) return entries;
    return entries.filter(
      (e) =>
        displayNameOf(e.brand).toLowerCase().includes(query) ||
        (categoriesByBrand[e.brand] ?? []).some((c) =>
          c.toLowerCase().includes(query)
        )
    );
  }, [entries, query, displayNameOf, categoriesByBrand]);

  const collections = useMemo(
    () => visible.filter((e) => isCollectionKey(e.brand)),
    [visible]
  );
  const brands = useMemo(
    () => visible.filter((e) => !isCollectionKey(e.brand)),
    [visible]
  );

  const choose = useCallback(
    (brand: string, category: string) => {
      onSelect(brand, category);
      onClose();
    },
    [onSelect, onClose]
  );

  const renderRow = (entry: BrandRailEntry) => {
    const accent = getBrandAccent(entry.brand, entry.color, mode);
    const isActive = entry.brand === activeBrand;
    // While filtering, every match is open — the categories are the reason the
    // row survived the filter, so hiding them behind a tap makes no sense.
    const isExpanded = query ? true : entry.brand === expanded;
    const categories = categoriesByBrand[entry.brand] ?? [];
    const total = brandTotal(counts, entry.brand);
    const name = displayNameOf(entry.brand);

    return (
      <Box key={entry.brand} ref={isActive ? activeRowRef : undefined}>
        <Box
          component="button"
          type="button"
          onClick={() => {
            // A brand with no categories to choose between navigates straight
            // away rather than expanding into an empty list.
            if (categories.length <= 1) {
              choose(entry.brand, categories[0] ?? "");
            } else {
              setExpanded(isExpanded ? "" : entry.brand);
            }
          }}
          aria-expanded={categories.length > 1 ? isExpanded : undefined}
          sx={{
            width: "100%",
            textAlign: "left",
            font: "inherit",
            color: "inherit",
            border: "none",
            bgcolor: isActive ? accent.soft : "transparent",
            boxShadow: isActive ? `inset 3px 0 0 ${accent.main}` : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.25,
            "&:hover": { bgcolor: isActive ? accent.soft : "action.hover" },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: accent.main,
              outlineOffset: -2,
            },
          }}
        >
          <BrandMark entry={entry} displayName={name} size={36} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.88rem",
                lineHeight: 1.3,
                overflowWrap: "anywhere",
              }}
            >
              {name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: "tabular-nums", display: "block" }}
            >
              {total} {total === 1 ? "product" : "products"}
              {categories.length > 1 ? ` in ${categories.length} categories` : ""}
            </Typography>
            {/* What's actually inside, on one clamped line — the row is worth
                expanding only if you can already see what it holds. */}
            {!isExpanded && categories.length > 1 && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.disabled",
                  fontSize: "0.68rem",
                  lineHeight: 1.35,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {categories.join(" · ")}
              </Typography>
            )}
          </Box>
          {categories.length > 1 && (
            <ExpandMoreIcon
              sx={{
                fontSize: 20,
                flexShrink: 0,
                color: isExpanded ? accent.main : "text.secondary",
                transform: isExpanded ? "rotate(180deg)" : "none",
                transition: "transform 0.18s ease",
              }}
            />
          )}
        </Box>

        {isExpanded && categories.length > 1 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              px: 2,
              pb: 1.5,
              pt: 0.25,
            }}
          >
            {categories.map((cat) => {
              const on = isActive && cat === activeCategory;
              return (
                <Box
                  key={cat}
                  component="button"
                  type="button"
                  onClick={() => choose(entry.brand, cat)}
                  sx={{
                    font: "inherit",
                    fontSize: "0.74rem",
                    fontWeight: on ? 700 : 400,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: on ? accent.main : "divider",
                    bgcolor: on ? accent.soft : "background.paper",
                    color: on ? accent.main : "text.secondary",
                    cursor: "pointer",
                    "&:hover": { borderColor: accent.main, color: accent.main },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: accent.main,
                      outlineOffset: 2,
                    },
                  }}
                >
                  {cat} ({counts[entry.brand]?.[cat] ?? 0})
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    );
  };

  const sectionLabel = (text: string) => (
    <Typography
      sx={{
        px: 2,
        pt: 1.5,
        pb: 0.5,
        fontSize: "0.62rem",
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "text.secondary",
      }}
    >
      {text}
    </Typography>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 380 },
            maxWidth: "100%",
            // The side drawer owns the full viewport height on desktop; the
            // bottom-sheet override in ResponsiveDrawer replaces this on phones.
            height: { sm: "100%" },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
              Browse
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ ml: "auto" }}
              aria-label="Close browse"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            size="small"
            fullWidth
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter brands…"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              // 16px keeps iOS from zooming the viewport on focus.
              "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "1rem" },
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
          {visible.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 3, textAlign: "center" }}
            >
              No brands match “{filter}”.
            </Typography>
          )}
          {collections.length > 0 && sectionLabel("Collections")}
          {collections.map(renderRow)}
          {brands.length > 0 && sectionLabel("Brands")}
          {brands.map(renderRow)}
        </Box>
      </Box>
    </Drawer>
  );
};

export default React.memo(BrowseSheet);
