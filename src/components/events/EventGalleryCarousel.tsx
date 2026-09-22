import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Event } from "@/hooks/useEvents";
import { useEventGalleryImages } from "@/hooks/useEventGalleryImages";
import { useLanguage } from "@/hooks/useLanguage";

interface EventGalleryCarouselProps {
  event: Event;
}

export function EventGalleryCarousel({ event }: EventGalleryCarouselProps) {
  const { language, t } = useLanguage();
  const { data: galleryImages, isLoading } = useEventGalleryImages(event.id, language);

  if (isLoading) {
    return (
      <section className="border-t border-event-border bg-event-background py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Event Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-event-elevated animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!galleryImages || galleryImages.length === 0) return null;

  return (
    <section className="border-t border-event-border bg-event-background py-16 md:py-20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="font-sora text-3xl font-bold text-event-foreground md:text-4xl">
            {t('eventGallery')}
          </h2>
          <p className="mt-3 text-event-muted max-w-2xl mx-auto">
            {t('eventGalleryDescription')}
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
              stopOnInteraction: false,
              stopOnMouseEnter: false,
            }),
          ]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {galleryImages.map((galleryImage, index) => (
              <CarouselItem key={galleryImage.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-2">
                  <div className="overflow-hidden rounded-lg border border-event-border bg-event-surface group">
                    <img
                      src={galleryImage.image_url}
                      alt={`${event.name} gallery image ${index + 1}`}
                        className="w-full h-56 sm:h-64 md:h-72 object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden border-event-border bg-event-surface text-event-foreground hover:bg-event-elevated md:flex" />
          <CarouselNext className="hidden border-event-border bg-event-surface text-event-foreground hover:bg-event-elevated md:flex" />
        </Carousel>
      </div>
    </section>
  );
}
