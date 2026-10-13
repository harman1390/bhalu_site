import type { Metadata } from 'next';
import { getProducts } from '@/lib/wc';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = { title: 'Shop — BARELYN' };

export default async function ShopPage() {
	const products = await getProducts({ per_page: 48 }).catch(() => []);

	return (
		<div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-10 md:py-16">
			<p className="eyebrow mb-3">The Collection</p>
			<h1 className="h-display text-[32px] md:text-[44px] text-ink mb-8 md:mb-10">Shop All</h1>
			{products.length === 0 && <p className="text-muted">No products found.</p>}
			<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
				{products.map((p) => (
					<ProductCard key={p.id} product={p} />
				))}
			</div>
		</div>
	);
}
