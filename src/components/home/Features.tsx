
import { Link } from '@/lib/router-compat';
import { GlassCard } from '../ui/GlassPanels';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { renderIcon } from '@/utils/iconMapping';

export default function Features() {
  const { data: contentData } = useHomepageContent();
  const featuresData = contentData?.content as any;

  // Default features data
  const defaultFeaturesData = {
    title: 'Everything You Need In One Place',
    description: 'Explore our wide range of services and resources designed to support your spiritual journey and leadership development.',
    features: [
      {
        icon: 'MapPin',
        title: 'WCA Centers & DCG Homes',
        description: 'Find fellowship centers and discipleship group homes near you with detailed information.',
        link: '/locations'
      },
      {
        icon: 'Calendar',
        title: 'Events Calendar',
        description: 'Stay updated with upcoming events, conferences, and gatherings across all locations.',
        link: '/events'
      },
      {
        icon: 'Film',
        title: 'Media & Sermons',
        description: 'Access our library of videos, sermons, and teachings to grow your spiritual life.',
        link: '/media'
      },
      {
        icon: 'BookOpen',
        title: 'Store & Library',
        description: 'Purchase books, resources, and materials or borrow from our extensive library.',
        link: '/store'
      },
      {
        icon: 'Heart',
        title: 'Counseling Services',
        description: 'Schedule appointments with our trained counselors for spiritual guidance.',
        link: '/counseling'
      },
      {
        icon: 'BarChart3',
        title: 'Fundraising Projects',
        description: 'Support and track our ongoing fundraising projects and initiatives.',
        link: '/fundraising'
      }
    ]
  };

  const features = featuresData?.features || defaultFeaturesData;
  const iconColors = ['text-primary', 'text-secondary', 'text-primary'];

  return (
    <section className="border-y border-border/70 bg-muted/35 py-16 sm:py-20">
      <div className="container-custom">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Explore WCA</p>
          <h2 className="mb-4 font-heading font-semibold text-foreground">
            {features.title}
          </h2>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            {features.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.features.map((feature: any, index: number) => (
            <GlassCard 
              key={index} 
              className="flex h-full flex-col p-6"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10">
                {renderIcon(feature.icon, `w-10 h-10 ${iconColors[index % iconColors.length]}`)}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="mb-6 text-left leading-6 text-muted-foreground">{feature.description}</p>
              <Link 
                to={feature.link} 
                className="mt-auto inline-flex items-center font-semibold text-primary transition-colors hover:text-primary/75"
              >
                Learn More
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
