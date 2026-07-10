// Central Google Analytics (GA4) helper for the order-form frontend.
// The gtag.js loader + init snippet live in pages/_document.tsx. Automatic
// page_view is disabled there (send_page_view: false) so that ONLY the public,
// unauthenticated pages listed below are ever reported to GA.

export const GA_ID = 'G-B3B84C0Y76';

// Public, unauthenticated routes — the only pages we track. Kept in sync with
// the publicPaths list in src/components/Layout.tsx.
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

/** Manually report a page_view (auto page_view is disabled in _document). */
export const pageview = (url: string): void => {
  if (!isReady()) return;
  (window as any).gtag('event', 'page_view', {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
};

/** Fire a custom GA4 event. */
export const event = (name: string, params: GtagParams = {}): void => {
  if (!isReady()) return;
  (window as any).gtag('event', name, params);
};
