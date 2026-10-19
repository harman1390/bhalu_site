// Category order/labels for "Shop by Category" — matches the pill series:
// All, Deals of the Week, Facewash, Toner, Serum, Moisturizer, Sunscreen, Dry, Oily, Acne.
export const SHOP_CAT_SERIES: { slug: string; label?: string }[] = [
	{ slug: 'dod', label: 'Deals of the Week' },
	{ slug: 'facewash' },
	{ slug: 'toner' },
	{ slug: 'serum' },
	{ slug: 'moisturizer' },
	{ slug: 'sunscreen' },
	{ slug: 'dry-skin' },
	{ slug: 'oily-skin' },
	{ slug: 'acne-skin' },
];

/** Display name for a category — applies label overrides (e.g. dod → Deals of the Week). */
export const catDisplayName = (slug: string, name: string) =>
	SHOP_CAT_SERIES.find((s) => s.slug === slug)?.label ?? name;
