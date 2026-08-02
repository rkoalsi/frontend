import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { getBrandAccent, isCollectionKey, type BrandRailEntry } from "../../util/brandAccent";

interface BrandWallProps {
  entries: BrandRailEntry[];
  activeBrand: string;
  onSelectBrand: (brand: string) => void;
  countsByBrand: { [brand: string]: { [category: string]: number } };
  displayNameOf: (brand?: string) => string;
  /** The categories a brand stocks, already summarised for one line. */
  summaryOf: (brand: string) => string;
}

/**
 * A visual wall of every brand, shown on the landing view of the catalogue.
 *
 * The rail above is a *control* — narrow tabs, or a dropdown on phones. This is
 * the storefront answer to "who do you carry?", which is the first thing a new
 * visitor wants to know and the thing the page never showed them.
 */
const BrandWall: React.FC<BrandWallProps> = ({
  entries,
  activeBrand,
  onSelectBrand,
  countsByBrand,
  displayNameOf,
  summaryOf,
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";

  const brands = entries.filter((e) => !isCollectionKey(e.brand));
  if (brands.length === 0) return null;

  const countOf = (brand: string) =>
    Object.values(countsByBrand[brand] || {}).reduce((a, b) => a + b, 0);

  return (
    <Box sx={{ mt: { xs: 2.5, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.25,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "text.secondary",
          }}
        >
          Browse by brand
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {brands.length} brands
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: { xs: 1.25, sm: 1.5 },
          overflowX: "auto",
          // Edge-to-edge on phones: tiles running off the viewport edge are
          // what tells you the row scrolls.
          mx: { xs: -2, sm: 0 },
          px: { xs: 2, sm: 0 },
          pb: 1,
          scrollSnapType: "x proximity",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {brands.map((entry) => {
          const accent = getBrandAccent(entry.brand, entry.color, mode);
          const logo = entry.image || entry.url;
          const count = countOf(entry.brand);
          const isActive = entry.brand === activeBrand;
          const summary = summaryOf(entry.brand);

          return (
            <Box
              key={entry.brand}
              component="button"
              type="button"
              onClick={() => onSelectBrand(entry.brand)}
              sx={{
                flex: "0 0 auto",
                width: { xs: 132, sm: 148 },
                scrollSnapAlign: "start",
                font: "inherit",
                cursor: "pointer",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                p: { xs: 1.25, sm: 1.5 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: isActive ? accent.main : "divider",
                bgcolor: isActive ? accent.soft : "background.paper",
                transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: 4,
                  borderColor: accent.main,
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: accent.main,
                  outlineOffset: 2,
                },
              }}
            >
              {logo ? (
                // Brand logos are transparent artwork drawn for a white ground.
                <Box
                  sx={{
                    width: { xs: 64, sm: 72 },
                    height: { xs: 64, sm: 72 },
                    borderRadius: "12px",
                    bgcolor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: "6px",
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
              ) : (
                <Box
                  sx={{
                    width: { xs: 64, sm: 72 },
                    height: { xs: 64, sm: 72 },
                    borderRadius: "12px",
                    bgcolor: accent.soft,
                    color: accent.main,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.3rem",
                  }}
                >
                  {displayNameOf(entry.brand).slice(0, 2).toUpperCase()}
                </Box>
              )}

              <Box sx={{ minWidth: 0, width: "100%" }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    lineHeight: 1.2,
                    color: isActive ? accent.main : "text.primary",
                    overflowWrap: "anywhere",
                  }}
                >
                  {displayNameOf(entry.brand)}
                </Typography>
                {summary && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mt: 0.25,
                      fontSize: "0.66rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {summary}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.4,
                    color: accent.main,
                    fontWeight: 700,
                    fontSize: "0.66rem",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {count} products
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default React.memo(BrandWall);
