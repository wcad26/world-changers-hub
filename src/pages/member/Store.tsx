import { useState } from 'react';
import { ShoppingBag, ShoppingCart, Star, Search, Minus, Plus, Trash2, Package, CheckCircle2, BookOpen, Store as StoreIcon, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Panel, Segmented, EmptyState } from '@/components/member/MemberUI';
import { products, storeCategories, demoOrders, fcfa, toneVar, type Product } from '@/data/memberDemo';
import { cn } from '@/lib/utils';

function Art({ p, className }: { p: Product; className?: string }) {
  return (
    <div className={cn('relative grid place-items-center overflow-hidden rounded-xl', className)}
      style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${toneVar(p.tone)} 25%, var(--card)), color-mix(in oklab, ${toneVar(p.tone)} 60%, var(--card)))` }}>
      <div className="flex h-[70%] w-[48%] flex-col justify-end rounded-md p-2 shadow-xl" style={{ background: toneVar(p.tone) }}>
        <p className="line-clamp-3 font-heading text-[11px] font-bold leading-tight text-primary-foreground">{p.name}</p>
      </div>
    </div>
  );
}

export default function MemberStore() {
  const [view, setView] = useState<'shop' | 'orders'>('shop');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [placed, setPlaced] = useState<string | null>(null);

  const featured = products.find((p) => p.featured)!;
  const list = products.filter((p) => (cat === 'all' || p.category === cat) && (!q || `${p.name} ${p.author}`.toLowerCase().includes(q.toLowerCase())));
  const lines = Object.entries(cart).map(([id, n]) => ({ p: products.find((x) => x.id === id)!, n }));
  const count = lines.reduce((s, l) => s + l.n, 0);
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.n, 0);
  const discount = delivery === 'pickup' ? Math.round(subtotal * 0.1) : 0;
  const fee = delivery === 'delivery' && subtotal > 0 ? 1500 : 0;
  const total = subtotal - discount + fee;

  const add = (id: string, n = 1) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + n }));
  const setLine = (id: string, n: number) => setCart((c) => { const x = { ...c }; if (n <= 0) delete x[id]; else x[id] = n; return x; });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented value={view} onChange={setView} options={[{ value: 'shop', label: 'Shop' }, { value: 'orders', label: 'My orders' }]} />
        <Button variant="outline" className="relative w-fit" onClick={() => setCartOpen(true)}>
          <ShoppingCart className="mr-2 h-4 w-4" />Cart
          {count > 0 && <span className="ml-2 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] text-primary-foreground">{count}</span>}
        </Button>
      </div>

      {view === 'shop' ? (<>
        <section className="grid items-center gap-5 overflow-hidden rounded-2xl border border-border bg-card p-5 sm:grid-cols-[180px_1fr] sm:p-7 lg:grid-cols-[220px_1fr]">
          <Art p={featured} className="h-52 sm:h-60" />
          <div className="space-y-3">
            <Badge className="w-fit">New release</Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground">{featured.name}</h2>
            <p className="text-sm text-muted-foreground">{featured.author} · {featured.format}</p>
            <p className="max-w-xl text-sm text-muted-foreground">{featured.description}</p>
            <p className="text-sm"><span className="font-heading text-xl font-bold text-foreground">{fcfa(featured.price)}</span> <span className="text-muted-foreground">· 10% off with branch pickup</span></p>
            <div className="flex gap-2"><Button onClick={() => add(featured.id)}><ShoppingCart className="mr-1 h-4 w-4" />Add to cart</Button><Button variant="outline" onClick={() => { setQuick(featured); setQty(1); }}>Details</Button></div>
          </div>
        </section>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
            {['all', ...storeCategories].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn('whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium',
                cat === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>{c === 'all' ? 'All products' : c}</button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="rounded-full pl-9" />
          </div>
        </div>

        {list.length === 0 ? <EmptyState icon={Search} title="Nothing matches" hint="Try another category." /> : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
                <button onClick={() => { setQuick(p); setQty(1); }} className="relative">
                  <Art p={p} className="h-40 rounded-none sm:h-48" />
                  {p.stock === 0 && <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-medium text-destructive-foreground">Sold out</span>}
                  {p.stock > 0 && p.stock <= 5 && <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground">Only {p.stock} left</span>}
                </button>
                <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.format}</p>
                  <p className="line-clamp-1 font-medium text-foreground">{p.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-current text-primary" />{p.rating} · {p.author}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="font-heading text-sm font-bold text-foreground sm:text-base">{fcfa(p.price)}</span>
                    <Button size="icon" variant="secondary" disabled={p.stock === 0} onClick={() => add(p.id)} aria-label="Add to cart"><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </>) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Panel title="Recent orders" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {demoOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Package className="h-5 w-5" /></span>
                    <div><p className="font-medium text-foreground">{o.id}</p><p className="text-xs text-muted-foreground">{o.date} · {o.items} item(s) · {fcfa(o.total)}</p></div>
                  </div>
                  <div className="text-right">
                    <Badge variant={o.status === 'Collected' ? 'secondary' : 'default'}>{o.status}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">Pickup code {o.code}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Digital library">
            <div className="space-y-3">
              {products.filter((p) => p.format.includes('Digital') || p.format === 'E-book').map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <Art p={p} className="h-14 w-11 shrink-0" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{p.format}</p></div>
                  <Button size="sm" variant="ghost"><BookOpen className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <Dialog open={!!quick} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          {quick && (
            <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
              <Art p={quick} className="h-56" />
              <div className="space-y-3">
                <DialogHeader><DialogTitle>{quick.name}</DialogTitle><DialogDescription>{quick.author} · {quick.format}</DialogDescription></DialogHeader>
                <p className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-4 w-4 fill-current text-primary" />{quick.rating} rating</p>
                <p className="text-sm text-muted-foreground">{quick.description}</p>
                <p className="font-heading text-2xl font-bold text-foreground">{fcfa(quick.price)}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-border">
                    <Button size="icon" variant="ghost" onClick={() => setQty((n) => Math.max(1, n - 1))}><Minus className="h-4 w-4" /></Button>
                    <span className="w-8 text-center text-sm font-medium">{qty}</span>
                    <Button size="icon" variant="ghost" onClick={() => setQty((n) => n + 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <Button disabled={quick.stock === 0} onClick={() => { add(quick.id, qty); setQuick(null); setCartOpen(true); }}>{quick.stock === 0 ? 'Sold out' : 'Add to cart'}</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={cartOpen} onOpenChange={(o) => { setCartOpen(o); if (!o) setPlaced(null); }}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader><SheetTitle>Your cart</SheetTitle></SheetHeader>
          {placed ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <CheckCircle2 className="h-14 w-14 text-primary" />
              <p className="font-heading text-lg font-bold">Order placed (demo)</p>
              <p className="text-sm text-muted-foreground">Reference {placed}. {delivery === 'pickup' ? 'Collect at your branch after Sunday service.' : 'We will contact you to arrange delivery.'}</p>
              <Button onClick={() => { setCartOpen(false); setPlaced(null); setView('orders'); }}>View my orders</Button>
            </div>
          ) : lines.length === 0 ? (
            <div className="flex-1 pt-6"><EmptyState icon={ShoppingBag} title="Your cart is empty" hint="Browse the store to add items." /></div>
          ) : (<>
            <ul className="flex-1 space-y-3 overflow-y-auto py-4">
              {lines.map(({ p, n }) => (
                <li key={p.id} className="flex gap-3">
                  <Art p={p} className="h-16 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{fcfa(p.price)}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setLine(p.id, n - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center text-sm">{n}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setLine(p.id, n + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={() => setLine(p.id, 0)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-2">
                {([['pickup', StoreIcon, 'Branch pickup'], ['delivery', Truck, 'Delivery']] as const).map(([k, Icon, l]) => (
                  <button key={k} onClick={() => setDelivery(k)} className={cn('flex items-center gap-2 rounded-xl border p-3 text-sm',
                    delivery === k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}><Icon className="h-4 w-4" />{l}</button>
                ))}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fcfa(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-primary"><span>Pickup discount (10%)</span><span>−{fcfa(discount)}</span></div>}
                {fee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{fcfa(fee)}</span></div>}
                <div className="flex justify-between pt-1 font-heading text-base font-bold"><span>Total</span><span>{fcfa(total)}</span></div>
              </div>
              <Button className="w-full" onClick={() => { setPlaced(`WCA-ORD-${1100 + count}`); setCart({}); }}>Place order</Button>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
