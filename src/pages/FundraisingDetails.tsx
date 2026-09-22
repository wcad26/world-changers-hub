import { Link, useParams, useNavigate } from "@/lib/router-compat";
import { useSuspenseQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassPanels";
import { ArrowLeft, Calendar, Heart, HandCoins, PiggyBank, Target, Users } from "lucide-react";
import { publicCampaignDonationsQueryOptions, publicFundraisingCampaignQueryOptions } from "@/lib/public-site.functions";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/utils/currencyUtils";
import { format } from "date-fns";

const FundraisingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: campaign } = useSuspenseQuery(publicFundraisingCampaignQueryOptions(id));
  const { data: donations } = useSuspenseQuery(publicCampaignDonationsQueryOptions(id, 10));

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{t("fr_no_projects")}</p>
          <Button asChild><Link to="/fundraising">{t("fr_back")}</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const goalMajor = Number(campaign.goal || 0) / 100;
  const raisedMajor = Number(campaign.raised || 0) / 100;
  const pct = goalMajor > 0 ? Math.min(100, Math.round((raisedMajor / goalMajor) * 100)) : 0;
  const currency = campaign.currency_code || "USD";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="flex-1 pb-16">
        <div className="container-custom py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("fr_back")}
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <GlassCard className="overflow-hidden">
                <div className="relative h-72 bg-muted">
                  {campaign.image_url ? (
                    <img src={campaign.image_url} alt={campaign.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <PiggyBank className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-medium ${campaign.status === "Active" ? "bg-green-500" : campaign.status === "Completed" ? "bg-blue-500" : "bg-amber-500"}`}>
                      {campaign.status === "Active" ? t("fr_status_active") : campaign.status === "Completed" ? t("fr_status_completed") : campaign.status}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{campaign.name}</h1>
                  {(campaign as any).region?.name && (
                    <p className="text-sm text-muted-foreground mb-4">{(campaign as any).region.name}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {campaign.start_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-wca-purple" />
                        <span>{format(new Date(campaign.start_date), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {campaign.end_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-wca-purple" />
                        <span>{format(new Date(campaign.end_date), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-wca-purple" />
                      <span>{formatCurrency(goalMajor, currency)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-wca-purple" />
                      <span>{donations.length} {t("fr_supporters")}</span>
                    </div>
                  </div>

                  <div className="mb-2 flex justify-between text-sm">
                    <span>{t("fr_progress")}</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-wca-purple to-wca-violet h-3 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-sm mt-1 text-muted-foreground">
                    <span>{formatCurrency(raisedMajor, currency)} {t("fr_raised")}</span>
                    <span>{t("fr_goal")}: {formatCurrency(goalMajor, currency)}</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-3">{t("fr_about")}</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{campaign.description}</p>
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-3">{t("fr_recent_supporters")}</h2>
                {donations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("fr_no_supporters")}</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {donations.map((d: any) => (
                      <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                        <span>{d.anonymous ? t("fr_anonymous") : (d.donor_name || t("fr_anonymous"))}</span>
                        <span className="font-medium">{formatCurrency(Number(d.amount) / 100, d.currency_code || currency)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassCard>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 self-start">
              <GlassCard className="p-6 space-y-3">
                <h3 className="text-lg font-semibold">{t("fr_donate")} / {t("fr_pledge")}</h3>
                <p className="text-sm text-muted-foreground">{t("fr_subtitle")}</p>
                <Button asChild className="w-full bg-wca-purple hover:bg-wca-purple/90">
                  <Link to={`/fundraising/${campaign.id}/pledge`}>
                    <HandCoins className="h-4 w-4 mr-2" /> {t("fr_pledge")}
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link to={`/fundraising/${campaign.id}/donate`}>
                    <Heart className="h-4 w-4 mr-2" /> {t("fr_donate")}
                  </Link>
                </Button>
              </GlassCard>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FundraisingDetails;
