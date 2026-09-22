import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format, isFuture, isToday } from "date-fns";
import Autoplay from "embla-carousel-autoplay";
import { CalendarDays, Clock3, MapPin, MessageCircle, Share2, Sparkles, UserPlus } from "lucide-react";
import type { Event } from "@/hooks/useEvents";
import { useEventImages } from "@/hooks/useEventImages";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface EventExperienceHeaderProps {
  event: Event;
}

export function EventExperienceHeader({ event }: EventExperienceHeaderProps) {
  const { language, localizedField, t } = useLanguage();
  const { data: eventImages } = useEventImages(event.id, language);
  const eventName = localizedField(event.name, event.name_fr);
  const location = localizedField(event.location_name, event.location_name_fr);
  const isUpcoming = isFuture(new Date(event.start_datetime));
  const canRegister = isUpcoming && event.status !== "Cancelled" && event.status !== "Completed";
  const registrationPath = `/events/${event.slug || event.id}/register`;
  const feedbackPath = `/events/${event.slug || event.id}/feedback`;

  const images = useMemo(() => {
    if (eventImages?.length) return eventImages.map((image) => image.image_url);
    if (language === "fr" && event.image_url_fr) return [event.image_url_fr];
    return event.image_url ? [event.image_url] : [];
  }, [event.image_url, event.image_url_fr, eventImages, language]);

  const shareEvent = async () => {
    const payload = { title: eventName, url: window.location.href };
    if (navigator.share) {
      await navigator.share(payload).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  };

  const openWhatsApp = () => {
    if (!event.whatsapp_contact) return;
    window.open(`https://wa.me/${event.whatsapp_contact.replace(/[^0-9]/g, "")}`, "_blank", "noopener,noreferrer");
  };

  const statusLabel = event.status === "Completed"
    ? t("completed")
    : event.status === "Cancelled"
      ? t("cancelled")
      : isToday(new Date(event.start_datetime))
        ? t("today")
        : isUpcoming ? t("upcoming") : t("pastEvent");

  return (
    <header className="relative min-h-[650px] overflow-hidden md:min-h-[720px] lg:min-h-[760px]">
      {images.length > 0 ? (
        <Carousel
          opts={{ loop: true }}
          plugins={images.length > 1 ? [Autoplay({ delay: 5500, stopOnInteraction: false })] : []}
          className="absolute inset-0"
        >
          <CarouselContent className="h-full ml-0">
            {images.map((image, index) => (
              <CarouselItem key={`${image}-${index}`} className="h-[650px] pl-0 md:h-[720px] lg:h-[760px]">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-[1400ms] motion-safe:hover:scale-[1.02]"
                  style={{ backgroundImage: `url(${image})` }}
                  role="img"
                  aria-label={`${eventName} ${language === "fr" ? "image" : "event image"} ${index + 1}`}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-4 top-1/2 z-20 hidden border-event-border bg-event-surface/80 text-event-foreground hover:bg-event-elevated md:flex" />
              <CarouselNext className="right-4 top-1/2 z-20 hidden border-event-border bg-event-surface/80 text-event-foreground hover:bg-event-elevated md:flex" />
            </>
          )}
        </Carousel>
      ) : (
        <div className="event-gradient absolute inset-0" />
      )}
      <div className="event-hero-overlay absolute inset-0 z-10" />

      <div className="container-custom relative z-20 flex min-h-[650px] items-end pb-10 pt-20 md:min-h-[720px] md:pb-14 lg:min-h-[760px] lg:pb-16">
        <div className="w-full max-w-5xl">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge className="border border-accent/40 bg-accent/90 text-accent-foreground">
              {statusLabel}
            </Badge>
            {event.category && <Badge className="border-event-border bg-event-surface/70 text-event-foreground backdrop-blur-md">{event.category}</Badge>}
            {event.is_featured && (
              <Badge className="border-primary/40 bg-primary/80 text-primary-foreground backdrop-blur-md">
                <Sparkles className="mr-1 h-3 w-3" /> {t("featured")}
              </Badge>
            )}
          </div>

          <h1 className="max-w-4xl font-sora text-4xl font-bold leading-tight text-event-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            {eventName}
          </h1>

          <div className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex min-w-0 items-center gap-3 border-l-2 border-accent pl-3 text-event-foreground">
              <CalendarDays className="h-5 w-5 shrink-0 text-accent" />
              <span className="text-sm font-semibold">{format(new Date(event.start_datetime), "dd/MM/yyyy")}</span>
            </div>
            <div className="flex min-w-0 items-center gap-3 border-l-2 border-primary pl-3 text-event-foreground">
              <Clock3 className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm font-semibold">{format(new Date(event.start_datetime), "h:mm a")}</span>
            </div>
            <div className="flex min-w-0 items-center gap-3 border-l-2 border-accent pl-3 text-event-foreground sm:col-span-2 lg:col-span-1">
              <MapPin className="h-5 w-5 shrink-0 text-accent" />
              <span className="truncate text-sm font-semibold">{location || "TBA"}</span>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {canRegister && event.is_special && event.requires_pre_registration && (
              <Button asChild size="lg" className="h-12 px-6 font-semibold shadow-lg">
                <Link to={registrationPath}><UserPlus />{language === "fr" ? "Se préinscrire" : "Pre-register"}</Link>
              </Button>
            )}
            {canRegister && event.registration_url && (
              <Button asChild size="lg" className="h-12 px-6 font-semibold">
                <a href={event.registration_url} target="_blank" rel="noopener noreferrer"><CalendarDays />{t("registerForEvent")}</a>
              </Button>
            )}
            {!canRegister && (
              <Button asChild size="lg" className="h-12 px-6 font-semibold">
                <Link to={feedbackPath}>{language === "fr" ? "Partager vos impressions" : "Share feedback"}</Link>
              </Button>
            )}
            {event.whatsapp_contact && (
              <Button type="button" variant="outline" size="lg" onClick={openWhatsApp} className="h-12 border-event-border bg-event-surface/70 px-5 text-event-foreground backdrop-blur-md hover:bg-event-elevated hover:text-event-foreground">
                <MessageCircle />{t("contactUs")}
              </Button>
            )}
            <Button type="button" variant="outline" size="lg" onClick={shareEvent} aria-label={language === "fr" ? "Partager cet événement" : "Share this event"} className="h-12 border-event-border bg-event-surface/70 px-5 text-event-foreground backdrop-blur-md hover:bg-event-elevated hover:text-event-foreground">
              <Share2 />{language === "fr" ? "Partager" : "Share Event"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}