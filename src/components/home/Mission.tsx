
import { Check, Users, Brain, Shield } from 'lucide-react';
import { GlassCard } from '../ui/GlassPanels';

const missions = [
  {
    icon: <Users className="w-10 h-10 text-wca-purple" />,
    title: "Win, Train, Transform",
    description: "Win the lost at all cost, train them as ministers, transform and empower them into effective leaders.",
    points: [
      "Outreach programs to reach the unreached",
      "Comprehensive leadership training",
      "Spiritual and professional development"
    ]
  },
  {
    icon: <Brain className="w-10 h-10 text-wca-violet" />,
    title: "Capacity Building",
    description: "Promote capacity building for all leaders through education, mentorship, and practical experiences.",
    points: [
      "Skill development workshops",
      "Mentorship programs",
      "Educational resources"
    ]
  },
  {
    icon: <Shield className="w-10 h-10 text-wca-teal" />,
    title: "Accountability & Integrity",
    description: "Ensure strict accountability for leadership transparency and integrity in all aspects.",
    points: [
      "Financial transparency",
      "Ethical leadership training",
      "Accountability structures"
    ]
  }
];

export default function Mission() {
  return (
    <section className="relative py-20" id="mission">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-bold mb-4">
            Our <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">Mission</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            We are committed to building a network of fellowships that are spiritually, intellectually, and economically empowered to bring positive change.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {missions.map((mission, index) => (
            <GlassCard 
              key={index} 
              className="p-6 flex flex-col h-full"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                {mission.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{mission.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{mission.description}</p>
              <ul className="mt-auto space-y-2">
                {mission.points.map((point, i) => (
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
  );
}
