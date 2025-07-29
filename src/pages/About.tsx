import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { useGlobalContent, GlobalContentData } from '@/hooks/useGlobalContent';
import { renderIcon } from '@/utils/iconMapping';

const About = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;
  const [openDetails, setOpenDetails] = useState<Record<number, boolean>>({});
  
  const { data: content, isLoading } = useGlobalContent('about_us');

  const toggleDetails = (index: number) => {
    setOpenDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Use database content directly
  const pageContent = content?.content as unknown as GlobalContentData;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Show loading state while content is being fetched
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-wca-purple mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading content...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Don't render if no content is available
  if (!pageContent) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Content Not Available</h1>
            <p className="text-gray-600 dark:text-gray-300">The About Us content is not yet configured.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-0 py-0">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 animate-fade-up">
                {/* Dynamic subtitle from first slide */}
                <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                  {pageContent.hero?.slides?.[0]?.subtitle || "About Us"}
                </div>
                
                {/* Dynamic title from first slide */}
                <h1 className="font-bold mb-4">
                  <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                    {pageContent.hero?.slides?.[0]?.title || "Our Story and Vision for Change"}
                  </span>
                </h1>
                
                {/* Dynamic description from first slide */}
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 text-justify">
                  {pageContent.hero?.slides?.[0]?.description || "World Changers Association (WCA) is dedicated to building a network of fellowships that are spiritually, intellectually, and economically empowered to rescue the lost, transform them into effective leaders that will bring positive change in the economy, legislature, judiciary, and administration of nations."}
                </p>
                
                {/* Dynamic mission points */}
                {pageContent.hero?.mission_points && pageContent.hero.mission_points.length > 0 && (
                  <div className="space-y-4">
                    {pageContent.hero.mission_points.map((point, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-wca-teal mr-3 mt-1 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="order-1 lg:order-2 flex justify-center animate-fade-in">
                <div className="relative">
                  {/* Hero slides carousel */}
                  {pageContent.hero?.slides && pageContent.hero.slides.length > 0 ? (
                    <Carousel className="w-full max-w-2xl">
                      <CarouselContent>
                        {pageContent.hero.slides.map((slide, index) => (
                          <CarouselItem key={slide.id || index}>
                            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
                              <img 
                                src={slide.image} 
                                alt={slide.title || `Slide ${index + 1}`} 
                                className="w-full h-full object-contain" 
                                loading="lazy" 
                              />
                              {/* Slide overlay with title and description for carousel slides */}
                              {(slide.title || slide.description) && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                                  <div className="p-6 text-white w-full">
                                    {slide.title && (
                                      <h3 className="font-semibold text-lg mb-2">{slide.title}</h3>
                                    )}
                                    {slide.description && (
                                      <p className="text-sm text-white/90 line-clamp-2">{slide.description}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {pageContent.hero.slides.length > 1 && (
                        <>
                          <CarouselPrevious />
                          <CarouselNext />
                        </>
                      )}
                    </Carousel>
                  ) : (
                    /* Fallback image when no slides are configured */
                    <div className="aspect-[16/9] rounded-2xl overflow-hidden max-w-2xl">
                      <img 
                        src="/lovable-uploads/5ade5f06-a3a8-4a1e-abfb-038125a75293.png" 
                        alt="World Changers Association Logo" 
                        className="w-full h-full object-contain" 
                        loading="lazy" 
                      />
                    </div>
                  )}
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-40 h-40 bg-wca-purple/10 rounded-full -z-10"></div>
                  <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-wca-teal/10 rounded-full -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        {pageContent.values && pageContent.values.length > 0 && (
          <section className="py-20">
            <div className="container-custom">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-bold mb-4">
                  Our <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">Values</span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  These core values guide everything we do at World Changers Association.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
                {pageContent.values.map((value, index) => (
                  <GlassCard key={index} className="p-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                      {renderIcon(value.icon, "w-6 h-6 text-wca-purple")}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-justify">{value.description}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Timeline/History Section */}
        {pageContent.milestones && pageContent.milestones.length > 0 && (
          <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
            <div className="container-custom">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-bold mb-4">
                  Our <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">Journey</span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Key milestones in our history of transforming lives and communities.
                </p>
              </div>

              <div className="relative max-w-4xl mx-auto">
                {/* Timeline line */}
                <div className={`absolute ${isMobileOrTablet ? 'left-10' : 'left-1/2 transform -translate-x-1/2'} h-full w-0.5 bg-gradient-to-b from-wca-purple via-wca-violet to-wca-teal`}></div>
                
                {/* Timeline items */}
                <div className="space-y-20">
                  {pageContent.milestones.map((milestone, index) => (
                    <div key={index} className={`relative flex items-center ${isMobileOrTablet ? 'flex-row' : (index % 2 === 0 ? 'flex-row' : 'flex-row-reverse')}`}>
                      <div className={isMobileOrTablet ? 'w-0' : 'w-1/2'}></div>
                      
                      {/* Timeline dot */}
                      <div className={`absolute ${isMobileOrTablet ? 'left-6' : 'left-1/2 transform -translate-x-1/2'} w-8 h-8 bg-white dark:bg-gray-900 rounded-full border-4 border-wca-purple z-10 flex items-center justify-center`}>
                        <div className="w-2 h-2 bg-wca-violet rounded-full"></div>
                      </div>
                      
                      {/* Content */}
                      <div className={isMobileOrTablet ? 'w-full pl-20' : `w-1/2 ${index % 2 === 0 ? 'pl-12' : 'pr-12'}`}>
                        <GlassCard className="p-6">
                          <div className="text-sm font-semibold text-wca-teal mb-2">{milestone.year}</div>
                          <h3 className="text-xl font-semibold mb-3">{milestone.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-justify">{milestone.description}</p>
                        </GlassCard>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Leadership Team Section */}
        {pageContent.team && pageContent.team.length > 0 && (
          <section className="py-20">
            <div className="container-custom">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-bold mb-4">
                  Our <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">Leadership Team</span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Meet the dedicated individuals who lead World Changers Association.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {pageContent.team.map((member, index) => (
                  <GlassCard key={index} className="overflow-hidden">
                    <div className="aspect-square overflow-hidden">
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-110" loading="lazy" />
                    </div>
                    <div className="p-4 lg:p-3">
                      <h3 className="font-semibold text-lg lg:text-base">{member.name}</h3>
                      <p className="text-wca-teal font-medium text-xs lg:text-xs mb-3">{member.role}</p>
                      <Collapsible open={openDetails[index]} onOpenChange={() => toggleDetails(index)}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                          <span className="text-sm font-medium text-wca-purple">Show Details</span>
                          <ChevronDown className={`w-4 h-4 text-wca-purple transition-transform duration-200 ${openDetails[index] ? 'rotate-180' : ''}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <p className="text-gray-600 dark:text-gray-300 text-sm">{member.bio}</p>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {pageContent.cta && (
          <section className="py-20 bg-gradient-to-br from-wca-purple to-wca-violet text-white">
            <div className="container-custom">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-bold mb-4">{pageContent.cta.title}</h2>
                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                  {pageContent.cta.description}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a href="/locations" className="bg-white text-wca-violet font-medium px-6 py-3 rounded-md hover:bg-gray-100 transition-colors">
                    Find a Location
                  </a>
                  <a href="/contact" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium px-6 py-3 rounded-md hover:bg-white/20 transition-colors">
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default About;