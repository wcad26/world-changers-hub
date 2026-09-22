import { useState } from "react";
import { Link, useParams, useNavigate } from "@/lib/router-compat";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassPanels";
import { ArrowLeft, HandCoins, Loader2 } from "lucide-react";
import { usePublicFundraisingCampaign } from "@/hooks/useFundraisingCampaigns";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currencyUtils";

const FundraisingPledge = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: campaign } = usePublicFundraisingCampaign(id);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matched, setMatched] = useState<{ first_name?: string; last_name?: string } | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [otherNames, setOtherNames] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const currency = campaign?.currency_code || "USD";

  const handleProceed = async () => {
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
        setEmail(data.email || "");
      } else {
        setMatched(null);
      }
      setStep(2);
    } catch (e: any) {
      toast.error(t("fr_lookup_error"), { description: e?.message });
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error(t("fr_amount"));
      return;
    }
    if (!matched && !familyName) {
      toast.error(t("fr_family_name"));
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("fundraising-public-pledge", {
        body: {
          campaign_id: id,
          phone,
          family_name: familyName,
          other_names: otherNames,
          email: email || null,
          amount: amt,
          currency_code: currency,
          note: note || null,
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success(t("fr_success_pledge"));
      setStep(3);
    } catch (e: any) {
      toast.error(t("fr_submit_error"), { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const greetMatch = (t("fr_greet_match") || "").replace("{name}", matched?.first_name || "");

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
                <HandCoins className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t("fr_pledge_title")}</h1>
                {campaign && <p className="text-sm text-muted-foreground">{campaign.name}</p>}
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <Label>{t("fr_phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237…" />
                <Button onClick={handleProceed} disabled={checking} className="w-full">
                  {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {checking ? t("fr_checking") : t("fr_proceed")}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm">{matched ? greetMatch : t("fr_greet_new")}</p>
                {!matched && (
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
                      <Label>{t("fr_email")}</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                )}
                <div>
                  <Label>{t("fr_pledge_amount")} ({currency})</Label>
                  <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <Label>{t("fr_note_optional")}</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-wca-purple hover:bg-wca-purple/90">
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("fr_confirm_pledge")}
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="text-4xl">🎉</div>
                <p className="text-lg font-medium">{t("fr_success_pledge")}</p>
                {amount && (
                  <p className="text-muted-foreground">
                    {t("fr_pledged")}: {formatCurrency(Number(amount), currency)}
                  </p>
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

export default FundraisingPledge;
