import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/wc';
import ProductDetail from '@/components/ProductDetail';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const p = await getProductBySlug(slug);
	return { title: `${p?.name ?? 'Product'} — BARELYN`, description: p?.short_description?.replace(/<[^>]+>/g, '') };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const product = await getProductBySlug(slug);
	if (!product) notFound();
	return <ProductDetail product={product} />;
}
