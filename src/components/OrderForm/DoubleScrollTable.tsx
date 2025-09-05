import React, { forwardRef, useImperativeHandle } from 'react';
import { Box, styled } from '@mui/material';

// Export the interface
export interface DoubleScrollTableRef {
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

const DoubleScrollTableContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  maxHeight: '70vh',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  boxShadow: theme.shadows[2],
}));

const TopScrollbar = styled(Box)(({ theme }) => ({
  overflowX: 'auto',
  overflowY: 'hidden',
  height: 17,
  backgroundColor: theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
  
  '&::-webkit-scrollbar': {
    height: 12,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.grey[100],
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: 6,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const TopScrollbarInner = styled(Box)({
  height: 1,
});

const MainScrollContainer = styled(Box)(({ theme }) => ({
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: 'calc(70vh - 17px)',
  
  '&::-webkit-scrollbar': {
    height: 12,
    width: 12,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.grey[100],
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: 6,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  '&::-webkit-scrollbar-corner': {
    backgroundColor: theme.palette.grey[100],
  },
}));

interface DoubleScrollTableProps {
  children: React.ReactNode;
  tableWidth?: number;
}

// Use forwardRef to expose scroll methods
const DoubleScrollTable = forwardRef<DoubleScrollTableRef, DoubleScrollTableProps>(({ 
  children, 
  tableWidth = 1400 
}, ref) => {
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const mainScrollRef = React.useRef<HTMLDivElement>(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && mainScrollRef.current) {
      mainScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleMainScroll = () => {
    if (topScrollRef.current && mainScrollRef.current) {
      topScrollRef.current.scrollLeft = mainScrollRef.current.scrollLeft;
    }
  };

  // Expose scroll methods to parent component
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    scrollToBottom: () => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ 
          top: mainScrollRef.current.scrollHeight, 
          behavior: 'smooth' 
        });
      }
    },
  }));

  return (
    <DoubleScrollTableContainer>
      {/* Top scrollbar */}
      <TopScrollbar ref={topScrollRef} onScroll={handleTopScroll}>
        <TopScrollbarInner sx={{ width: tableWidth }} />
      </TopScrollbar>
      
      {/* Main content with bottom scrollbar */}
      <MainScrollContainer ref={mainScrollRef} onScroll={handleMainScroll}>
        {children}
      </MainScrollContainer>
    </DoubleScrollTableContainer>
  );
});

DoubleScrollTable.displayName = 'DoubleScrollTable';

export default DoubleScrollTable;