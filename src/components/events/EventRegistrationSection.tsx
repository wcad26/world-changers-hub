import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle, Ticket, UserPlus } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { format, isFuture } from "date-fns";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useLanguage } from "@/hooks/useLanguage";
import { EventPreRegistrationDialog } from "./EventPreRegistrationDialog";

interface EventRegistrationSectionProps {
  event: Event;
}

export function EventRegistrationSection({ event }: EventRegistrationSectionProps) {
  const isUpcoming = isFuture(new Date(event.start_datetime));
  const canRegister = isUpcoming && event.status !== "Cancelled" && event.status !== "Completed";
  const { data: currencies } = useCurrencies();
  const eventCurrency = currencies?.find(c => c.code === event.cost_currency_code);
  const { t } = useLanguage();
  const [preRegOpen, setPreRegOpen] = useState(false);
  const showPreReg = canRegister && !!(event as any).is_special && !!(event as any).requires_pre_registration;

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--accent)/0.2),transparent_50%)]" />
      
      <div className="container-custom relative z-10">
        {/* CTA Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-bold mb-4 text-foreground">{t('readyToJoin')}</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('reserveSpot')}
          </p>
        </div>

        {canRegister ? (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="grid md:grid-cols-2 gap-0 rounded-lg overflow-hidden shadow-xl">
              {/* Left Side - Violet Background with Cost */}
              <div className="bg-[#542a8f] p-12 flex flex-col items-center justify-center text-white">
                <Ticket className="w-16 h-16 mb-6" />
                <h3 className="text-3xl font-bold mb-4">{t('eventCost')}</h3>
                {!event.cost || event.cost === 0 ? (
                  <p className="text-5xl font-bold">{t('free')}</p>
                ) : (
                  <div className="text-center">
                    <p className="text-5xl font-bold">
                      {eventCurrency?.symbol || '$'} {event.cost?.toFixed(eventCurrency?.decimal_places || 2)}
                    </p>
                    <p className="text-sm opacity-90 mt-3">{eventCurrency?.name || 'USD'}</p>
                  </div>
                )}
              </div>

              {/* Right Side - White Background with Buttons */}
              <div className="bg-white p-12 flex flex-col justify-center space-y-6">
                {showPreReg && (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-lg font-semibold transition-all hover:scale-105"
                    asChild
                  >
                    <Link to={`/events/${(event as any).slug || event.id}/register`}>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Reserve your spot
                    </Link>
                  </Button>
                )}
                {event.registration_url && (
                  <Button 
                    className="w-full bg-[#542a8f] hover:bg-[#542a8f]/90 text-white py-7 text-lg font-semibold transition-all hover:scale-105"
                    onClick={() => window.open(event.registration_url ?? undefined, '_blank')}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    {t('registerForEvent')}
                  </Button>
                )}
                
                <Button 
                  className="w-full bg-[#35adaf] hover:bg-[#35adaf]/90 text-white py-7 text-lg font-semibold transition-all hover:scale-105"
                  onClick={() => {
                    if (event.whatsapp_contact) {
                      const phoneNumber = event.whatsapp_contact.replace(/[^0-9]/g, '');
                      window.open(`https://wa.me/${phoneNumber}`, '_blank');
                    }
                  }}
                  disabled={!event.whatsapp_contact}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {t('contactUs')}
                </Button>
                
                {!event.whatsapp_contact && (
                  <p className="text-xs text-muted-foreground text-center">
                    {t('whatsappNotAvailable')}
                  </p>
                )}
                
                <p className="text-sm text-muted-foreground text-center mt-4">
                  {event.capacity ? `${event.capacity} ${t('spotsAvailable')}` : t('unlimited') + ' capacity'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel-hero p-8 md:p-12 max-w-2xl mx-auto text-center animate-fade-in-up">
            <Calendar className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-fluid-3xl font-bold mb-4">
              {event.status === "Completed" ? t('eventCompleted') : t('registrationUnavailable')}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {event.status === "Completed"
                ? t('eventCompletedDesc')
                : t('registrationUnavailableDesc')}
            </p>
            <Button 
              size="lg" 
              className="btn-soft text-lg px-8 py-6"
              asChild
            >
              <Link to="/events">{t('viewAllEvents')}</Link>
            </Button>
          </div>
        )}
      </div>
      <EventPreRegistrationDialog open={preRegOpen} onOpenChange={setPreRegOpen} event={event} />
    </section>
  );
}
