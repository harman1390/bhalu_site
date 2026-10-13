'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';
import { formatPrice } from '@/lib/types';

export default function CartPage() {
	const { cart, update, remove, loading } = useCart();
	const items = cart?.items ?? [];

	return (
		<div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 md:py-16">
			<p className="eyebrow mb-3">Your Selection</p>
			<h1 className="h-display text-[32px] md:text-[44px] text-ink mb-8 md:mb-10">Cart</h1>

			{loading && <p className="text-muted">Loading…</p>}

			{!loading && items.length === 0 && (
				<div className="text-center py-24 border border-sand rounded-[14px] bg-white">
					<p className="font-serif italic text-[20px] text-ink/80 mb-2">Your cart awaits its first ritual.</p>
					<p className="text-muted text-[13px] mb-7">Nothing here yet — explore the collection.</p>
					<Link href="/shop" className="inline-block bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] px-9 py-4 hover:bg-terracotta-deep transition-colors">
						Browse Products
					</Link>
				</div>
			)}

			{items.length > 0 && cart && (
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
					<div>
						{items.map((it) => (
							<div key={it.key} className="flex gap-5 py-5 border-b border-border">
								{it.images[0] && (
									<Image src={it.images[0].thumbnail || it.images[0].src} alt={it.name} width={80} height={80} className="rounded-xl object-cover bg-cream w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />
								)}
								<div className="flex-1 min-w-0">
									<Link href={`/product/${it.id}`} className="text-[15px] font-medium text-ink hover:text-terracotta">
										{it.name}
									</Link>
									<div className="flex items-center justify-between mt-4 flex-wrap gap-3">
										<div className="inline-flex items-center border border-border overflow-hidden">
											<button
												className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-cream transition-colors"
												onClick={() => (it.quantity > 1 ? update(it.key, it.quantity - 1) : remove(it.key))}
											>
												−
											</button>
											<span className="w-9 text-center font-medium text-[13px]">{it.quantity}</span>
											<button className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-cream transition-colors" onClick={() => update(it.key, it.quantity + 1)}>
												+
											</button>
										</div>
										<span className="font-serif text-[18px] font-medium">{formatPrice(it.totals.line_total, it.totals.currency_symbol)}</span>
									</div>
								</div>
								<button onClick={() => remove(it.key)} className="text-muted hover:text-terracotta self-start text-lg leading-none" aria-label="Remove">
									×
								</button>
							</div>
						))}
					</div>

					<aside className="bg-white border border-sand rounded-[14px] p-5 sm:p-7 lg:sticky lg:top-24">
						<h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink mb-5">Summary</h2>
						<div className="flex justify-between text-[14px] py-2 border-b border-sand">
							<span className="text-muted">Subtotal</span>
							<span className="font-semibold">{formatPrice(cart.totals.total_items, cart.totals.currency_symbol)}</span>
						</div>
						<div className="flex justify-between text-[16px] py-3 font-bold">
							<span>Total</span>
							<span>{formatPrice(cart.totals.total_price, cart.totals.currency_symbol)}</span>
						</div>
						<Link href="/checkout" className="block text-center bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] py-4 mt-3 hover:bg-terracotta-deep transition-colors">
							Proceed to Checkout
						</Link>
					</aside>
				</div>
			)}
		</div>
	);
}
