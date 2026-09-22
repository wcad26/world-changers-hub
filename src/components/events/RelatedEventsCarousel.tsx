import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "@/lib/router-compat";
import { useFeaturedEvents } from "@/hooks/useEvents";

interface RelatedEventsCarouselProps {
  currentEventId: string;
}

export function RelatedEventsCarousel({ currentEventId }: RelatedEventsCarouselProps) {
  const { data: events, isLoading } = useFeaturedEvents();
  
  // Filter out current event and limit to 6
  const relatedEvents = events?.filter(e => e.id !== currentEventId).slice(0, 6) || [];

  if (isLoading || relatedEvents.length === 0) return null;

  return (
    <section className="border-t border-event-border bg-event-surface py-16 md:py-20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="font-sora text-3xl font-bold text-event-foreground md:text-4xl">
            More Events You Might Like
          </h2>
          <p className="mt-3 text-event-muted max-w-2xl mx-auto">
            Discover other exciting events happening soon
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {relatedEvents.map((event) => (
              <CarouselItem key={event.id} className="md:basis-1/2 lg:basis-1/3">
                <Link to={`/events/${event.slug || event.id}`}>
                  <Card className="h-full overflow-hidden rounded-lg border-event-border bg-event-background text-event-foreground transition-colors group hover:border-primary/60">
                    {event.image_url && (
                      <div className="overflow-hidden h-48">
                        <img
                          src={event.image_url}
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        {event.is_featured && (
                          <Badge className="event-gradient text-primary-foreground">
                            Featured
                          </Badge>
                        )}
                        {event.category && (
                          <Badge variant="outline" className="border-event-border text-event-muted">{event.category}</Badge>
                        )}
                      </div>
                      <CardTitle className="font-sora line-clamp-2 group-hover:text-accent transition-colors">
                        {event.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-event-muted">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(event.start_datetime), "PPP")}
                        </div>
                        {event.location_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="truncate">{event.location_name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden border-event-border bg-event-background text-event-foreground hover:bg-event-elevated md:flex" />
          <CarouselNext className="hidden border-event-border bg-event-background text-event-foreground hover:bg-event-elevated md:flex" />
        </Carousel>
      </div>
    </section>
  );
}
