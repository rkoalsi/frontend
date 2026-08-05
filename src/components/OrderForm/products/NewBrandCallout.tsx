import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { getBrandAccent, type BrandRailEntry } from "../../../util/brandAccent";

const DISMISS_KEY = "orderform.newBrandCallout.dismissed";

/** Brands the user has already waved away, as a set of brand names. */
function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface NewBrandCalloutProps {
  /** The full rail list; the callout picks the new brands out of it. */
  entries: BrandRailEntry[];
  /** Brand currently being browsed — no point announcing where you already are. */
  activeBrand: string;
  onSelectBrand: (brand: string) => void;
  displayNameOf: (brand: string) => string;
  countOf: (brand: string) => number;
}

/**
 * Announces a brand that has just joined the catalogue, above the product grid.
 * The NEW badge on the rail only works for someone already scanning the rail;
 * this is for everyone else.
 *
 * One brand at a time (the first new one that isn't the active brand), and
 * dismissals stick per brand in localStorage so it never nags twice for the same
 * launch. The badge on the rail carries on regardless — dismissing the callout
 * hides the announcement, not the fact.
 */
const NewBrandCallout: React.FC<NewBrandCalloutProps> = ({
  entries,
  activeBrand,
  onSelectBrand,
  displayNameOf,
  countOf,
}) => {
  const theme = useTheme();
  const mode = theme.palette.mode === "dark" ? "dark" : "light";
  // Read on mount rather than during render: localStorage is unavailable during
  // SSR, and reading it in render would desync the first client paint.
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
    setHydrated(true);
  }, []);

  const target = entries.find(
    (e) => e.is_new && e.brand !== activeBrand && !dismissed.includes(e.brand)
  );

  const dismiss = useCallback(() => {
    if (!target) return;
    const next = [...readDismissed(), target.brand];
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      // Private browsing and full quotas both land here — the callout simply
      // comes back next visit, which is better than breaking the grid.
    }
  }, [target]);

  if (!hydrated || !target) return null;

  const accent = getBrandAccent(target.brand, target.color, mode);
  const name = displayNameOf(target.brand);
  const count = countOf(target.brand);
  const logo = target.image || target.url;

  return (
    <Box
      sx={{
        mt: { xs: 2.5, md: 3 },
        mb: { xs: 2.5, md: 3 },
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.25, sm: 2 },
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.25, sm: 1.5 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: accent.main,
        bgcolor: accent.soft,
      }}
    >
      {logo ? (
        // Brand logos are drawn for a white ground, so the tile stays white in
        // both themes — same rule as the rail.
        <Box
          sx={{
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            borderRadius: "8px",
            bgcolor: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            p: "4px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src={logo}
            alt={name}
            loading="lazy"
            sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </Box>
      ) : (
        <AutoAwesomeIcon
          sx={{ fontSize: 26, color: accent.main, flexShrink: 0 }}
        />
      )}

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "0.9rem", sm: "1rem" },
            lineHeight: 1.3,
          }}
        >
          {name} has joined the catalogue
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.76rem", sm: "0.82rem" }, mt: 0.25 }}
        >
          {count > 0
            ? `${count} ${count === 1 ? "product" : "products"} now available`
            : "New to the catalogue"}
        </Typography>
      </Box>

      <Button
        size="small"
        variant="outlined"
        onClick={() => onSelectBrand(target.brand)}
        sx={{
          flexShrink: 0,
          textTransform: "none",
          fontWeight: 700,
          borderColor: accent.main,
          color: accent.main,
          whiteSpace: "nowrap",
          "&:hover": { borderColor: accent.main, bgcolor: accent.soft },
        }}
      >
        Take a look
      </Button>

      <IconButton
        size="small"
        onClick={dismiss}
        aria-label={`Dismiss ${name} announcement`}
        sx={{ flexShrink: 0, color: "text.secondary" }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default React.memo(NewBrandCallout);
