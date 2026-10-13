/**
 * Fetch latest Instagram posts for the footer strip.
 *
 * Resolution order:
 *  1. Instagram Graph API — set IG_ACCESS_TOKEN (long-lived) + IG_USER_ID
 *     (Instagram Business/Creator account linked to a Facebook Page).
 *  2. Public web profile JSON — no auth needed but rate-limited; may
 *     occasionally fail, in which case callers fall back to product images.
 *
 * Results are cached for 1 hour via the route ISR cache.
 */
export interface IGPost {
	url: string; // link to the post on Instagram
	img: string; // display image (thumbnail for videos)
	isVideo: boolean;
	alt: string;
}

const USERNAME = 'itsbarelyn';

async function fromGraphAPI(): Promise<IGPost[]> {
	const token = process.env.IG_ACCESS_TOKEN;
	const userId = process.env.IG_USER_ID;
	if (!token || !userId) return [];

	const res = await fetch(
		`https://graph.instagram.com/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=6&access_token=${token}`,
		{ next: { revalidate: 3600 } }
	);
	if (!res.ok) return [];
	const data = await res.json();
	return (data?.data ?? [])
		.map((p: Record<string, string>) => ({
			url: p.permalink,
			img: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
			isVideo: p.media_type === 'VIDEO',
			alt: (p.caption ?? 'Instagram post').slice(0, 120),
		}))
		.filter((p: IGPost) => p.url && p.img);
}

async function fromPublicProfile(): Promise<IGPost[]> {
	const res = await fetch(
		`https://i.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`,
		{
			headers: {
				'x-ig-app-id': '936619743392459',
				'user-agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
			},
			next: { revalidate: 3600 },
		}
	);
	if (!res.ok) return [];
	const data = await res.json();
	const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
	return edges.slice(0, 6).map((e: { node: Record<string, unknown> }) => {
		const n = e.node;
		const caption =
			(n.edge_media_to_caption as { edges?: { node?: { text?: string } }[] })?.edges?.[0]?.node?.text ?? '';
		return {
			url: `https://www.instagram.com/p/${n.shortcode}/`,
			img: (n.thumbnail_src as string) || (n.display_url as string),
			isVideo: Boolean(n.is_video),
			alt: caption.slice(0, 120) || 'Instagram post',
		};
	});
}

/** Latest posts — empty array when nothing could be fetched. */
export async function getInstagramPosts(): Promise<IGPost[]> {
	try {
		const posts = await fromGraphAPI();
		if (posts.length > 0) return posts;
	} catch { /* fall through to public profile */ }

	try {
		return await fromPublicProfile();
	} catch {
		return [];
	}
}
