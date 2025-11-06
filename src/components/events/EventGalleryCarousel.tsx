import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Event } from "@/hooks/useEvents";
import { useEventGalleryImages } from "@/hooks/useEventGalleryImages";

interface EventGalleryCarouselProps {
  event: Event;
}

export function EventGalleryCarousel({ event }: EventGalleryCarouselProps) {
  const { data: galleryImages, isLoading } = useEventGalleryImages(event.id);

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Event Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!galleryImages || galleryImages.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Event Gallery
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Take a look at what makes this event special
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {galleryImages.map((galleryImage, index) => (
              <CarouselItem key={galleryImage.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-2">
                  <div className="glass-panel-soft overflow-hidden group cursor-pointer">
                    <img
                      src={galleryImage.image_url}
                      alt={`${event.name} gallery image ${index + 1}`}
                      className="w-full h-48 sm:h-56 md:h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
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
