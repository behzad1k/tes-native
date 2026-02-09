import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

// Mini intersection preview for selector
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
      {/* Roads as gray lines with curves at corners */}
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
      {/* Center dashed lines */}
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
      {/* Corner curves where roads DON'T exist */}
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

interface SiteTypeSelectorProps {
  visible: boolean;
  currentSiteType: number;
  onSelect: (siteType: number) => void;
  onCancel: () => void;
}

const SiteTypeSelector = ({
  visible,
  currentSiteType,
  onSelect,
  onCancel,
}: SiteTypeSelectorProps) => {
  const styles = useThemedStyles(createStyles);
  const [selectedType, setSelectedType] = useState(currentSiteType);

  const handleNext = () => {
    onSelect(selectedType);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TextView style={styles.title}>Site Type :</TextView>
          <View style={styles.divider} />
          <TextView style={styles.subtitle}>
            Please choose the site type you want to work with :
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
                  size={80}
                  selected={selectedType === siteType.type}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <TextView style={styles.cancelText}>Cancel</TextView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <TextView style={styles.nextText}>Next</TextView>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    modal: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      width: SCREEN_WIDTH * 0.85,
      padding: spacing.lg,
    },
    title: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.bold,
      color: "#1A1A1A",
      marginBottom: spacing.xs,
    },
    divider: {
      height: 1,
      backgroundColor: "#E0E0E0",
      marginBottom: spacing.md,
    },
    subtitle: {
      fontSize: FontSizes.sm,
      color: "#666",
      marginBottom: spacing.lg,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    siteOption: {
      width: 100,
      height: 100,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    siteOptionSelected: {
      borderColor: colors.lightGreen,
      backgroundColor: "rgba(184,184,120, 0.08)",
    },
    actions: {
      flexDirection: "row",
      gap: spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: "#E0E0E0",
      alignItems: "center",
    },
    cancelText: {
      fontSize: FontSizes.md,
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
      fontSize: FontSizes.md,
      fontWeight: FontWeights.semiBold,
      color: "#FFFFFF",
    },
  });

export default SiteTypeSelector;
