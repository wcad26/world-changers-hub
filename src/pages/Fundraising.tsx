import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassPanels";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Target, Search, Heart, Info, PiggyBank } from "lucide-react";
import { usePublicFundraisingCampaigns } from "@/hooks/useFundraisingCampaigns";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/utils/currencyUtils";
import { format } from "date-fns";

const Fundraising = () => {
  const { t } = useLanguage();
  const { data: campaigns = [], isLoading } = usePublicFundraisingCampaigns();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "Active" | "Completed">("all");

  const filtered = useMemo(() => {
    return campaigns.filter((c: any) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !(c.description || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (status !== "all" && c.status !== status) return false;
      return true;
    });
  }, [campaigns, search, status]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="flex-grow pt-0 pb-16">
        <section className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 py-[30px]">
          <div className="container-custom">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  {t("fr_title")}
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                {t("fr_subtitle")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("fr_search")}
                  className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-800 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-wca-purple"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {(["all", "Active", "Completed"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatus(s)}
                  >
                    {s === "all" ? t("fr_all_status") : s === "Active" ? t("fr_status_active") : t("fr_status_completed")}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-muted-foreground py-20">…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-20 flex flex-col items-center gap-3">
                <PiggyBank className="h-10 w-10 opacity-50" />
                <p>{t("fr_no_projects")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((c: any) => {
                  const goalMajor = Number(c.goal || 0) / 100;
                  const raisedMajor = Number(c.raised || 0) / 100;
                  const pct = goalMajor > 0 ? Math.min(100, Math.round((raisedMajor / goalMajor) * 100)) : 0;
                  const currency = c.currency_code || "USD";
                  return (
                    <GlassCard key={c.id} className="overflow-hidden flex flex-col">
                      <div className="relative h-44 bg-muted">
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <PiggyBank className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-medium ${c.status === "Active" ? "bg-green-500" : c.status === "Completed" ? "bg-blue-500" : "bg-amber-500"}`}>
                            {c.status === "Active" ? t("fr_status_active") : c.status === "Completed" ? t("fr_status_completed") : c.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        {c.region?.name && (
                          <span className="inline-block self-start px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground mb-2">{c.region.name}</span>
                        )}
                        <h3 className="text-lg font-bold mb-2 line-clamp-1">{c.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{c.description}</p>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{t("fr_progress")}</span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-wca-purple to-wca-violet h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                            <span>{formatCurrency(raisedMajor, currency)}</span>
                            <span>{t("fr_goal")}: {formatCurrency(goalMajor, currency)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          {c.end_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {format(new Date(c.end_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <Button asChild className="flex-1 bg-wca-purple hover:bg-wca-purple/90">
                            <Link to={`/fundraising/${c.id}`}>
                              <Info size={16} className="mr-1" />
                              {t("fr_details")}
                            </Link>
                          </Button>
                          <Button asChild variant="secondary" className="flex-1">
                            <Link to={`/fundraising/${c.id}/donate`}>
                              <Heart size={16} className="mr-1" />
                              {t("fr_donate")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Fundraising;
