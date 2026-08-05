import React from "react";
import { Box } from "@mui/material";

interface NewBrandBadgeProps {
  /** Accent to tint the pill with — usually the brand's own rail accent. */
  color: string;
  soft: string;
  /** Smaller variant for the dense mobile dropdown rows. */
  dense?: boolean;
}

/**
 * The "NEW BRAND" pill. A brand earns it for its first three months on the form
 * (see `is_new` from /products/brands), and it is deliberately worded "NEW
 * BRAND" rather than "NEW" — the rail already carries a "New Arrivals"
 * collection, and a bare "NEW" next to it reads as a duplicate of that.
 */
const NewBrandBadge: React.FC<NewBrandBadgeProps> = ({ color, soft, dense }) => (
  <Box
    component="span"
    sx={{
      px: dense ? 0.65 : 0.8,
      py: "1px",
      borderRadius: 999,
      border: "1px solid",
      borderColor: color,
      bgcolor: soft,
      color,
      fontSize: dense ? "0.58rem" : "0.62rem",
      fontWeight: 800,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      lineHeight: 1.6,
    }}
  >
    New brand
  </Box>
);

export default React.memo(NewBrandBadge);
