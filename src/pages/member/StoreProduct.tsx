import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Truck, ShieldCheck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/member/MemberUI';
import { MemberGiveSheet } from '@/components/member/MemberGiveSheet';
import { Cover } from '@/components/member/store/Cover';
import { useCart } from '@/components/member/store/cart';
import { CartSheet } from './Store';
import { products, fcfa } from '@/data/memberDemo';
import { toast } from 'sonner';

export default function StoreProduct({ productId }: { productId: string }) {
  const p = products.find((x) => x.id === productId);
  const [qty, setQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [pay, setPay] = useState<{ title: string; amount: number; fromCart?: boolean } | null>(null);
  const { cart, add, clear } = useCart();
  const count = Object.values(cart).reduce((s, n) => s + n, 0);

  if (!p) return <EmptyState icon={Package} title="Product not found" action={<Button asChild size="sm"><Link to="/member/store">Back to store</Link></Button>} />;
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const soldOut = p.stock === 0;

  return (
    <div className="space-y-5 overflow-x-clip pb-40 lg:pb-6">
      <div className="flex items-center justify-between">
        <Link to="/member/store" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Store</Link>
        <button type="button" onClick={() => setCartOpen(true)} aria-label="Open cart" className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card">
          <ShoppingCart className="h-4 w-4" />
          {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Cover title={p.name} tone={p.tone} className="aspect-square w-full" />
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{p.category}</p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-foreground">{p.name}</h1>
            <p className="text-sm text-muted-foreground">{p.author}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-current text-warning" />{p.rating}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{p.format}</span>
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">{fcfa(p.price)}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>
          <p className={soldOut ? 'text-sm font-semibold text-destructive' : p.stock < 10 ? 'text-sm font-semibold text-warning' : 'text-sm font-semibold text-success'}>
            {soldOut ? 'Sold out' : p.stock < 10 ? `Only ${p.stock} left` : 'In stock'}
          </p>
          <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" />Pick up at your branch or get it delivered</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" />Secure payment by Mobile Money, card or bank</p>
          </div>

          <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-card/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
            <div className="mx-auto flex max-w-4xl items-center gap-2">
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card p-1">
                <button type="button" aria-label="Less" onClick={() => setQty((n) => Math.max(1, n - 1))} className="grid h-9 w-9 place-items-center rounded-full"><Minus className="h-4 w-4" /></button>
                <span className="w-6 text-center font-semibold">{qty}</span>
                <button type="button" aria-label="More" onClick={() => setQty((n) => Math.min(p.stock || 1, n + 1))} className="grid h-9 w-9 place-items-center rounded-full"><Plus className="h-4 w-4" /></button>
              </div>
              <Button variant="outline" disabled={soldOut} className="h-11 flex-1 rounded-full" onClick={() => { add(p.id, qty); toast.success(`${qty} × ${p.name} added to cart`); }}>Add to cart</Button>
              <Button disabled={soldOut} className="h-11 flex-1 rounded-full" onClick={() => setPay({ title: `${qty} × ${p.name}`, amount: p.price * qty })}>Buy now</Button>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="space-y-3">
          <p className="font-heading text-base font-semibold">You may also like</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((r) => (
              <li key={r.id} className="min-w-0">
                <Link to="/member/store/$productId" params={{ productId: r.id }} className="block">
                  <Cover title={r.name} tone={r.tone} small className="aspect-[4/5] w-full" />
                  <p className="mt-2 truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{fcfa(r.price)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} onCheckout={(title, amount) => { setCartOpen(false); setPay({ title, amount, fromCart: true }); }} />
      <MemberGiveSheet open={!!pay} onOpenChange={(o) => { if (!o) { if (pay?.fromCart) clear(); setPay(null); } }} currency="XAF" purchase={pay} />
    </div>
  );
}
