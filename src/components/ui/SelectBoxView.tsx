import TextInputView from "@/src/components/ui/TextInputView";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { colors } from "@/src/styles/theme/colors";
import { Theme } from "@/src/types/theme";
import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Platform,
  ScrollView,
  Dimensions,
  FlatList,
} from "react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { CaretDown, CaretUp } from "phosphor-react-native";
import { scale, spacing } from "@/src/styles/theme/spacing";

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

  label?: string;
  labelStyle?: TextStyle;

  title?: string;
  titleStyle?: TextStyle;

  loading?: boolean;
  loadingText?: string;
  loadingComponent?: React.ReactNode;

  disabled?: boolean;

  // Style props
  containerStyle?: ViewStyle | ViewStyle[];
  selectBoxStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  iconStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  optionTextStyle?: TextStyle;
  selectedOptionStyle?: ViewStyle;
  selectedOptionTextStyle?: TextStyle;
  errorTextStyle?: TextStyle;
  loadingContainerStyle?: ViewStyle;

  accessibilityLabel?: string;
  accessibilityHint?: string;
  id?: string;

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
                                                       placeholder = "Select an item",
                                                       label,
                                                       labelStyle,
                                                       title,
                                                       titleStyle,
                                                       loading = false,
                                                       loadingText,
                                                       loadingComponent,
                                                       disabled = false,
                                                       containerStyle,
                                                       selectBoxStyle,
                                                       textStyle,
                                                       iconStyle,
                                                       dropdownStyle,
                                                       optionStyle,
                                                       optionTextStyle,
                                                       selectedOptionStyle,
                                                       selectedOptionTextStyle,
                                                       errorTextStyle,
                                                       loadingContainerStyle,
                                                       accessibilityLabel,
                                                       accessibilityHint,
                                                       id,
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
  const drawerId = `selectbox-${id || "default"}`;
  const isOpen = isDrawerOpen(drawerId);
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;

  const finalSelectBoxStyle: ViewStyle[] = [
    styles.selectBox,
    isDisabled && styles.disabled,
    error && styles.errorBorder,
    selectBoxStyle
      ? Array.isArray(selectBoxStyle)
        ? StyleSheet.flatten(selectBoxStyle)
        : selectBoxStyle
      : {},
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

  const handleOptionPress = useCallback((optionValue: string | number | null) => {
    onChange(optionValue);
    if (closeOnSelect) {
      closeDrawer(drawerId);
      setSearchQuery("");
    }
  }, [onChange, closeOnSelect, closeDrawer, drawerId]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  }, [onSearch]);

  // Memoize the drawer content renderer
  const renderDrawerContent = useCallback(() => {
    const currentFilteredOptions = searchable && searchQuery
      ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      : options;

    return (
      <View style={[styles.drawerContentContainer, dropdownStyle]}>
        {/* Header with Close Button */}
        <View style={styles.drawerHeader}>
          <TextView style={[styles.drawerTitle, titleStyle]}>
            {title || placeholder}
          </TextView>
        </View>

        {/* Search Input */}
        {searchable && (
          <View style={styles.searchContainer}>
            <TextInputView
              style={styles.searchInput}
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
        <View style={styles.optionsList}>
          {currentFilteredOptions.length === 0 ? (
            <View style={styles.noOptionsContainer}>
              <TextView style={styles.noOptionsText}>
                No options available
              </TextView>
            </View>
          ) : (
            <FlatList
              data={currentFilteredOptions}
              keyExtractor={(item) => `${item.value}`}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                const isOptionDisabled = item.disabled || false;

                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      isSelected && [
                        styles.selectedOptionBox,
                        selectedOptionStyle,
                      ],
                      isOptionDisabled && styles.disabledOption,
                      optionStyle,
                    ]}
                    onPress={() => handleOptionPress(item.value)}
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
                        isSelected && [
                          styles.selectedOptionText,
                          selectedOptionTextStyle,
                        ],
                        isOptionDisabled && styles.disabledOptionText,
                        optionTextStyle,
                      ]}
                    >
                      {item.label}
                    </TextView>
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 0.5,
                        borderColor: colors.green,
                      }}
                    >
                      {isSelected && <View style={styles.selectedIcon}></View>}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    );
  }, [
    searchQuery,
    searchable,
    options,
    value,
    styles,
    dropdownStyle,
    titleStyle,
    title,
    placeholder,
    searchPlaceholder,
    handleSearchChange,
    handleOptionPress,
    selectedOptionStyle,
    optionStyle,
    selectedOptionTextStyle,
    optionTextStyle,
  ]);

  // Update drawer content when search query or options change
  useEffect(() => {
    if (isOpen && searchable) {
      openDrawer(drawerId, renderDrawerContent(), {
        position: "bottom",
        transitionType: "slide",
        drawerHeight: "auto",
        enableGestures: true,
        enableOverlay: true,
        overlayOpacity: 0.5,
      });
    }
  }, [searchQuery]);

  const renderLoadingContent = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <View style={[styles.loadingContainer, loadingContainerStyle]}>
        <ActivityIndicator size="small" color={theme.text} />
        {loadingText && (
          <TextView style={[styles.loadingText, textStyle]}>
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

    return isOpen ? (
      <CaretUp size={20} color={colors.placeholder} style={iconStyle} />
    ) : (
      <CaretDown size={20} color={colors.placeholder} style={iconStyle} />
    );
  };

  const renderContent = () => {
    if (loading) {
      return renderLoadingContent();
    }

    return (
      <View style={styles.contentContainer}>
        <TextView style={[styles.selectedText, textStyle]} numberOfLines={1}>
          {selectedOption ? selectedOption.label : placeholder}
        </TextView>
        {renderDropdownIcon()}
      </View>
    );
  };

  const handleOpen = () => {
    if (!isDisabled) {
      openDrawer(drawerId, renderDrawerContent(), {
        position: "bottom",
        transitionType: "slide",
        drawerHeight: "auto",
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

  return (
    <View style={[fullWidth && styles.fullWidth, containerStyle]}>
      {label && (
        <TextView
          style={[styles.label, error && styles.labelError, labelStyle]}
        >
          {label}
        </TextView>
      )}

      <TouchableOpacity
        style={finalSelectBoxStyle}
        onPress={handleOpen}
        disabled={isDisabled}
        accessibilityLabel={accessibilityLabel || placeholder}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, expanded: isOpen }}
        id={id}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>

      {error && errorMessage && (
        <TextView style={[styles.errorText, errorTextStyle]}>
          {errorMessage}
        </TextView>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    selectBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: "rgba(109, 119, 122, 0.2)",
      paddingVertical: 8,
      paddingHorizontal: 8,
      height: scale(36),
      borderRadius: 4,
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
    errorBorder: {
      borderColor: "#FF3B30",
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
      fontSize: 12,
      color: colors.placeholder,
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
      fontSize: 16,
      color: theme.text,
    },
    label: {
      color: theme.text,
      fontWeight: "600",
      fontSize: 14,
      marginBottom: 8,
    },
    labelError: {
      color: "#FF3B30",
    },
    errorText: {
      color: "#FF3B30",
      marginTop: 4,
      marginLeft: 4,
      fontSize: 13,
    },
    drawerContentContainer: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 20,
      overflow: "hidden",
      backgroundColor: theme.background,
      height: "auto",
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
      fontWeight: 600,
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
      fontSize: 16,
      lineHeight: 20,
      paddingVertical: 10,
    },
    optionsList: {
      flex: 1,
      paddingBottom: spacing.md,
      maxHeight: Dimensions.get("window").height * 0.6,
    },
    optionText: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
    },
    selectedOptionText: {
      fontWeight: "600",
    },
    selectedOptionBox: {
      borderColor: colors.green,
    },
    selectedIcon: {
      width: 18,
      height: 18,
      borderRadius: 10,
      backgroundColor: colors.green,
    },
    option: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      gap: 8,
      justifyContent: "space-between",
      flexDirection: "row",
      borderColor: theme.border,
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