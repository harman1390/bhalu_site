export interface WCImage {
	id: number;
	src: string;
	thumbnail: string;
	srcset: string;
	sizes: string;
	name: string;
	alt: string;
}

export interface WCPrices {
	price: string;
	regular_price: string;
	sale_price: string;
	price_range: string | null;
	currency_code: string;
	currency_symbol: string;
	currency_minor_unit: number;
	currency_decimal_separator: string;
	currency_thousand_separator: string;
	currency_prefix: string;
	currency_suffix: string;
	raw_prices: { precision: number; price: string; regular_price: string; sale_price: string };
}

export interface WCCategoryRef {
	id: number;
	name: string;
	slug: string;
	link: string;
}

export interface WCCategory extends WCCategoryRef {
	description: string;
	image: WCImage | null;
	review_count: number;
	count: number;
	parent: number;
}

export interface WCProduct {
	id: number;
	name: string;
	slug: string;
	permalink: string;
	description: string;
	short_description: string;
	images: WCImage[];
	prices: WCPrices;
	categories: WCCategoryRef[];
	average_rating: string;
	review_count: number;
	is_in_stock: boolean;
	is_purchasable: boolean;
	has_options: boolean;
	sale_badge?: string;
	add_to_cart: { text: string; description: string; url: string; minimum: number; maximum: number };
	variation?: string;
	type: string;
}

export interface WCCartItemImage {
	id: number;
	src: string;
	thumbnail: string;
	srcset: string;
	sizes: string;
	name: string;
	alt: string;
}

export interface WCCartItem {
	key: string;
	id: number;
	name: string;
	quantity: number;
	images: WCCartItemImage[];
	prices: { price: string; regular_price: string; sale_price: string; currency_symbol: string; currency_code: string };
	totals: { line_subtotal: string; line_total: string; currency_symbol: string };
}

export interface WCCart {
	items: WCCartItem[];
	items_count: number;
	items_weight: number;
	needs_shipping: boolean;
	needs_payment: boolean;
	totals: {
		subtotal: string;
		total_items: string;
		total_price: string;
		currency_symbol: string;
		currency_code: string;
	};
	errors?: { code: string; message: string }[];
}

export function formatPrice(minor: string, symbol: string, decimals = 2): string {
	const n = Number(minor) / Math.pow(10, decimals);
	if (Number.isNaN(n)) return `${symbol}${minor}`;
	return `${symbol}${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: decimals })}`;
}
