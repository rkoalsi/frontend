import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";

interface BrowseFabProps {
  onClick: () => void;
  isMobile?: boolean;
}

/**
 * Opens the browse sheet. Lives in the same fixed stack as the cart and the
 * scroll arrows — the parent sets `pointerEvents: 'none'` so the column never
 * blocks the page, which is why this re-enables them on the button itself.
 */
const BrowseFab: React.FC<BrowseFabProps> = ({ onClick, isMobile }) => (
  <Tooltip title="Browse brands & categories" placement="left">
    <IconButton
      color="primary"
      onClick={onClick}
      aria-label="Browse brands and categories"
      sx={{
        backgroundColor: "background.paper",
        color: "primary.main",
        width: { xs: 44, sm: 52 },
        height: { xs: 44, sm: 52 },
        boxShadow: 6,
        pointerEvents: "auto",
        border: "1px solid",
        borderColor: "divider",
        "&:hover": {
          backgroundColor: "background.default",
          boxShadow: 8,
          transform: "scale3d(1.08, 1.08, 1)",
        },
        transition:
          "background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
        willChange: "transform",
      }}
    >
      <GridViewRoundedIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
    </IconButton>
  </Tooltip>
);

export default React.memo(BrowseFab);
