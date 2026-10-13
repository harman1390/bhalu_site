interface Section {
	heading: string;
	paragraphs?: string[];
	bullets?: string[];
	numbered?: string[];
}

export default function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string[]; sections: Section[] }) {
	return (
		<div className="max-w-[820px] mx-auto px-4 sm:px-6 py-10 md:py-16">
			<p className="eyebrow mb-3">{eyebrow}</p>
			<h1 className="h-display text-[32px] md:text-[44px] text-ink mb-8">{title}</h1>

			<div className="space-y-4 mb-12">
				{intro.map((p, i) => (
					<p key={i} className="text-[15px] leading-[1.8] text-muted">
						{p}
					</p>
				))}
			</div>

			<div className="space-y-10">
				{sections.map((s, i) => (
					<section key={i} className="pt-8 border-t border-sand first:border-0 first:pt-0">
						<h2 className="font-serif text-[22px] md:text-[26px] font-medium text-ink mb-4">{s.heading}</h2>
						<div className="space-y-4">
							{s.paragraphs?.map((p, j) => (
								<p key={j} className="text-[15px] leading-[1.8] text-muted">
									{p}
								</p>
							))}
							{s.bullets && (
								<ul className="space-y-2 pl-5 list-disc marker:text-terracotta text-[15px] leading-[1.7] text-muted">
									{s.bullets.map((b, j) => (
										<li key={j}>{b}</li>
									))}
								</ul>
							)}
							{s.numbered && (
								<ol className="space-y-2 pl-5 list-decimal marker:text-terracotta text-[15px] leading-[1.7] text-muted">
									{s.numbered.map((n, j) => (
										<li key={j}>{n}</li>
									))}
								</ol>
							)}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
