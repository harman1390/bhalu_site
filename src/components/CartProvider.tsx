'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { WCCart } from '@/lib/types';
import { cart } from '@/lib/client';

interface CartCtx {
	cart: WCCart | null;
	loading: boolean;
	add: (productId: number, qty?: number) => Promise<void>;
	update: (key: string, qty: number) => Promise<void>;
	remove: (key: string) => Promise<void>;
	refresh: () => Promise<void>;
}

const Ctx = createContext<CartCtx>({
	cart: null,
	loading: true,
	add: async () => {},
	update: async () => {},
	remove: async () => {},
	refresh: async () => {},
});

export const useCart = () => useContext(Ctx);

export default function CartProvider({ children }: { children: React.ReactNode }) {
	const [wc, setCart] = useState<WCCart | null>(null);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		try {
			setCart(await cart.get());
		} catch {
			/* no session yet */
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const add = useCallback(async (productId: number, qty = 1) => {
		setCart(await cart.addItem(productId, qty));
	}, []);

	const update = useCallback(async (key: string, qty: number) => {
		setCart(await cart.updateItem(key, qty));
	}, []);

	const remove = useCallback(async (key: string) => {
		setCart(await cart.removeItem(key));
	}, []);

	return <Ctx.Provider value={{ cart: wc, loading, add, update, remove, refresh }}>{children}</Ctx.Provider>;
}
