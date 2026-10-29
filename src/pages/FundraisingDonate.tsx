import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "@/lib/router-compat";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/ui/GlassPanels";
import { ArrowLeft, CheckCircle2, Heart, Loader2 } from "lucide-react";
import { usePublicFundraisingCampaign } from "@/hooks/useFundraisingCampaigns";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currencyUtils";
import { UniversalCheckout } from "@/components/payments/UniversalCheckout";
import { listPublicDestinations } from "@/lib/giving.functions";
import { CURRENCY_PRESETS } from "@/lib/payment-utils";
import { cn } from "@/lib/utils";

const FundraisingDonate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t, language } = useLanguage();
  const isFr = language === "fr";
  const { data: campaign } = usePublicFundraisingCampaign(id);

  const listPublicDestFn = useServerFn(listPublicDestinations);
  const { data: publicDest } = useQuery({
    queryKey: ["public_payment_destinations"],
    queryFn: () => listPublicDestFn(),
    staleTime: 2 * 60_000,
  });

  const [anonymous, setAnonymous] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [matched, setMatched] = useState<{ first_name?: string; last_name?: string } | null>(null);
  const [pledge, setPledge] = useState<any>(null);
  const [familyName, setFamilyName] = useState("");
  const [otherNames, setOtherNames] = useState("");
  const [amount, setAmount] = useState("");
  const [checking, setChecking] = useState(false);
  const [completedRef, setCompletedRef] = useState<{ txRef: string; isBankPending?: boolean } | null>(null);

  const currency = (campaign?.currency_code || "XAF").toUpperCase();
  const presets = CURRENCY_PRESETS[currency] ?? CURRENCY_PRESETS.USD;

  // Strict Multi-Tenant Routing:
  // Regional campaign -> Campaign's owning region gateway
  // Global campaign (region_id IS NULL) -> Head Office gateway
  const campaignTenant = useMemo(() => {
    if (!publicDest || !campaign) return null;
    if (!campaign.region_id) return publicDest.headOffice;
    return publicDest.regions.find((r) => r.id === campaign.region_id) ?? null;
  }, [publicDest, campaign]);

  // If returning from 3D Secure / Apple Pay / Google Pay redirect (?tx_ref=...), jump straight to step 2 so UniversalCheckout verifies it
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tx_ref")) {
      setStep(2);
    }
  }, []);

  const handleProceed = async () => {
    if (anonymous) {
      setStep(2);
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 8) {
      toast.error(t("fr_phone"));
      return;
    }
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("fundraising-lookup", {
        body: { phone, campaign_id: id },
      });
      if (error) throw error;
      if (data?.found) {
        setMatched({ first_name: data.first_name, last_name: data.last_name });
        setOtherNames(data.first_name || "");
        setFamilyName(data.last_name || "");
        setPledge(data.pledge || null);
      } else {
        setMatched(null);
        setPledge(null);
      }
      setStep(2);
    } catch (e: any) {
      toast.error(t("fr_lookup_error"), { description: e?.message });
    } finally {
      setChecking(false);
    }
  };

  const greetMatch = (t("fr_greet_match_donate") || "").replace("{name}", matched?.first_name || "");
  const numericAmount = Number(amount) || 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="flex-1 pb-16">
        <div className="container-custom py-6 max-w-2xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("fr_back")}
          </Button>

          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-wca-purple to-wca-violet flex items-center justify-center text-white">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t("fr_donate_title")}</h1>
                {campaign && <p className="text-sm text-muted-foreground">{campaign.name}</p>}
              </div>
            </div>

            {step !== 3 && (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label className="cursor-pointer">{t("fr_anonymous_toggle")}</Label>
                <Switch
                  checked={anonymous}
                  onCheckedChange={(v) => {
                    setAnonymous(v);
                    setStep(1);
                  }}
                />
              </div>
            )}

            {step === 1 && !anonymous && (
              <div className="space-y-3">
                <Label>{t("fr_phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237…" />
                <Button onClick={handleProceed} disabled={checking} className="w-full">
                  {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {checking ? t("fr_checking") : t("fr_proceed")}
                </Button>
              </div>
            )}

            {(step === 2 || (step === 1 && anonymous)) && (
              <div className="space-y-5">
                {!anonymous && (
                  <p className="text-sm">{matched ? greetMatch : t("fr_greet_new_donate")}</p>
                )}

                {pledge && !anonymous && (
                  <div className="rounded-lg border border-wca-purple/30 bg-wca-purple/5 p-4 space-y-2">
                    <div className="text-xs uppercase tracking-wider text-wca-purple font-semibold">
                      {t("fr_my_pledge")}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("fr_pledged")}</span>
                      <span className="font-medium">{formatCurrency(pledge.amount, pledge.currency_code)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("fr_redeemed")}</span>
                      <span className="font-medium">{formatCurrency(pledge.paid, pledge.currency_code)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-wca-purple h-2 rounded-full"
                        style={{ width: `${Math.min(100, (pledge.paid / pledge.amount) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {t("fr_remaining")}: {formatCurrency(pledge.remaining, pledge.currency_code)}
                      </span>
                    </div>
                  </div>
                )}

                {!anonymous && !matched && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>{t("fr_family_name")}</Label>
                      <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
                    </div>
                    <div>
                      <Label>{t("fr_other_names")}</Label>
                      <Input value={otherNames} onChange={(e) => setOtherNames(e.target.value)} />
                    </div>
                    <div>
                      <Label>{t("fr_phone")}</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                      <Label>Email ({isFr ? "optionnel" : "optional"})</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    {t("fr_amount")} ({currency})
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="h-12 text-lg font-bold"
                  />
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAmount(String(p))}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          numericAmount === p
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary/50",
                        )}
                      >
                        {new Intl.NumberFormat("en-US").format(p)} {currency}
                      </button>
                    ))}
                  </div>
                </div>

                {id && (
                  <UniversalCheckout
                    context="campaign_donation"
                    amount={numericAmount}
                    currency={currency}
                    tenant={campaignTenant}
                    campaignId={id}
                    regionId={campaign?.region_id || "global"}
                    payer={{
                      anonymous,
                      familyName: anonymous ? undefined : familyName,
                      otherNames: anonymous ? undefined : otherNames,
                      email: anonymous ? undefined : email || undefined,
                      phone: anonymous ? undefined : phone || undefined,
                    }}
                    redirectPath={`/fundraising/${id}/donate`}
                    onBeforeStart={() => {
                      if (!numericAmount || numericAmount <= 0) return t("fr_amount");
                      if (!anonymous && !matched && !familyName.trim()) return t("fr_family_name");
                      return null;
                    }}
                    onSuccess={(res) => {
                      setCompletedRef({ txRef: res.txRef, isBankPending: res.isBankPending });
                      qc.invalidateQueries({ queryKey: ["public_fundraising_campaign", id] });
                      qc.invalidateQueries({ queryKey: ["public_campaign_donations", id] });
                      toast.success(
                        res.isBankPending
                          ? isFr
                            ? "Référence de virement bancaire enregistrée."
                            : "Bank deposit reference recorded."
                          : t("fr_success_donate"),
                      );
                      setStep(3);
                    }}
                  />
                )}
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-lg font-medium">
                  {completedRef?.isBankPending
                    ? isFr
                      ? "Merci ! Votre référence de dépôt bancaire a été enregistrée."
                      : "Thank you! Your bank deposit reference has been recorded."
                    : t("fr_success_donate")}
                </p>
                {completedRef?.txRef && (
                  <p className="font-mono text-xs text-muted-foreground">Ref: {completedRef.txRef}</p>
                )}
                <Button asChild variant="outline">
                  <Link to={`/fundraising/${id}`}>{t("fr_back")}</Link>
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FundraisingDonate;
