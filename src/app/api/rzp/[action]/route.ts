import { NextRequest, NextResponse } from 'next/server';

const API = process.env.STORE_API ?? 'http://localhost/barelyn-api';

/** Proxy: /api/rzp/<action> → PHP backend /rzp/<action> */
export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
	const { action } = await params;
	const body = await req.text();
	const res = await fetch(`${API}/rzp/${action}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body,
	});
	const data = await res.text();
	return new NextResponse(data, {
		status: res.status,
		headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
	});
}
