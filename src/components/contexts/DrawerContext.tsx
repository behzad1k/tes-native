import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { DrawerContextType, DrawerConfig, DrawerInstance } from '@/src/types/drawer';
import { Dimensions, KeyboardAvoidingView, Platform } from 'react-native';

const defaultConfig: DrawerConfig = {
  position: 'bottom',
  transitionType: 'slide',
  transitionDuration: 300,
  overlayOpacity: 0.5,
  drawerWidth: Dimensions.get('window').width,
  drawerHeight: Dimensions.get('window').height * 0.5,
  enableGestures: true,
  enableOverlay: true,
};

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

interface DrawerProviderProps {
  children: ReactNode;
  initialConfig?: Partial<DrawerConfig>;
}

export const DrawerProvider: React.FC<DrawerProviderProps> = ({
                                                                children,
                                                                initialConfig = {}
                                                              }) => {
  const [drawers, setDrawers] = useState<DrawerInstance[]>([]);
  const [config, setConfig] = useState<DrawerConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const openDrawer = useCallback((
    id: string,
    content: ReactNode,
    drawerConfig?: Partial<DrawerConfig>
  ) => {
    setDrawers(prev => {
      const filtered = prev.filter(drawer => drawer.id !== id);

      const maxZIndex = filtered.length > 0
        ? Math.max(...filtered.map(d => d.zIndex))
        : 1000;

      const finalConfig = { ...config, ...drawerConfig };
      const newDrawer: DrawerInstance = {
        id,
        content,
        config: finalConfig,
        zIndex: maxZIndex + 1,
      };

      return [...filtered, newDrawer];
    });
  }, [config]);
  const closeDrawer = useCallback((id?: string) => {
    setDrawers(prev => {
      if (prev.length === 0) return prev;

      if (id) {
        return prev.filter(drawer => drawer.id !== id);
      } else {
        const sortedDrawers = [...prev].sort((a, b) => b.zIndex - a.zIndex);
        const topDrawer = sortedDrawers[0];
        return prev.filter(drawer => drawer.id !== topDrawer.id);
      }
    });
  }, []);

  const closeAllDrawers = useCallback(() => {
    setDrawers([]);
  }, []);

  const isDrawerOpen = useCallback((id: string) => {
    return drawers.some(drawer => drawer.id === id);
  }, [drawers]);

  const getTopDrawer = useCallback(() => {
    if (drawers.length === 0) return null;
    return drawers.reduce((top, current) =>
      current.zIndex > top.zIndex ? current : top
    );
  }, [drawers]);

  const updateDefaultConfig = useCallback((newConfig: Partial<DrawerConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const closeDrawerWithAnimation = useCallback((
    id: string,
    customConfig?: Partial<DrawerConfig>
  ) => {
    // Find the drawer to get its config
    const drawer = drawers.find(d => d.id === id);
    if (!drawer) return;

    // Merge custom config with drawer's config
    const finalConfig = { ...drawer.config, ...customConfig };

    // You could emit an event or use a different mechanism to trigger
    // the closing animation with the custom config
    // For now, we'll just use the regular close
    closeDrawer(id);
  }, [drawers, closeDrawer]);

  return (
    <DrawerContext.Provider
      value={{
        drawers,
        openDrawer,
        closeDrawer,
        closeAllDrawers,
        isDrawerOpen,
        getTopDrawer,
        defaultConfig: config,
        updateDefaultConfig,
        closeDrawerWithAnimation
      }}
    >
      <KeyboardAvoidingView style={{ flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {children}
      </KeyboardAvoidingView>
    </DrawerContext.Provider>
  );
};

export const useDrawer = (): DrawerContextType => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};

export { DrawerContext };
