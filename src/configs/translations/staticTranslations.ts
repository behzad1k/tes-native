import { setServiceI18nUpdater } from '@/src/components/contexts/LanguageContext';

let serviceI18nInstance: any = null;

// Initialize service i18n with the same instance
export const initializeServiceI18n = async () => {
  const { i18nInitPromise } = await import('@/src/configs/translations');
  serviceI18nInstance = await i18nInitPromise;

  // Register the updater function
  setServiceI18nUpdater((locale: string) => {
    if (serviceI18nInstance) {
      serviceI18nInstance.locale = locale;
    }
  });

  return serviceI18nInstance;
};

import i18n from 'i18next';

// Translation function for services
export const translate = (key: string, options?: any): string => {
  return i18n.t(key, options) as string;
};

// Initialize immediately
initializeServiceI18n().catch(console.error);
