import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { useGlobalContent } from '@/hooks/useGlobalContent';
import { renderIcon } from '@/utils/iconMapping';
// Fallback data if no content is available
const fallbackData = {
  hero: {
    title: "Our Story and Our Vision for Change",
    description: "World Changers Association (WCA) is dedicated to building a network of fellowships that are spiritually, intellectually, and economically empowered to rescue the lost, transform them into effective leaders that will bring positive change in the economy, legislature, judiciary, and administration of nations.",
    mission_points: [
      "Win the lost at all cost, train them as ministers, transform and empower them into effective leaders",
      "Promote capacity building for all leaders",
      "Ensure strict accountability for leadership transparency and integrity"
    ]
  },
  values: [{
    icon: "Users",
    title: "Community",
    description: "We believe in the power of community to transform lives and societies."
  }, {
    icon: "Target",
    title: "Excellence",
    description: "We pursue excellence in all we do, aiming to honor God with our best."
  }, {
    icon: "Shield",
    title: "Integrity",
    description: "We uphold transparency and honesty in all areas of leadership and service."
  }, {
    icon: "Award",
    title: "Empowerment",
    description: "We equip and empower individuals to reach their full potential."
  }],
  team: [{
    name: "Dr. John Smith",
    role: "Founder & President",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
    bio: "Dr. Smith has over 20 years of experience in ministry and leadership development."
  }, {
    name: "Sarah Johnson",
    role: "Executive Director",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=988&q=80",
    bio: "Sarah oversees the daily operations and strategic initiatives of WCA."
  }, {
    name: "Pastor Michael Chen",
    role: "Director of Ministries",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
    bio: "Pastor Chen leads our spiritual development programs and outreach efforts."
  }, {
    name: "Dr. Grace Williams",
    role: "Director of Education",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1061&q=80",
    bio: "Dr. Williams heads our leadership training and educational initiatives."
  }],
  milestones: [{
    year: "2005",
    title: "Foundation",
    description: "WCA was established with the vision to transform lives and communities."
  }, {
    year: "2010",
    title: "First Center",
    description: "Our first official center was opened, providing a home for our growing community."
  }, {
    year: "2015",
    title: "Leadership Academy",
    description: "Launched our comprehensive leadership development program."
  }, {
    year: "2020",
    title: "Global Expansion",
    description: "Expanded to 10 countries with over 50 centers and homes worldwide."
  }],
  cta: {
    title: "Join Our Mission",
    description: "Be part of a movement that is transforming lives and communities around the world. There are many ways to get involved with World Changers Association."
  }
};
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
  
  // Use dynamic content if available, otherwise fall back to static content
  const pageContent = (content?.content as typeof fallbackData) || fallbackData;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-0 py-0">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 animate-fade-up">
                <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                  About Us
                </div>
                <h1 className="font-bold mb-4">
                  <span className="block">
                    {pageContent.hero?.title.split(' ').slice(0, 2).join(' ') || 'Our Story'} and
                  </span>
                  <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                    {pageContent.hero?.title.split(' ').slice(2).join(' ') || 'Our Vision for Change'}
                  </span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 text-justify">
                  {pageContent.hero?.description || fallbackData.hero.description}
                </p>
                <div className="space-y-4">
                  {(pageContent.hero?.mission_points || fallbackData.hero.mission_points).map((point, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-wca-teal mr-3 mt-1" />
                      <p className="text-gray-600 dark:text-gray-300">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2 flex justify-center animate-fade-in">
                <div className="relative">
                  <Carousel className="w-full max-w-2xl">
                    <CarouselContent>
                      <CarouselItem>
                        <div className="aspect-[16/9] rounded-2xl overflow-hidden">
                          <img src="/lovable-uploads/5ade5f06-a3a8-4a1e-abfb-038125a75293.png" alt="World Changers Association Logo" className="w-full h-full object-contain" loading="lazy" />
                        </div>
                      </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-40 h-40 bg-wca-purple/10 rounded-full -z-10"></div>
                  <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-wca-teal/10 rounded-full -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
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
              {(pageContent.values || fallbackData.values).map((value, index) => (
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

        {/* Timeline/History Section */}
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
                {(pageContent.milestones || fallbackData.milestones).map((milestone, index) => (
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

        {/* Leadership Team Section */}
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
              {(pageContent.team || fallbackData.team).map((member, index) => (
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

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-wca-purple to-wca-violet text-white">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-bold mb-4">{pageContent.cta?.title || fallbackData.cta.title}</h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                {pageContent.cta?.description || fallbackData.cta.description}
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
      </main>
      
      <Footer />
    </div>;
};
export default About;