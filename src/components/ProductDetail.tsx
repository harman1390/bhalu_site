'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { WCProduct } from '@/lib/types';
import { formatPrice } from '@/lib/types';
import { wpImg } from '@/lib/img';
import { cleanHtml } from '@/lib/sanitize';
import { useCart } from './CartProvider';

export default function ProductDetail({ product }: { product: WCProduct }) {
	const { cart, add, update, remove } = useCart();
	const [qty, setQty] = useState(1);
	const [busy, setBusy] = useState(false);
	const [added, setAdded] = useState(false);
	const [active, setActive] = useState(0);
	const inCart = cart?.items.find((i) => i.id === product.id);

	const imgs = product.images;
	const onSale = product.prices.regular_price !== product.prices.sale_price && product.prices.sale_price !== '';
	const d = product.prices.currency_minor_unit;
	const price = onSale ? product.prices.sale_price : product.prices.price;
	const pct = onSale
		? Math.round((1 - Number(product.prices.sale_price) / Number(product.prices.regular_price)) * 100)
		: 0;

	const buy = async () => {
		setBusy(true);
		try {
			await add(product.id, qty);
			setAdded(true);
			setTimeout(() => setAdded(false), 2000);
		} finally {
			setBusy(false);
		}
	};

	const changeCartQty = async (delta: number) => {
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
		<div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 md:py-14">
			{/* breadcrumbs */}
			<nav className="text-[10.5px] uppercase tracking-[0.16em] text-muted mb-6">
				<Link href="/" className="hover:text-terracotta">Home</Link>
				<span className="mx-2 text-sand">/</span>
				<Link href="/shop" className="hover:text-terracotta">Shop</Link>
				{product.categories[0] && (
					<>
						<span className="mx-2 text-sand">/</span>
						<Link href={`/product-category/${product.categories[0].slug}`} className="hover:text-terracotta">
							{product.categories[0].name}
						</Link>
					</>
				)}
				<span className="mx-2 text-sand">/</span>
				<span className="text-ink normal-case tracking-normal">{product.name}</span>
			</nav>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
				{/* gallery */}
				<div className="lg:sticky lg:top-24">
					<div className="relative aspect-square rounded-[14px] overflow-hidden img-shell mb-3 border border-sand">
						{onSale && (
							<span className="absolute top-4 left-4 z-10 bg-ink text-ivory text-[10px] font-medium uppercase tracking-[0.16em] px-3.5 py-1.5">
								Save {pct}%
							</span>
						)}
						{imgs[active] && (
							<Image
								src={wpImg(imgs[active].src)}
								alt={imgs[active].alt || product.name}
								fill
								priority
								className="object-cover"
								sizes="(max-width:1024px) 100vw, 50vw"
							/>
						)}
					</div>
					{imgs.length > 1 && (
						<div className="flex gap-2 overflow-x-auto pb-1">
							{imgs.map((im, i) => (
								<button
									key={im.id}
									onClick={() => setActive(i)}
									className={`shrink-0 w-[72px] h-[72px] rounded-[8px] overflow-hidden border transition-colors bg-cream ${i === active ? 'border-ink' : 'border-sand'}`}
								>
									<Image src={wpImg(im.thumbnail || im.src)} alt="" width={72} height={72} className="object-cover w-full h-full" />
								</button>
							))}
						</div>
					)}
				</div>

				{/* summary */}
				<div>
					<h1 className="h-display text-[32px] md:text-[40px] text-ink leading-[1.12]">{product.name}</h1>

					{Number(product.average_rating) > 0 && (
						<div className="flex items-center gap-2 mt-3">
							<span className="text-star text-[14px] tracking-[2px]">{'★'.repeat(Math.round(Number(product.average_rating)))}</span>
							<span className="text-[12px] text-muted">({product.review_count} reviews)</span>
						</div>
					)}

					<div className="flex items-baseline gap-3 mt-5">
						<span className="font-serif text-[28px] font-medium text-ink">
							{formatPrice(price, product.prices.currency_symbol, d)}
						</span>
						{onSale && (
							<del className="text-[15px] text-muted">
								{formatPrice(product.prices.regular_price, product.prices.currency_symbol, d)}
							</del>
						)}
					</div>

					<div
						className="mt-5 pb-5 mb-6 border-b border-border text-[15px] leading-[1.8] text-muted"
						dangerouslySetInnerHTML={{ __html: cleanHtml(product.short_description) }}
					/>

					<div className="flex items-center gap-3 mb-8 flex-wrap">
						{inCart ? (
							<>
								<div className="inline-flex items-center border border-border overflow-hidden">
									<button
										onClick={() => changeCartQty(-1)}
										disabled={busy}
										aria-label="Decrease quantity"
										className="w-11 h-12 text-lg hover:bg-cream transition-colors disabled:opacity-60"
									>
										−
									</button>
									<span className="w-11 text-center text-[13px] font-medium">{busy ? '…' : inCart.quantity}</span>
									<button
										onClick={() => changeCartQty(1)}
										disabled={busy}
										aria-label="Increase quantity"
										className="w-11 h-12 text-lg hover:bg-cream transition-colors disabled:opacity-60"
									>
										+
									</button>
								</div>
								<span className="flex-1 min-w-[200px] text-center bg-cream text-ink text-[11px] font-medium uppercase tracking-[0.18em] py-4 px-8">
									{inCart.quantity} in Cart
								</span>
							</>
						) : (
							<>
								<div className="inline-flex items-center border border-border overflow-hidden">
									<button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-12 text-lg hover:bg-cream transition-colors">
										−
									</button>
									<span className="w-11 text-center text-[13px] font-medium">{qty}</span>
									<button onClick={() => setQty((q) => q + 1)} className="w-11 h-12 text-lg hover:bg-cream transition-colors">
										+
									</button>
								</div>
								<button
									onClick={buy}
									disabled={busy || !product.is_in_stock}
									className="flex-1 min-w-[200px] bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] py-4 px-8 hover:bg-terracotta-deep transition-colors disabled:opacity-60"
								>
									{busy ? 'Adding…' : added ? 'Added to Cart' : product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
								</button>
							</>
						)}
					</div>

					<div className="pt-5 border-t border-border text-[12px] tracking-[0.03em] text-muted">
						{product.categories.length > 0 && (
							<p>
								<span className="eyebrow !text-[10px] mr-3">Category</span>
								{product.categories.map((c, i) => (
									<span key={c.id}>
										{i > 0 && ', '}
										<Link href={`/product-category/${c.slug}`} className="text-ink border-b border-sand pb-px hover:text-terracotta hover:border-terracotta transition-colors">
											{c.name}
										</Link>
									</span>
								))}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* description */}
			{product.description && (
				<div className="mt-16 pt-12 border-t border-border max-w-[760px]">
					<p className="eyebrow mb-3">Details</p>
					<h2 className="h-display text-[28px] md:text-[34px] text-ink mb-5">The Ritual</h2>
					<div
						className="text-[15px] leading-[1.8] text-muted [&>p]:mb-4 [&_li]:mb-2"
						dangerouslySetInnerHTML={{ __html: cleanHtml(product.description) }}
					/>
				</div>
			)}
		</div>
	);
}
