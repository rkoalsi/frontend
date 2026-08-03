import GlobalStyles from '@mui/material/GlobalStyles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Slide, ToastContainer } from 'react-toastify';

/**
 * Single source of truth for toast styling.
 *
 * Every `toast.*()` call in the app (there are ~900 of them) renders through
 * this container, so nothing here requires touching the call sites. The toast
 * is a white paper card in both light and dark mode — it reads as a sheet
 * lifted above the page rather than another surface in the palette — so its
 * ink and hairline are fixed to the light-mode values regardless of theme.
 * Only the shadow changes, to stay believable on a dark ground.
 */

// Brand tokens, mirrored from src/theme.ts. Kept literal rather than imported
// from `brand` because the card never follows the active colour mode.
const CARD = '#FFFFFF';
const INK = '#1C1A33';
const MUTED = '#837E96';
const HAIRLINE = '#E8E4F2';

const TONES = {
  success: { main: '#2E7D48', soft: '#E4F2E9' },
  error: { main: '#C94444', soft: '#FBE9E9' },
  warning: { main: '#C9A821', soft: '#FAF0CE' },
  info: { main: '#4633B8', soft: '#EDEAFB' },
  default: { main: '#4633B8', soft: '#EDEAFB' },
} as const;

/**
 * One duration for everything, deliberately.
 *
 * Per-type durations would have to be applied through `toast.onChange`, and a
 * `ToastItem` does not expose `autoClose` — so there is no way to tell a toast
 * that inherited the default from one the call site configured. That would
 * silently dismiss the sticky ones (`useNetworkStatus` fires the offline and
 * slow-connection warnings with `autoClose: false`) and truncate the 10s errors
 * in `admin/customer_requests`. 5s reads comfortably for a one-line error
 * without nagging on a success, and every explicit call-site value still wins.
 */
const DEFAULT_AUTO_CLOSE = 5000;

// Above MUI's modal (1300) and drawer (1200) so a toast fired from inside a
// dialog is not buried by it.
const Z_INDEX = 1400;

const toneRules = Object.entries(TONES)
  .map(
    ([name, tone]) => `
    .Toastify__toast--${name} .Toastify__toast-icon {
      background: ${tone.soft};
      color: ${tone.main};
    }
    .Toastify__toast--${name} .Toastify__toast-icon > svg { fill: ${tone.main}; }
    .Toastify__toast--${name} .Toastify__progress-bar { background: ${tone.main}; }
  `
  )
  .join('\n');

export default function BrandToaster() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // A white card needs a heavier, cooler shadow to separate from a dark page.
  const shadow = isDark
    ? '0 16px 32px rgba(6,3,20,0.55), 0 4px 12px rgba(6,3,20,0.4)'
    : '0 12px 24px rgba(70,51,184,0.14), 0 4px 10px rgba(70,51,184,0.08)';

  const styles = `
    .Toastify {
      --toastify-z-index: ${Z_INDEX};
      --toastify-font-family: ${theme.typography.fontFamily};
      --toastify-toast-width: 380px;
      --toastify-toast-offset: 16px;
      --toastify-toast-min-height: 0px;
      --toastify-toast-padding: 13px 14px;
      --toastify-toast-bd-radius: 14px;
      --toastify-toast-background: ${CARD};
      --toastify-toast-shadow: ${shadow};
      --toastify-color-progress-bgo: 0.16;
    }

    .Toastify__toast-container {
      padding: 0;
    }

    .Toastify .Toastify__toast {
      background: ${CARD};
      color: ${INK};
      border: 1px solid ${isDark ? 'rgba(28,26,51,0.10)' : HAIRLINE};
      border-radius: 14px;
      box-shadow: ${shadow};
      padding: 13px 14px;
      margin-bottom: 10px;
      min-height: 0;
      align-items: flex-start;
      overflow: hidden;
      font-family: ${theme.typography.fontFamily};
    }

    /* The message itself. Call sites pass a plain string. */
    .Toastify .Toastify__toast-body {
      align-items: flex-start;
      gap: 12px;
      margin: 0;
      padding: 0;
      font-size: 0.855rem;
      font-weight: 500;
      line-height: 1.45;
      color: ${INK};
    }

    /* Toastify's own icon, re-housed in a tinted badge. */
    .Toastify .Toastify__toast-icon {
      width: 30px;
      height: 30px;
      min-width: 30px;
      margin: -1px 0 0 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .Toastify .Toastify__toast-icon > svg {
      width: 17px;
      height: 17px;
    }

    ${toneRules}

    .Toastify .Toastify__close-button {
      color: ${MUTED};
      opacity: 0.6;
      align-self: flex-start;
      margin-top: 1px;
      padding: 2px;
      border-radius: 6px;
    }
    .Toastify .Toastify__close-button:hover,
    .Toastify .Toastify__close-button:focus-visible {
      opacity: 1;
      background: rgba(131, 126, 150, 0.14);
    }
    .Toastify .Toastify__close-button > svg {
      width: 15px;
      height: 15px;
    }

    /* Time remaining, rather than vanishing without warning. */
    .Toastify .Toastify__progress-bar {
      height: 3px;
      bottom: 0;
      opacity: 1 !important;
      border-radius: 0;
    }
    .Toastify .Toastify__progress-bar--wrp {
      height: 3px;
      bottom: 0;
    }

    /*
     * Phones: bottom-centre, full width inside a gutter, clear of the iOS home
     * bar. Overrides toastify's own 480px block, which drops the radius and
     * pins the card edge to edge — hence the doubled class for specificity.
     */
    @media (max-width: 599.95px) {
      .Toastify .Toastify__toast-container.Toastify__toast-container {
        width: 100%;
        left: 0;
        right: 0;
        padding: 0 10px;
        margin: 0;
        transform: none;
      }
      /*
       * --app-toast-offset lets a page lift the toasts above its own fixed
       * furniture. The order form sets it while the cart / mobile nav bar is
       * showing, which is what the old per-page Snackbar mb:9 did.
       */
      .Toastify .Toastify__toast-container--bottom-center.Toastify__toast-container--bottom-center {
        bottom: calc(10px + env(safe-area-inset-bottom) + var(--app-toast-offset, 0px));
        transition: bottom 0.2s ease;
      }
      .Toastify .Toastify__toast.Toastify__toast {
        width: 100%;
        border-radius: 14px;
        margin-bottom: 10px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .Toastify .Toastify--animate {
        animation-duration: 1ms !important;
      }
    }
  `;

  return (
    <>
      <GlobalStyles styles={styles} />
      <ToastContainer
        position={isMobile ? 'bottom-center' : 'top-right'}
        autoClose={DEFAULT_AUTO_CLOSE}
        limit={3}
        newestOnTop
        closeOnClick
        pauseOnHover
        pauseOnFocusLoss={false}
        draggable
        draggablePercent={40}
        transition={Slide}
        theme='light'
      />
    </>
  );
}
