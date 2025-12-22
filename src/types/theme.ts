import { darkTheme, lightTheme } from '@/src/styles/theme/colors';

export type Theme = typeof lightTheme | typeof darkTheme;
export type ThemeMode = 'light' | 'dark' | 'system';
