import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
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
    <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            More Events You Might Like
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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
                <Link to={`/events/${event.id}`}>
                  <Card className="card-soft h-full hover:scale-105 transition-all duration-300 overflow-hidden group">
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
                          <Badge className="bg-gradient-to-r from-accent to-primary text-white">
                            Featured
                          </Badge>
                        )}
                        {event.category && (
                          <Badge variant="outline">{event.category}</Badge>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {event.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
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
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
}
