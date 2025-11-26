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
      <section className="py-10 bg-gradient-to-b from-background to-muted/20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-72 mx-auto" />
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
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
    <section className="py-10 bg-gradient-to-b from-background to-muted/20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-6">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('faq')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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
                  className="glass-panel-soft border-none animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:text-primary transition-colors">
                    <span className="text-left font-semibold text-base">{question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground text-justify">
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
