'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
	children: React.ReactNode;
	delay?: number; // ms stagger
	y?: number; // px offset
	className?: string;
}

/**
 * Scroll-reveal wrapper — fades+slides children in when they enter the
 * viewport. Respects prefers-reduced-motion via CSS.
 */
export default function Reveal({ children, delay = 0, y = 26, className = '' }: Props) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setVisible(true);
					io.disconnect();
				}
			},
			{ threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
			style={{ '--reveal-y': `${y}px`, '--reveal-delay': `${delay}ms` } as React.CSSProperties}
		>
			{children}
		</div>
	);
}
