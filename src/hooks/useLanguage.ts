import { useLanguageContext } from '@/contexts/LanguageContext';
import { getLocalizedField, translations, SupportedLanguage } from '@/utils/languageUtils';

export function useLanguage() {
  const { language, setLanguage } = useLanguageContext();

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key];
  };

  const localizedField = <T,>(englishValue: T | null | undefined, frenchValue: T | null | undefined): T | null | undefined => {
    return getLocalizedField(englishValue, frenchValue, language);
  };

  return {
    language,
    setLanguage,
    t,
    localizedField,
  };
}
