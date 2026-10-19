'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
	const router = useRouter();
	const [mode, setMode] = useState<'login' | 'register'>('login');
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState('');
	const [user, setUser] = useState<{ name?: string; email?: string } | null>(
		typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('brl_user') ?? 'null') : null
	);

	const [login, setLogin] = useState({ username: '', password: '' });
	const [reg, setReg] = useState({ name: '', email: '', phone: '', password: '' });

	const doLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setErr('');
		setBusy(true);
		try {
			const res = await fetch('/api/auth/token', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(login),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? 'Login failed');
			localStorage.setItem('brl_token', data.token);
			localStorage.setItem('brl_user', JSON.stringify({ name: data.user_display_name, email: data.user_email }));
			setUser({ name: data.user_display_name, email: data.user_email });
			router.refresh();
		} catch (e2) {
			setErr(e2 instanceof Error ? e2.message : 'Login failed');
		} finally {
			setBusy(false);
		}
	};

	const doRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setErr('');
		if (!/^[6-9]\d{9}$/.test(reg.phone)) return setErr('Please enter a valid 10-digit mobile number.');
		if (reg.password.length < 6) return setErr('Password must be at least 6 characters.');
		setBusy(true);
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(reg),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? 'Registration failed');
			// auto-login after register
			await fetch('/api/auth/token', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: reg.email, password: reg.password }),
			})
				.then((r) => r.json())
				.then((d) => {
					if (d.token) {
						localStorage.setItem('brl_token', d.token);
						localStorage.setItem('brl_user', JSON.stringify({ name: d.user_display_name, email: d.user_email }));
						setUser({ name: d.user_display_name, email: d.user_email });
					}
				});
		} catch (e2) {
			setErr(e2 instanceof Error ? e2.message : 'Registration failed');
		} finally {
			setBusy(false);
		}
	};

	if (user) {
		return (
			<div className="max-w-[600px] mx-auto px-6 py-20 text-center">
				<p className="eyebrow mb-4">Your Account</p>
				<h1 className="h-display text-[36px] text-ink">Welcome back, {user.name || 'there'}.</h1>
				<p className="text-muted mt-3">{user.email}</p>
				<button
					onClick={() => {
						localStorage.removeItem('brl_token');
						localStorage.removeItem('brl_user');
						setUser(null);
					}}
					className="mt-8 bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] px-9 py-4 hover:bg-terracotta-deep transition-colors"
				>
					Log out
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-[440px] mx-auto px-6 py-16">
			<h1 className="h-display text-[34px] text-ink text-center mb-8">
				{mode === 'login' ? 'Welcome back' : 'Join Barelyn'}
			</h1>
			<div className="flex gap-0 mb-8 border-b border-border">
				{(['login', 'register'] as const).map((m) => (
					<button
						key={m}
						onClick={() => setMode(m)}
						className={`flex-1 pb-3 text-[11px] font-medium uppercase tracking-[0.18em] border-b-2 -mb-px transition-colors ${mode === m ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
					>
						{m === 'login' ? 'Sign In' : 'Create Account'}
					</button>
				))}
			</div>

			{err && <p className="text-[13px] text-[#ff5a52] font-medium mb-4">{err}</p>}

			{mode === 'login' ? (
				<form onSubmit={doLogin} className="space-y-4">
					<input required placeholder="Email or username" value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} className="w-full border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px]" />
					<input required type="password" placeholder="Password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} className="w-full border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px]" />
					<button disabled={busy} className="w-full bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] py-4 hover:bg-terracotta-deep transition-colors disabled:opacity-60">
						{busy ? 'Signing in…' : 'Sign In'}
					</button>
				</form>
			) : (
				<form onSubmit={doRegister} className="space-y-4">
					<input required placeholder="Full name" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} className="w-full border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px]" />
					<input required type="email" placeholder="Email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} className="w-full border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px]" />
					<input required type="tel" placeholder="Mobile number (10 digits)" value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} className="w-full border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px]" />
					<input required type="password" placeholder="Password (min 6 chars)" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} className="w-full border border-border bg-white rounded-[8px] px-4 py-3.5 text-[14px]" />
					<button disabled={busy} className="w-full bg-ink text-ivory text-[11px] font-medium uppercase tracking-[0.18em] py-4 hover:bg-terracotta-deep transition-colors disabled:opacity-60">
						{busy ? 'Creating…' : 'Create Account'}
					</button>
				</form>
			)}
		</div>
	);
}
