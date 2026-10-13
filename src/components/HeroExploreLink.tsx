'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const OPTIONS = [
	{ label: 'Serums', slug: 'serum' },
	{ label: 'Moisturizers', slug: 'moisturizer' },
	{ label: 'Sunscreens', slug: 'sunscreen' },
	{ label: 'Toners', slug: 'toner' },
	{ label: 'Facewash', slug: 'facewash' },
];

export default function HeroExploreLink() {
	const [i, setI] = useState(0);

	useEffect(() => {
		const t = setInterval(() => setI((v) => (v + 1) % OPTIONS.length), 3200);
		return () => clearInterval(t);
	}, []);

	const opt = OPTIONS[i];

	return (
		<Link
			href={`/product-category/${opt.slug}`}
			className="inline-flex items-baseline gap-2 text-white text-[12px] font-medium uppercase tracking-[0.18em] transition-colors group"
		>
			<span className="text-white/60">Explore</span>
			{/* key remounts the span each cycle → plays the roll-up animation */}
			<span
				key={opt.slug}
				className="hero-roll underline underline-offset-[7px] decoration-white/60 group-hover:decoration-white transition-colors"
			>
				{opt.label}
			</span>
		</Link>
	);
}
