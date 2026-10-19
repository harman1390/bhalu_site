'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { WCProduct } from '@/lib/types';
import { wpImg } from '@/lib/img';
import ProductCard from './ProductCard';
import ScrollChevron from './ScrollChevron';

interface Props {
	products: WCProduct[];
	/** 'card' = full product card, 'watch' = tall tile with play overlay */
	variant?: 'card' | 'watch';
}

/**
 * Horizontal snap-scroll product carousel (Dot & Key style row).
 */
export default function ProductRow({ products, variant = 'card' }: Props) {
	if (products.length === 0) return null;

	return (
		<div className="relative">
			<div className="snap-row flex gap-3 md:gap-5 overflow-x-auto py-1">
				{products.map((p) =>
					variant === 'watch' ? (
						<Link
							key={p.id}
							href={`/product/${p.slug}`}
							className="shrink-0 w-[180px] md:w-[240px] group"
						>
							<div className="relative h-[240px] md:h-[320px] rounded-[12px] overflow-hidden bg-blush img-shell border border-sand">
								{p.images[0] && (
									<Image
										src={wpImg(p.images[0].src)}
										alt={p.images[0].alt || p.name}
										fill
										sizes="220px"
										className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
									/>
								)}
								<span className="absolute inset-0 flex items-center justify-center">
									<span className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-transform group-hover:scale-110">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-terracotta ml-0.5">
											<path d="M8 5.5v13l11-6.5z" />
										</svg>
									</span>
								</span>
							</div>
							<p className="mt-2.5 font-serif text-[15px] leading-snug text-ink text-center line-clamp-2">{p.name}</p>
						</Link>
					) : (
						<div key={p.id} className="shrink-0 w-[205px] md:w-[264px]">
							<ProductCard product={p} />
						</div>
					)
				)}
			</div>
			<ScrollChevron top={variant === 'watch' ? '40%' : '36%'} />
		</div>
	);
}
