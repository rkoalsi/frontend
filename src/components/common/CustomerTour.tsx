'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import { Close, ArrowBack, ArrowForward, CheckCircle } from '@mui/icons-material';
import { createPortal } from 'react-dom';
import axiosInstance from '../../util/axios';

export interface TourStep {
  target: string | null;
  title: string;
  content: string;
  /** On mobile (<600px), spotlight this smaller element instead (e.g. a section header) */
  mobileTarget?: string;
}

interface Spotlight {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

const PAD = 10;
const TOOLTIP_H = 230;

const CustomerTour = ({
  tourKey,
  tourSeen,
  steps,
  onStep,
}: {
  tourKey: string;
  tourSeen: boolean;
  steps: TourStep[];
  /** Called with the new step index whenever the tour advances or goes back */
  onStep?: (stepIndex: number) => void;
}) => {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, width: 340 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || tourSeen) return;
    const t = setTimeout(() => setActive(true), 700);
    return () => clearTimeout(t);
  }, [mounted, tourSeen]);

  // Prevent background scrolling while tour is active
  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [active]);

  const computePosition = useCallback(() => {
    const step = steps[stepIndex];
    if (!step.target) {
      setSpotlight(null);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 600;
    const useMobileTarget = isMobile && !!step.mobileTarget;

    const targetKey = useMobileTarget ? step.mobileTarget! : step.target;
    const el = document.querySelector(`[data-tour="${targetKey}"]`) as HTMLElement | null;
    if (!el) {
      setSpotlight(null);
      return;
    }

    if (useMobileTarget) {
      // Position the element at 60% down the viewport so the tooltip can appear above it
      const rect0 = el.getBoundingClientRect();
      const targetY = window.scrollY + rect0.top - vh * 0.6;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      const r = el.getBoundingClientRect();
      const spot: Spotlight = {
        top: r.top - PAD,
        left: r.left - PAD,
        right: r.right + PAD,
        bottom: r.bottom + PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      };
      setSpotlight(spot);

      const w = Math.min(360, vw - 32);
      const spaceBelow = vh - spot.bottom;
      const spaceAbove = spot.top;
      let top: number;

      if (spaceBelow >= TOOLTIP_H) {
        top = spot.bottom + 12;
      } else if (spaceAbove >= TOOLTIP_H) {
        top = spot.top - 12 - TOOLTIP_H;
      } else {
        top = Math.max(16, vh / 2 - TOOLTIP_H / 2);
      }

      const left = Math.max(16, Math.min(r.left, vw - w - 16));
      setTooltipPos({ top, left, width: w });
    }, 350);
  }, [stepIndex, steps]);

  useEffect(() => {
    if (active) computePosition();
  }, [active, stepIndex, computePosition]);

  useEffect(() => {
    if (!active) return;
    window.addEventListener('resize', computePosition);
    return () => window.removeEventListener('resize', computePosition);
  }, [active, computePosition]);

  const finish = useCallback(async () => {
    setActive(false);
    try {
      await axiosInstance.patch('/users/tour-seen', { tour_key: tourKey });
    } catch {
      // non-critical — tour will just show again next load
    }
  }, [tourKey]);

  const next = () => {
    if (stepIndex < steps.length - 1) {
      const newIndex = stepIndex + 1;
      setStepIndex(newIndex);
      onStep?.(newIndex);
    } else finish();
  };
  const prev = () => {
    if (stepIndex > 0) {
      const newIndex = stepIndex - 1;
      setStepIndex(newIndex);
      onStep?.(newIndex);
    }
  };

  if (!mounted || !active) return null;

  const step = steps[stepIndex];
  const isWelcome = !step.target || !spotlight;

  const portal = (
    <>
      {isWelcome ? (
        <Box
          onClick={finish}
          sx={{
            position: 'fixed', inset: 0, zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.78)',
          }}
        />
      ) : (
        <>
          {/* Top strip */}
          <Box sx={{
            position: 'fixed', pointerEvents: 'none', zIndex: 10000,
            top: 0, left: 0, right: 0,
            height: `${Math.max(0, spotlight.top)}px`,
            backgroundColor: 'rgba(0,0,0,0.72)',
          }} />
          {/* Bottom strip */}
          <Box sx={{
            position: 'fixed', pointerEvents: 'none', zIndex: 10000,
            top: `${spotlight.bottom}px`, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.72)',
          }} />
          {/* Left strip */}
          <Box sx={{
            position: 'fixed', pointerEvents: 'none', zIndex: 10000,
            top: `${spotlight.top}px`, left: 0,
            width: `${Math.max(0, spotlight.left)}px`,
            height: `${spotlight.height}px`,
            backgroundColor: 'rgba(0,0,0,0.72)',
          }} />
          {/* Right strip */}
          <Box sx={{
            position: 'fixed', pointerEvents: 'none', zIndex: 10000,
            top: `${spotlight.top}px`,
            left: `${spotlight.right}px`,
            right: 0, height: `${spotlight.height}px`,
            backgroundColor: 'rgba(0,0,0,0.72)',
          }} />
          {/* Green spotlight ring */}
          <Box sx={{
            position: 'fixed', pointerEvents: 'none', zIndex: 10001,
            top: `${spotlight.top}px`, left: `${spotlight.left}px`,
            width: `${spotlight.width}px`, height: `${spotlight.height}px`,
            borderRadius: 2,
            border: '2.5px solid #38a169',
            boxShadow: '0 0 20px rgba(56,161,105,0.5), inset 0 0 8px rgba(56,161,105,0.08)',
          }} />
        </>
      )}

      {/* Tooltip card */}
      <Paper
        elevation={16}
        sx={{
          position: 'fixed',
          zIndex: 10002,
          borderRadius: 3,
          p: { xs: 2, sm: 2.5 },
          background: '#1a2b3c',
          border: '1px solid rgba(56,161,105,0.35)',
          color: 'white',
          ...(isWelcome ? {
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: { xs: 'calc(100vw - 32px)', sm: 400 },
            textAlign: 'center',
          } : {
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            width: `${tooltipPos.width}px`,
          }),
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography
            fontWeight={700}
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              color: '#38a169', lineHeight: 1.3, flex: 1,
              textAlign: isWelcome ? 'center' : 'left',
            }}
          >
            {step.title}
          </Typography>
          {!isWelcome && (
            <IconButton
              size='small'
              onClick={finish}
              sx={{ color: 'rgba(255,255,255,0.45)', ml: 1, mt: -0.25,
                '&:hover': { color: 'rgba(255,255,255,0.85)' } }}
            >
              <Close fontSize='small' />
            </IconButton>
          )}
        </Box>

        <Typography
          variant='body2'
          sx={{
            color: 'rgba(255,255,255,0.82)', mb: 2, lineHeight: 1.7,
            fontSize: { xs: '0.82rem', sm: '0.875rem' },
          }}
        >
          {step.content}
        </Typography>

        {/* Progress dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mb: 2 }}>
          {steps.map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 6, borderRadius: 3,
                width: i === stepIndex ? 22 : 6,
                backgroundColor: i === stepIndex ? '#38a169' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </Box>

        <Box sx={{
          display: 'flex',
          justifyContent: isWelcome ? 'center' : 'space-between',
          alignItems: 'center', gap: 1,
        }}>
          {!isWelcome && (
            <Button
              size='small'
              onClick={finish}
              sx={{
                textTransform: 'none', color: 'rgba(255,255,255,0.4)',
                fontSize: '0.78rem', p: 0, minWidth: 0,
                '&:hover': { color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent' },
              }}
            >
              Skip
            </Button>
          )}

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!isWelcome && (
              <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.3)', mr: 0.5 }}>
                {stepIndex + 1}&thinsp;/&thinsp;{steps.length}
              </Typography>
            )}
            {stepIndex > 0 && (
              <Button
                size='small'
                onClick={prev}
                startIcon={<ArrowBack sx={{ fontSize: '15px !important' }} />}
                sx={{
                  textTransform: 'none', color: 'rgba(255,255,255,0.7)',
                  px: 1.5, py: 0.6, minWidth: 0,
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                }}
              >
                Back
              </Button>
            )}
            <Button
              size='small'
              onClick={next}
              variant='contained'
              endIcon={
                stepIndex < steps.length - 1
                  ? <ArrowForward sx={{ fontSize: '15px !important' }} />
                  : <CheckCircle sx={{ fontSize: '15px !important' }} />
              }
              sx={{
                textTransform: 'none',
                backgroundColor: '#38a169',
                borderRadius: 2, px: 2, py: 0.6,
                '&:hover': { backgroundColor: '#2f855a' },
              }}
            >
              {stepIndex < steps.length - 1 ? (isWelcome ? "Let's go!" : 'Next') : 'Done!'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </>
  );

  return createPortal(portal, document.body);
};

export default CustomerTour;
