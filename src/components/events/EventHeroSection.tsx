import React from "react";
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
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
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
                  className="h-[70vh] min-h-[500px] bg-cover bg-center transition-transform duration-700"
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
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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
      
      {/* Transparent Brand Color Overlay for smooth blending */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7C3AED]/30 to-[#7C3AED]/60 pointer-events-none z-10"
        aria-hidden="true"
      />
    </div>
  );
}
