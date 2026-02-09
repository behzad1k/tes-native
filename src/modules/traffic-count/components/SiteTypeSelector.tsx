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
import ButtonView from "@/src/components/ui/ButtonView";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { X } from "phosphor-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Site types representing different intersection configurations:
 * 1 = Full 4-way intersection (N, S, E, W)
 * 2 = T-intersection missing East  (N, S, W)
 * 3 = T-intersection missing West  (N, S, E)
 * 4 = T-intersection missing North (S, E, W)
 * 5 = T-intersection missing South (N, E, W)
 */

export type SiteTypeConfig = {
  type: number;
  directions: string[];
  label: string;
};

export const SITE_TYPES: SiteTypeConfig[] = [
  { type: 1, directions: ["N", "S", "E", "W"], label: "4-Way" },
  { type: 2, directions: ["N", "S", "W"], label: "T (No East)" },
  { type: 3, directions: ["N", "S", "E"], label: "T (No West)" },
  { type: 4, directions: ["S", "E", "W"], label: "T (No North)" },
  { type: 5, directions: ["N", "E", "W"], label: "T (No South)" },
];

export const getSiteTypeConfig = (siteType: number): SiteTypeConfig => {
  return SITE_TYPES.find((st) => st.type === siteType) || SITE_TYPES[0];
};

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
  defaultLocationName?: string;
  onComplete: (siteType: number, streetNames: Record<string, string>) => void;
}

const SiteTypeDrawerContent = ({
  currentSiteType,
  defaultLocationName,
  onComplete,
}: SiteTypeDrawerContentProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState(currentSiteType);

  // Parse default street names from location
  const defaultParts = (defaultLocationName || "")
    .split("@")
    .map((s) => s.trim());
  const defaultNS = defaultParts[0] || "";
  const defaultEW = defaultParts[1] || "";

  const selectedConfig = getSiteTypeConfig(selectedType);
  const activeDirections = selectedConfig.directions;

  // Street name state for each direction
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
    // Only pass names for active directions
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

  // ── Step 1: Site type selection ──────────────────────────────────────
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
          {SITE_TYPES.map((siteType) => (
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

  // ── Step 2: Name each direction ──────────────────────────────────────
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
//  Hook to open the site type selector drawer
// ═══════════════════════════════════════════════════════════════════════════════

export const useSiteTypeSelector = () => {
  const { openDrawer, closeDrawer } = useDrawer();

  const showSiteTypeSelector = (
    currentSiteType: number,
    defaultLocationName: string,
    onComplete: (siteType: number, streetNames: Record<string, string>) => void,
  ) => {
    openDrawer(
      "site-type-selector",
      <SiteTypeDrawerContent
        currentSiteType={currentSiteType}
        defaultLocationName={defaultLocationName}
        onComplete={(siteType, streetNames) => {
          closeDrawer("site-type-selector");
          onComplete(siteType, streetNames);
        }}
      />,
      {
        position: "bottom",
        transitionType: "slide",
        drawerHeight: SCREEN_HEIGHT * 0.7,
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
