'use client';

/**
 * Fastrr (Shiprocket) headless checkout — replicates the official WooCommerce
 * channel script flow on this storefront:
 *
 *   load woocommerce.js → HeadlessCheckout.checkout(event, items)
 *   → channel script opens its own modal iframe on fastrr-boost-ui.pickrr.com
 *   and owns the full parent↔iframe protocol: otpless login, WebOTP autofill,
 *   Razorpay/Cashfree payment iframes, exit popup, close/complete events.
 *
 * Items use the plugin's order_details shape (snake_case, price in PAISE).
 */

export const FASTRR_HOST = 'https://fastrr-boost-ui.pickrr.com/';
export const FASTRR_SCRIPT = FASTRR_HOST + 'assets/js/channels/woocommerce.js';
export const FASTRR_CSS = FASTRR_HOST + 'assets/styles/shopify.css';
export const SHOP_URL = 'barelyn.co.in'; // seller identity Fastrr resolves

/** Cart line shape expected by HeadlessCheckout.checkout (price in paise). */
export interface FastrrCartItem {
	product_id: number;
	variation_id?: number;
	title: string;
	price: number;
	quantity: number;
	image?: string;
	category?: string;
	custom_attributes?: Record<string, unknown>;
}

declare global {
	interface Window {
		HeadlessCheckout?: {
			checkout: (event: unknown, items: FastrrCartItem[]) => void;
			buyNow?: (event: unknown, product: unknown, callAPI?: boolean) => void;
			buyDirect?: (data: { productList: unknown[] }) => void;
		};
	}
}

let scriptPromise: Promise<void> | null = null;

/** Inject #sellerDomain + #checkoutBtn + channel stylesheet/script (all idempotent). */
export function ensureFastrrEnv(): Promise<void> {
	if (!document.getElementById('sellerDomain')) {
		const i = document.createElement('input');
		i.type = 'hidden';
		i.id = 'sellerDomain';
		i.value = SHOP_URL;
		document.body.appendChild(i);
	}
	// The channel script dereferences #checkoutBtn unguarded when adding its
	// button loader — it must exist or checkout() throws before opening.
	if (!document.getElementById('checkoutBtn')) {
		const b = document.createElement('button');
		b.id = 'checkoutBtn';
		b.type = 'button';
		b.style.display = 'none';
		document.body.appendChild(b);
	}
	if (!document.getElementById('shopify-css')) {
		const l = document.createElement('link');
		l.id = 'shopify-css';
		l.rel = 'stylesheet';
		l.href = FASTRR_CSS;
		document.head.appendChild(l);
	}
	if (!scriptPromise) {
		scriptPromise = new Promise((resolve, reject) => {
			const s = document.createElement('script');
			s.src = FASTRR_SCRIPT;
			s.onload = () => resolve();
			s.onerror = () => {
				scriptPromise = null;
				reject(new Error('Failed to load Fastrr checkout'));
			};
			document.body.appendChild(s);
		});
	}
	return scriptPromise;
}

/** Wait for the async IIFE in woocommerce.js to assign window.HeadlessCheckout. */
function waitForHeadless(timeoutMs = 8000): Promise<NonNullable<Window['HeadlessCheckout']>> {
	return new Promise((resolve, reject) => {
		const t0 = Date.now();
		const tick = () => {
			if (window.HeadlessCheckout?.checkout) return resolve(window.HeadlessCheckout);
			if (Date.now() - t0 > timeoutMs) return reject(new Error('Fastrr checkout failed to initialise'));
			setTimeout(tick, 50);
		};
		tick();
	});
}

/** Open the hosted Fastrr modal via the channel script's own entry point. */
export async function openFastrrCheckout(items: FastrrCartItem[]): Promise<void> {
	await ensureFastrrEnv();
	const hc = await waitForHeadless();
	hc.checkout(null, items);
}

/** Remove the channel script's modal (fallback cleanup — it normally self-closes). */
export function closeFastrrModal(): void {
	document.getElementById('headless-container')?.remove();
	document.getElementById('fastrr-main-container')?.remove();
	document.getElementById('fastrr-pre-loader')?.remove();
	document.body.style.overflow = '';
	document.body.style.height = '';
}

/**
 * NOTE on the back button: the channel script handles it natively — on open it
 * pushes a dummy history state and, on popstate, re-pushes + posts
 * 'openExitPopup' into the iframe (their exit-intent flow). Do NOT add our own
 * pushState/popstate handler here — a second marker entry breaks the modal.
 */

/**
 * Listen for Fastrr iframe lifecycle events.
 * `onDone` fires on 'headless-complete' / 'clear-cart' (order placed);
 * `onClosed` fires when the shopper exits ('headless-close' etc.).
 */
export function watchFastrr(opts: { onDone: () => void; onClosed: () => void }): () => void {
	const onMsg = (e: MessageEvent) => {
		let host = '';
		try {
			host = new URL(e.origin).hostname;
		} catch {
			return;
		}
		if (!/pickrr|fastrr|shiprocket/.test(host)) return;
		const t = typeof e.data === 'object' && e.data ? e.data.trigger : e.data;
		if (t === 'headless-complete' || t === 'clear-cart') {
			opts.onDone();
		} else if (
			t === 'headless-close' ||
			t === 'continue-shopping' ||
			t === 'headless-woocommerce' ||
			(/close|exit|cancel|abort/i.test(t) && !/payment/i.test(t))
		) {
			opts.onClosed();
		}
	};
	window.addEventListener('message', onMsg);
	return () => window.removeEventListener('message', onMsg);
}
