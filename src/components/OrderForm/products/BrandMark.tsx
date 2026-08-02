import React from "react";
import { Box, useTheme } from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  getBrandAccent,
  type BrandRailEntry,
} from "../../../util/brandAccent";

const SPECIAL_OFFERS_ICON = "https://assets.pupscribe.in/assets/special_offers.png";

interface BrandMarkProps {
  entry?: BrandRailEntry;
  /** Display name — used for the alt text and the initials fallback. */
  displayName: string;
  /** Tile edge in px; the glyph inside scales with it. */
  size?: number;
}

/**
 * The square mark for a rail entry: the collection's icon, the brand's logo,
 * or its initials when `db.brands` has no image. Every surface that names a
 * brand — the strip, the end-of-list block, the browse sheet, the sticky bar —
 * draws it the same way.
 */
const BrandMark: React.FC<BrandMarkProps> = ({ entry, displayName, size = 44 }) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";
  const accent = getBrandAccent(entry?.brand, entry?.color, mode);
  const logo = entry?.image || entry?.url;

  const base = {
    width: size,
    height: size,
    borderRadius: `${Math.max(4, Math.round(size / 6))}px`,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  } as const;

  // Brand logos are transparent PNG/SVG drawn for a white ground, so the tile
  // stays white in both themes.
  const plate = {
    ...base,
    bgcolor: "#ffffff",
    border: "1px solid rgba(0,0,0,0.08)",
    p: `${Math.max(2, Math.round(size / 11))}px`,
  } as const;

  if (entry?.brand === "Pre Orders") {
    return (
      <Box sx={{ ...base, bgcolor: accent.soft }}>
        <ShoppingCartCheckoutIcon
          sx={{ fontSize: size * 0.5, color: accent.main }}
        />
      </Box>
    );
  }

  if (entry?.brand === "Clearance") {
    return (
      <Box sx={plate}>
        <Box
          component="img"
          src={SPECIAL_OFFERS_ICON}
          alt="Special Offers"
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    );
  }

  if (entry?.brand === "New Arrivals") {
    return (
      <Box sx={{ ...base, bgcolor: accent.soft }}>
        <AutoAwesomeIcon sx={{ fontSize: size * 0.46, color: accent.main }} />
      </Box>
    );
  }

  if (logo) {
    return (
      <Box sx={plate}>
        <Box
          component="img"
          src={logo}
          alt={displayName}
          loading="lazy"
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...base,
        bgcolor: accent.soft,
        color: accent.main,
        fontWeight: 800,
        fontSize: size * 0.36,
        letterSpacing: "-0.02em",
      }}
    >
      {displayName.slice(0, 2).toUpperCase()}
    </Box>
  );
};

export default React.memo(BrandMark);
