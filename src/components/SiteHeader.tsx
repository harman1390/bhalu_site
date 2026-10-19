'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import CartDrawer from './CartDrawer';
import SearchBox from './SearchBox';

const CATS = [
	{ label: 'Toner', slug: 'toner' },
	{ label: 'Sunscreen', slug: 'sunscreen' },
	{ label: 'Serum', slug: 'serum' },
	{ label: 'Moisturizer', slug: 'moisturizer' },
	{ label: 'Facewash', slug: 'facewash' },
];

const ANNOUNCEMENTS = [
	'Free shipping on orders above ₹999',
	'Made for Indian skin',
	'Clean. Conscious. Effective.',
];

function AnnouncementBar() {
	const items = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS, ...ANNOUNCEMENTS, ...ANNOUNCEMENTS];
	return (
		<div className="bg-ink text-cream overflow-hidden">
			<div className="flex w-max animate-marquee py-2">
				{[0, 1].map((half) => (
					<div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
						{items.map((a, i) => (
							<span key={i} className="flex items-center text-[10px] font-normal tracking-[0.22em] uppercase">
								<span className="mx-8">{a}</span>
								<span className="text-terracotta/80 text-[8px]">◆</span>
							</span>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export default function SiteHeader() {
	const { cart } = useCart();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const h = () => setScrolled(window.scrollY > 8);
		h();
		window.addEventListener('scroll', h, { passive: true });
		return () => window.removeEventListener('scroll', h);
	}, []);

	return (
		<>
			<header className="sticky top-0 z-50">
				<AnnouncementBar />
				<div
					className={`bg-ivory/95 backdrop-blur-sm border-b transition-shadow duration-300 ${scrolled ? 'border-sand shadow-[0_2px_18px_rgba(25,22,19,0.06)]' : 'border-transparent'}`}
				>
				<div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 py-3.5 sm:py-4">
					{/* logo */}
					<Link href="/" className="shrink-0">
						<Image
							src="/wp-uploads/2026/03/Barelyn-Logo-1-1-1.png"
							alt="BARELYN"
							width={140}
							height={34}
							priority
							unoptimized
							className="w-[112px] sm:w-[140px] h-auto"
						/>
					</Link>

					{/* desktop category nav */}
					<nav className="hidden lg:flex items-center gap-9">
						{CATS.map((c) => (
							<Link
								key={c.slug}
								href={`/product-category/${c.slug}`}
								className="text-[11px] font-medium tracking-[0.18em] uppercase text-ink/80 hover:text-ink underline underline-offset-[6px] decoration-transparent hover:decoration-terracotta decoration-[1.5px] transition-all"
							>
								{c.label}
							</Link>
						))}
					</nav>

					{/* right cluster */}
					<div className="flex items-center gap-4">
						<SearchBox />
						<Link href="/account" aria-label="Account" className="text-ink hover:text-terracotta transition-colors">
							<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/></svg>
						</Link>
						<button onClick={() => setDrawerOpen(true)} aria-label="Cart" className="relative text-ink hover:text-terracotta transition-colors">
							<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l1.2 12.2a1 1 0 0 1-1 1.1H5.8a1 1 0 0 1-1-1.1L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>
							{cart && cart.items_count > 0 && (
								<span className="absolute -top-2 -right-2 bg-terracotta text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
									{cart.items_count}
								</span>
							)}
						</button>
						<button className="lg:hidden text-ink" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
						</button>
					</div>
				</div>
				</div>

				{/* mobile nav */}
				{menuOpen && (
					<nav className="lg:hidden bg-ivory border-t border-sand px-4 sm:px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-3">
						{[{ label: 'Shop All', slug: '' }, ...CATS].map((c) => (
							<Link
								key={c.slug || 'all'}
								href={c.slug ? `/product-category/${c.slug}` : '/shop'}
								onClick={() => setMenuOpen(false)}
								className="text-[11px] font-medium tracking-[0.18em] uppercase text-ink/80 text-center border-b border-sand py-3 hover:text-terracotta hover:border-terracotta transition-colors"
							>
								{c.label}
							</Link>
						))}
					</nav>
				)}
			</header>
			<CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
		</>
	);
}
