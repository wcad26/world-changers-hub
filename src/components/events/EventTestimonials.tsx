import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import { useEventTestimonials } from "@/hooks/useEventTestimonials";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

interface EventTestimonialsProps {
  eventId: string;
}

export function EventTestimonials({ eventId }: EventTestimonialsProps) {
  const { data: testimonials, isLoading } = useEventTestimonials(eventId);
  const { t, localizedField } = useLanguage();

  // Fallback testimonials if none exist for this event
  const defaultTestimonials = [
    {
      name: "Sarah Johnson",
      role: "Previous Attendee",
      content: "This event exceeded all my expectations. The organization was flawless, and I learned so much from the sessions!",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Community Member",
      content: "Amazing experience! Met wonderful people and gained valuable insights. Can't wait for the next one.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "First-time Participant",
      content: "As a first-timer, I was warmly welcomed. The event was well-structured and incredibly enriching.",
      rating: 5,
    },
  ];

  const displayTestimonials = testimonials && testimonials.length > 0 
    ? testimonials 
    : defaultTestimonials;

  if (isLoading) {
    return (
      <section className="py-10 bg-muted/20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-muted/20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('testimonials')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from those who've experienced our events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {displayTestimonials.map((testimonial, index) => {
            const name = 'name_fr' in testimonial
              ? (localizedField(testimonial.name, (testimonial as any).name_fr) as string)
              : testimonial.name;
            const role = 'role_fr' in testimonial
              ? (localizedField(testimonial.role, (testimonial as any).role_fr) as string)
              : testimonial.role;
            const content = 'content_fr' in testimonial
              ? (localizedField(testimonial.content, (testimonial as any).content_fr) as string)
              : testimonial.content;

            return (
              <div
                key={index}
                className="glass-panel-soft p-8 hover:scale-105 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Quote className="h-10 w-10 text-primary/30 mb-4" />
                
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>

                <p className="text-muted-foreground mb-6 italic leading-relaxed text-justify">
                  "{content}"
                </p>

                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      {name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
