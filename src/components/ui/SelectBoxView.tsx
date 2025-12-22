import TextInputView from "@/src/components/ui/TextInputView";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { colors } from "@/src/styles/theme/colors";
import Typography from "@/src/styles/theme/typography";
import { Theme } from "@/src/types/theme";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/src/components/contexts/ThemeContext";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Platform,
  ScrollView,
  Dimensions,
  TextInput,
} from "react-native";
import { useDrawer } from "@/src/components/contexts/DrawerContext";

export type SelectBoxVariant = "primary" | "secondary" | "outline" | "ghost";
export type SelectBoxSize = "small" | "medium" | "large";

export interface SelectBoxOption {
  label: string;
  value: string | number | null;
  disabled?: boolean;
}

interface SelectBoxViewProps {
  options: SelectBoxOption[];
  value?: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;

  loading?: boolean;
  loadingText?: string;
  loadingComponent?: React.ReactNode;

  variant?: SelectBoxVariant;
  size?: SelectBoxSize;
  disabled?: boolean;

  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  dropdownStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  optionTextStyle?: TextStyle;

  backgroundColor?: string;
  textColor?: string;
  loadingColor?: string;
  dropdownBackgroundColor?: string;
  selectedOptionColor?: string;

  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;

  fullWidth?: boolean;

  error?: boolean;
  errorMessage?: string;

  showDropdownIcon?: boolean;
  dropdownIcon?: React.ReactNode;

  closeOnSelect?: boolean;
  drawerHeight?: number | "auto";

  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

const SelectBoxView: React.FC<SelectBoxViewProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  loading = false,
  loadingText,
  loadingComponent,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
  textStyle,
  dropdownStyle,
  optionStyle,
  optionTextStyle,
  backgroundColor,
  textColor,
  loadingColor,
  dropdownBackgroundColor,
  selectedOptionColor,
  accessibilityLabel,
  accessibilityHint,
  testID,
  fullWidth = false,
  error = false,
  errorMessage,
  showDropdownIcon = true,
  dropdownIcon,
  closeOnSelect = true,
  drawerHeight = "auto",
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { openDrawer, closeDrawer, isDrawerOpen } = useDrawer();
  const { theme } = useTheme();
  const drawerId = `selectbox-${testID || "default"}`;
  const isOpen = isDrawerOpen(drawerId);

  const isDisabled = disabled || loading;

  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  const boxBackgroundColor =
    backgroundColor || theme.background || variantStyles.backgroundColor;
  const boxTextColor = textColor || theme.text || variantStyles.textColor;
  const spinnerColor = loadingColor || variantStyles.loadingColor;
  const dropdownBgColor = dropdownBackgroundColor || "#FFFFFF";
  const selectedColor =
    selectedOptionColor || variantStyles.selectedOptionColor;
  const styles = useThemedStyles(createStyles);

  const finalBackgroundColor = isDisabled
    ? variantStyles.disabledBackgroundColor
    : error
      ? variantStyles.errorBackgroundColor
      : boxBackgroundColor;
  const finalTextColor = isDisabled
    ? variantStyles.disabledTextColor
    : error
      ? variantStyles.errorTextColor
      : boxTextColor;
  const finalBorderColor = error
    ? variantStyles.errorBorderColor
    : theme.pink || variantStyles.borderColor;

  const selectBoxStyle: ViewStyle[] = [
    styles.selectBox,
    sizeStyles.selectBox,
    {
      backgroundColor: finalBackgroundColor,
      borderColor: finalBorderColor,
      borderWidth: variantStyles.borderWidth,
    },
    fullWidth ? styles.fullWidth : {},
    isDisabled ? styles.disabled : {},
    style ? (Array.isArray(style) ? StyleSheet.flatten(style) : style) : {},
  ];

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions =
    searchable && searchQuery
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options;

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const renderLoadingContent = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={sizeStyles.spinnerSize} color={spinnerColor} />
        {loadingText && (
          <TextView
            style={[
              styles.loadingText,
              sizeStyles.text,
              { color: finalTextColor },
              textStyle,
            ]}
          >
            {loadingText}
          </TextView>
        )}
      </View>
    );
  };

  const renderDropdownIcon = () => {
    if (!showDropdownIcon) return null;

    if (dropdownIcon) {
      return dropdownIcon;
    }

    return (
      <TextView
        style={[
          styles.dropdownIconText,
          { color: finalTextColor },
          sizeStyles.icon,
        ]}
      >
        {isOpen ? "▲" : "▼"}
      </TextView>
    );
  };

  const renderContent = () => {
    if (loading) {
      return renderLoadingContent();
    }

    return (
      <View style={styles.contentContainer}>
        <TextView
          style={[
            styles.selectedText,
            sizeStyles.text,
            {
              color: selectedOption
                ? finalTextColor
                : variantStyles.placeholderColor,
            },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </TextView>
        {renderDropdownIcon()}
      </View>
    );
  };

  const handleOptionPress = (optionValue: string | number | null) => {
    onChange(optionValue);
    if (closeOnSelect) {
      closeDrawer(drawerId);
      setSearchQuery("");
    }
  };

  const handleOpen = () => {
    if (!isDisabled) {
      openDrawer(drawerId, renderDrawerContent(), {
        position: "bottom",
        transitionType: "slide",
        drawerHeight: drawerHeight || Dimensions.get("window").height * 0.6,
        enableGestures: true,
        enableOverlay: true,
        overlayOpacity: 0.5,
      });
    }
  };

  const handleClose = () => {
    closeDrawer(drawerId);
    setSearchQuery("");
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const renderDrawerContent = () => {
    return (
      <View style={[styles.drawerContentContainer, dropdownStyle]}>
        {/* Header with Close Button */}
        <View style={styles.drawerHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <TextView style={styles.closeButtonText}>✕</TextView>
          </TouchableOpacity>
          <TextView style={styles.drawerTitle}>{placeholder}</TextView>
        </View>

        {/* Search Input */}
        {searchable && (
          <View style={styles.searchContainer}>
            <TextInputView
              style={[styles.searchInput, sizeStyles.searchInput]}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus={false}
            />
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Options List */}
        <ScrollView
          style={styles.optionsList}
          showsVerticalScrollIndicator={true}
        >
          {filteredOptions.length === 0 ? (
            <View style={styles.noOptionsContainer}>
              <TextView style={styles.noOptionsText}>
                No options available
              </TextView>
            </View>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isOptionDisabled = option.disabled || false;

              return (
                <TouchableOpacity
                  key={`${option.value}-${index}`}
                  style={[
                    styles.option,
                    sizeStyles.option,
                    isSelected && styles.selectedOptionBox,
                    isOptionDisabled && styles.disabledOption,
                    optionStyle,
                  ]}
                  onPress={() => handleOptionPress(option.value)}
                  disabled={isOptionDisabled}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isOptionDisabled,
                    selected: isSelected,
                  }}
                >
                  <TextView
                    style={[
                      styles.optionText,
                      sizeStyles.optionText,
                      isSelected && styles.selectedOptionText,
                      isOptionDisabled && styles.disabledOptionText,
                      optionTextStyle,
                    ]}
                  >
                    {option.label}
                  </TextView>
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 0.5,
                      borderColor: colors.pink,
                    }}
                  >
                    {isSelected && <View style={styles.selectedIcon}></View>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={fullWidth ? styles.fullWidth : {}}>
      <TouchableOpacity
        style={selectBoxStyle}
        onPress={handleOpen}
        disabled={isDisabled}
        accessibilityLabel={accessibilityLabel || placeholder}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, expanded: isOpen }}
        testID={testID}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>

      {error && errorMessage && (
        <TextView style={[styles.errorText, sizeStyles.errorText]}>
          {errorMessage}
        </TextView>
      )}
    </View>
  );
};

const getVariantStyles = (variant: SelectBoxVariant) => {
  const variants = {
    primary: {
      backgroundColor: colors.background,
      textColor: "#000000",
      borderColor: "#007AFF",
      borderWidth: 2,
      loadingColor: "#007AFF",
      placeholderColor: "#999999",
      disabledBackgroundColor: "#F2F2F7",
      disabledTextColor: "#B0B0B0",
      errorBackgroundColor: "#FFF5F5",
      errorTextColor: "#FF3B30",
      errorBorderColor: "#FF3B30",
      selectedOptionColor: "#E3F2FD",
    },
    secondary: {
      backgroundColor: "#F2F2F7",
      textColor: "#000000",
      borderColor: "#E5E5EA",
      borderWidth: 1,
      loadingColor: "#007AFF",
      placeholderColor: "#999999",
      disabledBackgroundColor: "#E5E5EA",
      disabledTextColor: "#B0B0B0",
      errorBackgroundColor: "#FFF5F5",
      errorTextColor: "#FF3B30",
      errorBorderColor: "#FF3B30",
      selectedOptionColor: "#E3F2FD",
    },
    outline: {
      backgroundColor: "transparent",
      textColor: "#000000",
      borderColor: "#CCCCCC",
      borderWidth: 1,
      loadingColor: "#007AFF",
      placeholderColor: "#999999",
      disabledBackgroundColor: "transparent",
      disabledTextColor: "#B0B0B0",
      errorBackgroundColor: "transparent",
      errorTextColor: "#FF3B30",
      errorBorderColor: "#FF3B30",
      selectedOptionColor: "#E3F2FD",
    },
    ghost: {
      backgroundColor: "transparent",
      textColor: "#000000",
      borderColor: "transparent",
      borderWidth: 0,
      loadingColor: "#007AFF",
      placeholderColor: "#999999",
      disabledBackgroundColor: "transparent",
      disabledTextColor: "#B0B0B0",
      errorBackgroundColor: "transparent",
      errorTextColor: "#FF3B30",
      errorBorderColor: "transparent",
      selectedOptionColor: "#E3F2FD",
    },
  };

  return variants[variant];
};

const getSizeStyles = (size: SelectBoxSize) => {
  const sizes = {
    small: {
      selectBox: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        minHeight: 36,
        borderRadius: 6,
      },
      text: {
        fontSize: 14,
        fontWeight: "500" as const,
      },
      icon: {
        fontSize: 12,
      },
      spinnerSize: "small" as const,
      option: {
        paddingVertical: 10,
        paddingHorizontal: 12,
      },
      optionText: {
        fontSize: 14,
      },
      errorText: {
        fontSize: 12,
      },
      searchInput: {
        fontSize: 14,
        paddingVertical: 8,
      },
    },
    medium: {
      selectBox: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 48,
        borderRadius: 8,
      },
      text: {
        fontSize: 16,
        fontWeight: "500" as const,
      },
      icon: {
        fontSize: 14,
      },
      spinnerSize: "small" as const,
      option: {
        paddingVertical: 14,
        paddingHorizontal: 16,
      },
      optionText: {
        fontSize: 16,
      },
      errorText: {
        fontSize: 13,
      },
      searchInput: {
        fontSize: 16,
        paddingVertical: 10,
      },
    },
    large: {
      selectBox: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        minHeight: 56,
        borderRadius: 10,
      },
      text: {
        fontSize: 18,
        fontWeight: "500" as const,
      },
      icon: {
        fontSize: 16,
      },
      spinnerSize: "small" as const,
      option: {
        paddingVertical: 16,
        paddingHorizontal: 20,
      },
      optionText: {
        fontSize: 18,
      },
      errorText: {
        fontSize: 14,
      },
      searchInput: {
        fontSize: 18,
        paddingVertical: 12,
      },
    },
  };

  return sizes[size];
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    selectBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.primary,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    fullWidth: {
      width: "100%",
    },
    disabled: {
      opacity: 0.6,
      ...Platform.select({
        ios: {
          shadowOpacity: 0,
        },
        android: {
          elevation: 0,
        },
      }),
    },
    contentContainer: {
      backgroundColor: theme.background,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
    },
    selectedText: {
      flex: 1,
      marginRight: 8,
    },
    dropdownIconText: {
      marginLeft: 8,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      marginLeft: 8,
    },
    errorText: {
      color: "#FF3B30",
      marginTop: 4,
      marginLeft: 4,
    },
    drawerContentContainer: {
      flex: 1,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 20,
      overflow: "hidden",
      backgroundColor: theme.background,
    },
    drawerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: theme.background,
    },
    drawerTitle: {
      fontSize: 18,
      ...Typography.weights.medium,
      color: theme.text,
      flex: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#F2F2F7",
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonText: {
      fontSize: 18,
      color: "#666666",
      fontWeight: "bold",
    },
    divider: {
      height: 1,
      backgroundColor: "#E5E5EA",
      marginTop: 8,
      marginBottom: 8,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInput: {
      backgroundColor: "#F2F2F7",
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    optionsList: {
      flex: 1,
      paddingHorizontal: 10,
      gap: 8,
    },
    optionText: {
      flex: 1,
      color: theme.text,
    },
    selectedOptionText: {
      fontWeight: "600",
    },
    selectedOptionBox: {
      borderColor: colors.pink,
    },
    selectedIcon: {
      width: 18,
      height: 18,
      borderRadius: 10,
      backgroundColor: colors.pink,
    },
    option: {
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderWidth: 2,
      gap: 8,
      marginVertical: 4,
      justifyContent: "space-between",
      flexDirection: "row",
      borderColor: "transparent",
      backgroundColor: theme.primary,
    },
    checkmark: {
      fontSize: 18,
      color: "#007AFF",
      marginLeft: 8,
      fontWeight: "bold",
    },
    disabledOption: {
      opacity: 0.4,
    },
    disabledOptionText: {
      color: "#B0B0B0",
    },
    noOptionsContainer: {
      paddingVertical: 24,
      alignItems: "center",
    },
    noOptionsText: {
      color: "#999999",
      fontSize: 16,
    },
  });

export default SelectBoxView;
