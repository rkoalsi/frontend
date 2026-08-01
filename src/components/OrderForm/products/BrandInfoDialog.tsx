import React, { useCallback } from "react";
import { Box, Chip, Dialog, IconButton, Typography, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  COLLECTION_COPY,
  getBrandAccent,
  isCollectionKey,
  type BrandRailEntry,
} from "../../../util/brandAccent";
import {
  snapScrollerSx,
  snapSlideSx,
  useSnapCarousel,
} from "../../../hooks/useSnapCarousel";

const SPECIAL_OFFERS_ICON = "https://assets.pupscribe.in/assets/special_offers.png";

interface BrandInfoDialogProps {
  open: boolean;
  onClose: () => void;
  /** Every rail entry, in rail order — one swipeable panel each. */
  entries: BrandRailEntry[];
  activeBrand: string;
  /** Swiping/arrowing to a panel selects that brand behind the dialog too. */
  onSelectBrand: (brand: string) => void;
  /** productCounts — per brand, per category. */
  countsByBrand: { [brand: string]: { [category: string]: number } };
  /** "Clearance" surfaces as "Special Offers". */
  displayNameOf: (brand?: string) => string;
  /** Jumping straight to a category is the point of the chips being tappable. */
  onCategorySelect?: (category: string) => void;
}

/**
 * The full brand story: a masthead built from `secondary_image_url` (or an
 * accent wash when there isn't one), the logo breaking the masthead's lower
 * edge, the description in full, and the catalogue broken down by category.
 *
 * Every brand is a panel in a scroll-snapped strip, so the dialog is browsed
 * the same way the spotlight card is — swipe sideways for the next brand.
 * Each panel scrolls vertically on its own, so a long description never grows
 * the sheet past the viewport.
 */
const BrandInfoDialog: React.FC<BrandInfoDialogProps> = ({
  open,
  onClose,
  entries,
  activeBrand,
  onSelectBrand,
  countsByBrand,
  displayNameOf,
  onCategorySelect,
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";
  const isDark = mode === "dark";
  const paper = theme.palette.background.paper;

  const activeIndex = Math.max(
    0,
    entries.findIndex((e) => e.brand === activeBrand)
  );

  const handleIndexChange = useCallback(
    (index: number) => {
      const entry = entries[index];
      if (entry && entry.brand !== activeBrand) onSelectBrand(entry.brand);
    },
    [entries, activeBrand, onSelectBrand]
  );

  const { ref: scrollerRef, onScroll, onPointerDown } = useSnapCarousel({
    activeIndex,
    count: entries.length,
    onIndexChange: handleIndexChange,
  });

  const go = useCallback(
    (delta: number) => {
      const next = entries[activeIndex + delta];
      if (next) onSelectBrand(next.brand);
    },
    [entries, activeIndex, onSelectBrand]
  );

  // Arrow keys move between brands, matching the swipe.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    },
    [go]
  );

  if (entries.length === 0) return null;

  const activeEntry = entries[activeIndex];
  const activeAccent = getBrandAccent(
    activeEntry?.brand,
    activeEntry?.color,
    mode
  );
  const prevEntry = entries[activeIndex - 1];
  const nextEntry = entries[activeIndex + 1];

  const markSx = {
    width: { xs: 72, sm: 84 },
    height: { xs: 72, sm: 84 },
    borderRadius: 3,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    // Lifts the mark off the masthead it overlaps.
    boxShadow: isDark
      ? "0 8px 24px rgba(10,6,32,0.6)"
      : "0 8px 24px rgba(70,51,184,0.18)",
  } as const;

  const renderMark = (entry: BrandRailEntry, accentMain: string) => {
    const logo = entry.image || entry.url;
    if (entry.brand === "Pre Orders") {
      return (
        <Box sx={{ ...markSx, bgcolor: paper, color: accentMain }}>
          <ShoppingCartCheckoutIcon sx={{ fontSize: { xs: 34, sm: 40 } }} />
        </Box>
      );
    }
    if (entry.brand === "Clearance") {
      return (
        <Box sx={{ ...markSx, bgcolor: "#ffffff", p: "10px" }}>
          <Box
            component="img"
            src={SPECIAL_OFFERS_ICON}
            alt=""
            sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </Box>
      );
    }
    if (entry.brand === "New Arrivals") {
      return (
        <Box sx={{ ...markSx, bgcolor: paper, color: accentMain }}>
          <AutoAwesomeIcon sx={{ fontSize: { xs: 32, sm: 38 } }} />
        </Box>
      );
    }
    if (logo) {
      // Brand logos are transparent artwork drawn for a white ground, so the
      // tile stays white in both themes.
      return (
        <Box sx={{ ...markSx, bgcolor: "#ffffff", p: { xs: "8px", sm: "10px" } }}>
          <Box
            component="img"
            src={logo}
            alt=""
            loading="lazy"
            sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </Box>
      );
    }
    return (
      <Box
        sx={{
          ...markSx,
          bgcolor: paper,
          color: accentMain,
          fontWeight: 800,
          fontSize: { xs: "1.5rem", sm: "1.75rem" },
          letterSpacing: "-0.03em",
        }}
      >
        {displayNameOf(entry.brand).slice(0, 2).toUpperCase()}
      </Box>
    );
  };

  const stat = (value: string, label: string, accentMain: string) => (
    <Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.15rem", sm: "1.3rem" },
          lineHeight: 1.15,
          color: accentMain,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: "0.63rem",
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  const navButtonSx = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
    color: "#fff",
    bgcolor: "rgba(0,0,0,0.38)",
    backdropFilter: "blur(6px)",
    "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
    "&.Mui-disabled": { opacity: 0, pointerEvents: "none" },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="brand-info-title"
      onKeyDown={handleKeyDown}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(4px)",
            backgroundColor: isDark ? "rgba(10,6,32,0.7)" : "rgba(28,26,51,0.45)",
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          // A fixed height, not a max — panels of different lengths must not
          // resize the sheet as you swipe between them.
          height: { xs: "86vh", sm: "min(86vh, 780px)" },
          m: { xs: 1.5, sm: 2 },
          width: { xs: "calc(100% - 24px)", sm: "calc(100% - 32px)" },
          maxWidth: { xs: "calc(100% - 24px)", sm: 600 },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        aria-label="Close"
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 4,
          color: "#fff",
          bgcolor: "rgba(0,0,0,0.38)",
          backdropFilter: "blur(6px)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <IconButton
        onClick={() => go(-1)}
        disabled={!prevEntry}
        aria-label={
          prevEntry ? `Previous brand: ${displayNameOf(prevEntry.brand)}` : "Previous brand"
        }
        sx={{ ...navButtonSx, left: 8 }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        onClick={() => go(1)}
        disabled={!nextEntry}
        aria-label={nextEntry ? `Next brand: ${displayNameOf(nextEntry.brand)}` : "Next brand"}
        sx={{ ...navButtonSx, right: 8 }}
      >
        <ChevronRightIcon />
      </IconButton>

      <Box
        ref={scrollerRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        role="group"
        aria-roledescription="carousel"
        aria-label="Brands"
        sx={{ ...snapScrollerSx, flex: 1, minHeight: 0 }}
      >
        {entries.map((entry) => {
          const accent = getBrandAccent(entry.brand, entry.color, mode);
          const collection = isCollectionKey(entry.brand);
          const description = collection
            ? COLLECTION_COPY[entry.brand]?.description
            : entry.description;
          const banner = entry.secondary_image_url;
          const counts = countsByBrand[entry.brand] || {};
          const count = Object.values(counts).reduce((a, b) => a + b, 0);
          const categories = Object.entries(counts)
            .filter(([, n]) => n > 0)
            .sort((a, b) => b[1] - a[1]);
          const isActive = entry.brand === activeBrand;

          return (
            <Box
              key={entry.brand}
              aria-hidden={isActive ? undefined : true}
              // One scroll region per panel — the mark overlaps the masthead
              // edge, so the two must scroll together or the overlap is clipped.
              sx={{
                ...snapSlideSx,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {/* ── Masthead ───────────────────────────────────────────────
                  The brand's own banner when there is one, otherwise a wash in
                  the brand's accent so the header reads the same either way. */}
              <Box
                sx={{
                  position: "relative",
                  flexShrink: 0,
                  height: banner ? { xs: 196, sm: 248 } : { xs: 96, sm: 116 },
                  background: banner
                    ? undefined
                    : `linear-gradient(135deg, ${accent.soft} 0%, ${accent.main}22 55%, transparent 100%), ${paper}`,
                }}
              >
                {banner && (
                  <Box
                    component="img"
                    src={banner}
                    alt=""
                    loading="lazy"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                {/* Scrim fades the masthead into the sheet so the overlapping
                    mark and the accent rule never fight the artwork. */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: banner
                      ? `linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 22%, transparent 58%, ${paper} 100%)`
                      : `linear-gradient(to bottom, transparent 55%, ${paper} 100%)`,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 3,
                    bgcolor: accent.main,
                    opacity: 0.9,
                  }}
                />
              </Box>

              {/* Content. Positioned so it paints above the masthead's
                  absolutely positioned scrim and accent rule. */}
              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  px: { xs: 2.25, sm: 3.5 },
                  pb: { xs: 3, sm: 3.5 },
                }}
              >
                {/* Mark breaks the masthead edge — the one deliberately bold
                    move. */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: { xs: 1.75, sm: 2.25 },
                    mt: { xs: -4, sm: -5 },
                    position: "relative",
                  }}
                >
                  {renderMark(entry, accent.main)}
                  <Box sx={{ minWidth: 0, pb: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontSize: "0.62rem",
                        color: accent.main,
                      }}
                    >
                      {collection ? "Collection" : "Brand"}
                    </Typography>
                    <Typography
                      id={isActive ? "brand-info-title" : undefined}
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.35rem", sm: "1.6rem" },
                        lineHeight: 1.15,
                        letterSpacing: "-0.02em",
                        textWrap: "balance",
                      }}
                    >
                      {displayNameOf(entry.brand)}
                    </Typography>
                  </Box>
                </Box>

                {/* Stats */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 3, sm: 4 },
                    mt: 2.5,
                    py: 2,
                    borderTop: "1px solid",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {stat(String(count), count === 1 ? "Product" : "Products", accent.main)}
                  {categories.length > 0 &&
                    stat(
                      String(categories.length),
                      categories.length === 1 ? "Category" : "Categories",
                      accent.main
                    )}
                </Box>

                {description && (
                  <Typography
                    sx={{
                      mt: 2.5,
                      fontSize: { xs: "0.9rem", sm: "0.95rem" },
                      lineHeight: 1.7,
                      color: "text.secondary",
                      maxWidth: "62ch",
                    }}
                  >
                    {description}
                  </Typography>
                )}

                {categories.length > 0 && (
                  <Box sx={{ mt: 3.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mb: 1.5,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontSize: "0.63rem",
                        color: "text.secondary",
                      }}
                    >
                      {onCategorySelect ? "Jump to a category" : "Categories"}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {categories.map(([category, n]) => (
                        <Chip
                          key={category}
                          label={
                            <Box
                              component="span"
                              sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}
                            >
                              <Box component="span">{category}</Box>
                              <Box
                                component="span"
                                sx={{ opacity: 0.65, fontVariantNumeric: "tabular-nums" }}
                              >
                                {n}
                              </Box>
                            </Box>
                          }
                          onClick={
                            onCategorySelect
                              ? () => {
                                  // The panel may not be the selected brand yet
                                  // — pick it up before the category applies.
                                  if (!isActive) onSelectBrand(entry.brand);
                                  onCategorySelect(category);
                                  onClose();
                                }
                              : undefined
                          }
                          sx={{
                            height: 34,
                            borderRadius: 999,
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            bgcolor: "transparent",
                            color: "text.primary",
                            border: "1px solid",
                            borderColor: "divider",
                            transition: "all 0.15s ease",
                            ...(onCategorySelect && {
                              "&:hover": {
                                bgcolor: accent.soft,
                                borderColor: accent.main,
                                color: accent.main,
                              },
                            }),
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Position + swipe affordance, pinned below the panels. */}
      {entries.length > 1 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, fontSize: "0.7rem", whiteSpace: "nowrap" }}
          >
            Swipe for more brands
          </Typography>
          <Box
            sx={{
              flex: 1,
              minWidth: 24,
              height: 3,
              borderRadius: 999,
              bgcolor: "divider",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${(activeIndex / entries.length) * 100}%`,
                width: `${(1 / entries.length) * 100}%`,
                bgcolor: activeAccent.main,
                borderRadius: 999,
                transition: "left 0.3s ease",
              }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          >
            {activeIndex + 1} / {entries.length}
          </Typography>
        </Box>
      )}
    </Dialog>
  );
};

export default React.memo(BrandInfoDialog);
