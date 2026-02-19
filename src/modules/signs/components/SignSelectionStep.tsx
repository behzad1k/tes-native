import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { Sign } from "@/src/types/models";
import { useAppSelector } from "@/src/store/hooks";
import { colors } from "@/src/styles/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SignsStackParamList } from "@/src/navigation/types";
import { useRouter } from "expo-router";
import { ROUTES } from "@/src/constants/navigation";

interface SignSelectionStepProps {
  selectedSignIds: string[];
  onSignsChange: (signIds: string[]) => void;
  supportId?: string;
}

export default function SignSelectionStep({
  selectedSignIds,
  onSignsChange,
  supportId,
}: SignSelectionStepProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  // Get all signs from Redux store
  const allSigns = useAppSelector((state) => state.signs.signs);
  const signCodes = useAppSelector((state) => state.signs.codes);
  const backendImages = useAppSelector((state) => state.signs.backendImages);
  // Filter signs: show signs without a support OR already assigned to this support

  const availableSigns = useMemo(() => {
    return allSigns.filter((sign) => {
      // Include if sign has no support, or is already assigned to this support
      // const isAvailable = true;
      const isAvailable = !sign.supportId || sign.supportId == supportId;

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const signCode = signCodes.find((c) => c.id === sign.signCodeId);
        const codeMatch = signCode?.name?.toLowerCase().includes(query);
        const idMatch = sign.signId?.toLowerCase().includes(query);
        return isAvailable && (codeMatch || idMatch);
      }

      return isAvailable;
    });
  }, [allSigns, supportId, searchQuery, signCodes]);
  console.log(supportId);
  console.log(allSigns.map((e) => e.supportId));
  // Get selected signs data
  const selectedSigns = useMemo(() => {
    return allSigns.filter((sign) => selectedSignIds.includes(sign.id));
  }, [allSigns, selectedSignIds]);

  const handleToggleSign = useCallback(
    (signId: string) => {
      if (selectedSignIds.includes(signId)) {
        onSignsChange(selectedSignIds.filter((id) => id !== signId));
      } else {
        onSignsChange([...selectedSignIds, signId]);
      }
    },
    [selectedSignIds, onSignsChange],
  );

  const handleRemoveSign = useCallback(
    (signId: string) => {
      onSignsChange(selectedSignIds.filter((id) => id !== signId));
    },
    [selectedSignIds, onSignsChange],
  );

  const handleAddNewSign = useCallback(() => {
    // Navigate to sign creation screen with callback to add the new sign
    router.push(`${ROUTES.SIGN_CREATE}?preselectedSupportId=${supportId}`, {
      // onSignsChange([...selectedSignIds, newSignId]);
    });
  }, [router, supportId, selectedSignIds, onSignsChange]);

  const getSignCode = useCallback(
    (signCodeId: string | undefined) => {
      if (!signCodeId) return null;
      return signCodes.find((c) => c.id === signCodeId);
    },
    [signCodes],
  );

  const getSignImage = useCallback(
    (sign: Sign) => {
      // First try local images
      if (sign.images && sign.images.length > 0) {
        return { uri: sign.images[0].localPath };
      }
      // Then try backend images
      const backendImage = backendImages[sign.id];
      if (backendImage) {
        return { uri: backendImage };
      }
      return null;
    },
    [backendImages],
  );

  const renderSignItem = useCallback(
    ({ item: sign }: { item: Sign }) => {
      const isSelected = selectedSignIds.includes(sign.id);
      const signCode = getSignCode(sign.signCodeId);
      const imageSource = getSignImage(sign);

      return (
        <TouchableOpacity
          style={[styles.signItem, isSelected && styles.signItemSelected]}
          onPress={() => handleToggleSign(sign.id)}
          activeOpacity={0.7}
        >
          <View style={styles.signItemContent}>
            {/* Checkbox */}
            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              )}
            </View>

            {/* Sign Image */}
            <View style={styles.signImageContainer}>
              {imageSource ? (
                <Image source={imageSource} style={styles.signImage} />
              ) : (
                <View style={styles.signImagePlaceholder}>
                  <Ionicons
                    name="warning-outline"
                    size={24}
                    color={colors.lightGrey}
                  />
                </View>
              )}
            </View>

            {/* Sign Info */}
            <View style={styles.signInfo}>
              <TextView style={styles.signId}>
                {sign.signId || t("signs.newSign")}
              </TextView>
              <TextView style={styles.signCode}>
                {signCode?.name || t("signs.unknownCode")}
              </TextView>
              {sign.conditionId && (
                <TextView style={styles.signCondition}>
                  {t("condition")}: {sign.conditionId}
                </TextView>
              )}
            </View>

            {/* Sync Status */}
            {!sign.isSynced && (
              <View style={styles.unsyncedBadge}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={14}
                  color={colors.warning}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedSignIds, styles, handleToggleSign, getSignCode, getSignImage, t],
  );

  const renderSelectedSign = useCallback(
    (sign: Sign) => {
      const signCode = getSignCode(sign.signCodeId);
      const imageSource = getSignImage(sign);

      return (
        <View key={sign.id} style={styles.selectedSignItem}>
          {/* Sign Image */}
          <View style={styles.selectedSignImageContainer}>
            {imageSource ? (
              <Image source={imageSource} style={styles.selectedSignImage} />
            ) : (
              <View style={styles.selectedSignImagePlaceholder}>
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={colors.lightGrey}
                />
              </View>
            )}
          </View>

          {/* Sign Info */}
          <View style={styles.selectedSignInfo}>
            <TextView style={styles.selectedSignId}>
              {sign.signId || t("signs.newSign")}
            </TextView>
            <TextView style={styles.selectedSignCode}>
              {signCode?.name || ""}
            </TextView>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveSign(sign.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      );
    },
    [styles, getSignCode, getSignImage, handleRemoveSign, t],
  );

  return (
    <View style={styles.container}>
      {/* Selected Signs Section */}
      {selectedSigns.length > 0 && (
        <View style={styles.selectedSection}>
          <TextView style={styles.sectionTitle}>
            {t("supports.selectedSigns")} ({selectedSigns.length})
          </TextView>
          <View style={styles.selectedSignsList}>
            {selectedSigns.map(renderSelectedSign)}
          </View>
        </View>
      )}

      {/* Add New Sign Button */}
      <ButtonView
        onPress={handleAddNewSign}
        variant="outline"
        // icon={<Ionicons name="add" size={20} color={colors.primary} />}
        style={styles.addButton}
      >
        {t("signs.addNewSign")}
      </ButtonView>

      {/* Available Signs Section */}
      <View style={styles.availableSection}>
        <TextView style={styles.sectionTitle}>
          {t("supports.availableSigns")}
        </TextView>

        {/* Search Input */}
        {/*<Te
					id="search-signs"
					placeholder={t("signs.searchSigns")}
					value={searchQuery}
          onChangeText={setSearchQuery}
					// leftIcon={
					// 	<Ionicons name="search" size={20} color={colors.gray400} />
					// }
					style={styles.searchInput}
				/>*/}

        {/* Signs List */}
        {availableSigns.length > 0 ? (
          <FlatList
            data={availableSigns}
            renderItem={renderSignItem}
            keyExtractor={(item) => item.id}
            style={styles.signsList}
            contentContainerStyle={styles.signsListContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="warning-outline"
              size={48}
              color={colors.lightGrey}
            />
            <TextView style={styles.emptyStateText}>
              {searchQuery
                ? t("signs.noSignsFound")
                : t("signs.noAvailableSigns")}
            </TextView>
            <TextView style={styles.emptyStateSubtext}>
              {t("signs.createNewSignPrompt")}
            </TextView>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.md,
    },
    selectedSection: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: spacing.sm,
    },
    selectedSignsList: {
      gap: spacing.sm,
    },
    selectedSignItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary + "40",
    },
    selectedSignImageContainer: {
      width: scale(50),
      height: scale(50),
      borderRadius: 8,
      overflow: "hidden",
      marginRight: spacing.sm,
    },
    selectedSignImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    selectedSignImagePlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
    },
    selectedSignInfo: {
      flex: 1,
    },
    selectedSignId: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    selectedSignCode: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    removeButton: {
      padding: spacing.xs,
    },
    addButton: {
      marginBottom: spacing.lg,
    },
    availableSection: {
      flex: 1,
    },
    searchInput: {
      marginBottom: spacing.sm,
    },
    signsList: {
      flex: 1,
    },
    signsListContent: {
      paddingBottom: spacing.xl,
    },
    signItem: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    signItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "10",
    },
    signItemContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkbox: {
      width: scale(24),
      height: scale(24),
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.border,
      marginRight: spacing.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    signImageContainer: {
      width: scale(60),
      height: scale(60),
      borderRadius: 8,
      overflow: "hidden",
      marginRight: spacing.sm,
    },
    signImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    signImagePlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
    },
    signInfo: {
      flex: 1,
    },
    signId: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    signCode: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    signCondition: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    unsyncedBadge: {
      padding: spacing.xs,
    },
    separator: {
      height: spacing.sm,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: spacing.xl,
    },
    emptyStateText: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.textSecondary,
      marginTop: spacing.md,
      textAlign: "center",
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: spacing.xs,
      textAlign: "center",
    },
  });
