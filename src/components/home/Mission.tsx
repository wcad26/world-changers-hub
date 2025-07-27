
import { Check } from 'lucide-react';
import { GlassCard } from '../ui/GlassPanels';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { renderIcon } from '@/utils/iconMapping';

export default function Mission() {
  const { data: contentData } = useHomepageContent();
  const missionData = contentData?.content as any;

  // Default mission data
  const defaultMissionData = {
    title: 'Our Mission',
    description: 'We are committed to building a network of fellowships that are spiritually, intellectually, and economically empowered to bring positive change.',
    missions: [
      {
        icon: 'Users',
        title: 'Win, Train, Transform',
        description: 'Win the lost at all cost, train them as ministers, transform and empower them into effective leaders.',
        points: [
          'Outreach programs to reach the unreached',
          'Comprehensive leadership training',
          'Spiritual and professional development'
        ]
      },
      {
        icon: 'Brain',
        title: 'Capacity Building',
        description: 'Promote capacity building for all leaders through education, mentorship, and practical experiences.',
        points: [
          'Skill development workshops',
          'Mentorship programs',
          'Educational resources'
        ]
      },
      {
        icon: 'Shield',
        title: 'Accountability & Integrity',
        description: 'Ensure strict accountability for leadership transparency and integrity in all aspects.',
        points: [
          'Financial transparency',
          'Ethical leadership training',
          'Accountability structures'
        ]
      }
    ]
  };

  const mission = missionData?.mission || defaultMissionData;

  const iconColors = ['text-wca-purple', 'text-wca-violet', 'text-wca-teal'];

  return (
    <>
      {/* Mission Intro Section */}
      <section className="relative py-20" id="mission">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950"></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">
              {mission.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {mission.description}
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission Cards Section */}
      <section className="relative py-20">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900"></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                OUR MISSION
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mission.missions.map((missionItem: any, index: number) => (
              <GlassCard 
                key={index} 
                className="p-6 flex flex-col h-full"
              >
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  {renderIcon(missionItem.icon, `w-10 h-10 ${iconColors[index % iconColors.length]}`)}
                </div>
                <h3 className="text-xl font-semibold mb-3">{missionItem.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-left">{missionItem.description}</p>
                <ul className="mt-auto space-y-2">
                  {missionItem.points.map((point: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-wca-teal mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
