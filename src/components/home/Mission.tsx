import { Check } from 'lucide-react';
import { GlassCard } from '../ui/GlassPanels';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { renderIcon } from '@/utils/iconMapping';
export default function Mission() {
  const {
    data: contentData
  } = useHomepageContent();
  const missionData = contentData?.content as any;

  // Default mission data
  const defaultMissionData = {
    title: 'Our Mission',
    description: 'We are committed to building a network of fellowships that are spiritually, intellectually, and economically empowered to bring positive change.',
    missions: [{
      icon: 'Users',
      title: 'Win, Train, Transform',
      description: 'Win the lost at all cost, train them as ministers, transform and empower them into effective leaders.',
      points: ['Outreach programs to reach the unreached', 'Comprehensive leadership training', 'Spiritual and professional development']
    }, {
      icon: 'Brain',
      title: 'Capacity Building',
      description: 'Promote capacity building for all leaders through education, mentorship, and practical experiences.',
      points: ['Skill development workshops', 'Mentorship programs', 'Educational resources']
    }, {
      icon: 'Shield',
      title: 'Accountability & Integrity',
      description: 'Ensure strict accountability for leadership transparency and integrity in all aspects.',
      points: ['Financial transparency', 'Ethical leadership training', 'Accountability structures']
    }]
  };
  const mission = missionData?.mission || defaultMissionData;
  const iconColors = ['text-primary', 'text-secondary', 'text-primary'];
  return <>
      {/* Mission Intro Section */}
      <section id="mission" className="relative border-b border-border/70 bg-muted/35 py-14 sm:py-16">
        {/* Background Elements */}
        <div className="container-custom relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Our foundation</p>
            <h2 className="mb-5 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
              Our Vision
            </h2>
            <p className="text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              {mission.description}
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission Cards Section */}
      <section className="relative py-16 sm:py-20">
        {/* Background Elements */}
        <div className="container-custom relative z-10">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">How we serve</p>
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
              Our Mission
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {mission.missions.map((missionItem: any, index: number) => <GlassCard key={index} className="flex h-full flex-col p-6">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted/60">
                  {renderIcon(missionItem.icon, `w-10 h-10 ${iconColors[index % iconColors.length]}`)}
                </div>
                <h3 className="text-xl font-semibold mb-3">{missionItem.title}</h3>
                <p className="mb-4 text-left leading-6 text-muted-foreground">{missionItem.description}</p>
                <ul className="mt-auto space-y-2">
                  {missionItem.points.map((point: string, i: number) => <li key={i} className="flex items-start">
                      <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                      <span className="text-sm text-muted-foreground">{point}</span>
                    </li>)}
                </ul>
              </GlassCard>)}
          </div>
        </div>
      </section>
    </>;
}