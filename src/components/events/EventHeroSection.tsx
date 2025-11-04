import React from "react";
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isPast, isFuture } from "date-fns";
import { Event } from "@/hooks/useEvents";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useEventImages } from "@/hooks/useEventImages";

interface EventHeroSectionProps {
  event: Event;
}

export function EventHeroSection({ event }: EventHeroSectionProps) {
  const { data: eventImages, isLoading: imagesLoading } = useEventImages(event.id);
  
  const getStatusBadge = () => {
    const eventDate = new Date(event.start_datetime);
    
    if (event.status === "Completed") {
      return <Badge className="bg-muted text-muted-foreground">Completed</Badge>;
    }
    if (event.status === "Cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (isToday(eventDate)) {
      return <Badge className="bg-gradient-to-r from-primary to-accent text-white animate-glow">Today</Badge>;
    }
    if (isFuture(eventDate)) {
      return <Badge className="bg-primary/20 text-primary border border-primary/30">Upcoming</Badge>;
    }
    if (isPast(eventDate)) {
      return <Badge variant="secondary">Past Event</Badge>;
    }
    return null;
  };

  // Priority: Use images from event_images table, fallback to single image_url
  const heroImages = React.useMemo(() => {
    if (eventImages && eventImages.length > 0) {
      return eventImages.map(img => img.image_url);
    }
    if (event.image_url) {
      return [event.image_url];
    }
    return [];
  }, [eventImages, event.image_url]);
  
  const hasImages = heroImages.length > 0;
  const hasMultipleImages = heroImages.length > 1;

  return (
    <div className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
      {/* Background Image Carousel or Gradient */}
      {hasImages ? (
        <Carousel
          opts={{
            loop: true,
            align: "center",
          }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: false,
            }),
          ]}
          className="absolute inset-0 group"
        >
          <CarouselContent>
            {heroImages.map((image, index) => (
              <CarouselItem key={index}>
                <div 
                  className="h-[90vh] min-h-[600px] md:min-h-[600px] sm:min-h-[500px] bg-cover bg-center transition-transform duration-700"
                  style={{
                    backgroundImage: `url(${image})`,
                  }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation Controls - Show only if multiple images */}
          {hasMultipleImages && (
            <>
              <CarouselPrevious className="left-4 md:left-8 bg-black/30 hover:bg-black/60 border-none text-white h-12 w-12 hidden md:flex transition-all opacity-0 group-hover:opacity-100" />
              <CarouselNext className="right-4 md:right-8 bg-black/30 hover:bg-black/60 border-none text-white h-12 w-12 hidden md:flex transition-all opacity-0 group-hover:opacity-100" />
              
              {/* Dot Indicators */}
              <div className="absolute bottom-24 md:bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {heroImages.map((_, idx) => (
                  <div
                    key={idx}
                    className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white/50 hover:bg-white/80 transition-all cursor-pointer"
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </Carousel>
      ) : (
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
          }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-12 md:pb-20">
        <div className="container-custom">
          {/* Badges */}
          <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-up">
            {event.is_featured && (
              <Badge className="bg-gradient-to-r from-accent to-primary text-white px-4 py-1.5">
                ⭐ Featured Event
              </Badge>
            )}
            {getStatusBadge()}
            {event.category && (
              <Badge variant="outline" className="glass-panel-soft border-primary/30">
                {event.category}
              </Badge>
            )}
          </div>

          {/* Event Title */}
          <h1 className="text-fluid-4xl md:text-fluid-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in-up leading-tight">
            {event.name}
          </h1>
        </div>
      </div>
    </div>
  );
}
