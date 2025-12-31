import { useLanguage } from '@/src/hooks/useLanguage';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SplashContextType {
  showSplash: boolean;
  hideSplash: () => void;
  setTextValue: React.Dispatch<React.SetStateAction<string>>
  textValue: string
}

const SplashContext = createContext<SplashContextType | undefined>(undefined);

export function SplashProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [showSplash, setShowSplash] = useState(true);
  const [textValue, setTextValue] = useState(t('general.loading') + '...');

  const hideSplash = () => {
    setShowSplash(false);
  };

  return (
    <SplashContext.Provider value={{ showSplash, hideSplash, setTextValue, textValue }}>
      {children}
    </SplashContext.Provider>
  );
}

export function useSplash() {
  const context = useContext(SplashContext);
  if (context === undefined) {
    throw new Error('useSplash must be used within a SplashProvider');
  }
  return context;
}
