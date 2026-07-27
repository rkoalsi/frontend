import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import axios from "axios";

export interface Placement {
  _id: string;
  name: string;
  placement: "brand_banner" | "in_scroll";
  image_url: string;
  mobile_image_url?: string | null;
  alt_text?: string | null;
  after_n_products?: number;
  target_type: "none" | "brand" | "category" | "url";
  target_value?: string;
}

interface FeatureBannerProps {
  placement: Placement;
  /** Brand tab the banner was shown on — recorded with the event. */
  brand?: string;
  /** Jump to a brand tab. */
  onSelectBrand?: (brand: string) => void;
  /** Jump to a category within the current brand. */
  onSelectCategory?: (category: string) => void;
  /** Extra sx, e.g. `gridColumn: '1 / -1'` for the in-grid variant. */
  sx?: object;
}

/**
 * A merchandising banner. Records a view the first time it scrolls into
 * sight and a click when tapped, then performs whatever the placement is
 * pointed at.
 *
 * Deliberately free of "ad" / "banner" / "sponsored" in every class name and
 * request path — see routes/promotions.py. The IntersectionObserver is also
 * doing double duty as a blocker check: a hidden element never intersects, so
 * a placement with clicks but no views is a signal something is filtering it.
 */
const FeatureBanner: React.FC<FeatureBannerProps> = ({
  placement,
  brand,
  onSelectBrand,
  onSelectCategory,
  sx,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const seen = useRef(false);
  const [failed, setFailed] = useState(false);

  const send = useCallback(
    (event: "view" | "click") => {
      axios
        .post(`${process.env.api_url}/promotions/${placement._id}/event`, {
          event,
          brand: brand || null,
        })
        .catch(() => {
          // Tracking must never surface to the user.
        });
    },
    [placement._id, brand]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || seen.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !seen.current) {
            seen.current = true;
            send("view");
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [send]);

  const handleClick = () => {
    send("click");
    const value = (placement.target_value || "").trim();
    switch (placement.target_type) {
      case "brand":
        onSelectBrand?.(value);
        break;
      case "category":
        onSelectCategory?.(value);
        break;
      case "url":
        window.open(value, "_blank", "noopener,noreferrer");
        break;
      default:
        break;
    }
  };

  // A placement whose artwork 404s should collapse rather than leave a
  // broken-image box sitting in the middle of the catalogue.
  if (failed) return null;

  const clickable = placement.target_type !== "none";

  return (
    <Box
      ref={ref}
      component={clickable ? "button" : "div"}
      type={clickable ? "button" : undefined}
      onClick={clickable ? handleClick : undefined}
      aria-label={clickable ? placement.alt_text || placement.name : undefined}
      sx={{
        display: "block",
        width: "100%",
        p: 0,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        background: "none",
        font: "inherit",
        cursor: clickable ? "pointer" : "default",
        lineHeight: 0,
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        ...(clickable && {
          "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
        }),
        ...sx,
      }}
    >
      <Box
        component="img"
        src={placement.image_url}
        srcSet={
          placement.mobile_image_url
            ? `${placement.mobile_image_url} 640w, ${placement.image_url} 1600w`
            : undefined
        }
        sizes={placement.mobile_image_url ? "(max-width: 640px) 100vw, 1200px" : undefined}
        alt={placement.alt_text || placement.name}
        loading="lazy"
        onError={() => setFailed(true)}
        sx={{ width: "100%", height: "auto", display: "block" }}
      />
    </Box>
  );
};

export default React.memo(FeatureBanner);
