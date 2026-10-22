import { useSyncExternalStore } from 'react';

/** Member store cart kept in the browser (product id -> quantity). */
type Cart = Record<string, number>;
const KEY = 'wca_member_cart';
const EMPTY: Cart = {};
let cache: Cart | null = null;
const subs = new Set<() => void>();

function read(): Cart {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { cache = {}; }
  return cache!;
}
function write(next: Cart) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

export function useCart() {
  const cart = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, read, () => EMPTY);
  return {
    cart,
    add: (id: string, n = 1) => write({ ...read(), [id]: (read()[id] ?? 0) + n }),
    set: (id: string, n: number) => { const x = { ...read() }; if (n <= 0) delete x[id]; else x[id] = n; write(x); },
    clear: () => write({}),
  };
}
