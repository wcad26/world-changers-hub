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

  if (isLoading) {
    return (
      <section className="border-t border-event-border bg-event-surface py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 bg-event-elevated" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="border-t border-event-border bg-event-surface py-16 md:py-20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="font-sora text-3xl font-bold text-event-foreground md:text-4xl">
            {t('testimonials')}
          </h2>
          <p className="mt-3 text-event-muted max-w-2xl mx-auto">
            {t('testimonialsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => {
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
                className="rounded-lg border border-event-border bg-event-background p-7 transition-colors hover:border-primary/60"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Quote className="h-10 w-10 text-primary/30 mb-4" />
                
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>

                <p className="text-event-muted mb-6 italic leading-relaxed">
                  "{content}"
                </p>

                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="event-gradient text-primary-foreground">
                      {name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-event-foreground">{name}</p>
                    <p className="text-sm text-event-muted">{role}</p>
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
