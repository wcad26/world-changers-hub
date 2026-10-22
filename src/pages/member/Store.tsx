import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingCart, Search, Minus, Plus, Trash2, Star, BookOpen, Clock, ShoppingBag, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Segmented, EmptyState } from '@/components/member/MemberUI';
import { MemberGiveSheet } from '@/components/member/MemberGiveSheet';
import { Cover } from '@/components/member/store/Cover';
import { useCart } from '@/components/member/store/cart';
import { products, storeCategories, libraryBooks, libraryGenres, demoRentals, fcfa, type LibraryBook } from '@/data/memberDemo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function Chips({ items, value, onChange, allLabel }: { items: string[]; value: string; onChange: (v: string) => void; allLabel: string }) {
  return (
    <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto">
      {['all', ...items].map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} className={cn('whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
          value === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{c === 'all' ? allLabel : c}</button>
      ))}
    </div>
  );
}

export function CartSheet({ open, onOpenChange, onCheckout }: { open: boolean; onOpenChange: (o: boolean) => void; onCheckout: (title: string, amount: number) => void }) {
  const { cart, set } = useCart();
  const lines = Object.entries(cart).map(([id, n]) => ({ p: products.find((x) => x.id === id), n })).filter((l) => l.p) as { p: typeof products[number]; n: number }[];
  const total = lines.reduce((s, l) => s + l.p.price * l.n, 0);
  const count = lines.reduce((s, l) => s + l.n, 0);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-border bg-card px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:mx-auto sm:max-w-lg sm:px-6">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="mb-4 text-left"><SheetTitle>Your cart</SheetTitle><SheetDescription>{count} item{count === 1 ? '' : 's'}</SheetDescription></SheetHeader>
        {lines.length === 0 ? <EmptyState icon={ShoppingBag} title="Your cart is empty" hint="Add something from the store." /> : (<>
          <ul className="space-y-3">
            {lines.map(({ p, n }) => (
              <li key={p.id} className="flex items-center gap-3">
                <Cover title={p.name} tone={p.tone} small className="h-16 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{fcfa(p.price)}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <button type="button" aria-label="Less" onClick={() => set(p.id, n - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-border"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-5 text-center text-sm font-semibold">{n}</span>
                    <button type="button" aria-label="More" onClick={() => set(p.id, Math.min(n + 1, p.stock))} className="grid h-7 w-7 place-items-center rounded-full border border-border"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-sm font-bold">{fcfa(p.price * n)}</p>
                  <button type="button" aria-label="Remove" onClick={() => set(p.id, 0)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-sm text-muted-foreground">Total</span><span className="font-heading text-xl font-bold">{fcfa(total)}</span></div>
          <Button className="mt-4 h-12 w-full rounded-full" onClick={() => onCheckout(`Store order · ${count} item${count === 1 ? '' : 's'}`, total)}>Checkout</Button>
        </>)}
      </SheetContent>
    </Sheet>
  );
}

export default function MemberStore() {
  const [tab, setTab] = useState<'store' | 'library'>('store');
  const [cat, setCat] = useState('all');
  const [genre, setGenre] = useState('all');
  const [q, setQ] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [pay, setPay] = useState<{ title: string; amount: number; fromCart?: boolean } | null>(null);
  const [rentBook, setRentBook] = useState<LibraryBook | null>(null);
  const [weeks, setWeeks] = useState(2);
  const { cart, add, clear } = useCart();
  const count = Object.values(cart).reduce((s, n) => s + n, 0);

  const ql = q.toLowerCase();
  const list = products.filter((p) => (cat === 'all' || p.category === cat) && (!q || `${p.name} ${p.author}`.toLowerCase().includes(ql)));
  const books = libraryBooks.filter((b) => (genre === 'all' || b.genre === genre) && (!q || `${b.title} ${b.author}`.toLowerCase().includes(ql)));
  const rentals = demoRentals.map((r) => ({ ...r, book: libraryBooks.find((b) => b.id === r.bookId)! }));

  return (
    <div className="space-y-5 overflow-x-clip pb-24 lg:pb-6">
      <Segmented<'store' | 'library'> full value={tab} onChange={(v) => { setTab(v); setQ(''); }} options={[{ value: 'store', label: 'Store' }, { value: 'library', label: 'Library' }]} />

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'store' ? 'Search the store' : 'Search the library'} className="h-11 rounded-full pl-10" />
        </div>
        {tab === 'store' && (
          <button type="button" onClick={() => setCartOpen(true)} aria-label="Open cart" className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">{count}</span>}
          </button>
        )}
      </div>

      {tab === 'store' ? (<>
        <Chips items={storeCategories} value={cat} onChange={setCat} allLabel="All" />
        {list.length === 0 ? <EmptyState icon={ShoppingBag} title="Nothing found" hint="Try another search or category." /> : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => {
              const inCart = cart[p.id] ?? 0;
              return (
                <li key={p.id} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
                  <Link to="/member/store/$productId" params={{ productId: p.id }} className="block">
                    <Cover title={p.name} tone={p.tone} className="aspect-[4/5] w-full rounded-none" />
                  </Link>
                  <div className="space-y-1 p-3">
                    <Link to="/member/store/$productId" params={{ productId: p.id }} className="block truncate text-sm font-semibold text-foreground">{p.name}</Link>
                    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><Star className="h-3 w-3 fill-current text-warning" />{p.rating} · {p.format}</p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="truncate font-heading text-sm font-bold">{fcfa(p.price)}</p>
                      {p.stock === 0 ? <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">Sold out</span> : (
                        <button type="button" aria-label={`Add ${p.name}`} onClick={() => { add(p.id); toast.success(`${p.name} added to cart`); }}
                          className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors', inCart ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground')}>
                          {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </>) : (<>
        {rentals.length > 0 && (
          <section className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-primary-foreground shadow-regal">
            <p className="text-xs font-medium opacity-80">Borrowed by you</p>
            {rentals.map((r) => (
              <div key={r.id} className="mt-2 flex items-center gap-3">
                <Cover title={r.book.title} tone={r.book.tone} small className="h-14 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1"><p className="truncate font-heading font-semibold">{r.book.title}</p><p className="flex items-center gap-1 text-xs opacity-85"><Clock className="h-3.5 w-3.5" />Return by {r.due}</p></div>
              </div>
            ))}
          </section>
        )}
        <Chips items={libraryGenres} value={genre} onChange={setGenre} allLabel="All books" />
        {books.length === 0 ? <EmptyState icon={BookOpen} title="No books found" /> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {books.map((b) => (
              <li key={b.id} className="flex min-w-0 gap-3 rounded-2xl border border-border bg-card p-3">
                <Cover title={b.title} tone={b.tone} small className="h-28 w-20 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">{b.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.author} · {b.pages} pages</p>
                  <p className={cn('mt-1 text-[11px] font-semibold', b.available ? 'text-success' : 'text-muted-foreground')}>{b.available ? `${b.available} of ${b.copies} available to rent` : 'All copies borrowed'}</p>
                  <div className="mt-auto flex gap-2 pt-2">
                    <Button size="sm" className="h-8 flex-1 rounded-full px-2 text-xs" onClick={() => setPay({ title: `Book · ${b.title}`, amount: b.price })}>Buy {fcfa(b.price)}</Button>
                    <Button size="sm" variant="outline" disabled={!b.available} className="h-8 flex-1 rounded-full px-2 text-xs" onClick={() => { setRentBook(b); setWeeks(2); }}>Rent</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>)}

      <Sheet open={!!rentBook} onOpenChange={(o) => !o && setRentBook(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:mx-auto sm:max-w-lg sm:px-6">
          {rentBook && (<>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
            <SheetHeader className="mb-4 text-left"><SheetTitle>Rent “{rentBook.title}”</SheetTitle><SheetDescription>Collect at your branch library and return by the due date.</SheetDescription></SheetHeader>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">How long?</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 4].map((w) => (
                <button key={w} type="button" onClick={() => setWeeks(w)} className={cn('rounded-2xl border py-3 text-center transition-colors', weeks === w ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                  <p className="font-heading text-lg font-bold">{w} wk{w > 1 ? 's' : ''}</p><p className="text-[11px] opacity-80">{fcfa(rentBook.rentPerWeek * w)}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Due back on {new Date(Date.now() + weeks * 7 * 86400000).toLocaleDateString('en-GB')}.</p>
            <Button className="mt-4 h-12 w-full rounded-full" onClick={() => { const b = rentBook; setRentBook(null); setPay({ title: `Rental · ${b.title} · ${weeks} wk`, amount: b.rentPerWeek * weeks }); }}>Pay {fcfa(rentBook.rentPerWeek * weeks)}</Button>
          </>)}
        </SheetContent>
      </Sheet>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} onCheckout={(title, amount) => { setCartOpen(false); setPay({ title, amount, fromCart: true }); }} />
      <MemberGiveSheet open={!!pay} onOpenChange={(o) => { if (!o) { if (pay?.fromCart) clear(); setPay(null); } }} currency="XAF" purchase={pay} />
    </div>
  );
}
