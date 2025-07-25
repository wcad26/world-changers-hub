
import { Check, Users, Brain, Shield, ArrowRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassPanels';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const missions = [
  {
    icon: <Users className="w-8 h-8" />,
    title: "Win, Train, Transform",
    subtitle: "Comprehensive Leadership Development",
    description: "Win the lost at all cost, train them as ministers, transform and empower them into effective leaders.",
    color: "wca-purple",
    points: [
      "Outreach programs to reach the unreached",
      "Comprehensive leadership training",
      "Spiritual and professional development"
    ],
    cta: "Learn About Training"
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Capacity Building",
    subtitle: "Education & Mentorship",
    description: "Promote capacity building for all leaders through education, mentorship, and practical experiences.",
    color: "wca-violet",
    points: [
      "Skill development workshops",
      "Mentorship programs",
      "Educational resources"
    ],
    cta: "Explore Programs"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Accountability & Integrity",
    subtitle: "Transparent Leadership",
    description: "Ensure strict accountability for leadership transparency and integrity in all aspects.",
    color: "wca-teal",
    points: [
      "Financial transparency",
      "Ethical leadership training",
      "Accountability structures"
    ],
    cta: "View Standards"
  }
];

export default function Mission() {
  const isMobile = useIsMobile();

  return (
    <section className="relative bg-gradient-to-b from-background to-muted/30" id="mission">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-wca-purple/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-wca-teal/10 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wca-purple/10 border border-wca-purple/20">
            <Shield className="w-4 h-4 text-wca-purple" />
            <span className="text-sm font-medium text-wca-purple">Our Mission</span>
          </div>
          
          <h2 className="font-bold">
            Transforming Lives Through <span className="text-gradient">Strategic Leadership</span>
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            We are committed to building a network of fellowships that are spiritually, intellectually, 
            and economically empowered to bring positive change to communities worldwide.
          </p>
        </div>

        {/* Mission Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {missions.map((mission, index) => (
            <GlassCard 
              key={index} 
              className="group relative overflow-hidden p-8 h-full hover:shadow-2xl transition-all duration-300 card-hover"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${mission.color}/5 to-${mission.color}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${mission.color}/20 to-${mission.color}/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`text-${mission.color}`}>
                    {mission.icon}
                  </div>
                </div>
                
                {/* Content */}
                <div className="space-y-4 flex-grow">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{mission.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{mission.subtitle}</p>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {mission.description}
                  </p>
                  
                  {/* Features List */}
                  <ul className="space-y-3">
                    {mission.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full bg-${mission.color}/20 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className={`w-3 h-3 text-${mission.color}`} />
                        </div>
                        <span className="text-sm text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* CTA */}
                <div className="pt-6 mt-auto">
                  <Link 
                    to="/about" 
                    className={`inline-flex items-center gap-2 text-${mission.color} hover:text-${mission.color}/80 font-medium text-sm transition-colors group/link`}
                  >
                    {mission.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center">
          <div className="glass-panel p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Join Our Mission?</h3>
            <p className="text-muted-foreground mb-6">
              Be part of a global movement that's transforming lives and empowering leaders worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/about" className="button-primary">
                Learn More About WCA
              </Link>
              <Link to="/locations" className="button-outline">
                Find a Location Near You
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
