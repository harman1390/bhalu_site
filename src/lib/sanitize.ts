/**
 * Client-side mirror of the backend `clean_html()` allowlist.
 * Applied before dangerouslySetInnerHTML so product HTML stays safe even if
 * a DB write ever bypasses the import-time sanitizer: keeps only simple
 * content tags and strips ALL attributes plus script/style blocks.
 */
const ALLOWED = new Set(['p', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'br', 'h2', 'h3', 'h4']);

export function cleanHtml(html: string | null | undefined): string {
	if (!html || !html.trim()) return '';
	let out = html;
	out = out.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
	out = out.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (m, close: string, tag: string) => {
		const t = tag.toLowerCase();
		return ALLOWED.has(t) ? `<${close}${t}>` : '';
	});
	return out.trim();
}
