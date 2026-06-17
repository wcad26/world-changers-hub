import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/ui/GlassPanels";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { usePublicFundraisingCampaign } from "@/hooks/useFundraisingCampaigns";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currencyUtils";

const FundraisingDonate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: campaign } = usePublicFundraisingCampaign(id);

  const [anonymous, setAnonymous] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [matched, setMatched] = useState<any>(null);
  const [pledge, setPledge] = useState<any>(null);
  const [familyName, setFamilyName] = useState("");
  const [otherNames, setOtherNames] = useState("");
  const [amount, setAmount] = useState("");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currency = campaign?.currency_code || "USD";

  const handleProceed = async () => {
    if (anonymous) {
      setStep(2);
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 9) {
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

  const handlePay = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error(t("fr_amount"));
      return;
    }
    if (!anonymous && !matched && !familyName) {
      toast.error(t("fr_family_name"));
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("fundraising-public-donate", {
        body: {
          campaign_id: id,
          phone: anonymous ? null : phone,
          family_name: anonymous ? null : familyName,
          other_names: anonymous ? null : otherNames,
          anonymous,
          amount: amt,
          currency_code: currency,
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success(t("fr_success_donate"));
      setStep(3);
    } catch (e: any) {
      toast.error(t("fr_submit_error"), { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const greetMatch = (t("fr_greet_match_donate") || "").replace("{name}", matched?.first_name || "");

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

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label className="cursor-pointer">{t("fr_anonymous_toggle")}</Label>
              <Switch checked={anonymous} onCheckedChange={(v) => { setAnonymous(v); setStep(1); }} />
            </div>

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
              <div className="space-y-4">
                {!anonymous && (
                  <p className="text-sm">{matched ? greetMatch : t("fr_greet_new_donate")}</p>
                )}

                {pledge && !anonymous && (
                  <div className="rounded-lg border border-wca-purple/30 bg-wca-purple/5 p-4 space-y-2">
                    <div className="text-xs uppercase tracking-wider text-wca-purple font-semibold">{t("fr_my_pledge")}</div>
                    <div className="flex justify-between text-sm">
                      <span>{t("fr_pledged")}</span>
                      <span className="font-medium">{formatCurrency(pledge.amount, pledge.currency_code)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("fr_redeemed")}</span>
                      <span className="font-medium">{formatCurrency(pledge.paid, pledge.currency_code)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-wca-purple h-2 rounded-full" style={{ width: `${Math.min(100, (pledge.paid / pledge.amount) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("fr_remaining")}: {formatCurrency(pledge.remaining, pledge.currency_code)}</span>
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
                  </div>
                )}

                <div>
                  <Label>{t("fr_amount")} ({currency})</Label>
                  <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>

                <Button onClick={handlePay} disabled={submitting} className="w-full bg-wca-purple hover:bg-wca-purple/90">
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("fr_pay_now")}
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="text-4xl">💜</div>
                <p className="text-lg font-medium">{t("fr_success_donate")}</p>
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
