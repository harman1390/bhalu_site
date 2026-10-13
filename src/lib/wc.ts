import type { WCCategory, WCProduct } from './types';

const API = process.env.STORE_API ?? 'http://localhost/barelyn-api';

/** Fields needed for product listings/cards — keeps WP payloads small. */
const LIST_FIELDS = 'id,name,slug,images,prices,average_rating,review_count,is_purchasable,is_in_stock,on_sale';

/** Server-side catalog fetch — no session needed, cacheable. */
async function api<T>(path: string, init?: RequestInit & { next?: { revalidate?: number } }): Promise<T> {
	const res = await fetch(`${API}${path}`, {
		...init,
		next: { revalidate: init?.next?.revalidate ?? 60 },
	});
	if (!res.ok) {
		throw new Error(`WC API ${path} -> ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export async function getProducts(params: Record<string, string | number> = {}): Promise<WCProduct[]> {
	const q = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) q.set(k, String(v));
	q.set('per_page', q.get('per_page') ?? '24');
	if (!q.has('_fields')) q.set('_fields', LIST_FIELDS);
	return api<WCProduct[]>(`/products?${q}`, { next: { revalidate: 120 } });
}

export async function getProductBySlug(slug: string): Promise<WCProduct | null> {
	const list = await api<WCProduct[]>(`/products?slug=${encodeURIComponent(slug)}`, {
		next: { revalidate: 120 },
	});
	return list[0] ?? null;
}

export async function getCategories(): Promise<WCCategory[]> {
	return api<WCCategory[]>('/products/categories?per_page=50', { next: { revalidate: 300 } });
}

export async function getCategoryBySlug(slug: string): Promise<WCCategory | null> {
	// Store API doesn't filter categories by slug — fetch all + match locally.
	const list = await getCategories();
	return list.find((c) => c.slug === slug) ?? null;
}
