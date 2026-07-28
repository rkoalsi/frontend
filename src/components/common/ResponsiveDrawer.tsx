import React from 'react';
import { Box, Drawer, DrawerProps, useMediaQuery, useTheme } from '@mui/material';

const toArray = (value: any): any[] =>
  Array.isArray(value) ? value : value ? [value] : [];

/**
 * Drop-in replacement for MUI's Drawer that slides in from the side on desktop
 * but turns into a full-width bottom sheet on small screens.
 *
 * Caller `sx` / `PaperProps` / `slotProps.paper` are preserved — the mobile
 * overrides are merged last so they win.
 */
const ResponsiveDrawer = ({
  anchor = 'right',
  sx,
  PaperProps,
  slotProps,
  children,
  ...rest
}: DrawerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Only side drawers become bottom sheets — a drawer already anchored to the
  // bottom, or a nav drawer on the left, is left alone.
  const asBottomSheet = isMobile && (anchor === 'right' || anchor === 'left');

  const paperOverride = {
    width: '100%',
    maxWidth: '100%',
    left: 0,
    right: 0,
    height: 'auto',
    maxHeight: '90vh',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  };

  const paperProps: any = {
    ...(PaperProps as any),
    ...((slotProps?.paper as any) || {}),
    sx: [
      ...toArray((PaperProps as any)?.sx),
      ...toArray((slotProps?.paper as any)?.sx),
      ...(asBottomSheet ? [paperOverride] : []),
    ],
  };

  return (
    <Drawer
      {...rest}
      anchor={asBottomSheet ? 'bottom' : anchor}
      sx={[
        ...toArray(sx),
        ...(asBottomSheet ? [{ '& .MuiDrawer-paper': paperOverride }] : []),
      ]}
      slotProps={{ ...slotProps, paper: paperProps }}
    >
      {asBottomSheet && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pt: 1.25,
            pb: 0.5,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'divider',
            }}
          />
        </Box>
      )}
      {children}
    </Drawer>
  );
};

export default ResponsiveDrawer;
