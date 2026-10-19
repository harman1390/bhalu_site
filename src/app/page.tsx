import Image from 'next/image';
import Link from 'next/link';
import { getProducts } from '@/lib/wc';
import ProductRow from '@/components/ProductRow';
import Reveal from '@/components/Reveal';
import HeroExploreLink from '@/components/HeroExploreLink';

const SKIN_TYPES = [
	{ name: 'Dry Skin', slug: 'dry-skin', img: `/wp-uploads/2026/09/31744.png`, tint: 'bg-[#eef3f6]', accent: 'text-[#3b7ea6]' },
	{ name: 'Oily Skin', slug: 'oily-skin', img: `/wp-uploads/2026/09/31746.png`, tint: 'bg-[#eef4ee]', accent: 'text-[#4a8a52]' },
	{ name: 'Acne Skin', slug: 'acne-skin', img: `/wp-uploads/2026/09/31748.png`, tint: 'bg-[#f8eeec]', accent: 'text-[#a05648]' },
];

const MARQUEE_WORDS = ['Clean Formulas', 'Clinical Results', 'Indian Skin', 'Conscious Beauty', 'BARELYN'];

const BADGES = [
	{ label: 'ISO Certified', img: 'Container-8' },
	{ label: 'Cruelty Free', img: 'Container-9' },
	{ label: 'Made for Indian Skin', img: 'Container-10' },
];

const QUOTES = [
	{ text: 'Lightweight, quick-absorbing and actually works. My skin has never looked this healthy.', name: 'Megha', stars: 5 },
	{ text: 'Third bottle in. No white cast, no pilling — just love it!', name: 'Reshma', stars: 5 },
	{ text: 'Finally a routine that protects my skin barrier while keeping it hydrated all day.', name: 'Muskan', stars: 5 },
	{ text: 'Non-sticky and quick absorbing. My skin looks visibly brighter and even-toned.', name: 'Sonal', stars: 4 },
];

export default async function HomePage() {
	const [best, newest] = await Promise.all([
		getProducts({ orderby: 'popularity', per_page: 10 }).catch(() => []),
		getProducts({ orderby: 'date', order: 'desc', per_page: 8 }).catch(() => []),
	]);
	const bestList = best.length > 0 ? best : newest;
	const quotes = QUOTES.map((q, i) => ({ ...q, product: bestList[i % Math.max(bestList.length, 1)] }));

	return (
		<>
			{/* ── HERO — full-bleed editorial ── */}
			<section className="relative min-h-[70svh] md:min-h-[88svh] flex items-end md:items-center overflow-hidden">
				<Image
					src="/wp-uploads/2026/03/2560-by-1244-1-mobile.jpg"
					unoptimized
					alt=""
					fill
					priority
					className="object-cover object-center md:hidden"
					sizes="100vw"
				/>
				<Image
					src="/wp-uploads/2026/03/2560-by-1244-1.png"
					unoptimized
					alt=""
					fill
					priority
					className="object-cover object-center hidden md:block"
					sizes="100vw"
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
				<div className="relative w-full max-w-[1360px] mx-auto px-6 md:px-12 pt-24 pb-16 md:py-24">
					<div className="max-w-[640px]">
						{/* text hidden on phones — image stays the hero, CTAs only */}
						<p
							className="eyebrow rise !text-white/70 mb-5 md:mb-6 hidden md:block"
							style={{ textShadow: '0 1px 12px rgba(0,0,0,.3)', animationDelay: '0.1s' }}
						>
							Clean Skincare · Made in India
						</p>
						<h1
							className="h-display rise text-[38px] md:text-[76px] text-white hidden md:block"
							style={{ textShadow: '0 2px 34px rgba(0,0,0,.4)', animationDelay: '0.28s' }}
						>
							Skincare, elevated to <em className="font-medium">an art.</em>
						</h1>
						<p
							className="rise mt-5 md:mt-6 text-[15px] md:text-[17px] leading-[1.7] text-white/90 max-w-[440px] hidden md:block"
							style={{ textShadow: '0 1px 18px rgba(0,0,0,.35)', animationDelay: '0.44s' }}
						>
							Formulas crafted with intention — quiet, considered and clinically effective for every Indian skin
							type.
						</p>
						<div className="rise mt-8 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-5 sm:gap-6" style={{ animationDelay: '0.6s' }}>
							<Link
								href="/shop"
								className="bg-white text-ink text-[12px] font-medium uppercase tracking-[0.18em] px-9 py-4 hover:bg-cream transition-colors"
							>
								Shop the Collection
							</Link>
							<HeroExploreLink />
						</div>
					</div>
				</div>
			</section>

			{/* ── BESTSELLERS ── */}
			<section className="max-w-[1360px] mx-auto px-5 md:px-6 pt-14 md:pt-20 pb-3 md:pb-5">
				<Reveal>
					<div className="flex items-end justify-between mb-7 md:mb-9">
						<div>
							<p className="eyebrow mb-2.5">Most Loved</p>
							<h2 className="h-display text-[32px] md:text-[42px] text-ink">The Icons</h2>
						</div>
						<Link
							href="/shop"
							className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink underline underline-offset-[7px] decoration-terracotta hover:text-terracotta transition-colors pb-1"
						>
							View All
						</Link>
					</div>
				</Reveal>
				<ProductRow products={bestList} />
			</section>

			{/* ── STATEMENT MARQUEE — hugs the product row above ── */}
			<section className="overflow-hidden pt-2 pb-8 md:pt-3 md:pb-10 select-none" aria-hidden="true">
				<div className="flex w-max animate-marquee-slow">
					{[0, 1].map((half) => (
						<div key={half} className="flex shrink-0 items-center">
							{MARQUEE_WORDS.map((w) => (
								<span key={w} className="flex items-center">
									<span className="h-display text-[30px] md:text-[48px] text-ink/85 whitespace-nowrap px-5 md:px-7">
										{w}
									</span>
									<span className="text-terracotta text-[12px] md:text-[16px]">✦</span>
								</span>
							))}
						</div>
					))}
				</div>
			</section>

			{/* ── CLEAN BEAUTY badges ── */}
			<section className="bg-blush border-y border-sand">
				<div className="max-w-[1360px] mx-auto px-5 md:px-6 py-14 md:py-20 text-center">
					<Reveal>
						<p className="eyebrow mb-3">Our Tenets</p>
						<h2 className="h-display text-[32px] md:text-[42px] text-ink">Clean Beauty</h2>
						<p className="text-[13px] md:text-[14px] text-muted mt-3 mb-10 md:mb-12 tracking-[0.04em]">
							With uncompromised efficacy
						</p>
					</Reveal>
					<div className="flex flex-wrap justify-center gap-x-10 md:gap-x-20 gap-y-8">
						{BADGES.map((b, i) => (
							<Reveal key={b.label} delay={i * 90}>
								<div className="w-[120px] md:w-[170px]">
									<Image
										src={`/wp-uploads/2026/03/${b.img}-150x150.png`}
										alt={b.label}
										width={90}
										height={90}
										className="mx-auto object-cover w-[70px] h-[70px] md:w-[90px] md:h-[90px]"
									/>
									<p className="mt-3 text-[11px] md:text-[12px] leading-[1.6] font-medium uppercase tracking-[0.12em] text-ink/80">
										{b.label}
									</p>
								</div>
							</Reveal>
						))}
					</div>
				</div>
			</section>

			{/* ── WATCH IT. LOVE IT. — video row, paused for now ──
			<section className="max-w-[1360px] mx-auto px-5 md:px-6 py-14 md:py-20">
				<Reveal>
					<p className="eyebrow text-center mb-3">In Motion</p>
					<h2 className="h-display text-[32px] md:text-[42px] text-ink mb-8 md:mb-10 text-center">
						Watch It. Love It.
					</h2>
				</Reveal>
				<ProductRow products={newest.length > 0 ? newest : bestList} variant="watch" />
			</section>
			*/}

			{/* ── FEATURED IN / pull-quote (Sobha-style dark moment) ── */}
			<section className="bg-ink text-ivory">
				<div className="max-w-[900px] mx-auto px-6 py-16 md:py-24 text-center">
					<p className="eyebrow !text-terracotta mb-6">Featured In</p>
					<blockquote className="font-serif text-[26px] md:text-[38px] leading-[1.35] italic font-medium">
						&ldquo;Barelyn redefines skincare with clean, effective formulas for every Indian skin type.&rdquo;
					</blockquote>
				</div>
			</section>

			{/* ── SHOP BY CONCERN (skin types) ── */}
			<section className="max-w-[1360px] mx-auto px-5 md:px-6 py-14 md:py-20">
				<Reveal>
					<p className="eyebrow text-center mb-3">Your Skin, Your Ritual</p>
					<h2 className="h-display text-[32px] md:text-[42px] text-ink mb-9 md:mb-12 text-center">
						Shop by Concern
					</h2>
				</Reveal>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-7">
					{SKIN_TYPES.map((s, i) => (
						<Reveal key={s.slug} delay={i * 100}>
							<Link
								href={`/product-category/${s.slug}`}
								className={`block rounded-[14px] overflow-hidden ${s.tint} border border-sand transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(25,22,19,0.08)] group`}
							>
								<div className="relative h-[230px] md:h-[280px] overflow-hidden">
									<Image
										src={s.img}
										alt={s.name}
										fill
										sizes="(max-width:640px) 100vw, 33vw"
										className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
									/>
								</div>
								<div className="px-6 py-5 flex items-center justify-between">
									<h3 className="font-serif text-[24px] font-medium text-ink">{s.name}</h3>
									<span
										className={`w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center ${s.accent} transition-all group-hover:bg-ink group-hover:border-ink group-hover:text-white`}
									>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M5 12h14M13 6l6 6-6 6" />
										</svg>
									</span>
								</div>
							</Link>
						</Reveal>
					))}
				</div>
			</section>

			{/* ── TESTIMONIALS ── */}
			<section className="max-w-[1360px] mx-auto py-14 md:py-20">
				<Reveal>
					<p className="eyebrow text-center mb-3">Kind Words</p>
					<h2 className="h-display text-[32px] md:text-[42px] text-ink mb-9 md:mb-11 text-center px-5">
						Loved, Worn &amp; Repurchased
					</h2>
				</Reveal>
				<div className="relative">
				<div className="snap-row flex overflow-x-auto px-5 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-5 md:px-6 md:overflow-visible">
					{quotes.map((q, i) => (
						<Reveal key={q.name} delay={i * 90} className="shrink-0 w-[78vw] sm:w-[340px] md:w-auto">
							<div className="bg-white border border-sand rounded-[14px] px-6 py-7 h-full flex flex-col">
								<div className="text-star text-[13px] tracking-[3px] mb-4">
									{'★'.repeat(q.stars)}{'☆'.repeat(5 - q.stars)}
								</div>
								<p className="font-serif italic text-[16.5px] leading-[1.6] text-ink/90 flex-1">
									&ldquo;{q.text}&rdquo;
								</p>
								<p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink">
									{q.name} <span className="text-muted normal-case tracking-normal font-normal">recommends</span>
								</p>
								{q.product && (
									<Link
										href={`/product/${q.product.slug}`}
										className="mt-2 inline-block text-[10.5px] font-medium uppercase tracking-[0.18em] text-terracotta underline underline-offset-[5px] decoration-terracotta/50 hover:decoration-terracotta transition-colors"
									>
										Shop the ritual
									</Link>
								)}
							</div>
						</Reveal>
					))}
				</div>
				</div>
			</section>

			{/* ── BRAND BLURB ── */}
			<section className="bg-blush border-t border-sand">
				<div className="max-w-[780px] mx-auto px-6 py-16 md:py-20 text-center">
					<p className="font-serif italic text-[22px] md:text-[27px] leading-[1.55] text-ink">
						&ldquo;At Barelyn, we&rsquo;re here to find the missing piece in your skincare routine — clean,
						effective formulas crafted to work in harmony with your skin.&rdquo;
					</p>
				</div>
			</section>
		</>
	);
}
