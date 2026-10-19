'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from './CartProvider';
import {
	openFastrrCheckout,
	closeFastrrModal,
	watchFastrr,
	type FastrrCartItem,
} from '@/lib/fastrr';

/**
 * One-click Fastrr checkout — same flow as the official WooCommerce plugin:
 * the channel script (woocommerce.js) owns the modal iframe + the whole
 * parent↔iframe protocol (OTP-less login, payments, close/complete events).
 * We only record a pending order via /api/fastrr/init (direct mode) and mark
 * it paid on 'headless-complete'/'clear-cart'.
 */
export default function FastrrCheckout({
	label = 'Buy Now',
	className = '',
	subtext,
}: {
	label?: string;
	className?: string;
	subtext?: string;
}) {
	const { cart, refresh } = useCart();
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState('');
	const [confirmPrompt, setConfirmPrompt] = useState<number | null>(null);
	const [done, setDone] = useState<number | null>(null);
	const orderIdRef = useRef<number | null>(null);
	const paidRef = useRef(false);
	const unwatchRef = useRef<(() => void) | null>(null);

	// Modal dismissed without completing — via ✕, iframe close, or device Back.
	const dismiss = () => {
		closeFastrrModal();
		if (!paidRef.current && orderIdRef.current) setConfirmPrompt(orderIdRef.current);
	};

	const confirmPaid = async (orderId?: number) => {
		const oid = orderId ?? orderIdRef.current ?? undefined;
		const res = await fetch('/api/fastrr/confirm', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(oid ? { order_id: oid } : {}),
		});
		if (!res.ok) throw new Error('Payment confirmation failed');
		const d = await res.json().catch(() => ({}));
		paidRef.current = true;
		closeFastrrModal();
		setConfirmPrompt(null);
		setDone(d?.order_id ?? oid ?? 1);
		refresh(); // cart cleared server-side
	};

	useEffect(() => () => unwatchRef.current?.(), []);

	const start = async () => {
		const items = cart?.items ?? [];
		if (!items.length) {
			setErr('Your cart is empty.');
			return;
		}
		setBusy(true);
		setErr('');
		try {
			// 1. record a pending order on our backend (direct mode — no Fastrr session needed)
			const init = await fetch('/api/fastrr/init', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ direct: true }),
			}).then(async (r) => {
				const d = await r.json();
				if (!r.ok) throw new Error(d?.message ?? 'Checkout init failed');
				return d as { order_id: number };
			});
			orderIdRef.current = init.order_id;

			// 2. channel script opens its own modal + owns the iframe protocol
			const fastrrItems: FastrrCartItem[] = items.map((it) => ({
				product_id: it.id,
				variation_id: 0,
				title: it.name,
				price: Number(it.prices.price), // paise — script converts to ₹
				quantity: it.quantity,
				image: it.images?.[0]?.src ?? '',
				custom_attributes: {},
			}));
			await openFastrrCheckout(fastrrItems);

			// 3. completion / dismissal events from the channel script
			unwatchRef.current?.();
			unwatchRef.current = watchFastrr({
				onDone: () => {
					confirmPaid().catch(() => setErr('Payment confirmation failed'));
				},
				onClosed: dismiss,
			});
		} catch (e) {
			setErr(e instanceof Error ? e.message : 'Something went wrong');
		} finally {
			setBusy(false);
		}
	};

	if (done) {
		return (
			<div className="text-center">
				<p className="text-[13px] font-medium text-ink mb-1">Order #{done} confirmed — thank you!</p>
				<p className="text-[12px] text-muted">You&apos;ll get a confirmation shortly.</p>
			</div>
		);
	}

	return (
		<>
			<button type="button" onClick={start} disabled={busy} className={className}>
				{busy ? 'Opening checkout…' : label}
			</button>
			{subtext && <p className="text-[11px] text-muted mt-2 text-center">{subtext}</p>}
			{err && <p className="text-[12px] text-[#ff5a52] mt-2 text-center">{err}</p>}

			{/* Fallback when the modal is closed without a completion event */}
			{confirmPrompt !== null && (
				<div className="fixed bottom-6 inset-x-0 z-[9998] flex justify-center px-4">
					<div className="bg-ink text-ivory px-5 py-3.5 rounded-[12px] shadow-2xl flex items-center justify-center gap-4 max-w-full">
						<p className="text-[13px] whitespace-nowrap">Payment completed?</p>
						<button
							type="button"
							onClick={() => confirmPaid(confirmPrompt).catch(() => setErr('Payment confirmation failed'))}
							className="shrink-0 whitespace-nowrap bg-white text-ink text-[11px] font-medium uppercase tracking-[0.12em] px-4 py-2 rounded-[8px]"
						>
							Yes, mark paid
						</button>
						<button
							type="button"
							onClick={() => setConfirmPrompt(null)}
							className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-[0.12em] text-ivory/70 underline underline-offset-2"
						>
							Not yet
						</button>
					</div>
				</div>
			)}
		</>
	);
}
