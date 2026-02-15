import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { X } from "phosphor-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════════════════════
//  Site Type Configuration
//  Based on old app's intersection type handling
// ═══════════════════════════════════════════════════════════════════════════════

export type SiteTypeConfig = {
  type: number;
  backendType: number; // siteTypeBackend from old app
  directions: string[];
  label: string;
  description?: string;
};

/**
 * Site type mapping from old app:
 * Backend siteType values and their corresponding UI representations
 *
 * Backend siteTypeBackend:
 * 1 = 4-way intersection (all directions)
 * 2 = T-junction (3 directions, multiple orientations)
 * 3 = One-way (2 directions on same axis)
 * 4 = Two-way (2 directions on perpendicular axis)
 *
 * UI siteType (selected by user):
 * 1 = 4-way (N, S, E, W)
 * 2 = T-junction North variant (N, S, W - no East)
 * 3 = T-junction East variant (N, S, E - no West)
 * 4 = T-junction South variant (S, E, W - no North)
 * 5 = T-junction West variant (N, E, W - no South)
 * 6 = Two-way North-South
 * 7 = Two-way East-West
 * 8 = One-way East
 * 9 = One-way North
 */
export const SITE_TYPES: SiteTypeConfig[] = [
  // 4-way intersection
  { type: 1, backendType: 1, directions: ["N", "S", "E", "W"], label: "4-Way" },
  // T-junction variants (backendType: 2)
  {
    type: 2,
    backendType: 2,
    directions: ["N", "S", "W"],
    label: "T (No East)",
  },
  {
    type: 3,
    backendType: 2,
    directions: ["N", "S", "E"],
    label: "T (No West)",
  },
  {
    type: 4,
    backendType: 2,
    directions: ["S", "E", "W"],
    label: "T (No North)",
  },
  {
    type: 5,
    backendType: 2,
    directions: ["N", "E", "W"],
    label: "T (No South)",
  },
  // Two-way variants (backendType: 4)
  { type: 6, backendType: 4, directions: ["N", "S"], label: "2-Way N-S" },
  { type: 7, backendType: 4, directions: ["E", "W"], label: "2-Way E-W" },
  // One-way variants (backendType: 3)
  { type: 8, backendType: 3, directions: ["E", "W"], label: "1-Way E" },
  { type: 9, backendType: 3, directions: ["N", "S"], label: "1-Way N" },
];

/**
 * Get site type configuration by type number
 */
export const getSiteTypeConfig = (siteType: number): SiteTypeConfig => {
  return SITE_TYPES.find((st) => st.type === siteType) || SITE_TYPES[0];
};

/**
 * Get available site types for a given backend site type
 * This is used to filter which site type options to show in the selector
 */
export const getSiteTypesForBackendType = (
  backendType: number,
): SiteTypeConfig[] => {
  return SITE_TYPES.filter((st) => st.backendType === backendType);
};

/**
 * Get directions for a site type
 */
export const getDirectionsForSiteType = (siteType: number): string[] => {
  const config = getSiteTypeConfig(siteType);
  return config.directions;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Intersection Preview Component
// ═══════════════════════════════════════════════════════════════════════════════

interface IntersectionPreviewProps {
  siteType: number;
  size?: number;
  selected?: boolean;
}

const IntersectionPreview = ({
  siteType,
  size = 80,
  selected = false,
}: IntersectionPreviewProps) => {
  const config = getSiteTypeConfig(siteType);
  const hasN = config.directions.includes("N");
  const hasS = config.directions.includes("S");
  const hasE = config.directions.includes("E");
  const hasW = config.directions.includes("W");

  const mid = size / 2;
  const roadColor = selected ? "#B8B878" : "#999";
  const dashColor = selected ? "#C4A635" : "#777";

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Road lines */}
      {hasN && (
        <Line
          x1={mid}
          y1={0}
          x2={mid}
          y2={mid}
          stroke={roadColor}
          strokeWidth={2}
        />
      )}
      {hasS && (
        <Line
          x1={mid}
          y1={mid}
          x2={mid}
          y2={size}
          stroke={roadColor}
          strokeWidth={2}
        />
      )}
      {hasE && (
        <Line
          x1={mid}
          y1={mid}
          x2={size}
          y2={mid}
          stroke={roadColor}
          strokeWidth={2}
        />
      )}
      {hasW && (
        <Line
          x1={0}
          y1={mid}
          x2={mid}
          y2={mid}
          stroke={roadColor}
          strokeWidth={2}
        />
      )}

      {/* Center dashes */}
      {hasN && (
        <Line
          x1={mid}
          y1={0}
          x2={mid}
          y2={mid}
          stroke={dashColor}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}
      {hasS && (
        <Line
          x1={mid}
          y1={mid}
          x2={mid}
          y2={size}
          stroke={dashColor}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}
      {hasE && (
        <Line
          x1={mid}
          y1={mid}
          x2={size}
          y2={mid}
          stroke={dashColor}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}
      {hasW && (
        <Line
          x1={0}
          y1={mid}
          x2={mid}
          y2={mid}
          stroke={dashColor}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}

      {/* Corner curves for T-junctions */}
      {!hasN && !hasW && (
        <Path
          d={`M ${mid - 10} ${mid} Q ${mid - 10} ${mid - 10} ${mid} ${mid - 10}`}
          stroke={roadColor}
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {!hasN && !hasE && (
        <Path
          d={`M ${mid} ${mid - 10} Q ${mid + 10} ${mid - 10} ${mid + 10} ${mid}`}
          stroke={roadColor}
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {!hasS && !hasW && (
        <Path
          d={`M ${mid - 10} ${mid} Q ${mid - 10} ${mid + 10} ${mid} ${mid + 10}`}
          stroke={roadColor}
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {!hasS && !hasE && (
        <Path
          d={`M ${mid} ${mid + 10} Q ${mid + 10} ${mid + 10} ${mid + 10} ${mid}`}
          stroke={roadColor}
          strokeWidth={1.5}
          fill="none"
        />
      )}
    </Svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Drawer Content — Two-step flow
// ═══════════════════════════════════════════════════════════════════════════════

const DIRECTION_FULL_NAMES: Record<string, string> = {
  N: "North",
  S: "South",
  E: "East",
  W: "West",
};

interface SiteTypeDrawerContentProps {
  currentSiteType: number;
  backendSiteType: number; // siteTypeBackend from work order
  defaultLocationName?: string;
  onComplete: (siteType: number, streetNames: Record<string, string>) => void;
}

const SiteTypeDrawerContent = ({
  currentSiteType,
  backendSiteType,
  defaultLocationName,
  onComplete,
}: SiteTypeDrawerContentProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState(currentSiteType);

  // Parse location name to get default street names
  // Format: "Street1 @ Street2" or "Street1"
  const defaultParts = (defaultLocationName || "")
    .split("@")
    .map((s) => s.trim());
  const defaultNS = defaultParts[0] || "";
  const defaultEW = defaultParts[1] || defaultParts[0] || "";

  // Get available site types based on backend type
  const availableSiteTypes = getSiteTypesForBackendType(backendSiteType);

  const selectedConfig = getSiteTypeConfig(selectedType);
  const activeDirections = selectedConfig.directions;

  const [streetNames, setStreetNames] = useState<Record<string, string>>(() => {
    const names: Record<string, string> = {};
    ["N", "S", "E", "W"].forEach((d) => {
      if (d === "N" || d === "S") names[d] = defaultNS;
      else names[d] = defaultEW;
    });
    return names;
  });

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleStart = () => {
    const finalNames: Record<string, string> = {};
    activeDirections.forEach((d) => {
      finalNames[d] = streetNames[d] || DIRECTION_FULL_NAMES[d] || d;
    });
    onComplete(selectedType, finalNames);
  };

  const handleCancel = () => {
    closeDrawer("site-type-selector");
  };

  const updateStreetName = (dir: string, value: string) => {
    setStreetNames((prev) => ({ ...prev, [dir]: value }));
  };

  // Step 1: Select site type
  if (step === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TextView style={styles.title}>Site Type</TextView>
          <TouchableOpacity onPress={handleCancel}>
            <X size={24} color={colors.lightGreen} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TextView style={styles.subtitle}>
          Choose the intersection type for this site:
        </TextView>

        <View style={styles.grid}>
          {availableSiteTypes.map((siteType) => (
            <TouchableOpacity
              key={siteType.type}
              style={[
                styles.siteOption,
                selectedType === siteType.type && styles.siteOptionSelected,
              ]}
              onPress={() => setSelectedType(siteType.type)}
              activeOpacity={0.7}
            >
              <IntersectionPreview
                siteType={siteType.type}
                size={70}
                selected={selectedType === siteType.type}
              />
              <TextView
                style={[
                  styles.siteLabel,
                  selectedType === siteType.type && styles.siteLabelSelected,
                ]}
              >
                {siteType.label}
              </TextView>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <TextView style={styles.cancelText}>Cancel</TextView>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <TextView style={styles.nextText}>Next</TextView>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 2: Name each direction
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView style={styles.title}>Name Each Side</TextView>
        <TouchableOpacity onPress={handleCancel}>
          <X size={24} color={colors.lightGreen} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <TextView style={styles.subtitle}>
        Enter a street name for each direction of the intersection:
      </TextView>

      <ScrollView
        style={styles.namesContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview of selected intersection */}
        <View style={styles.previewRow}>
          <IntersectionPreview siteType={selectedType} size={90} selected />
        </View>

        {activeDirections.map((dir) => (
          <View key={dir} style={styles.nameField}>
            <View style={styles.nameLabel}>
              <View style={styles.dirBadge}>
                <TextView style={styles.dirBadgeText}>{dir}</TextView>
              </View>
              <TextView style={styles.dirFullName}>
                {DIRECTION_FULL_NAMES[dir]}
              </TextView>
            </View>
            <TextInput
              style={styles.nameInput}
              value={streetNames[dir]}
              onChangeText={(v) => updateStreetName(dir, v)}
              placeholder={`e.g. ${dir === "N" || dir === "S" ? "Main St" : "Cross Ave"}`}
              placeholderTextColor="rgba(109, 119, 122, 0.4)"
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
          <TextView style={styles.cancelText}>Back</TextView>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleStart}>
          <TextView style={styles.nextText}>Start Counting</TextView>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Hook for using the site type selector
// ═══════════════════════════════════════════════════════════════════════════════

export const useSiteTypeSelector = () => {
  const { openDrawer, closeDrawer } = useDrawer();

  /**
   * Show site type selector drawer
   * @param currentSiteType - Current site type (from user selection or default)
   * @param backendSiteType - Backend site type (siteTypeBackend from work order)
   * @param defaultLocationName - Default location name for street name suggestions
   * @param onComplete - Callback when user completes selection
   */
  const showSiteTypeSelector = (
    currentSiteType: number,
    backendSiteType: number,
    defaultLocationName: string,
    onComplete: (siteType: number, streetNames: Record<string, string>) => void,
  ) => {
    openDrawer(
      "site-type-selector",
      <SiteTypeDrawerContent
        currentSiteType={currentSiteType}
        backendSiteType={backendSiteType}
        defaultLocationName={defaultLocationName}
        onComplete={(siteType, streetNames) => {
          closeDrawer("site-type-selector");
          onComplete(siteType, streetNames);
        }}
      />,
      {
        position: "bottom",
        transitionType: "slide",
        enableGestures: true,
        enableOverlay: true,
        overlayOpacity: 0.6,
      },
    );
  };

  return { showSiteTypeSelector };
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Styles
// ═══════════════════════════════════════════════════════════════════════════════

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    title: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.bold,
      color: theme.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: FontSizes.sm,
      color: theme.secondary,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    siteOption: {
      width: 100,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: "transparent",
      paddingVertical: spacing.xs,
      gap: 4,
    },
    siteOptionSelected: {
      borderColor: colors.lightGreen,
      backgroundColor: "rgba(184,184,120, 0.08)",
    },
    siteLabel: {
      fontSize: FontSizes.xxs,
      color: theme.secondary,
    },
    siteLabelSelected: {
      color: colors.lightGreen,
      fontWeight: FontWeights.semiBold,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: "center",
    },
    cancelText: {
      fontSize: FontSizes.base,
      fontWeight: FontWeights.semiBold,
      color: colors.lightGreen,
    },
    nextButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: colors.lightGreen,
      alignItems: "center",
    },
    nextText: {
      fontSize: FontSizes.base,
      fontWeight: FontWeights.semiBold,
      color: "#FFFFFF",
    },
    // Step 2 styles
    namesContainer: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    previewRow: {
      alignItems: "center",
      marginBottom: spacing.md,
    },
    nameField: {
      marginBottom: spacing.sm,
    },
    nameLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: 6,
    },
    dirBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.lightGreen,
      alignItems: "center",
      justifyContent: "center",
    },
    dirBadgeText: {
      color: "#FFF",
      fontWeight: FontWeights.bold,
      fontSize: FontSizes.sm,
    },
    dirFullName: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.semiBold,
      color: theme.text,
    },
    nameInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      fontSize: FontSizes.sm,
      color: theme.text,
      backgroundColor: theme.background,
      height: scale(36),
    },
  });

export default SiteTypeDrawerContent;
