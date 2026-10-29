import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router-compat";
import {
  CheckCircle2,
  Gift,
  Globe2,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassPanels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UniversalCheckout } from "@/components/payments/UniversalCheckout";
import { listPublicDestinations } from "@/lib/giving.functions";
import { CURRENCY_PRESETS, formatMajorCurrency } from "@/lib/payment-utils";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

type GivingKind = "tithe" | "offering" | "special";

export default function PublicDonate() {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const listPublicDestFn = useServerFn(listPublicDestinations);
  const { data: publicDest } = useQuery({
    queryKey: ["public_payment_destinations"],
    queryFn: () => listPublicDestFn(),
    staleTime: 2 * 60_000,
  });

  const [regionId, setRegionId] = useState<string>("");
  const [kind, setKind] = useState<GivingKind>("offering");
  const [anonymous, setAnonymous] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amountText, setAmountText] = useState("");
  const [completed, setCompleted] = useState<{
    txRef: string;
    isBankPending?: boolean;
    amount: number;
    currency: string;
    regionName: string;
  } | null>(null);

  useEffect(() => {
    if (!publicDest || regionId) return;
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("region");
      if (q) {
        if (q.toLowerCase() === "global" || q.toUpperCase() === "HO") {
          setRegionId("global");
          return;
        }
        const match = publicDest.regions.find(
          (r) => r.id === q || r.code?.toLowerCase() === q.toLowerCase(),
        );
        if (match) {
          setRegionId(match.id);
          return;
        }
      }
    }
    setRegionId(publicDest.regions[0]?.id || "global");
  }, [publicDest, regionId]);

  const activeTenant = useMemo(() => {
    if (!publicDest) return null;
    if (regionId === "global") return publicDest.headOffice;
    return publicDest.regions.find((r) => r.id === regionId) ?? null;
  }, [publicDest, regionId]);

  const currency = (activeTenant?.currency || "XAF").toUpperCase();
  const presets = CURRENCY_PRESETS[currency] ?? CURRENCY_PRESETS.USD;
  const amount = Number(amountText.replace(/[^\d.]/g, "")) || 0;

  const kinds: { value: GivingKind; label: string; icon: typeof Heart }[] = [
    { value: "offering", label: isFr ? "Offrande" : "Offering", icon: Gift },
    { value: "tithe", label: isFr ? "Dîme" : "Tithe", icon: Heart },
    { value: "special", label: isFr ? "Don spécial" : "Special Seed", icon: Sparkles },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navbar />
      <main className="flex-1 py-10 pb-20">
        <div className="container-custom max-w-2xl space-y-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary p-6 text-primary-foreground shadow-xl md:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isFr ? "Don sécurisé par région" : "Direct Regional Giving"}
              </div>
              <h1 className="font-heading text-2xl font-bold md:text-3xl">
                {isFr ? "Faire un don à WCA" : "Give to World Changers Association"}
              </h1>
              <p className="max-w-xl text-sm text-primary-foreground/85">
                {isFr
                  ? "Choisissez la région bénéficiaire. Votre contribution est acheminée directement vers le compte officiel de cette région."
                  : "Select your destination WCA region. Your gift routes directly to that region's dedicated account with strict fund isolation."}
              </p>
            </div>
          </div>

          {completed ? (
            <GlassCard className="space-y-5 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-heading text-xl font-bold">
                  {completed.isBankPending
                    ? isFr
                      ? "Référence de virement enregistrée"
                      : "Bank Deposit Reference Recorded"
                    : isFr
                      ? "Merci pour votre générosité !"
                      : "Thank you for your generosity!"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatMajorCurrency(completed.amount, completed.currency)} · {completed.regionName}
                </p>
                {completed.txRef && (
                  <p className="pt-1 font-mono text-xs text-muted-foreground">
                    Ref: {completed.txRef}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCompleted(null);
                    setAmountText("");
                  }}
                >
                  {isFr ? "Faire un autre don" : "Give again"}
                </Button>
                <Button asChild>
                  <Link to="/">{isFr ? "Retour à l'accueil" : "Back to Home"}</Link>
                </Button>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="space-y-6 p-6 md:p-8">
              {/* 1. Destination Region */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {isFr ? "Région bénéficiaire" : "Destination Region"}
                </Label>
                <Select
                  value={regionId}
                  onValueChange={(v) => {
                    setRegionId(v);
                    setAmountText("");
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <span className="flex items-center gap-2">
                      {regionId === "global" ? (
                        <Globe2 className="h-4 w-4 text-primary" />
                      ) : (
                        <MapPin className="h-4 w-4 text-primary" />
                      )}
                      <SelectValue placeholder={isFr ? "Sélectionner une région…" : "Select a region…"} />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {(publicDest?.regions ?? []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.currency})
                      </SelectItem>
                    ))}
                    {publicDest?.headOffice && (
                      <SelectItem value="global">
                        {publicDest.headOffice.name} ({publicDest.headOffice.currency}) ·{" "}
                        {isFr ? "International" : "Global"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Giving Type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {isFr ? "Catégorie" : "Giving Type"}
                </Label>
                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1">
                  {kinds.map((k) => {
                    const active = kind === k.value;
                    return (
                      <button
                        key={k.value}
                        type="button"
                        onClick={() => setKind(k.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <k.icon className="h-4 w-4" />
                        <span>{k.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {kind === "special" && (
                <div className="space-y-1.5">
                  <Label>{isFr ? "Motif / Note (optionnel)" : "Note / Purpose (optional)"}</Label>
                  <Input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder={isFr ? "Ex: Action de grâce, Missions…" : "e.g. Thanksgiving, Missions…"}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}

              {/* 3. Amount */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {isFr ? "Montant" : "Amount"} ({currency})
                </Label>
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="0"
                    className="h-14 rounded-xl pr-16 font-heading text-2xl font-bold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    {currency}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmountText(String(p))}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                        amount === p
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary/50",
                      )}
                    >
                      {new Intl.NumberFormat("en-US").format(p)} {currency}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Donor Details */}
              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="donate-anon" className="cursor-pointer text-sm font-medium">
                    {isFr ? "Donner de manière anonyme" : "Give anonymously"}
                  </Label>
                  <Switch id="donate-anon" checked={anonymous} onCheckedChange={setAnonymous} />
                </div>

                {!anonymous && (
                  <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">{isFr ? "Nom complet" : "Full Name"}</Label>
                      <Input
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder={isFr ? "Votre nom et prénom" : "Your full name"}
                        className="mt-1 h-11 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">
                        Email ({isFr ? "pour votre reçu" : "for receipt"})
                      </Label>
                      <Input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1 h-11 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isFr ? "Téléphone" : "Phone"}</Label>
                      <Input
                        type="tel"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        placeholder="+237…"
                        className="mt-1 h-11 rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Universal Multi-Tenant Checkout */}
              <UniversalCheckout
                context="public_giving"
                amount={amount}
                currency={currency}
                tenant={activeTenant}
                kind={kind}
                regionId={regionId || "global"}
                payer={{
                  anonymous,
                  name: anonymous ? undefined : donorName || undefined,
                  email: anonymous ? undefined : donorEmail || undefined,
                  phone: anonymous ? undefined : donorPhone || undefined,
                  purpose: purpose || undefined,
                }}
                redirectPath="/donate"
                onBeforeStart={() => {
                  if (!amount || amount <= 0) {
                    return isFr ? "Veuillez saisir un montant valide." : "Please enter a valid gift amount.";
                  }
                  if (!anonymous && !donorName.trim()) {
                    return isFr
                      ? "Veuillez indiquer votre nom ou activer le don anonyme."
                      : "Please enter your name or toggle anonymous giving.";
                  }
                  return null;
                }}
                onSuccess={(res) => {
                  setCompleted({
                    txRef: res.txRef,
                    isBankPending: res.isBankPending,
                    amount,
                    currency,
                    regionName: activeTenant?.name || "WCA",
                  });
                }}
              />
            </GlassCard>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
