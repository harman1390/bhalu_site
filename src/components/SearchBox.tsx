'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { products } from '@/lib/client';
import type { WCProduct } from '@/lib/types';
import { formatPrice } from '@/lib/types';
import { wpImg } from '@/lib/img';

const PHRASES = ['Serum, moisturizer & more', 'Vitamin C serum', 'AHA BHA facewash', 'Whipped sunscreen', 'Rice water toner'];

export default function SearchBox() {
	const [q, setQ] = useState('');
	const [results, setResults] = useState<WCProduct[]>([]);
	const [open, setOpen] = useState(false);
	const [ph, setPh] = useState(PHRASES[0]);
	const boxRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const t = setInterval(() => {
			setPh((p) => PHRASES[(PHRASES.indexOf(p) + 1) % PHRASES.length]);
		}, 2500);
		return () => clearInterval(t);
	}, []);

	useEffect(() => {
		if (q.trim().length < 2) {
			setResults([]);
			return;
		}
		const t = setTimeout(async () => {
			try {
				setResults(await products.search(q.trim(), 6));
			} catch {
				setResults([]);
			}
		}, 250);
		return () => clearTimeout(t);
	}, [q]);

	useEffect(() => {
		const h = (e: MouseEvent) => {
			if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', h);
		return () => document.removeEventListener('mousedown', h);
	}, []);

	return (
		<div ref={boxRef} className="relative hidden sm:block">
			<div className="flex items-center border-b border-ink/30 bg-transparent w-[240px] focus-within:border-terracotta transition-colors">
				<button aria-label="Search" className="pl-3 pr-1 text-muted">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
				</button>
				<input
					value={q}
					onChange={(e) => {
						setQ(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					placeholder={`Search ${ph}`}
					className="w-full px-2 py-1.5 text-[12px] tracking-[0.04em] outline-none bg-transparent placeholder:text-muted/60"
				/>
			</div>

			{open && results.length > 0 && (
				<div className="absolute top-full mt-2 left-0 right-0 bg-white border border-sand rounded-[10px] shadow-[0_12px_32px_rgba(25,22,19,0.10)] overflow-hidden z-50">
					{results.map((p) => (
						<Link
							key={p.id}
							href={`/product/${p.slug}`}
							onClick={() => setOpen(false)}
							className="flex items-center gap-3 px-3 py-2 hover:bg-warm transition-colors"
						>
							{p.images[0] && (
								<Image src={wpImg(p.images[0].thumbnail || p.images[0].src)} alt="" width={34} height={34} className="rounded object-cover" />
							)}
							<span className="flex-1 text-[13px] text-ink truncate">{p.name}</span>
							<span className="text-[12px] font-semibold text-terracotta">
								{formatPrice(p.prices.price, p.prices.currency_symbol)}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
