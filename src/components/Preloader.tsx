'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const MIN_MS = 2400; // brand moment — let the bar fully fill before lift
const MAX_MS = 4000; // never trap the user if load stalls
const EXIT_MS = 800; // matches .preloader-exit transition

/**
 * Page veil: ivory overlay, logo + hairline bar, lifts when the page is
 * loaded (or after MIN_MS, whichever is later). Plays on every full load —
 * client-side navigation keeps it hidden. Flips `html.loaded` which arms
 * the .rise entrance animations. If JS never runs, CSS auto-hides it
 * (preAuto fallback keyframe).
 */
export default function Preloader() {
	const [phase, setPhase] = useState<'show' | 'exit' | 'gone'>('show');

	useEffect(() => {
		const html = document.documentElement;

		document.body.style.overflow = 'hidden';

		const minWait = new Promise((r) => setTimeout(r, MIN_MS));
		const pageLoad =
			document.readyState === 'complete'
				? Promise.resolve()
				: new Promise((r) => window.addEventListener('load', r, { once: true }));
		const maxWait = new Promise((r) => setTimeout(r, MAX_MS));

		Promise.race([Promise.all([minWait, pageLoad]), maxWait]).then(() => {
			html.classList.add('loaded');
			setPhase('exit');
			setTimeout(() => setPhase('gone'), EXIT_MS);
		});

		return () => {
			document.body.style.overflow = '';
		};
	}, []);

	if (phase === 'gone') return null;

	return (
		<div className={`preloader ${phase === 'exit' ? 'preloader-exit' : ''}`} aria-hidden="true">
			<div className="preloader-inner">
				<Image
					src="/wp-uploads/2026/03/Barelyn-Logo-1-1-1.png"
					alt="BARELYN"
					width={148}
					height={36}
					priority
					unoptimized
					className="preloader-logo w-[132px] sm:w-[148px] h-auto"
				/>
				<div className="preloader-track">
					<span className="preloader-bar" />
				</div>
				<p className="preloader-tag">Clean · Conscious · Effective</p>
			</div>
		</div>
	);
}
