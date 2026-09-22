import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { useLanguage } from "@/hooks/useLanguage";

const linkClass = "text-event-muted transition-colors hover:text-event-foreground";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="border-t border-event-border bg-event-background text-event-foreground">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_.8fr_.9fr_1.1fr] lg:gap-12">
          <div>
            <Link to="/" className="inline-flex"><img src="/lovable-uploads/366be6c2-b04b-4b05-a73a-cff2d9452c69.png" alt="World Changers Association" className="h-20 w-auto brightness-0 invert" /></Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-event-muted">{t("footerMission")}</p>
            <div className="mt-6 flex gap-2">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => <a key={index} href="#" className="grid h-9 w-9 place-items-center rounded-md border border-event-border text-event-muted transition-colors hover:border-secondary hover:text-secondary" aria-label={["Facebook", "Twitter", "Instagram", "YouTube"][index]}><Icon className="h-4 w-4" /></a>)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-event-foreground">{t("quickLinks")}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link to="/about" className={linkClass}>{t("aboutUs")}</Link></li>
              <li><Link to="/locations" className={linkClass}>{t("ourLocations")}</Link></li>
              <li><Link to="/events" className={linkClass}>{t("events")}</Link></li>
              <li><Link to="/media" className={linkClass}>{t("mediaSermons")}</Link></li>
              <li><Link to="/store" className={linkClass}>{t("storeLibrary")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-event-foreground">{t("resources")}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link to="/blog" className={linkClass}>{t("newsBlog")}</Link></li>
              <li><Link to="/counseling" className={linkClass}>{t("counselling")}</Link></li>
              <li><Link to="/fundraising" className={linkClass}>{t("fundraisingProjects")}</Link></li>
              <li><Link to="/privacy" className={linkClass}>{t("privacyPolicy")}</Link></li>
              <li><Link to="/terms" className={linkClass}>{t("termsOfService")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-event-foreground">{t("contactUs")}</h3>
            <ul className="mt-5 space-y-4 text-sm text-event-muted">
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>Douala, Yaounde, Buea, Kaélé,<br />North America &amp; Europe</span></li>
              <li><a href="mailto:info@wcaglobal.org" className="flex items-center gap-3 transition-colors hover:text-event-foreground"><Mail className="h-4 w-4 text-secondary" />info@wcaglobal.org</a></li>
              <li><a href="tel:+237690634860" className="flex items-center gap-3 transition-colors hover:text-event-foreground"><Phone className="h-4 w-4 text-secondary" />+237 690 63 48 60</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-event-border pt-7 text-xs text-event-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} World Changers Association.</p>
          <p>See the Future · Take a Step · Change your World</p>
        </div>
      </div>
    </footer>
  );
}