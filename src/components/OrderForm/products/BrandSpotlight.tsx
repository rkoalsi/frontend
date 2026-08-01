import React, { useCallback, useEffect } from "react";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SwipeIcon from "@mui/icons-material/Swipe";
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

/** Categories named on the card before the rest collapse into a "+n" chip. */
const CATEGORY_CHIP_LIMIT = 4;

/** Swipe hint is a first-run affordance — once used, it never comes back. */
const HINT_KEY = "of_brand_swipe_hint_v1";

const readHintDismissed = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
};

const writeHintDismissed = (): void => {
  try {
    window.localStorage.setItem(HINT_KEY, "1");
  } catch {
    /* private mode — the hint just shows again next visit */
  }
};

interface BrandSpotlightProps {
  /** Every rail entry, in rail order. One slide each. */
  entries: BrandRailEntry[];
  activeBrand: string;
  /** Swiping/arrowing to a slide selects that brand. */
  onSelectBrand: (brand: string) => void;
  /** productCounts — per brand, per category. */
  countsByBrand: { [brand: string]: { [category: string]: number } };
  /** "Clearance" surfaces as "Special Offers". */
  displayNameOf: (brand?: string) => string;
  /** Tapping a category chip jumps the grid straight to it. */
  onSelectCategory?: (category: string) => void;
  /** Opens the full brand dialog. */
  onOpenDetails?: () => void;
}

/**
 * The card under the brand rail that says what the selected entry actually
 * *is* — mark, description, live product count and the categories it stocks.
 *
 * It is also the rail itself on small screens: every entry is a slide in a
 * scroll-snapped strip, so swiping sideways moves to the next brand. The rail
 * (tabs on desktop, dropdown on mobile) and this carousel are two views of one
 * selection — moving either moves the other.
 */
const BrandSpotlight: React.FC<BrandSpotlightProps> = ({
  entries,
  activeBrand,
  onSelectBrand,
  countsByBrand,
  displayNameOf,
  onSelectCategory,
  onOpenDetails,
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";

  const [hintDismissed, setHintDismissed] = React.useState(true);
  useEffect(() => setHintDismissed(readHintDismissed()), []);

  const dismissHint = useCallback(() => {
    setHintDismissed((prev) => {
      if (!prev) writeHintDismissed();
      return true;
    });
  }, []);

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

  const {
    ref: scrollerRef,
    onScroll: handleScroll,
    onPointerDown: carouselPointerDown,
  } = useSnapCarousel({
    activeIndex,
    count: entries.length,
    onIndexChange: handleIndexChange,
  });

  // A real finger on the strip retires the hint.
  const handlePointerDown = useCallback(() => {
    carouselPointerDown();
    dismissHint();
  }, [carouselPointerDown, dismissHint]);

  const go = useCallback(
    (delta: number) => {
      const next = entries[activeIndex + delta];
      if (!next) return;
      dismissHint();
      onSelectBrand(next.brand);
    },
    [entries, activeIndex, onSelectBrand, dismissHint]
  );

  if (entries.length === 0) return null;

  const countOf = (brand: string) =>
    Object.values(countsByBrand[brand] || {}).reduce((a, b) => a + b, 0);

  const prevEntry = entries[activeIndex - 1];
  const nextEntry = entries[activeIndex + 1];
  const activeAccent = getBrandAccent(
    entries[activeIndex]?.brand,
    entries[activeIndex]?.color,
    mode
  );

  const markSx = {
    width: { xs: 48, sm: 56 },
    height: { xs: 48, sm: 56 },
    borderRadius: "8px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    // Lifts the mark off the banner band it overlaps.
    boxShadow:
      mode === "dark"
        ? "0 6px 18px rgba(10,6,32,0.55)"
        : "0 6px 18px rgba(70,51,184,0.16)",
  } as const;

  const renderMark = (entry: BrandRailEntry, accentMain: string, accentSoft: string) => {
    const logo = entry.image || entry.url;
    if (entry.brand === "Pre Orders") {
      return (
        <Box sx={{ ...markSx, bgcolor: accentSoft }}>
          <ShoppingCartCheckoutIcon sx={{ fontSize: 28, color: accentMain }} />
        </Box>
      );
    }
    if (entry.brand === "Clearance") {
      return (
        <Box
          sx={{
            ...markSx,
            bgcolor: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            p: "5px",
          }}
        >
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
        <Box sx={{ ...markSx, bgcolor: accentSoft }}>
          <AutoAwesomeIcon sx={{ fontSize: 26, color: accentMain }} />
        </Box>
      );
    }
    if (logo) {
      // Brand logos are transparent artwork drawn for a white ground, so the
      // tile stays white in both themes.
      return (
        <Box
          sx={{
            ...markSx,
            bgcolor: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            p: "4px",
          }}
        >
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
          bgcolor: accentSoft,
          color: accentMain,
          fontWeight: 800,
          fontSize: "1.05rem",
          letterSpacing: "-0.02em",
        }}
      >
        {displayNameOf(entry.brand).slice(0, 2).toUpperCase()}
      </Box>
    );
  };

  return (
    <Box
      role="group"
      aria-roledescription="carousel"
      aria-label="Brands"
      sx={{
        mt: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
        // The accent rule reads as "this whole card belongs to that brand".
        borderTop: "3px solid",
        borderTopColor: activeAccent.main,
        transition: "border-top-color 0.25s ease",
      }}
    >
      <Box
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        sx={{ ...snapScrollerSx, overflowY: "hidden" }}
      >
        {entries.map((entry) => {
          const accent = getBrandAccent(entry.brand, entry.color, mode);
          const collection = isCollectionKey(entry.brand);
          const copy = COLLECTION_COPY[entry.brand];
          const description = collection ? copy?.description : entry.description;
          const banner = entry.secondary_image_url;
          const count = countOf(entry.brand);
          const categories = collection
            ? []
            : Object.entries(countsByBrand[entry.brand] || {})
                .filter(([, n]) => n > 0)
                .sort((a, b) => b[1] - a[1]);
          const shownCategories = categories.slice(0, CATEGORY_CHIP_LIMIT);
          const restCategories = categories.length - shownCategories.length;
          const isActive = entry.brand === activeBrand;

          return (
            <Box key={entry.brand} aria-hidden={isActive ? undefined : true} sx={snapSlideSx}>
              {/* ── Banner band ─────────────────────────────────────────────
                  The brand's own artwork when there is one, an accent wash
                  when there isn't. The space is held either way — this is
                  where per-brand (and later per-category) banners live, and
                  a card that changes height as you swipe reads as broken. */}
              <Box
                sx={{
                  position: "relative",
                  height: { xs: 128, sm: 140, md: 108 },
                  background: banner
                    ? undefined
                    : `linear-gradient(135deg, ${accent.soft} 0%, ${accent.main}22 55%, transparent 100%), ${theme.palette.background.paper}`,
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
                {/* Scrim fades the band into the card so the overlapping mark
                    never fights the artwork. */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: banner
                      ? `linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 30%, transparent 62%, ${theme.palette.background.paper} 100%)`
                      : `linear-gradient(to bottom, transparent 50%, ${theme.palette.background.paper} 100%)`,
                  }}
                />
                {onOpenDetails && (
                  <Button
                    onClick={() => {
                      if (!isActive) onSelectBrand(entry.brand);
                      dismissHint();
                      onOpenDetails();
                    }}
                    size="small"
                    startIcon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
                    aria-label={`About ${displayNameOf(entry.brand)}`}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      borderRadius: 999,
                      px: 1.25,
                      py: 0.25,
                      color: "#fff",
                      bgcolor: "rgba(0,0,0,0.45)",
                      backdropFilter: "blur(6px)",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.62)" },
                      // Until the card has been used once, the button asks to
                      // be noticed — this is the affordance people were missing.
                      ...(!hintDismissed && {
                        animation: "brandInfoPulse 2.4s ease-in-out 3",
                      }),
                      "@keyframes brandInfoPulse": {
                        "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,255,255,0)" },
                        "50%": { boxShadow: "0 0 0 5px rgba(255,255,255,0.28)" },
                      },
                    }}
                  >
                    Brand info
                  </Button>
                )}
              </Box>

              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: { xs: 1.5, sm: 2 },
                  px: { xs: 1.75, sm: 2.25 },
                  pb: { xs: 1.75, sm: 2 },
                  // Mark breaks the band's lower edge.
                  mt: { xs: -3.5, sm: -4 },
                }}
              >
                {renderMark(entry, accent.main, accent.soft)}

                <Box sx={{ minWidth: 0, flex: 1, pt: { xs: 2.5, sm: 3 } }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontSize: "0.6rem",
                      color: accent.main,
                    }}
                  >
                    {collection ? "Collection" : "Brand"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                      mt: 0.25,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {displayNameOf(entry.brand)}
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        px: 1,
                        py: "2px",
                        borderRadius: 999,
                        bgcolor: accent.soft,
                        color: accent.main,
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count} {count === 1 ? "product" : "products"}
                    </Box>
                  </Box>

                  {description ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                        fontSize: { xs: "0.78rem", sm: "0.82rem" },
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {description}
                    </Typography>
                  ) : null}

                  {/* What this brand actually sells — the question the card
                      exists to answer, so it is spelled out rather than left
                      behind the info button. */}
                  {collection && copy?.short ? (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "inline-block",
                        mt: 1,
                        px: 1,
                        py: "3px",
                        borderRadius: 999,
                        border: "1px solid",
                        borderColor: "divider",
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.72rem",
                      }}
                    >
                      {copy.short}
                    </Typography>
                  ) : shownCategories.length > 0 ? (
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 700, fontSize: "0.68rem", mr: 0.25 }}
                      >
                        Sells
                      </Typography>
                      {shownCategories.map(([category, n]) => (
                        <Box
                          key={category}
                          component={onSelectCategory ? "button" : "span"}
                          type={onSelectCategory ? "button" : undefined}
                          onClick={
                            onSelectCategory && isActive
                              ? () => onSelectCategory(category)
                              : undefined
                          }
                          sx={{
                            font: "inherit",
                            px: 1,
                            py: "3px",
                            borderRadius: 999,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "transparent",
                            color: "text.secondary",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            cursor: onSelectCategory ? "pointer" : "default",
                            transition: "all 0.15s ease",
                            ...(onSelectCategory && {
                              "&:hover": {
                                bgcolor: accent.soft,
                                borderColor: accent.main,
                                color: accent.main,
                              },
                            }),
                          }}
                        >
                          {category}{" "}
                          <Box component="span" sx={{ opacity: 0.65 }}>
                            {n}
                          </Box>
                        </Box>
                      ))}
                      {restCategories > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.72rem", fontWeight: 600 }}
                        >
                          +{restCategories} more
                        </Typography>
                      )}
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ── Controls ─────────────────────────────────────────────────────
          Arrows, position, and the info button. Outside the scroller so they
          stay put while the slides move under them. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: { xs: 1, sm: 1.5 },
          py: 0.75,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
        }}
      >
        <IconButton
          size="small"
          onClick={() => go(-1)}
          disabled={!prevEntry}
          aria-label={
            prevEntry ? `Previous brand: ${displayNameOf(prevEntry.brand)}` : "Previous brand"
          }
          sx={{ color: "text.secondary" }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1 }}>
          {/* A dot per brand would be twenty dots; a track reads at a glance. */}
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
              fontSize: "0.68rem",
            }}
          >
            {activeIndex + 1} / {entries.length}
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={() => go(1)}
          disabled={!nextEntry}
          aria-label={nextEntry ? `Next brand: ${displayNameOf(nextEntry.brand)}` : "Next brand"}
          sx={{ color: "text.secondary" }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>

      </Box>

      {/* First-run nudge. Retired the moment the strip is touched. */}
      {!hintDismissed && entries.length > 1 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            py: 0.6,
            borderTop: "1px dashed",
            borderColor: "divider",
            color: "text.secondary",
          }}
        >
          <SwipeIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>
            Swipe to see every brand — tap Brand info for the full story
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(BrandSpotlight);
