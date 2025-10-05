import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Users } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { format, isFuture } from "date-fns";

interface EventRegistrationSectionProps {
  event: Event;
}

export function EventRegistrationSection({ event }: EventRegistrationSectionProps) {
  const isUpcoming = isFuture(new Date(event.start_datetime));
  const canRegister = isUpcoming && event.status !== "Cancelled" && event.status !== "Completed";

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--accent)/0.2),transparent_50%)]" />
      
      <div className="container-custom relative z-10">
        <div className="glass-panel-hero p-8 md:p-12 lg:p-16 max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6 animate-float">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {canRegister ? "Register for This Event" : "Event Information"}
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {canRegister 
                ? "Don't miss out on this amazing opportunity. Secure your spot today!"
                : event.status === "Completed"
                ? "This event has already taken place. Check out our upcoming events!"
                : "Registration is currently not available for this event."
              }
            </p>
          </div>

          {canRegister && (
            <>
              {/* Event Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel-soft p-6">
                  <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Event Date</p>
                  <p className="font-semibold">{format(new Date(event.start_datetime), "MMM dd, yyyy")}</p>
                </div>
                
                <div className="glass-panel-soft p-6">
                  <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Available Spots</p>
                  <p className="font-semibold">{event.capacity ? `${event.capacity} seats` : "Unlimited"}</p>
                </div>
                
                <div className="glass-panel-soft p-6">
                  <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold text-primary">Open for Registration</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="btn-soft text-lg px-8 py-6 hover:scale-105 transition-transform"
                >
                  Register Now
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="btn-soft-outline text-lg px-8 py-6 hover:scale-105 transition-transform"
                >
                  Add to Calendar
                </Button>
              </div>
            </>
          )}

          {!canRegister && (
            <Button 
              size="lg" 
              className="btn-soft text-lg px-8 py-6"
              asChild
            >
              <a href="/events">View All Events</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
