import Link from 'next/link';
import Image from 'next/image';
import { getProducts } from '@/lib/wc';
import { getInstagramPosts } from '@/lib/instagram';
import { wpImg } from '@/lib/img';

const KNOW_LINKS = [
	{ label: 'Privacy Policy', href: '/privacy-policy' },
	{ label: 'Shipping & Delivery', href: '/shipping' },
	{ label: 'Returns & Refunds', href: '/returns' },
	{ label: 'Product Disclaimer', href: '/disclaimer' },
	{ label: 'FAQ', href: '/account' },
	{ label: 'Sitemap', href: '/shop' },
];

const HELP_LINKS = [
	{ label: 'Contact Us', href: 'mailto:customercare@barelyn.co.in' },
	{ label: 'My Account', href: '/account' },
	{ label: 'Cart', href: '/cart' },
	{ label: 'Shop All', href: '/shop' },
];

const SHOP_LINKS = [
	{ label: 'Toner', href: '/product-category/toner' },
	{ label: 'Sunscreen', href: '/product-category/sunscreen' },
	{ label: 'Serum', href: '/product-category/serum' },
	{ label: 'Moisturizer', href: '/product-category/moisturizer' },
	{ label: 'Facewash', href: '/product-category/facewash' },
];

function Col({ title, links }: { title: string; links: { label: string; href: string }[] }) {
	return (
		<div>
			<h3 className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-ink mb-4">{title}</h3>
			<ul className="space-y-2.5">
				{links.map((l) => (
					<li key={l.label}>
						<Link href={l.href} className="text-[13px] text-muted hover:text-terracotta transition-colors">
							{l.label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

export default async function SiteFooter() {
	// Real posts when reachable; product images as graceful fallback
	const igPosts = await getInstagramPosts().catch(() => []);
	const insta =
		igPosts.length > 0
			? igPosts
			: (await getProducts({ per_page: 6 }).catch(() => [])).map((p) => ({
					url: 'https://www.instagram.com/itsbarelyn',
					img: p.images[0]?.src ? wpImg(p.images[0].src) : '',
					isVideo: false,
					alt: p.name,
				}));

	return (
		<footer className="border-t border-sand bg-warm">
			{/* ── Instagram strip ── */}
			{insta.length > 0 && (
				<div className="max-w-[1360px] mx-auto px-6 pt-16 pb-8">
					<p className="eyebrow text-center mb-3">@itsbarelyn</p>
					<h2 className="h-display text-[30px] md:text-[38px] text-ink mb-8 text-center">
						The Daily Ritual
					</h2>
					<div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
						{insta.map((p, i) => (
							<a
								key={`${p.url}-${i}`}
								href={p.url}
								target="_blank"
								rel="noreferrer"
								className="relative aspect-square rounded-[10px] overflow-hidden bg-blush border border-sand group"
							>
								{p.img && (
									<Image
										src={p.img}
										alt={p.alt}
										fill
										unoptimized={!p.img.startsWith('/')}
										sizes="(max-width:640px) 33vw, 16vw"
										className="object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								)}
								{p.isVideo && (
									<span className="absolute top-2 right-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,.5)]">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
											<path d="M8 5.5v13l11-6.5z" />
										</svg>
									</span>
								)}
								<span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors flex items-center justify-center">
									<svg
										width="22"
										height="22"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.8"
										className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<rect x="3" y="3" width="18" height="18" rx="5" />
										<circle cx="12" cy="12" r="4" />
										<circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
									</svg>
								</span>
							</a>
						))}
					</div>
				</div>
			)}

			{/* ── Link columns ── */}
			<div className="max-w-[1360px] mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
				<div className="col-span-2 sm:col-span-3 lg:col-span-2">
					<Link href="/">
						<Image src="/wp-uploads/2026/03/Barelyn-Logo-1-1-1.png" alt="BARELYN" width={120} height={30} unoptimized />
					</Link>
					<p className="font-serif italic text-[17px] leading-[1.6] text-ink/80 mt-4 mb-2 max-w-[320px]">
						Skincare that works for your skin.
					</p>
					<p className="text-[13px] leading-[1.7] text-muted mb-5 max-w-[320px]">
						Every formula is crafted to work in harmony with your skin — no excess, no noise.
					</p>
					<div className="flex items-center gap-3">
						<a
							href="https://www.instagram.com/itsbarelyn"
							target="_blank"
							rel="noreferrer"
							aria-label="Instagram"
							className="w-8 h-8 rounded-full border border-sand bg-white flex items-center justify-center text-muted hover:text-terracotta hover:border-terracotta transition-colors"
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
								<rect x="3" y="3" width="18" height="18" rx="5" />
								<circle cx="12" cy="12" r="4" />
								<circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
							</svg>
						</a>
						<a
							href="mailto:customercare@barelyn.co.in"
							aria-label="Email"
							className="w-8 h-8 rounded-full border border-sand bg-white flex items-center justify-center text-muted hover:text-terracotta hover:border-terracotta transition-colors"
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
								<rect x="3" y="5" width="18" height="14" rx="2" />
								<path d="m3 7 9 6 9-6" />
							</svg>
						</a>
					</div>
				</div>
				<Col title="Know Us Better" links={KNOW_LINKS} />
				<Col title="Shop" links={SHOP_LINKS} />
				<Col title="Help" links={HELP_LINKS} />
			</div>

			{/* ── Bottom bar ── */}
			<div className="border-t border-sand">
				<div className="max-w-[1360px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] uppercase tracking-[0.14em] text-muted">
					<span>© {new Date().getFullYear()} Barelyn — All rights reserved</span>
					<span>Clean · Conscious · Effective</span>
				</div>
			</div>
		</footer>
	);
}
