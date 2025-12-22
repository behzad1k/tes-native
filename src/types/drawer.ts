import { ReactNode } from 'react';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
export type TransitionType = 'slide' | 'fade' | 'scale' | 'slideAndScale' | 'slideAndFade' | 'push';

export interface DrawerConfig {
  position: DrawerPosition;
  transitionType: TransitionType;
  transitionDuration: number;
  overlayOpacity: number;
  drawerWidth: number;
  drawerHeight?: number | 'auto';
  enableGestures: boolean;
  enableOverlay: boolean;
}

export interface DrawerInstance {
  id: string;
  content: ReactNode;
  config: DrawerConfig;
  zIndex: number;
}

export interface DrawerContextType {
  drawers: DrawerInstance[];
  openDrawer: (id: string, content: ReactNode, config?: Partial<DrawerConfig>) => void;
  closeDrawer: (id?: string) => void;
  closeAllDrawers: () => void;
  isDrawerOpen: (id: string) => boolean;
  getTopDrawer: () => DrawerInstance | null;
  defaultConfig: DrawerConfig;
  updateDefaultConfig: (config: Partial<DrawerConfig>) => void;
  closeDrawerWithAnimation: (id: string, customConfig?: Partial<DrawerConfig>) => void;
}

