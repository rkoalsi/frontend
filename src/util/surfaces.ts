/**
 * Shared purple surfaces used across the app shell and page headers.
 *
 * Keeping these in one place means the customer portal, the admin area and the
 * sales layout all sit on the same background instead of drifting apart.
 */

/** Full-page background behind every layout (Customer / Admin / Sales). */
export const appShellBg = (isDark: boolean) =>
  isDark ? 'linear-gradient(135deg, #191536 0%, #221E48 100%)' : '#F9F8FD';

/**
 * Gradient used on the header band at the top of page cards.
 *
 * Lighter than the shell so white text and the translucent back button read
 * clearly against it in both colour modes (white on the light end of this
 * ramp is ~5.3:1, comfortably past AA for the heading sizes used).
 */
export const headerGradient = 'linear-gradient(135deg, #37279C 0%, #6A5AD1 100%)';

/** Text/icon colours for content sitting on `headerGradient`. */
export const onHeaderText = '#FFFFFF';
export const onHeaderMutedText = 'rgba(255,255,255,0.82)';

/** Icon button (e.g. back arrow) placed on `headerGradient`. */
export const headerIconButtonSx = {
  color: onHeaderText,
  bgcolor: 'rgba(255,255,255,0.16)',
  border: '1px solid rgba(255,255,255,0.28)',
  '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
};
