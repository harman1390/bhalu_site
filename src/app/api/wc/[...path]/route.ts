import { NextRequest, NextResponse } from 'next/server';

const WC_API = process.env.STORE_API ?? 'http://localhost/barelyn-api';

/**
 * Proxy: /api/wc/<path> → <WC_STORE_API>/<path>
 * Forwards cookies + store nonces both ways so WooCommerce cart sessions
 * stay intact even though WP lives on a different origin.
 */
async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
	const { path } = await params;
	const upstream = new URL(`${WC_API}/${path.join('/')}`);
	upstream.search = req.nextUrl.search;

	const headers = new Headers();
	const cookie = req.headers.get('cookie');
	if (cookie) headers.set('cookie', cookie);
	const nonce = req.headers.get('nonce');
	if (nonce) headers.set('nonce', nonce);
	const contentType = req.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);
	headers.set('user-agent', 'barelyn-storefront/1.0');

	const hasBody = !['GET', 'HEAD'].includes(req.method);
	const body = hasBody ? await req.arrayBuffer() : undefined;

	const res = await fetch(upstream.toString(), {
		method: req.method,
		headers,
		body: body && body.byteLength > 0 ? body : undefined,
		cache: 'no-store',
		redirect: 'manual',
	});

	const out = new NextResponse(res.body, { status: res.status });
	// Set-Cookie must be forwarded per-cookie (fetch coalesces it otherwise)
	for (const c of res.headers.getSetCookie()) {
		out.headers.append('set-cookie', c);
	}
	res.headers.forEach((value, key) => {
		const k = key.toLowerCase();
		if (k === 'nonce' || k === 'nonce-timestamp' || k === 'cart-hash') {
			out.headers.append(key, value);
		}
	});
	if (!out.headers.get('content-type')) {
		out.headers.set('content-type', res.headers.get('content-type') ?? 'application/json');
	}
	// Catalog GETs (products, categories) are session-independent — cache them
	// in the browser/shared caches. Cart & session paths must never cache.
	const joined = path.join('/');
	const isCatalogGet =
		req.method === 'GET' && (joined === 'products' || joined.startsWith('products/'));
	if (isCatalogGet && res.ok) {
		out.headers.set('cache-control', 'public, s-maxage=120, stale-while-revalidate=600');
	} else {
		out.headers.set('cache-control', 'private, no-store');
	}
	return out;
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as OPTIONS };
