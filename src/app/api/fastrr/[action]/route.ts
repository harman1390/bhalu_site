import { NextRequest, NextResponse } from 'next/server';

const API = process.env.STORE_API ?? 'http://localhost/barelyn-api';

/** Proxy: /api/fastrr/<action> → PHP backend /fastrr/<action> (cookies both ways for bl_cart) */
export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
	const { action } = await params;
	const body = await req.text();

	const headers = new Headers({ 'content-type': 'application/json' });
	const cookie = req.headers.get('cookie');
	if (cookie) headers.set('cookie', cookie);

	const res = await fetch(`${API}/fastrr/${action}`, { method: 'POST', headers, body, cache: 'no-store' });

	const out = new NextResponse(res.body, { status: res.status });
	for (const c of res.headers.getSetCookie()) {
		out.headers.append('set-cookie', c);
	}
	out.headers.set('content-type', res.headers.get('content-type') ?? 'application/json');
	out.headers.set('cache-control', 'private, no-store');
	return out;
}
