
import { Link } from 'react-router-dom';
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
  const iconColors = ['text-wca-purple', 'text-wca-violet', 'text-wca-teal'];

  return (
    <section className="py-20">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-bold mb-4">
            <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
              {features.title}
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {features.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.features.map((feature: any, index: number) => (
            <GlassCard 
              key={index} 
              className="p-6 flex flex-col h-full"
            >
              <div className="mb-6">
                {renderIcon(feature.icon, `w-10 h-10 ${iconColors[index % iconColors.length]}`)}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{feature.description}</p>
              <Link 
                to={feature.link} 
                className="mt-auto text-wca-purple hover:text-wca-violet font-medium inline-flex items-center transition-colors"
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
