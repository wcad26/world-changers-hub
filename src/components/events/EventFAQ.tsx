import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useEventFAQs } from "@/hooks/useEventFAQs";
import { Skeleton } from "@/components/ui/skeleton";

interface EventFAQProps {
  eventId: string;
}

export function EventFAQ({ eventId }: EventFAQProps) {
  const { data: faqs, isLoading } = useEventFAQs(eventId);

  // Fallback FAQs if none exist for this event
  const defaultFAQs = [
    {
      question: "How do I register for the event?",
      answer: "You can register by clicking the 'Register Now' button above. Fill out the registration form with your details, and you'll receive a confirmation email with all the event information.",
    },
    {
      question: "What should I bring to the event?",
      answer: "Please bring a valid ID for check-in, comfortable clothing, and any personal items you may need. Specific requirements will be sent in your confirmation email.",
    },
    {
      question: "Is parking available at the venue?",
      answer: "Yes, complimentary parking is available for all attendees. The parking area is located adjacent to the main venue entrance.",
    },
    {
      question: "Can I get a refund if I can't attend?",
      answer: "Refund policies vary by event. Generally, you can request a refund up to 48 hours before the event start time. Please check your confirmation email for specific details.",
    },
    {
      question: "Will food and beverages be provided?",
      answer: "Yes, refreshments will be provided throughout the event. If you have any dietary restrictions, please let us know during registration.",
    },
  ];

  const displayFAQs = faqs && faqs.length > 0 ? faqs : defaultFAQs;

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

  return (
    <section className="py-10 bg-gradient-to-b from-background to-muted/20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-6">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about the event
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {displayFAQs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="glass-panel-soft border-none animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:text-primary transition-colors">
                  <span className="text-left font-semibold text-base">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground text-justify">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
