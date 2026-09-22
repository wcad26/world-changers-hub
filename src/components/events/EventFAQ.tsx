import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useEventFAQs } from "@/hooks/useEventFAQs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

interface EventFAQProps {
  eventId: string;
}

export function EventFAQ({ eventId }: EventFAQProps) {
  const { data: faqs, isLoading } = useEventFAQs(eventId);
  const { t, localizedField } = useLanguage();

  if (isLoading) {
    return (
      <section className="border-t border-event-border bg-event-background py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-72 mx-auto" />
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 bg-event-elevated" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Don't render the section if no FAQs exist for this event
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-event-border bg-event-background py-16 md:py-20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="event-gradient inline-flex items-center justify-center w-12 h-12 rounded-md mb-5">
            <HelpCircle className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="font-sora text-3xl font-bold text-event-foreground md:text-4xl">
            {t('faq')}
          </h2>
          <p className="mt-3 text-event-muted max-w-2xl mx-auto">
            {t('faqSubtitle')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => {
              // Check if this is a database FAQ (has _fr fields) or default FAQ
              const question = 'question_fr' in faq 
                ? (localizedField(faq.question, (faq as any).question_fr) as string)
                : (faq.question as string);
              const answer = 'answer_fr' in faq
                ? (localizedField(faq.answer, (faq as any).answer_fr) as string)
                : (faq.answer as string);
              
              return (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="rounded-lg border border-event-border bg-event-surface px-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AccordionTrigger className="px-5 py-4 text-event-foreground hover:no-underline hover:text-accent transition-colors">
                    <span className="text-left font-semibold text-base">{question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 leading-7 text-event-muted">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
