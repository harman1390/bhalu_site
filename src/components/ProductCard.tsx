'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { WCProduct } from '@/lib/types';
import { formatPrice } from '@/lib/types';
import { wpImg } from '@/lib/img';
import { useCart } from './CartProvider';

export default function ProductCard({ product }: { product: WCProduct }) {
	const { cart, add, update, remove } = useCart();
	const [busy, setBusy] = useState(false);
	const [failed, setFailed] = useState(false);
	const img = product.images[0];
	const onSale = product.prices.regular_price !== product.prices.sale_price && product.prices.sale_price !== '';
	const decimals = product.prices.currency_minor_unit;
	const inCart = cart?.items.find((i) => i.id === product.id);
	const pctOff =
		onSale && Number(product.prices.regular_price) > 0
			? Math.round((1 - Number(product.prices.sale_price) / Number(product.prices.regular_price)) * 100)
			: 0;

	const buy = async () => {
		setBusy(true);
		setFailed(false);
		try {
			await add(product.id);
		} catch {
			setFailed(true);
		} finally {
			setBusy(false);
		}
	};

	const changeQty = async (delta: number) => {
		if (!inCart) return;
		setBusy(true);
		try {
			if (inCart.quantity + delta <= 0) await remove(inCart.key);
			else await update(inCart.key, inCart.quantity + delta);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="bg-white border border-sand rounded-[14px] overflow-hidden transition-all duration-300 hover:border-terracotta/50 group">
			<Link href={`/product/${product.slug}`} className="block relative m-2 h-[280px] img-shell overflow-hidden rounded-[10px] bg-blush">
				{img && (
					<Image
						src={wpImg(img.src)}
						alt={img.alt || product.name}
						fill
						sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
						className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
					/>
				)}
				{onSale && (
					<span className="absolute top-3 left-3 bg-ink text-ivory text-[10px] font-medium uppercase tracking-[0.14em] px-3 py-1.5">
						{pctOff > 0 ? `${pctOff}% Off` : 'Sale'}
					</span>
				)}
				{Number(product.average_rating) > 0 && (
					<span className="absolute bottom-3 left-3 bg-white/95 text-ink text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-[0_2px_8px_rgba(0,0,0,.08)]">
						<span className="text-star">★</span>
						{Number(product.average_rating).toFixed(1)}
					</span>
				)}
			</Link>
			<div className="px-5 pt-3 pb-5">
				<Link
					href={`/product/${product.slug}`}
					className="block font-serif text-[17px] leading-[1.3] font-medium text-ink hover:text-terracotta transition-colors mb-1.5 line-clamp-2 min-h-[44px]"
				>
					{product.name}
				</Link>
				<div className="flex items-baseline gap-2 mb-4">
					<span className="text-[14px] font-medium tracking-[0.02em] text-ink">
						{formatPrice(onSale ? product.prices.sale_price : product.prices.price, product.prices.currency_symbol, decimals)}
					</span>
					{onSale && (
						<del className="text-[12.5px] text-muted">
							{formatPrice(product.prices.regular_price, product.prices.currency_symbol, decimals)}
						</del>
					)}
				</div>
				{inCart ? (
					<div className="w-full flex items-center justify-between bg-ink text-ivory overflow-hidden">
						<button
							onClick={() => changeQty(-1)}
							disabled={busy}
							aria-label="Decrease quantity"
							className="w-12 py-3 text-lg hover:bg-white/10 transition-colors disabled:opacity-60"
						>
							−
						</button>
						<span className="text-[11px] font-medium uppercase tracking-[0.14em]">{busy ? '…' : `${inCart.quantity} in cart`}</span>
						<button
							onClick={() => changeQty(1)}
							disabled={busy}
							aria-label="Increase quantity"
							className="w-12 py-3 text-lg hover:bg-white/10 transition-colors disabled:opacity-60"
						>
							+
						</button>
					</div>
				) : (
					<button
						onClick={buy}
						disabled={busy || !product.is_purchasable || !product.is_in_stock}
						className="w-full py-3 px-4 bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] hover:bg-terracotta-deep transition-colors disabled:opacity-60"
					>
						{busy ? 'Adding…' : failed ? 'Failed — Retry' : product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
					</button>
				)}
			</div>
		</div>
	);
}
