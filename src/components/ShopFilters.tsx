'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { WCCategory } from '@/lib/types';
import { SHOP_CAT_SERIES, catDisplayName } from '@/lib/shop';

/**
 * Shop sidebar filters + toolbar sort.
 * All state lives in the URL (?q=, ?cat=, ?min=, ?max=, ?sale=1, ?stock=1, ?sort=)
 * so the server component re-renders filtered results and links are shareable.
 */

const inputCls =
	'w-full border border-sand rounded-[8px] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-terracotta transition-colors placeholder:text-muted/60';
const labelCls = 'flex items-center gap-2.5 text-[13px] text-ink cursor-pointer select-none';
const headingCls = 'text-[11px] font-medium uppercase tracking-[0.14em] text-muted mb-3';

type FilterProps = {
	categories: WCCategory[];
	activeCat: string;
	activeQ: string;
	activeMin: string;
	activeMax: string;
	activeSale: boolean;
	activeStock: boolean;
	anyActive: boolean;
};

export function ShopFilters(p: FilterProps) {
	const router = useRouter();
	const sp = useSearchParams();
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState(p.activeQ);
	const [min, setMin] = useState(p.activeMin);
	const [max, setMax] = useState(p.activeMax);
	const debounce = useRef<ReturnType<typeof setTimeout>>(null);

	const go = (patch: Record<string, string>) => {
		const params = new URLSearchParams(sp.toString());
		for (const [k, v] of Object.entries(patch)) {
			if (v === '') params.delete(k);
			else params.set(k, v);
		}
		params.delete('page'); // filter changes reset pagination
		const qs = params.toString();
		router.push(qs ? `/shop?${qs}` : '/shop');
	};

	// Keep inputs in sync when URL changes externally (chips, clear all).
	useEffect(() => setQ(p.activeQ), [p.activeQ]);
	useEffect(() => setMin(p.activeMin), [p.activeMin]);
	useEffect(() => setMax(p.activeMax), [p.activeMax]);

	// Debounced live search → ?q=
	useEffect(() => {
		if (q === p.activeQ) return;
		debounce.current = setTimeout(() => go({ q: q.trim() }), 400);
		return () => {
			if (debounce.current) clearTimeout(debounce.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [q]);

	const applyPrice = () => {
		const lo = String(Math.max(0, Math.floor(Number(min) || 0)) || '');
		const hi = String(Math.max(0, Math.floor(Number(max) || 0)) || '');
		go({ min: lo === '0' ? '' : lo, max: hi === '0' ? '' : hi });
	};

	// Only the defined series, in order (DB categories outside it are hidden).
	const displayCats = SHOP_CAT_SERIES.map((s) => p.categories.find((c) => c.slug === s.slug)).filter(
		(c): c is WCCategory => !!c
	);

	const panel = (
		<div className="space-y-8">
			<div>
				<h3 className={headingCls}>Search</h3>
				<div className="relative">
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search products…"
						className={inputCls}
						aria-label="Search products"
					/>
					<svg
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/70"
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					>
						<circle cx="11" cy="11" r="7" />
						<path d="m20 20-3.5-3.5" />
					</svg>
				</div>
			</div>

			<div>
				<h3 className={headingCls}>Shop by Category</h3>
				<ul className="space-y-1">
					<li>
						<button
							onClick={() => go({ cat: '' })}
							className={`w-full text-left px-3 py-2 rounded-[8px] text-[13px] transition-colors ${
								p.activeCat === ''
									? 'bg-ink text-ivory font-medium'
									: 'text-ink hover:bg-warm'
							}`}
						>
							All Products
						</button>
					</li>
					{displayCats.map((c) => (
						<li key={c.id}>
							<button
								onClick={() => go({ cat: c.slug })}
								className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] transition-colors ${
									p.activeCat === c.slug
										? 'bg-ink text-ivory font-medium'
										: 'text-ink hover:bg-warm'
								}`}
							>
								<span>{catDisplayName(c.slug, c.name)}</span>
								{c.count > 0 && (
									<span
										className={`text-[11px] ${p.activeCat === c.slug ? 'text-ivory/70' : 'text-muted'}`}
									>
										{c.count}
									</span>
								)}
							</button>
						</li>
					))}
				</ul>
			</div>

			<div>
				<h3 className={headingCls}>Shop by Price</h3>
				<div className="flex items-center gap-2">
					<input
						value={min}
						onChange={(e) => setMin(e.target.value.replace(/[^0-9]/g, ''))}
						onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
						inputMode="numeric"
						placeholder="Min ₹"
						className={inputCls}
						aria-label="Minimum price in rupees"
					/>
					<span className="text-muted text-[13px]">—</span>
					<input
						value={max}
						onChange={(e) => setMax(e.target.value.replace(/[^0-9]/g, ''))}
						onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
						inputMode="numeric"
						placeholder="Max ₹"
						className={inputCls}
						aria-label="Maximum price in rupees"
					/>
				</div>
				<button
					onClick={applyPrice}
					className="mt-2.5 w-full py-2 border border-ink text-ink text-[11px] font-medium uppercase tracking-[0.14em] rounded-[8px] hover:bg-ink hover:text-ivory transition-colors"
				>
					Apply
				</button>
			</div>

			<div>
				<h3 className={headingCls}>Filter</h3>
				<div className="space-y-2.5">
					<label className={labelCls}>
						<input
							type="checkbox"
							checked={p.activeSale}
							onChange={(e) => go({ sale: e.target.checked ? '1' : '' })}
							className="accent-[#b56a4c] w-4 h-4"
						/>
						On sale
					</label>
					<label className={labelCls}>
						<input
							type="checkbox"
							checked={p.activeStock}
							onChange={(e) => go({ stock: e.target.checked ? '1' : '' })}
							className="accent-[#b56a4c] w-4 h-4"
						/>
						In stock only
					</label>
				</div>
			</div>

			{p.anyActive && (
				<button
					onClick={() => {
						setQ('');
						setMin('');
						setMax('');
						router.push('/shop');
					}}
					className="text-[12px] text-terracotta underline underline-offset-4 hover:text-terracotta-deep transition-colors"
				>
					Clear all filters
				</button>
			)}
		</div>
	);

	return (
		<>
			{/* Mobile toggle */}
			<button
				onClick={() => setOpen((o) => !o)}
				className="lg:hidden w-full flex items-center justify-between border border-sand rounded-[10px] bg-white px-4 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-ink mb-4"
				aria-expanded={open}
			>
				<span>Shop by &amp; Filters</span>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					className={`transition-transform ${open ? 'rotate-180' : ''}`}
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
			{open && <div className="lg:hidden border border-sand rounded-[10px] bg-white p-5 mb-6">{panel}</div>}

			{/* Desktop sidebar */}
			<aside className="hidden lg:block w-[240px] shrink-0">{panel}</aside>
		</>
	);
}

const SORTS: { v: string; label: string }[] = [
	{ v: 'menu_order', label: 'Default sorting' },
	{ v: 'popularity', label: 'Sort by popularity' },
	{ v: 'rating', label: 'Sort by average rating' },
	{ v: 'date', label: 'Sort by latest' },
	{ v: 'price-asc', label: 'Price: low to high' },
	{ v: 'price-desc', label: 'Price: high to low' },
];

export function ShopSort({ active }: { active: string }) {
	const router = useRouter();
	const sp = useSearchParams();
	return (
		<select
			value={SORTS.some((s) => s.v === active) ? active : 'menu_order'}
			onChange={(e) => {
				const params = new URLSearchParams(sp.toString());
				if (e.target.value === 'menu_order') params.delete('sort');
				else params.set('sort', e.target.value);
				params.delete('page');
				const qs = params.toString();
				router.push(qs ? `/shop?${qs}` : '/shop');
			}}
			className="border border-sand rounded-[8px] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-terracotta cursor-pointer"
			aria-label="Sort products"
		>
			{SORTS.map((s) => (
				<option key={s.v} value={s.v}>
					{s.label}
				</option>
			))}
		</select>
	);
}
