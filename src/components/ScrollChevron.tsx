'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Scroll hints for horizontal .snap-row carousels: chevron chips pinned to
 * the row's left/right edges. The right chip fades out at the end, the left
 * chip fades in only once the row is scrolled. Taps scroll the row. Must be
 * rendered inside a `relative` wrapper containing a .snap-row.
 *
 * `top` positions the chips vertically (default centers on the row),
 * `inset` sets the horizontal offset — should clear the row's padding
 * so chips sit fully on the cards, not straddling their edges.
 */
export default function ScrollChevron({ top = '50%', inset = '1.25rem' }: { top?: string; inset?: string }) {
	const wrap = useRef<HTMLSpanElement>(null);
	const [atStart, setAtStart] = useState(true);
	const [atEnd, setAtEnd] = useState(false);

	const getRow = () =>
		wrap.current?.parentElement?.querySelector<HTMLElement>('.snap-row') ?? null;

	useEffect(() => {
		const row = getRow();
		if (!row) return;
		const check = () => {
			setAtStart(row.scrollLeft <= 8);
			setAtEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 8);
		};
		check();
		row.addEventListener('scroll', check, { passive: true });
		window.addEventListener('resize', check);
		return () => {
			row.removeEventListener('scroll', check);
			window.removeEventListener('resize', check);
		};
	}, []);

	const nudge = (dir: 1 | -1) => {
		const row = getRow();
		row?.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: 'smooth' });
	};

	const chip =
		'absolute z-10 w-10 h-10 -translate-y-1/2 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.10)] border border-sand flex items-center justify-center text-ink hover:text-terracotta transition-all duration-200';

	return (
		<span ref={wrap} className="contents">
			<button
				onClick={() => nudge(-1)}
				aria-label="Scroll back"
				style={{ top, left: inset }}
				className={`${chip} ${atStart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
					<path d="M15 5l-7 7-7 7" />
				</svg>
			</button>
			<button
				onClick={() => nudge(1)}
				aria-label="Scroll for more"
				style={{ top, right: inset }}
				className={`${chip} ${atEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
					<path d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</span>
	);
}
