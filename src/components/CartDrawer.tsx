'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from './CartProvider';
import { formatPrice } from '@/lib/types';
import { wpImg } from '@/lib/img';
import FastrrCheckout from './FastrrCheckout';

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
	const { cart, update, remove } = useCart();
	const items = cart?.items ?? [];
	const decimals = 2;

	return (
		<div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`}>
			<div
				className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
				onClick={onClose}
			/>
			<aside
				className={`absolute right-0 top-0 h-full w-full max-w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
			>
				<div className="flex items-center justify-between px-6 py-5 border-b border-sand">
					<h2 className="h-display text-[24px] text-ink">Your Cart {cart ? `(${cart.items_count})` : ''}</h2>
					<button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink text-2xl leading-none">×</button>
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-4">
					{items.length === 0 && (
						<div className="text-center text-muted py-16">
							<p className="mb-4">Your cart is empty.</p>
							<Link href="/shop" onClick={onClose} className="text-terracotta font-semibold underline underline-offset-4">
								Start shopping
							</Link>
						</div>
					)}
					{items.map((it) => (
						<div key={it.key} className="flex gap-4 py-4 border-b border-sand last:border-0">
							{it.images[0] && (
								<Image src={wpImg(it.images[0].thumbnail || it.images[0].src)} alt={it.name} width={72} height={72} className="rounded-[8px] object-cover bg-cream border border-sand" />
							)}
							<div className="flex-1 min-w-0">
								<p className="text-[14px] font-medium text-ink truncate">{it.name}</p>
								<div className="flex items-center gap-3 mt-2">
									<div className="inline-flex items-center border border-border overflow-hidden">
										<button
											className="w-7 h-7 flex items-center justify-center text-base hover:bg-cream transition-colors"
											onClick={() => (it.quantity > 1 ? update(it.key, it.quantity - 1) : remove(it.key))}
										>
											−
										</button>
										<span className="w-7 text-center text-[13px] font-medium">{it.quantity}</span>
										<button className="w-7 h-7 flex items-center justify-center text-base hover:bg-cream transition-colors" onClick={() => update(it.key, it.quantity + 1)}>
											+
										</button>
									</div>
								</div>
							</div>
							<div className="text-right">
								<p className="text-[14px] font-bold">
									{formatPrice(it.totals.line_total, it.totals.currency_symbol, decimals)}
								</p>
								<button onClick={() => remove(it.key)} className="text-[11px] text-muted hover:text-terracotta mt-2 underline">
									Remove
								</button>
							</div>
						</div>
					))}
				</div>

				{items.length > 0 && cart && (
					<div className="border-t border-sand px-5 py-4">
						<div className="flex justify-between mb-3">
							<span className="text-muted text-[13px]">Subtotal</span>
							<span className="font-bold">{formatPrice(cart.totals.total_price, cart.totals.currency_symbol, decimals)}</span>
						</div>
						<FastrrCheckout
							label="Buy Now"
							subtext="UPI · Cards · COD · Wallets"
							className="block w-full text-center bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] py-4 hover:bg-terracotta-deep transition-colors disabled:opacity-60"
						/>
					</div>
				)}
			</aside>
		</div>
	);
}
