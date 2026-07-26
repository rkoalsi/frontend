import React from "react";
import { Box, Chip, Dialog, IconButton, Typography, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { COLLECTION_COPY, getBrandAccent, isCollectionKey } from "../../../util/brandAccent";
import type { BrandStripEntry } from "./BrandStrip";

const SPECIAL_OFFERS_ICON = "https://assets.pupscribe.in/assets/special_offers.png";

interface BrandInfoDialogProps {
  open: boolean;
  onClose: () => void;
  entry?: BrandStripEntry;
  displayName: string;
  count: number;
  /** Per-category product counts for this brand, from productCounts[brand]. */
  categoryCounts?: { [category: string]: number };
  /** Jumping straight to a category is the point of the chips being tappable. */
  onCategorySelect?: (category: string) => void;
}

/**
 * The full brand story: a masthead built from `secondary_image_url` (or an
 * accent wash when there isn't one), the logo breaking the masthead's lower
 * edge, the description in full, and the catalogue broken down by category.
 *
 * A centred card at every size, with its own scroll region so a long
 * description never grows the sheet past the viewport.
 */
const BrandInfoDialog: React.FC<BrandInfoDialogProps> = ({
  open,
  onClose,
  entry,
  displayName,
  count,
  categoryCounts,
  onCategorySelect,
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";
  const isDark = mode === "dark";

  if (!entry?.brand) return null;

  const accent = getBrandAccent(entry.brand, entry.color, mode);
  const isCollection = isCollectionKey(entry.brand);
  const description = isCollection
    ? COLLECTION_COPY[entry.brand]?.description
    : entry.description;
  const logo = entry.image || entry.url;
  const banner = entry.secondary_image_url;

  const categories = Object.entries(categoryCounts || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  const paper = theme.palette.background.paper;

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

  const mark =
    entry.brand === "Pre Orders" ? (
      <Box sx={{ ...markSx, bgcolor: paper, color: accent.main }}>
        <ShoppingCartCheckoutIcon sx={{ fontSize: { xs: 34, sm: 40 } }} />
      </Box>
    ) : entry.brand === "Clearance" ? (
      <Box sx={{ ...markSx, bgcolor: "#ffffff", p: "10px" }}>
        <Box
          component="img"
          src={SPECIAL_OFFERS_ICON}
          alt=""
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    ) : entry.brand === "New Arrivals" ? (
      <Box sx={{ ...markSx, bgcolor: paper, color: accent.main }}>
        <AutoAwesomeIcon sx={{ fontSize: { xs: 32, sm: 38 } }} />
      </Box>
    ) : logo ? (
      // Brand logos are transparent artwork drawn for a white ground, so the
      // tile stays white in both themes.
      <Box sx={{ ...markSx, bgcolor: "#ffffff", p: { xs: "8px", sm: "10px" } }}>
        <Box
          component="img"
          src={logo}
          alt=""
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    ) : (
      <Box
        sx={{
          ...markSx,
          bgcolor: paper,
          color: accent.main,
          fontWeight: 800,
          fontSize: { xs: "1.5rem", sm: "1.75rem" },
          letterSpacing: "-0.03em",
        }}
      >
        {displayName.slice(0, 2).toUpperCase()}
      </Box>
    );

  const stat = (value: string, label: string) => (
    <Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.15rem", sm: "1.3rem" },
          lineHeight: 1.15,
          color: accent.main,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="brand-info-title"
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
          maxHeight: { xs: "90vh", sm: "min(88vh, 780px)" },
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
          zIndex: 3,
          color: "#fff",
          bgcolor: "rgba(0,0,0,0.38)",
          backdropFilter: "blur(6px)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      {/* One scroll region for the whole sheet — the mark overlaps the masthead
          edge, so the two must scroll together or the overlap gets clipped. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
      {/* ── Masthead ───────────────────────────────────────────────────────
          The brand's own banner when there is one, otherwise a wash in the
          brand's accent so the header reads the same either way. */}
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
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {/* Scrim fades the masthead into the sheet so the overlapping mark and
            the accent rule below it never fight the artwork. */}
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

      {/* Content. Positioned so it paints above the masthead's absolutely
          positioned scrim and accent rule. */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 2.25, sm: 3.5 },
          pb: { xs: 3, sm: 3.5 },
        }}
      >
        {/* Mark breaks the masthead edge — the one deliberately bold move. */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: { xs: 1.75, sm: 2.25 },
            mt: { xs: -4, sm: -5 },
            position: "relative",
          }}
        >
          {mark}
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
              {isCollection ? "Collection" : "Brand"}
            </Typography>
            <Typography
              id="brand-info-title"
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.35rem", sm: "1.6rem" },
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                textWrap: "balance",
              }}
            >
              {displayName}
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
          {stat(String(count), count === 1 ? "Product" : "Products")}
          {categories.length > 0 &&
            stat(
              String(categories.length),
              categories.length === 1 ? "Category" : "Categories"
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
                    <Box component="span" sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
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
    </Dialog>
  );
};

export default React.memo(BrandInfoDialog);
