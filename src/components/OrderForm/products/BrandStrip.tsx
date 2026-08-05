import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  COLLECTION_COPY,
  getBrandAccent,
  isCollectionKey,
  type BrandRailEntry,
} from "../../../util/brandAccent";
import NewBrandBadge from "./NewBrandBadge";

const SPECIAL_OFFERS_ICON = "https://assets.pupscribe.in/assets/special_offers.png";

export type BrandStripEntry = BrandRailEntry;

interface BrandStripProps {
  /** The rail entry currently selected. */
  entry?: BrandStripEntry;
  /** Product count for the entry, already summed across categories. */
  count: number;
  /** Display name — "Clearance" surfaces as "Special Offers". */
  displayName: string;
  /** Opens the full brand dialog. */
  onOpenDetails?: () => void;
}

/**
 * The strip that sits under the brand rail (desktop) or the brand dropdown
 * (mobile) and says what the selected entry actually *is*: the brand mark, its
 * description from `db.brands`, and the live product count. The rail is for
 * choosing; this is for telling.
 */
const BrandStrip: React.FC<BrandStripProps> = ({
  entry,
  count,
  displayName,
  onOpenDetails,
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";

  if (!entry?.brand) return null;

  const accent = getBrandAccent(entry.brand, entry.color, mode);
  const isCollection = isCollectionKey(entry.brand);
  const copy = COLLECTION_COPY[entry.brand];
  const description = isCollection ? copy?.description : entry.description;
  const logo = entry.image || entry.url;

  const markSx = {
    width: { xs: 44, sm: 52 },
    height: { xs: 44, sm: 52 },
    borderRadius: "8px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  } as const;

  const mark =
    entry.brand === "Pre Orders" ? (
      <Box sx={{ ...markSx, bgcolor: accent.soft }}>
        <ShoppingCartCheckoutIcon sx={{ fontSize: 26, color: accent.main }} />
      </Box>
    ) : entry.brand === "Clearance" ? (
      <Box sx={{ ...markSx, bgcolor: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", p: "5px" }}>
        <Box
          component="img"
          src={SPECIAL_OFFERS_ICON}
          alt="Special Offers"
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    ) : entry.brand === "New Arrivals" ? (
      <Box sx={{ ...markSx, bgcolor: accent.soft }}>
        <AutoAwesomeIcon sx={{ fontSize: 24, color: accent.main }} />
      </Box>
    ) : logo ? (
      // Brand logos are supplied as transparent PNG/SVG drawn for a white
      // ground, so the tile stays white in both themes.
      <Box sx={{ ...markSx, bgcolor: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", p: "4px" }}>
        <Box
          component="img"
          src={logo}
          alt={displayName}
          loading="lazy"
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    ) : (
      <Box
        sx={{
          ...markSx,
          bgcolor: accent.soft,
          color: accent.main,
          fontWeight: 800,
          fontSize: "1rem",
          letterSpacing: "-0.02em",
        }}
      >
        {displayName.slice(0, 2).toUpperCase()}
      </Box>
    );

  const interactive = !!onOpenDetails;

  return (
    <Box
      // A button when it opens the dialog, so keyboard and screen readers get
      // the affordance for free.
      component={interactive ? "button" : "div"}
      type={interactive ? "button" : undefined}
      onClick={onOpenDetails}
      aria-label={interactive ? `About ${displayName}` : undefined}
      sx={{
        mt: 1.5,
        width: "100%",
        textAlign: "left",
        font: "inherit",
        color: "inherit",
        display: "flex",
        alignItems: "stretch",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 0,
        cursor: interactive ? "pointer" : "default",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        ...(interactive && {
          "&:hover": { borderColor: accent.main, boxShadow: 1 },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: accent.main,
            outlineOffset: 2,
          },
        }),
      }}
    >
      <Box sx={{ flex: "0 0 5px", bgcolor: accent.main }} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.25, sm: 1.75 },
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.25, sm: 1.5 },
          minWidth: 0,
          flex: 1,
        }}
      >
        {mark}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: "0.95rem", sm: "1.05rem" },
                lineHeight: 1.2,
              }}
            >
              {displayName}
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
            {entry.is_new && (
              <NewBrandBadge color={accent.main} soft={accent.soft} />
            )}
          </Box>
          {description ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.4,
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
        </Box>
        {interactive && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexShrink: 0,
              color: accent.main,
              fontSize: "0.72rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            <Box component="span">Details</Box>
            <InfoOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(BrandStrip);
