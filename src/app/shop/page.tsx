import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCategories, getCategoryBySlug, getProducts } from '@/lib/wc';
import ProductCard from '@/components/ProductCard';
import { ShopFilters, ShopSort } from '@/components/ShopFilters';
import { catDisplayName } from '@/lib/shop';

export const metadata: Metadata = { title: 'Shop — BARELYN' };

const PER_PAGE = 24;

const SORT_MAP: Record<string, { orderby: string; order?: string }> = {
	menu_order: { orderby: 'menu_order', order: 'asc' },
	popularity: { orderby: 'popularity', order: 'desc' },
	rating: { orderby: 'rating', order: 'desc' },
	date: { orderby: 'date', order: 'desc' },
	'price-asc': { orderby: 'price', order: 'asc' },
	'price-desc': { orderby: 'price', order: 'desc' },
};

type SP = Record<string, string | string[] | undefined>;

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
	const sp = await searchParams;

	const q = str(sp.q).trim();
	const catSlug = str(sp.cat);
	const min = str(sp.min);
	const max = str(sp.max);
	const sale = str(sp.sale) === '1';
	const stock = str(sp.stock) === '1';
	const sort = str(sp.sort) || 'menu_order';
	const page = Math.max(1, parseInt(str(sp.page) || '1', 10) || 1);

	const [categories, activeCat] = await Promise.all([
		getCategories().catch(() => []),
		catSlug ? getCategoryBySlug(catSlug).catch(() => null) : Promise.resolve(null),
	]);

	const apiParams: Record<string, string | number> = { per_page: PER_PAGE, page };
	if (q) apiParams.search = q;
	if (activeCat) apiParams.category = activeCat.id;
	if (sale) apiParams.on_sale = '1';
	if (stock) apiParams.stock_status = 'instock';
	if (/^\d+$/.test(min)) apiParams.min_price = String(Math.floor(Number(min) * 100));
	if (/^\d+$/.test(max)) apiParams.max_price = String(Math.floor(Number(max) * 100));
	const s = SORT_MAP[sort] ?? SORT_MAP.menu_order;
	apiParams.orderby = s.orderby;
	apiParams.order = s.order ?? 'asc';

	const products = await getProducts(apiParams).catch(() => []);

	// Server-side href builder for chips + pagination.
	const href = (patch: Record<string, string>, resetPage = true) => {
		const p = new URLSearchParams();
		for (const [k, v] of Object.entries(sp)) {
			const sv = str(v);
			if (sv) p.set(k, sv);
		}
		for (const [k, v] of Object.entries(patch)) {
			if (v === '') p.delete(k);
			else p.set(k, v);
		}
		if (resetPage) p.delete('page');
		const qs = p.toString();
		return qs ? `/shop?${qs}` : '/shop';
	};

	const chips: { label: string; remove: Record<string, string> }[] = [];
	if (q) chips.push({ label: `Search: “${q}”`, remove: { q: '' } });
	if (activeCat) chips.push({ label: `Category: ${catDisplayName(activeCat.slug, activeCat.name)}`, remove: { cat: '' } });
	if (/^\d+$/.test(min)) chips.push({ label: `Min ₹${min}`, remove: { min: '' } });
	if (/^\d+$/.test(max)) chips.push({ label: `Max ₹${max}`, remove: { max: '' } });
	if (sale) chips.push({ label: 'On sale', remove: { sale: '' } });
	if (stock) chips.push({ label: 'In stock', remove: { stock: '' } });

	const anyActive = chips.length > 0;

	return (
		<div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-10 md:py-16">
			<p className="eyebrow mb-3">The Collection</p>
			<h1 className="h-display text-[32px] md:text-[44px] text-ink mb-8 md:mb-10">
				{activeCat ? catDisplayName(activeCat.slug, activeCat.name) : 'Shop All'}
			</h1>

			<div className="lg:flex lg:gap-10">
				<Suspense fallback={null}>
					<ShopFilters
						categories={categories}
						activeCat={activeCat?.slug ?? ''}
						activeQ={q}
						activeMin={/^\d+$/.test(min) ? min : ''}
						activeMax={/^\d+$/.test(max) ? max : ''}
						activeSale={sale}
						activeStock={stock}
						anyActive={anyActive}
					/>
				</Suspense>

				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between gap-3 mb-5">
						<p className="text-[13px] text-muted">
							{products.length === 0
								? 'No products found'
								: `Showing ${products.length} product${products.length === 1 ? '' : 's'}${page > 1 ? ` · page ${page}` : ''}`}
						</p>
						<Suspense fallback={null}>
							<ShopSort active={sort} />
						</Suspense>
					</div>

					{anyActive && (
						<div className="flex flex-wrap items-center gap-2 mb-5">
							{chips.map((c) => (
								<Link
									key={c.label}
									href={href(c.remove)}
									className="inline-flex items-center gap-1.5 bg-white border border-sand rounded-full px-3 py-1.5 text-[12px] text-ink hover:border-terracotta hover:text-terracotta transition-colors"
								>
									{c.label}
									<span aria-hidden>×</span>
								</Link>
							))}
							<Link href="/shop" className="text-[12px] text-terracotta underline underline-offset-4 ml-1">
								Clear all
							</Link>
						</div>
					)}

					{products.length === 0 && (
						<p className="text-muted">No products match these filters.</p>
					)}

					<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
						{products.map((p) => (
							<ProductCard key={p.id} product={p} />
						))}
					</div>

					{(page > 1 || products.length === PER_PAGE) && (
						<div className="flex items-center justify-center gap-3 mt-10">
							{page > 1 && (
								<Link
									href={href({ page: String(page - 1) }, false)}
									className="px-5 py-2.5 border border-ink text-ink text-[11px] font-medium uppercase tracking-[0.14em] rounded-[8px] hover:bg-ink hover:text-ivory transition-colors"
								>
									← Previous
									</Link>
								)}
								{products.length === PER_PAGE && (
									<Link
										href={href({ page: String(page + 1) }, false)}
										className="px-5 py-2.5 border border-ink text-ink text-[11px] font-medium uppercase tracking-[0.14em] rounded-[8px] hover:bg-ink hover:text-ivory transition-colors"
									>
										Next →
									</Link>
								)}
							</div>
						)}
				</div>
			</div>
		</div>
	);
}
