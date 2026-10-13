import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CartProvider from '@/components/CartProvider';
import Preloader from '@/components/Preloader';

const cormorant = Cormorant_Garamond({
	subsets: ['latin'],
	weight: ['400', '500', '600'],
	style: ['normal', 'italic'],
	variable: '--font-cormorant',
	display: 'swap',
});

const jost = Jost({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600'],
	variable: '--font-jost',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'BARELYN — Skincare That Works for Your Skin',
	description:
		'Barelyn is where skincare meets intention. Facewash, toners, serums, moisturizers & sunscreen — clean, effective formulas.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html
			lang="en"
			data-scroll-behavior="smooth"
			className={`${cormorant.variable} ${jost.variable}`}
			suppressHydrationWarning // 'js'/'loaded' classes are added to <html> pre-hydration on purpose
		>
			<head>
				{/* marks JS availability so entrance states don't hide content without JS */}
				<script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
			</head>
			<body className="min-h-full flex flex-col font-sans">
				<CartProvider>
					<Preloader />
					<SiteHeader />
					<main className="flex-1">{children}</main>
					<SiteFooter />
				</CartProvider>
			</body>
		</html>
	);
}
