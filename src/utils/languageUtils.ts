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
    today: "Today",
    upcoming: "Upcoming",
    pastEvent: "Past Event",
    completed: "Completed",
    cancelled: "Cancelled",
    featured: "Featured",
    people: "people",
    unlimited: "Unlimited",
    readyToJoin: "Ready to Join?",
    reserveSpot: "Reserve your spot today and be part of something extraordinary",
    eventCost: "Event Cost",
    registerForEvent: "Register",
    whatsappNotAvailable: "WhatsApp contact not available for this event",
    eventCompleted: "Event Completed",
    registrationUnavailable: "Registration Unavailable",
    eventCompletedDesc: "This event has already taken place. Check out our upcoming events!",
    registrationUnavailableDesc: "Registration is currently not available for this event.",
    viewAllEvents: "View All Events",
    eventNotFound: "Event Not Found",
    eventNotFoundDesc: "We couldn't find the event you're looking for.",
    backToEvents: "← Back to Events",
    eventGallery: "Event Gallery",
    eventGalleryDescription: "Take a look at what makes this event special",
    testimonialsDescription: "Hear from those who've experienced our events",
    footerMission: "Building a network of fellowships that are spiritually, intellectually and economically empowered to transform lives.",
    // Visitor Registration Page
    visitorRegTitle: "VIP Registration Form",
    visitorRegDescription: "Welcome to WCA, a place where impact leaders are made.",
    welcomeTo: "Welcome to",
    firstName: "First Name",
    lastName: "Last Name",
    emailAddress: "Email Address",
    phoneNumber: "Phone Number",
    address: "Address",
    completeRegistration: "Complete Visitor Registration",
    alreadyMember: "Already a member?",
    signIn: "Sign In",
    back: "Back",
    regionNotFound: "Region Not Found",
    regionNotFoundDesc: "The region you're trying to register for could not be found.",
    returnToHome: "Return to Home",
    registrationSuccessful: "Registration Successful!",
    yourVisitorId: "Your Visitor ID",
    saveIdMessage: "Please save this ID for your records. A regional administrator will contact you soon.",
    backToRegionalPage: "Back to Regional Page",
    registerAgain: "Register Again",
    registrationFailed: "Registration failed. Please try again.",
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
    today: "Aujourd'hui",
    upcoming: "À venir",
    pastEvent: "Événement passé",
    completed: "Terminé",
    cancelled: "Annulé",
    featured: "En vedette",
    people: "personnes",
    unlimited: "Illimité",
    readyToJoin: "Prêt à vous joindre?",
    reserveSpot: "Réservez votre place aujourd'hui et faites partie de quelque chose d'extraordinaire",
    eventCost: "Coût de l'événement",
    registerForEvent: "S'inscrire",
    whatsappNotAvailable: "Contact WhatsApp non disponible pour cet événement",
    eventCompleted: "Événement terminé",
    registrationUnavailable: "Inscription indisponible",
    eventCompletedDesc: "Cet événement a déjà eu lieu. Consultez nos événements à venir!",
    registrationUnavailableDesc: "L'inscription n'est actuellement pas disponible pour cet événement.",
    viewAllEvents: "Voir tous les événements",
    eventNotFound: "Événement introuvable",
    eventNotFoundDesc: "Nous n'avons pas pu trouver l'événement que vous recherchez.",
    backToEvents: "← Retour aux événements",
    eventGallery: "Galerie de l'événement",
    eventGalleryDescription: "Découvrez ce qui rend cet événement spécial",
    testimonialsDescription: "Écoutez ceux qui ont vécu nos événements",
    footerMission: "Construire un réseau de communautés spirituellement, intellectuellement et économiquement habilitées à transformer des vies.",
    // Visitor Registration Page
    visitorRegTitle: "Formulaire d'inscription VIP",
    visitorRegDescription: "Bienvenue à WCA, un endroit où les leaders d'impact sont formés.",
    welcomeTo: "Bienvenue à",
    firstName: "Prénom",
    lastName: "Nom de famille",
    emailAddress: "Adresse e-mail",
    phoneNumber: "Numéro de téléphone",
    address: "Adresse",
    completeRegistration: "Terminer l'inscription du visiteur",
    alreadyMember: "Déjà membre?",
    signIn: "Se connecter",
    back: "Retour",
    regionNotFound: "Région introuvable",
    regionNotFoundDesc: "La région pour laquelle vous essayez de vous inscrire est introuvable.",
    returnToHome: "Retour à l'accueil",
    registrationSuccessful: "Inscription réussie!",
    yourVisitorId: "Votre ID de visiteur",
    saveIdMessage: "Veuillez conserver cet identifiant pour vos dossiers. Un administrateur régional vous contactera bientôt.",
    backToRegionalPage: "Retour à la page régionale",
    registerAgain: "S'inscrire à nouveau",
    registrationFailed: "L'inscription a échoué. Veuillez réessayer.",
  },
};
