// Central Google Analytics (GA4) helper for the order-form frontend.
// The gtag.js loader + init snippet live in pages/_document.tsx. Automatic
// page_view is disabled there (send_page_view: false) so that every page_view
// goes through trackedPath() below and is stripped of identifiers first.

export const GA_ID = 'G-B3B84C0Y76';

// Public, unauthenticated routes. These report their real URL; everything else
// reports the route pattern only. Kept in sync with the publicPaths list in
// src/components/Layout.tsx.
export const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot_password',
  '/reset_password',
  '/catalogues',
  '/catalogues/all_products',
];

export const isPublicPath = (pathname: string): boolean =>
  PUBLIC_PATHS.includes(pathname);

type GtagParams = Record<string, unknown>;

// gtag is only available in the browser, once the loader in _document has run.
const isReady = (): boolean =>
  typeof window !== 'undefined' &&
  typeof (window as any).gtag === 'function' &&
  Boolean(GA_ID);

/**
 * The path to report for a route. Public pages send their real URL. Authenticated
 * pages send the Next.js route pattern instead (`/orders/new/[id]` rather than
 * `/orders/new/68f3...`) so order, customer and estimate IDs never reach GA.
 */
export const trackedPath = (pathname: string, asPath: string): string =>
  isPublicPath(pathname) ? asPath : pathname;

/** Manually report a page_view (auto page_view is disabled in _document). */
export const pageview = (url: string): void => {
  if (!isReady()) return;
  (window as any).gtag('event', 'page_view', {
    page_path: url,
    // Built from `url`, not location.href, so a sanitised path is not paired
    // with a full URL that still carries the identifiers.
    page_location: `${window.location.origin}${url}`,
    page_title: document.title,
  });
};

/** Fire a custom GA4 event. */
export const event = (name: string, params: GtagParams = {}): void => {
  if (!isReady()) return;
  (window as any).gtag('event', name, params);
};
