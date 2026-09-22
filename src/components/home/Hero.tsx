import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '../ui/GlassPanels';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import Autoplay from 'embla-carousel-autoplay';
export default function Hero() {
  const {
    data: contentData
  } = useHomepageContent();
  const heroData = contentData?.content as any;

  // Default slides if no content data
  const defaultSlides = [{
    id: '1',
    image: '/lovable-uploads/366be6c2-b04b-4b05-a73a-cff2d9452c69.png',
    title: 'Welcome to World Christian Assembly',
    subtitle: 'Building Tomorrow\'s Leaders Today',
    description: 'Empowering communities through spiritual growth, leadership development, and transformative service worldwide.',
    primaryButton: {
      text: 'Learn More',
      link: '/about'
    },
    secondaryButton: {
      text: 'Find a Location',
      link: '/locations'
    }
  }];
  const slides = heroData?.hero?.slides || defaultSlides;
  const tagline = heroData?.hero?.tagline || 'Join our community of purpose-driven leaders';
  return <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden border-b border-border/70 bg-background py-16 sm:py-20 lg:py-24">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_34%),radial-gradient(circle_at_85%_70%,color-mix(in_oklab,var(--secondary)_14%,transparent),transparent_32%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <div className="container-custom relative z-10">
        <Carousel plugins={[Autoplay({
        delay: 5000
      })]} className="w-full" opts={{
        align: "start",
        loop: true
      }}>
          <CarouselContent>
            {slides.map((slide: any) => <CarouselItem key={slide.id}>
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
                  <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
                    <div className="inline-flex rounded-sm border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {slide.subtitle}
                    </div>
                    <h1 className="max-w-4xl text-balance font-heading text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
                      {slide.title}
                    </h1>
                    <p className="mx-auto max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                      {slide.description}
                    </p>
                    <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                      <Link to={slide.primaryButton.link}>
                        <Button size="lg" className="w-full px-7 sm:w-auto">
                          {slide.primaryButton.text}
                          <ArrowRight size={20} className="ml-2" />
                        </Button>
                      </Link>
                      <Link to={slide.secondaryButton.link}>
                        <Button variant="outline" size="lg" className="w-full px-7 sm:w-auto">
                          {slide.secondaryButton.text}
                          <MapPin size={20} className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex justify-center lg:col-span-5 lg:justify-end">
                    <GlassPanel className="w-full max-w-md p-3 sm:p-4">
                      <div className="text-center space-y-4">
                        <div className="h-56 w-full overflow-hidden rounded-sm bg-muted sm:h-72">
                          <img src={slide.image} alt="Community gathering" className="w-full h-full object-contain" loading="lazy" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{tagline}</h3>
                          <p className="mb-4 text-sm text-muted-foreground">
                            Connect with like-minded individuals and grow together in faith and purpose.
                          </p>
                          <Link to="/events" className="text-sm font-semibold text-primary hover:text-primary/75">
                            View Upcoming Events →
                          </Link>
                        </div>
                      </div>
                    </GlassPanel>
                  </div>
                </div>
              </CarouselItem>)}
          </CarouselContent>
          
          {slides.length > 1 && <>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </>}
        </Carousel>
      </div>
    </section>;
}