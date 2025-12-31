import { useTheme } from "@/src/contexts/ThemeContext";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Typography, weightTransforms } from "@/src/styles/theme/typography";
import React, { ReactNode } from "react";
import { Text, TextProps, TextStyle } from "react-native";

type FontWeight = keyof typeof Typography.weights;
type TypographyVariant = keyof typeof Typography.variants;

interface TextViewProps extends TextProps {
  variant?: TypographyVariant;
  weight?: FontWeight;
  children?: string | string[] | ReactNode;
}

const TextView: React.FC<TextViewProps> = ({
  variant,
  weight,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const getTextStyle = (): TextStyle => {
    let baseStyle: TextStyle = {};

    if (variant && Typography.variants[variant]) {
      baseStyle = { ...Typography.variants[variant] };
    }

    baseStyle = {
      ...baseStyle,
      ...Typography.weights[
        weight || weightTransforms[(style as TextStyle)?.fontWeight || "normal"]
      ],
    };

    baseStyle.color = theme.text;

    return baseStyle;
  };

  return (
    <Text style={[getTextStyle(), style]} {...props}>
      {children}
    </Text>
  );
};

export default TextView;
