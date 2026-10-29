import { useMemo, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Check,
  Globe2,
  MapPin,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Cover } from '@/components/member/store/Cover';
import { UniversalCheckout, type PublicTenantCapability } from '@/components/payments/UniversalCheckout';
import { listPublicDestinations } from '@/lib/giving.functions';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useBaseCurrencyCode } from '@/hooks/useSystemSettings';
import { convertCatalogPriceFromXaf, formatCatalogPrice } from '@/utils/fx';
import {
  products,
  storeCategories,
  libraryBooks,
  libraryGenres,
  type LibraryBook,
} from '@/data/memberDemo';
import { cn } from '@/lib/utils';

export default function StorePage() {
  const [activeTab, setActiveTab] = useState<'store' | 'library'>('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('global');

  // Public cart state: productId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);

  // Checkout modal state
  const [checkoutOrder, setCheckoutOrder] = useState<{
    title: string;
    amountInXaf: number;
    fromCart?: boolean;
  } | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const listDest = useServerFn(listPublicDestinations);
  const { data: destinations } = useQuery({
    queryKey: ['public_giving_destinations'],
    queryFn: () => listDest(),
    staleTime: 2 * 60_000,
  });

  const { data: rates = [] } = useExchangeRates();
  const { data: baseCode = 'EUR' } = useBaseCurrencyCode();

  const activeTenant = useMemo<PublicTenantCapability | null>(() => {
    if (!destinations) return null;
    if (selectedRegionId === 'global') return destinations.headOffice;
    return (
      destinations.regions.find((r) => r.id === selectedRegionId) ??
      destinations.headOffice
    );
  }, [destinations, selectedRegionId]);

  const activeCurrency = (activeTenant?.currency || 'XAF').toUpperCase();

  const fmt = (priceInXaf: number) =>
    formatCatalogPrice(priceInXaf, activeCurrency, rates, baseCode);

  const toTargetMajor = (priceInXaf: number) =>
    convertCatalogPriceFromXaf(priceInXaf, activeCurrency, rates, baseCode);

  const setQty = (id: string, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const addToCart = (id: string, delta = 1) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + delta }));
  };

  const clearCart = () => setCart({});

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const prod = products.find((p) => p.id === id);
        return prod ? { product: prod, qty } : null;
      })
      .filter(Boolean) as { product: (typeof products)[number]; qty: number }[];
  }, [cart]);

  const totalItems = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const totalCartXaf = cartLines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  const qLower = searchQuery.toLowerCase().trim();
  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === 'all' || p.category === selectedCategory) &&
      (!qLower || `${p.name} ${p.author} ${p.description}`.toLowerCase().includes(qLower)),
  );

  const filteredBooks = libraryBooks.filter(
    (b) =>
      (selectedGenre === 'all' || b.genre === selectedGenre) &&
      (!qLower || `${b.title} ${b.author}`.toLowerCase().includes(qLower)),
  );

  const openBookPurchase = (book: LibraryBook) => {
    setCheckoutOrder({
      title: `Book · ${book.title}`,
      amountInXaf: book.price,
      fromCart: false,
    });
  };

  const openCartCheckout = () => {
    if (!cartLines.length) return;
    const summary =
      cartLines.length === 1
        ? `${cartLines[0].qty}x ${cartLines[0].product.name}`
        : `${totalItems} items (${cartLines.map((l) => l.product.name).slice(0, 2).join(', ')})`;
    setCartOpen(false);
    setCheckoutOrder({
      title: summary,
      amountInXaf: totalCartXaf,
      fromCart: true,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Sticky Store & Currency Bar */}
      <div className="sticky top-16 z-20 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="container-custom py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Store / Library Switcher */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('store')}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
                    activeTab === 'store'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>WCA Store</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
                    activeTab === 'library'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>WCA Library</span>
                </button>
              </div>

              {/* Region & Dynamic Currency Selector */}
              {destinations && (
                <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                  <SelectTrigger className="h-10 w-[220px] rounded-full text-xs sm:w-[250px]">
                    <span className="flex items-center gap-1.5 truncate">
                      {selectedRegionId === 'global' ? (
                        <Globe2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="global">
                      {destinations.headOffice.name} ({destinations.headOffice.currency})
                    </SelectItem>
                    {destinations.regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Search & Cart Trigger */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'store'
                      ? 'Search books, apparel, devotionals...'
                      : 'Search library titles or authors...'
                  }
                  className="h-10 rounded-full pl-9"
                />
              </div>

              <Button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative h-10 rounded-full gap-2 px-4"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <Badge variant="secondary" className="ml-0.5 rounded-full px-1.5 py-0 text-xs font-bold">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="border-b border-border/50 bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-10">
        <div className="container-custom flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                {activeTenant?.name || 'World Changers Army'} · {activeCurrency}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Dynamic regional currency conversion
              </span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {activeTab === 'store' ? 'World Changers Store' : 'World Changers Library'}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {activeTab === 'store'
                ? 'Equip your spiritual journey with official WCA books, study guides, audio teachings, and ministry apparel.'
                : 'Explore foundational Christian literature and leadership resources available across WCA regional libraries.'}
            </p>
          </div>
          {totalItems > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/80 p-3.5 shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground">
                  {totalItems} item{totalItems > 1 ? 's' : ''} in cart
                </p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {fmt(totalCartXaf)}
                </p>
              </div>
              <Button size="sm" className="rounded-full" onClick={openCartCheckout}>
                Checkout Now
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Main Catalog */}
      <main className="container-custom flex-1 py-8">
        {activeTab === 'store' ? (
          <div className="space-y-6">
            {/* Category Pills */}
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {['all', ...storeCategories].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                    selectedCategory === cat
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card/50 py-16 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-heading text-base font-semibold">No products found</p>
                <p className="text-xs text-muted-foreground">Try another search or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((p) => {
                  const inCart = cart[p.id] ?? 0;
                  const soldOut = p.stock === 0;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-shadow hover:shadow-md"
                    >
                      <Cover title={p.name} tone={p.tone} className="aspect-[4/5] w-full rounded-none" />
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
                            <span className="font-semibold uppercase tracking-wider text-primary">
                              {p.category}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {p.rating}
                            </span>
                          </div>
                          <h3 className="font-heading text-sm font-bold text-foreground line-clamp-2">
                            {p.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">{p.author} · {p.format}</p>
                          <p className="line-clamp-2 pt-1 text-xs text-muted-foreground">
                            {p.description}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                          <div>
                            <p className="font-heading text-base font-extrabold text-foreground">
                              {fmt(p.price)}
                            </p>
                            {activeCurrency !== 'XAF' && (
                              <p className="text-[10px] text-muted-foreground">
                                {p.price.toLocaleString()} FCFA
                              </p>
                            )}
                          </div>

                          {soldOut ? (
                            <Badge variant="secondary" className="text-xs">
                              Sold Out
                            </Badge>
                          ) : inCart > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setQty(p.id, inCart - 1)}
                                className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-muted"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold">{inCart}</span>
                              <button
                                type="button"
                                onClick={() => setQty(p.id, Math.min(p.stock, inCart + 1))}
                                className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-muted"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 rounded-full px-3 text-xs"
                              onClick={() => {
                                addToCart(p.id, 1);
                                toast.success(`${p.name} added to cart`);
                              }}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {['all', ...libraryGenres].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGenre(g)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                    selectedGenre === g
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {g === 'all' ? 'All Genres' : g}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((b) => (
                <div
                  key={b.id}
                  className="flex gap-4 rounded-2xl border border-border/80 bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <Cover title={b.title} tone={b.tone} small className="h-32 w-24 shrink-0 rounded-xl" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Badge variant="outline" className="w-fit text-[10px]">
                      {b.genre}
                    </Badge>
                    <h3 className="mt-1 font-heading text-base font-bold text-foreground line-clamp-2">
                      {b.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {b.author} · {b.pages} pages
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-xs font-semibold',
                        b.available > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                      )}
                    >
                      {b.available > 0
                        ? `${b.available} of ${b.copies} copies available`
                        : 'All branch copies currently borrowed'}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <span className="font-heading text-sm font-extrabold text-foreground">
                        {fmt(b.price)}
                      </span>
                      <Button
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => openBookPurchase(b)}
                      >
                        Buy Copy
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sliding Cart Drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col justify-between sm:max-w-md"
        >
          <div className="overflow-y-auto pr-1">
            <SheetHeader className="mb-4 text-left">
              <SheetTitle>Your Shopping Cart</SheetTitle>
              <SheetDescription>
                {totalItems} item{totalItems === 1 ? '' : 's'} · Priced in {activeCurrency} ({activeTenant?.name || 'WCA'})
              </SheetDescription>
            </SheetHeader>

            {cartLines.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 font-semibold">Your cart is empty</p>
                <p className="text-xs text-muted-foreground">
                  Browse the WCA Store and add books or merchandise.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {cartLines.map(({ product: p, qty }) => (
                  <li key={p.id} className="flex items-center gap-3 py-3.5">
                    <Cover title={p.name} tone={p.tone} small className="h-16 w-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{fmt(p.price)} each</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQty(p.id, qty - 1)}
                          className="grid h-7 w-7 place-items-center rounded-full border border-border"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(p.id, Math.min(p.stock, qty + 1))}
                          className="grid h-7 w-7 place-items-center rounded-full border border-border"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm font-bold">{fmt(p.price * qty)}</p>
                      <button
                        type="button"
                        onClick={() => setQty(p.id, 0)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cartLines.length > 0 && (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal ({activeCurrency})</span>
                <span className="font-heading text-xl font-extrabold">{fmt(totalCartXaf)}</span>
              </div>
              <Button className="h-12 w-full rounded-full font-semibold" onClick={openCartCheckout}>
                Proceed to Checkout · {fmt(totalCartXaf)}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Public Store Universal Checkout Dialog */}
      <Dialog
        open={!!checkoutOrder}
        onOpenChange={(o) => {
          if (!o) setCheckoutOrder(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[540px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">
              WCA Store Checkout
            </DialogTitle>
            <DialogDescription>
              {checkoutOrder?.title} · Routed to {activeTenant?.name || 'World Changers Army'}
            </DialogDescription>
          </DialogHeader>

          {checkoutOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Order Summary
                  </p>
                  <p className="text-sm font-semibold text-foreground">{checkoutOrder.title}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-xl font-extrabold text-foreground">
                    {fmt(checkoutOrder.amountInXaf)}
                  </p>
                  {activeCurrency !== 'XAF' && (
                    <p className="text-[10px] text-muted-foreground">
                      Base: {checkoutOrder.amountInXaf.toLocaleString()} FCFA
                    </p>
                  )}
                </div>
              </div>

              {/* Buyer Contact Information */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Your full name"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email (for digital receipt)</Label>
                  <Input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <UniversalCheckout
                context="store_order"
                amount={toTargetMajor(checkoutOrder.amountInXaf)}
                currency={activeCurrency}
                tenant={activeTenant}
                kind="special"
                regionId={selectedRegionId}
                payer={{
                  name: buyerName.trim() || 'Store Customer',
                  email: buyerEmail.trim() || undefined,
                  phone: buyerPhone.trim() || undefined,
                  purpose: checkoutOrder.title,
                }}
                redirectPath="/store"
                onBeforeStart={() => {
                  if (!buyerName.trim()) return 'Please enter your full name for the order.';
                  return null;
                }}
                onSuccess={() => {
                  if (checkoutOrder.fromCart) clearCart();
                  toast.success('Order payment confirmed! Thank you.');
                }}
              />

              <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  Prices are converted using official WCA exchange rates and settled directly to {activeTenant?.name}.
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
