const LANGUAGE_STORAGE_KEY = 'user-language-preference';

export type SupportedLanguage = 'en' | 'fr';

export function detectBrowserLanguage(): SupportedLanguage {
  // Check localStorage first for cached preference
  const cached = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (cached === 'fr' || cached === 'en') {
    return cached as SupportedLanguage;
  }

  // Detect from browser
  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  const language: SupportedLanguage = langCode === 'fr' ? 'fr' : 'en';
  
  // Cache the detected language
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  
  return language;
}

export function setLanguagePreference(language: SupportedLanguage) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function getLocalizedField<T>(
  englishValue: T | null | undefined,
  frenchValue: T | null | undefined,
  language: SupportedLanguage
): T | null | undefined {
  if (language === 'fr' && frenchValue) {
    return frenchValue;
  }
  return englishValue;
}

// UI translations
export const translations = {
  en: {
    aboutEvent: "About This Event",
    meetSpeakers: "Meet Our Speakers",
    testimonials: "What Attendees Say",
    faq: "Frequently Asked Questions",
    faqSubtitle: "Find answers to common questions about the event",
    registerEvent: "Register for Event",
    contactUs: "Contact Us",
    date: "Date",
    time: "Time",
    location: "Location",
    capacity: "Capacity",
    availability: "Availability",
    spotsAvailable: "spots available",
    eventFull: "Event Full",
    cost: "Cost",
    free: "Free",
    organizer: "Organizer",
    requirements: "Requirements",
    relatedEvents: "Related Events",
    viewDetails: "View Details",
  },
  fr: {
    aboutEvent: "À propos de cet événement",
    meetSpeakers: "Rencontrez nos conférenciers",
    testimonials: "Ce que disent les participants",
    faq: "Questions fréquemment posées",
    faqSubtitle: "Trouvez des réponses aux questions courantes sur l'événement",
    registerEvent: "S'inscrire à l'événement",
    contactUs: "Nous contacter",
    date: "Date",
    time: "Heure",
    location: "Lieu",
    capacity: "Capacité",
    availability: "Disponibilité",
    spotsAvailable: "places disponibles",
    eventFull: "Événement complet",
    cost: "Coût",
    free: "Gratuit",
    organizer: "Organisateur",
    requirements: "Exigences",
    relatedEvents: "Événements connexes",
    viewDetails: "Voir les détails",
  },
};
