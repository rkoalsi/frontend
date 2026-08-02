import React from "react";
import { Box, Button, Typography, alpha, useTheme } from "@mui/material";
import { useRouter } from "next/router";

interface GuestCtaProps {
  /** Named so the click can be told apart from the QuickView one later. */
  source?: string;
  onDismiss?: () => void;
}

/**
 * The bar that picks up a logged-out visitor once they have scrolled into the
 * grid — the catalogue's only standing prompt to register, since the topbar
 * already carries a Register button and a third ask above the grid was in the
 * way. Phones only: on desktop the topbar button is always in view.
 *
 * Goes to /register — the WhatsApp-number signup, not a pricing page.
 */
const GuestCta: React.FC<GuestCtaProps> = ({ source, onDismiss }) => {
  const theme = useTheme();
  const router = useRouter();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1200,
        display: { xs: "flex", md: "none" },
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.25,
        // Clears the iPhone home indicator.
        pb: "calc(10px + env(safe-area-inset-bottom))",
        bgcolor: alpha(theme.palette.background.paper, 0.94),
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid",
        borderColor: "divider",
        boxShadow: isDark
          ? "0 -6px 24px rgba(0,0,0,0.45)"
          : "0 -6px 24px rgba(28,26,51,0.14)",
        animation: "guestCtaRise 0.28s cubic-bezier(0.22, 1, 0.36, 1) both",
        "@keyframes guestCtaRise": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", lineHeight: 1.25 }}>
          Ready to place an order?
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontSize: "0.72rem" }}
        >
          Sign up with your WhatsApp number
        </Typography>
      </Box>
      <Button
        variant="contained"
        onClick={() =>
          router.push(`/register${source ? `?from=catalogue_${source}` : "?from=catalogue"}`)
        }
        sx={{ flexShrink: 0, textTransform: "none", fontWeight: 700, borderRadius: 999, px: 2 }}
      >
        Register
      </Button>
      {onDismiss && (
        <Button
          onClick={onDismiss}
          size="small"
          sx={{
            flexShrink: 0,
            minWidth: "auto",
            px: 0.5,
            color: "text.secondary",
            textTransform: "none",
          }}
        >
          Not now
        </Button>
      )}
    </Box>
  );
};

export default React.memo(GuestCta);
