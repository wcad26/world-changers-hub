import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    image: '/public/lovable-uploads/366be6c2-b04b-4b05-a73a-cff2d9452c69.png',
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
  return <section className="relative min-h-screen flex items-center overflow-hidden -mt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-wca-purple/10 via-transparent to-wca-teal/10 opacity-50"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-wca-purple/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-wca-teal/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-wca-violet/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="container-custom relative z-10 pt-20 md:pt-24 lg:pt-16">
        <Carousel plugins={[Autoplay({
        delay: 5000
      })]} className="w-full" opts={{
        align: "start",
        loop: true
      }}>
          <CarouselContent>
            {slides.map((slide: any) => <CarouselItem key={slide.id}>
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-center">
                  <div className="lg:col-span-6 space-y-6 text-center lg:text-left animate-fade-up">
                    <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm">
                      {slide.subtitle}
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                      <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                        {slide.title}
                      </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                      {slide.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                      <Link to={slide.primaryButton.link}>
                        <Button size="lg" className="bg-gradient-to-r from-wca-purple to-wca-violet hover:from-wca-purple/90 hover:to-wca-violet/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                          {slide.primaryButton.text}
                          <ArrowRight size={20} className="ml-2" />
                        </Button>
                      </Link>
                      <Link to={slide.secondaryButton.link}>
                        <Button variant="outline" size="lg" className="border-2 border-wca-purple/30 bg-white/10 backdrop-blur-sm text-wca-purple hover:bg-wca-purple hover:text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                          {slide.secondaryButton.text}
                          <MapPin size={20} className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-4 flex justify-center lg:justify-end animate-fade-up animation-delay-300">
                    <GlassPanel className="p-6 max-w-sm">
                      <div className="text-center space-y-4">
                        <div className="w-full h-48 bg-gradient-to-br from-wca-purple/20 to-wca-teal/20 rounded-lg overflow-hidden">
                          <img src={slide.image} alt="Community gathering" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{tagline}</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                            Connect with like-minded individuals and grow together in faith and purpose.
                          </p>
                          <Link to="/events" className="text-wca-purple hover:text-wca-violet font-medium text-sm">
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