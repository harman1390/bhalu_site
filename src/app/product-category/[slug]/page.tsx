import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProducts } from '@/lib/wc';
import ProductCard from '@/components/ProductCard';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const cat = await getCategoryBySlug(slug);
	return { title: `${cat?.name ?? 'Category'} — BARELYN` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const cat = await getCategoryBySlug(slug);
	if (!cat) notFound();

	const products = await getProducts({ category: cat.id, per_page: 48 }).catch(() => []);

	return (
		<div className="max-w-[1360px] mx-auto px-6 py-12 md:py-16">
			<p className="eyebrow mb-3">Shop / {cat.name}</p>
			<h1 className="h-display text-[36px] md:text-[44px] text-ink mb-10">{cat.name}</h1>
			{products.length === 0 && <p className="text-muted">No products in this category yet.</p>}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{products.map((p) => (
					<ProductCard key={p.id} product={p} />
				))}
			</div>
		</div>
	);
}
