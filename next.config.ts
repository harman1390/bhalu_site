import type { NextConfig } from 'next';

const wpHost = process.env.WP_BASE ? new URL(process.env.WP_BASE).hostname : 'barelyn.local';

const nextConfig: NextConfig = {
	// Browser preview proxies via 127.0.0.1 — allow dev resources cross-origin
	allowedDevOrigins: ['127.0.0.1', 'localhost'],
	images: {
		// barelyn.local resolves to 127.0.0.1 — required in dev
		dangerouslyAllowLocalIP: true,
		remotePatterns: [
			{ protocol: 'http', hostname: wpHost },
			{ protocol: 'https', hostname: 'barelyn.co.in' },
			{ protocol: 'https', hostname: 'www.barelyn.co.in' },
		],
	},
	async rewrites() {
		const wp = process.env.WP_BASE ?? 'http://barelyn.local';
		return [{ source: '/wp-uploads/:path*', destination: `${wp}/wp-content/uploads/:path*` }];
	},
	async headers() {
		return [
			{
				source: '/api/wc/:path*',
				headers: [{ key: 'Access-Control-Allow-Credentials', value: 'true' }],
			},
			{
				// WP uploads are immutable assets — cache aggressively at the edge/browser
				source: '/wp-uploads/:path*',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
			},
		];
	},
};

export default nextConfig;
