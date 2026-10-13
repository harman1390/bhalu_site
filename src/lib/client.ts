'use client';

import type { WCCart } from './types';

/**
 * Browser-side cart client. All calls go through /api/wc proxy so
 * WooCommerce session cookies + nonces stay same-site.
 */

let nonce: string | null = null;
let noncePromise: Promise<void> | null = null;

/** Fetch a fresh Store API nonce via an innocuous GET. */
function ensureNonce(): Promise<void> {
	if (!noncePromise) {
		noncePromise = (async () => {
			try {
				const res = await fetch('/api/wc/cart', { credentials: 'include' });
				const n = res.headers.get('nonce');
				if (n) nonce = n;
			} finally {
				noncePromise = null;
			}
		})();
	}
	return noncePromise;
}

async function call<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
	// Writes need a nonce — grab one first if we don't have it.
	const isWrite = options.method && options.method !== 'GET';
	if (isWrite && !nonce) await ensureNonce();

	const headers = new Headers(options.headers);
	if (nonce) headers.set('nonce', nonce);
	if (options.body) headers.set('content-type', 'application/json');

	const res = await fetch(`/api/wc/${path}`, { ...options, headers, credentials: 'include' });
	const n = res.headers.get('nonce');
	if (n) nonce = n;

	const data = res.status === 204 ? null : await res.json().catch(() => null);

	// Nonce missing/expired mid-session → refresh and retry once.
	const nonceErr =
		res.status === 401 &&
		(data?.code === 'woocommerce_rest_missing_nonce' || data?.code === 'woocommerce_rest_invalid_nonce');
	if (nonceErr && !retried) {
		nonce = null;
		await ensureNonce();
		return call<T>(path, options, true);
	}

	if (!res.ok) {
		throw new Error(data?.message ?? `Request failed: ${res.status}`);
	}
	return data as T;
}

export const cart = {
	get: () => call<WCCart>('/cart'),
	addItem: (productId: number, quantity = 1) =>
		call<WCCart>('/cart/add-item', {
			method: 'POST',
			body: JSON.stringify({ id: productId, quantity }),
		}),
	updateItem: (key: string, quantity: number) =>
		call<WCCart>(`/cart/update-item`, {
			method: 'POST',
			body: JSON.stringify({ key, quantity }),
		}),
	removeItem: (key: string) =>
		call<WCCart>(`/cart/remove-item?key=${encodeURIComponent(key)}`, { method: 'POST' }),
};

export const checkout = {
	place: (payload: {
		billing_address: object;
		shipping_address: object;
		payment_method: string;
	}) =>
		call<{ id: number; order_id?: number; order_number: string }>('/checkout', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
};

export const products = {
	search: (q: string, perPage = 12) =>
		call<import('./types').WCProduct[]>(`/products?search=${encodeURIComponent(q)}&per_page=${perPage}`),
};
