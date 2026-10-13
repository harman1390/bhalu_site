'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { formatPrice } from '@/lib/types';
import { checkout } from '@/lib/client';

declare global {
	interface Window {
		Razorpay?: new (opts: Record<string, unknown>) => { open(): void };
	}
}

interface Address {
	first_name: string;
	last_name: string;
	email: string;
	phone: string;
	address_1: string;
	city: string;
	state: string;
	postcode: string;
	country: string;
}

const EMPTY: Address = {
	first_name: '',
	last_name: '',
	email: '',
	phone: '',
	address_1: '',
	city: '',
	state: '',
	postcode: '',
	country: 'IN',
};

const IN_STATES: [string, string][] = [
	['AN', 'Andaman & Nicobar Islands'], ['AP', 'Andhra Pradesh'], ['AR', 'Arunachal Pradesh'],
	['AS', 'Assam'], ['BR', 'Bihar'], ['CH', 'Chandigarh'], ['CT', 'Chhattisgarh'],
	['DD', 'Daman & Diu'], ['DH', 'Dadra & Nagar Haveli'], ['DL', 'Delhi'], ['DN', 'Dadra and Nagar Haveli and Daman and Diu'],
	['GA', 'Goa'], ['GJ', 'Gujarat'], ['HP', 'Himachal Pradesh'], ['HR', 'Haryana'],
	['JH', 'Jharkhand'], ['JK', 'Jammu & Kashmir'], ['KA', 'Karnataka'], ['KL', 'Kerala'],
	['LA', 'Ladakh'], ['LD', 'Lakshadweep'], ['MH', 'Maharashtra'], ['ML', 'Meghalaya'],
	['MN', 'Manipur'], ['MP', 'Madhya Pradesh'], ['MZ', 'Mizoram'], ['NL', 'Nagaland'],
	['OD', 'Odisha'], ['PB', 'Punjab'], ['PY', 'Puducherry'], ['RJ', 'Rajasthan'],
	['SK', 'Sikkim'], ['TS', 'Telangana'], ['TN', 'Tamil Nadu'], ['TR', 'Tripura'],
	['UP', 'Uttar Pradesh'], ['UK', 'Uttarakhand'], ['WB', 'West Bengal'],
];

function stateCodeFromName(name: string): string {
	const norm = (s: string) => s.toLowerCase().replace(/\s*&\s*|\s+and\s+/g, ' ').replace(/[^a-z]/g, '');
	const target = norm(name);
	for (const [code, label] of IN_STATES) {
		if (norm(label) === target) return code;
	}
	return '';
}

export default function CheckoutPage() {
	const { cart } = useCart();
	const [form, setForm] = useState(EMPTY);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState('');
	const [done, setDone] = useState<number | null>(null);
	const [pinBusy, setPinBusy] = useState(false);
	const [manualLoc, setManualLoc] = useState(false); // city/state editable ONLY when lookup fails
	const [stateName, setStateName] = useState(''); // display name; form.state holds WC code
	const [pinMsg, setPinMsg] = useState('');

	const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
	const items = cart?.items ?? [];

	// PIN → city/state autofill via free postalpincode.in API
	const lookupPin = async (pin: string) => {
		if (!/^\d{6}$/.test(pin)) {
			setManualLoc(false);
			setPinMsg(pin ? 'Enter a 6-digit PIN' : '');
			setStateName('');
			setForm((f) => ({ ...f, city: '', state: '' }));
			return;
		}
		setPinBusy(true);
		setPinMsg('');
		try {
			const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`).then((r) => r.json());
			const po = res?.[0]?.PostOffice?.[0];
			if (po) {
				const code = stateCodeFromName(po.State);
				const label = IN_STATES.find(([c]) => c === code)?.[1] ?? po.State;
				setForm((f) => ({ ...f, city: po.District ?? '', state: code }));
				setStateName(label);
				setManualLoc(false);
				setPinMsg('');
			} else {
				setManualLoc(true);
				setStateName('');
				setPinMsg('PIN not found — enter city/state manually');
				setForm((f) => ({ ...f, city: '', state: '' }));
			}
		} catch {
			setManualLoc(true);
			setStateName('');
			setPinMsg('Lookup failed — enter city/state manually');
		} finally {
			setPinBusy(false);
		}
	};

	const loadRzp = () =>
		new Promise<void>((resolve, reject) => {
			if (window.Razorpay) return resolve();
			const s = document.createElement('script');
			s.src = 'https://checkout.razorpay.com/v1/checkout.js';
			s.onload = () => resolve();
			s.onerror = () => reject(new Error('Failed to load Razorpay'));
			document.body.appendChild(s);
		});

	const placeOrder = async (e: React.FormEvent) => {
		e.preventDefault();
		setErr('');
		// Manual state entry must resolve to a valid code
		if (manualLoc && !IN_STATES.some(([c]) => c === form.state)) {
			setErr('Please enter a valid Indian state name.');
			return;
		}
		if (!/^[6-9]\d{9}$/.test(form.phone)) {
			setErr('Please enter a valid 10-digit mobile number.');
			return;
		}
		setBusy(true);
		try {
			// 1. create WC order via Store API (nonce-aware client)
			const order = await checkout.place({
				billing_address: form,
				shipping_address: form,
				payment_method: 'razorpay',
			});

			// 2. create Razorpay order on WP side
			const rzp = await fetch('/api/rzp/razorpay-order', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ order_id: order.id ?? order.order_id }),
			}).then(async (r) => {
				const d = await r.json();
				if (!r.ok) throw new Error(d?.message ?? 'Payment init failed');
				return d;
			});

			// 3. open Razorpay modal
			await loadRzp();
			await new Promise<void>((resolve, reject) => {
				const modal = new window.Razorpay!({
					key: rzp.key_id,
					amount: rzp.amount,
					currency: rzp.currency,
					name: 'BARELYN',
					description: `Order #${order.order_number ?? order.id}`,
					order_id: rzp.razorpay_order_id,
					handler: async (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
						try {
							const v = await fetch('/api/rzp/razorpay-verify', {
								method: 'POST',
								headers: { 'content-type': 'application/json' },
								body: JSON.stringify({ ...res, order_id: order.id }),
							});
							if (!v.ok) throw new Error('Payment verification failed');
							resolve();
						} catch (e2) {
							reject(e2);
						}
					},
					modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
					theme: { color: '#1c1917' },
				});
				modal.open();
			});

			setDone(order.id ?? order.order_id ?? null);
		} catch (e2) {
			setErr(e2 instanceof Error ? e2.message : 'Something went wrong');
		} finally {
			setBusy(false);
		}
	};

	if (done) {
		return (
			<div className="max-w-[700px] mx-auto px-6 py-24 text-center">
				<p className="eyebrow mb-4">Order Confirmed</p>
				<h1 className="h-display text-[38px] md:text-[46px] text-ink mb-4">Thank you.</h1>
				<p className="text-muted mb-8">Order #{done} — payment received. You&rsquo;ll get a confirmation shortly.</p>
				<Link href="/shop" className="inline-block bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] px-9 py-4 hover:bg-terracotta-deep transition-colors">
					Continue Shopping
				</Link>
			</div>
		);
	}

	return (
		<div className="max-w-[1280px] mx-auto px-6 py-12 md:py-16">
			<p className="eyebrow mb-3">Almost There</p>
			<h1 className="h-display text-[36px] md:text-[44px] text-ink mb-10">Checkout</h1>

			{items.length === 0 ? (
				<p className="text-muted">
					Your cart is empty — <Link href="/shop" className="text-terracotta underline">go shopping</Link>.
				</p>
			) : (
				<form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
					<div className="space-y-4">
						<h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink">Billing & Shipping</h2>
						<div className="grid grid-cols-2 gap-3">
							<input required placeholder="First name" value={form.first_name} onChange={set('first_name')} className="border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px] w-full" />
							<input required placeholder="Last name" value={form.last_name} onChange={set('last_name')} className="border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px] w-full" />
						</div>
						<input required type="email" placeholder="Email" value={form.email} onChange={set('email')} className="border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px] w-full" />
						<input required type="tel" placeholder="Phone (10 digits)" value={form.phone} onChange={set('phone')} className="border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px] w-full" />
						<input required placeholder="Address" value={form.address_1} onChange={set('address_1')} className="border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px] w-full" />
						<div className="grid grid-cols-3 gap-3">
							<div className="relative">
								<input
									required
									inputMode="numeric"
									maxLength={6}
									placeholder="PIN code"
									value={form.postcode}
									onChange={(e) => {
										const v = e.target.value.replace(/\D/g, '').slice(0, 6);
										setForm((f) => ({ ...f, postcode: v }));
										if (v.length === 6) lookupPin(v);
										else {
											setManualLoc(false);
											setStateName('');
											setForm((f) => ({ ...f, city: '', state: '' }));
										}
									}}
									className="border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px] w-full"
								/>
								{pinBusy && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted">…</span>}
							</div>
							<input
								required
								placeholder="City"
								value={form.city}
								onChange={set('city')}
								readOnly={!manualLoc}
								className={`border border-border rounded-[8px] px-4 py-3.5 text-[14px] w-full ${!manualLoc ? 'bg-cream text-muted' : 'bg-white'}`}
							/>
							<input
								required
								placeholder="State"
								value={stateName}
								onChange={(e) => {
									if (!manualLoc) return;
									setStateName(e.target.value);
									setForm((f) => ({ ...f, state: stateCodeFromName(e.target.value) || e.target.value }));
								}}
								readOnly={!manualLoc}
								className={`border border-border rounded-[8px] px-4 py-3.5 text-[14px] w-full ${!manualLoc ? 'bg-cream text-muted' : 'bg-white'}`}
							/>
						</div>
						{pinMsg && <p className="text-[12px] text-muted -mt-2">{pinMsg}</p>}
						{err && <p className="text-[13px] text-[#ff5a52] font-medium">{err}</p>}
					</div>

					<aside className="bg-white border border-sand rounded-[14px] p-7 lg:sticky lg:top-24">
						<h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink mb-5">Your Order</h2>
						{items.map((it) => (
							<div key={it.key} className="flex justify-between text-[13px] py-1.5">
								<span className="text-muted truncate mr-3">
									{it.name} × {it.quantity}
								</span>
								<span className="font-medium shrink-0">{formatPrice(it.totals.line_total, it.totals.currency_symbol)}</span>
							</div>
						))}
						{cart && (
							<div className="flex justify-between text-[16px] font-bold pt-3 mt-2 border-t border-sand">
								<span>Total</span>
								<span>{formatPrice(cart.totals.total_price, cart.totals.currency_symbol)}</span>
							</div>
						)}
						<button
							type="submit"
							disabled={busy}
							className="w-full bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] py-4 mt-5 hover:bg-terracotta-deep transition-colors disabled:opacity-60"
						>
							{busy ? 'Processing…' : 'Pay with Razorpay'}
						</button>
						<p className="text-[11px] text-muted mt-3 text-center">UPI · Cards · Netbanking · Wallets</p>
					</aside>
				</form>
			)}
		</div>
	);
}
