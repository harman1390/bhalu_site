/**
 * Store API returns attachment URLs on the live domain (barelyn.co.in) or
 * WP_BASE. We rewrite them to the same-site /wp-uploads proxy (see
 * next.config rewrites) so images never hit a cross-origin URL or the
 * optimizer's local-IP restriction.
 */
export function wpImg(src: string | undefined | null): string {
	if (!src) return '';
	// Strip host — keep only the uploads path
	const m = src.match(/\/wp-content\/uploads\/(.+)$/i);
	if (m) return `/wp-uploads/${m[1]}`;
	return src;
}
