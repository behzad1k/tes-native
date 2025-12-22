import { colors } from './colors';
import { spacing } from './spacing';
import Typography from './typography';

export const theme = {
  colors,
  spacing,
  roundness: 8,
};

export type Theme = typeof theme;
export type ColorTheme = typeof colors;
export type SpacingTheme = typeof spacing;
export type TypographyTheme = typeof Typography;
