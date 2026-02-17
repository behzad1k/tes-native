import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { UseFormGetValues } from "react-hook-form";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import { CollisionFormData } from "../../../types";
import { InvolvedAsType } from "@/src/types/models";
import { colors } from "@/src/styles/theme/colors";
import {
  MapPin,
  Car,
  Users,
  Image as ImageIcon,
  Note,
  PencilSimple,
  CheckCircle,
  Warning,
} from "phosphor-react-native";

interface ReviewStepProps {
  getValues: UseFormGetValues<CollisionFormData>;
  onEditStep: (step: number) => void;
  errors: any;
}

const ReviewStep = ({ getValues, onEditStep, errors }: ReviewStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const formData = getValues();
  const { general, roads, vehicles, persons, images, remark } = formData;

  // Get involved type label
  const getInvolvedTypeLabel = (type: InvolvedAsType) => {
    switch (type) {
      case InvolvedAsType.DRIVER:
        return t("collision.driver");
      case InvolvedAsType.PASSENGER:
        return t("collision.passenger");
      case InvolvedAsType.PEDESTRIAN:
        return t("collision.pedestrian");
      default:
        return t("collision.other");
    }
  };

  // Get vehicle label by id
  const getVehicleLabel = (vehicleId?: string) => {
    if (!vehicleId) return null;
    const vehicle = vehicles?.find((v) => v.id === vehicleId);
    return vehicle ? `Vehicle #${vehicle.index}` : null;
  };

  // Check if a section has errors
  const hasErrors = (section: string) => {
    return errors && errors[section];
  };

  // Check if section is complete
  const isSectionComplete = (section: string) => {
    switch (section) {
      case "general":
        return general && Object.keys(general).length > 0;
      case "roads":
        return roads && roads.length > 0;
      case "vehicles":
        return vehicles && vehicles.length > 0;
      case "persons":
        return persons && persons.length > 0;
      case "images":
        return images && images.length > 0;
      case "remark":
        return remark && Object.keys(remark).length > 0;
      default:
        return false;
    }
  };

  // Get image source
  const getImageSource = (image: any) => {
    if (image.localPath) return { uri: image.localPath };
    if (image.serverPath) return { uri: image.serverPath };
    return null;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <TextView style={styles.title}>{t("collision.reviewTitle")}</TextView>
        <TextView style={styles.subtitle}>
          {t("collision.reviewSubtitle")}
        </TextView>
      </View>

      {/* General Information Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => onEditStep(0)}
        >
          <View style={styles.sectionIconContainer}>
            <MapPin size={20} color={colors.lightGreen} />
          </View>
          <TextView style={styles.sectionTitle}>
            {t("collision.generalInformation")}
          </TextView>
          <View style={styles.sectionStatus}>
            {isSectionComplete("general") ? (
              <CheckCircle size={20} color={colors.success} weight="fill" />
            ) : (
              <Warning size={20} color={colors.warning} />
            )}
            <PencilSimple size={16} color={colors.lightGreen} />
          </View>
        </TouchableOpacity>
        <View style={styles.sectionContent}>
          {general && Object.keys(general).length > 0 ? (
            <>
              {Object.entries(general)
                .slice(0, 5)
                .map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <TextView style={styles.detailLabel}>{key}:</TextView>
                    <TextView style={styles.detailValue}>
                      {String(value)}
                    </TextView>
                  </View>
                ))}
              {Object.keys(general).length > 5 && (
                <TextView style={styles.moreText}>
                  +{Object.keys(general).length - 5} {t("common.more")}
                </TextView>
              )}
            </>
          ) : (
            <TextView style={styles.emptyText}>
              {t("collision.noGeneralInfo")}
            </TextView>
          )}
          {/*{mapLocation && (
            <View style={styles.locationInfo}>
              <MapPin size={14} color={theme.textSecondary} />
              <TextView style={styles.locationText}>
                {mapLocation.latitude.toFixed(6)},{" "}
                {mapLocation.longitude.toFixed(6)}
              </TextView>
            </View>
          )}*/}
        </View>
      </View>

      {/* Roads Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => onEditStep(1)}
        >
          <View style={styles.sectionIconContainer}>
            {/*<Road size={20} color={colors.info} />*/}
          </View>
          <TextView style={styles.sectionTitle}>
            {t("collision.roads")} ({roads?.length || 0})
          </TextView>
          <View style={styles.sectionStatus}>
            {isSectionComplete("roads") ? (
              <CheckCircle size={20} color={colors.success} weight="fill" />
            ) : (
              <Warning size={20} color={colors.warning} />
            )}
            <PencilSimple size={16} color={colors.lightGreen} />
          </View>
        </TouchableOpacity>
        <View style={styles.sectionContent}>
          {roads && roads.length > 0 ? (
            roads.map((road) => (
              <View key={road.id} style={styles.itemCard}>
                <TextView style={styles.itemTitle}>
                  {t("collision.road")} #{road.index}
                </TextView>
                {Object.entries(road)
                  .filter(([key]) => !["id", "index"].includes(key))
                  .slice(0, 2)
                  .map(([key, value]) => (
                    <TextView key={key} style={styles.itemDetail}>
                      {key}: {String(value)}
                    </TextView>
                  ))}
              </View>
            ))
          ) : (
            <TextView style={styles.emptyText}>
              {t("collision.noRoads")}
            </TextView>
          )}
        </View>
      </View>

      {/* Vehicles Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => onEditStep(2)}
        >
          <View style={styles.sectionIconContainer}>
            <Car size={20} color={colors.warning} />
          </View>
          <TextView style={styles.sectionTitle}>
            {t("collision.vehicles")} ({vehicles?.length || 0})
          </TextView>
          <View style={styles.sectionStatus}>
            {isSectionComplete("vehicles") ? (
              <CheckCircle size={20} color={colors.success} weight="fill" />
            ) : (
              <Warning size={20} color={colors.warning} />
            )}
            <PencilSimple size={16} color={colors.lightGreen} />
          </View>
        </TouchableOpacity>
        <View style={styles.sectionContent}>
          {vehicles && vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.itemCard}>
                <TextView style={styles.itemTitle}>
                  {t("collision.vehicle")} #{vehicle.index}
                </TextView>
                {Object.entries(vehicle)
                  .filter(([key]) => !["id", "index"].includes(key))
                  .slice(0, 2)
                  .map(([key, value]) => (
                    <TextView key={key} style={styles.itemDetail}>
                      {key}: {String(value)}
                    </TextView>
                  ))}
              </View>
            ))
          ) : (
            <TextView style={styles.emptyText}>
              {t("collision.noVehicles")}
            </TextView>
          )}
        </View>
      </View>

      {/* People Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => onEditStep(3)}
        >
          <View style={styles.sectionIconContainer}>
            <Users size={20} color={colors.error} />
          </View>
          <TextView style={styles.sectionTitle}>
            {t("collision.persons")} ({persons?.length || 0})
          </TextView>
          <View style={styles.sectionStatus}>
            {isSectionComplete("persons") ? (
              <CheckCircle size={20} color={colors.success} weight="fill" />
            ) : (
              <Warning size={20} color={colors.warning} />
            )}
            <PencilSimple size={16} color={colors.lightGreen} />
          </View>
        </TouchableOpacity>
        <View style={styles.sectionContent}>
          {persons && persons.length > 0 ? (
            persons.map((person) => (
              <View key={person.id} style={styles.itemCard}>
                <TextView style={styles.itemTitle}>
                  {getInvolvedTypeLabel(person.involvedAs)}
                </TextView>
                {person.vehicleId && (
                  <TextView style={styles.itemDetail}>
                    {getVehicleLabel(person.vehicleId)}
                  </TextView>
                )}
              </View>
            ))
          ) : (
            <TextView style={styles.emptyText}>
              {t("collision.noPersons")}
            </TextView>
          )}
        </View>
      </View>

      {/* Pictures Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => onEditStep(4)}
        >
          <View style={styles.sectionIconContainer}>
            <ImageIcon size={20} color={colors.darkPink} />
          </View>
          <TextView style={styles.sectionTitle}>
            {t("collision.pictures")} ({images?.length || 0})
          </TextView>
          <View style={styles.sectionStatus}>
            <PencilSimple size={16} color={colors.lightGreen} />
          </View>
        </TouchableOpacity>
        <View style={styles.sectionContent}>
          {images && images.length > 0 ? (
            <View style={styles.imagesRow}>
              {images.slice(0, 4).map((image) => {
                const source = getImageSource(image);
                return (
                  <View key={image.imageId} style={styles.thumbnailContainer}>
                    {source ? (
                      <Image source={source} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <ImageIcon size={16} color={colors.lightGrey} />
                      </View>
                    )}
                    {!image.isSynced && <View style={styles.unsyncedDot} />}
                  </View>
                );
              })}
              {images.length > 4 && (
                <View style={styles.moreImages}>
                  <TextView style={styles.moreImagesText}>
                    +{images.length - 4}
                  </TextView>
                </View>
              )}
            </View>
          ) : (
            <TextView style={styles.emptyText}>
              {t("collision.noPictures")}
            </TextView>
          )}
        </View>
      </View>

      {/* Remarks Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => onEditStep(5)}
        >
          <View style={styles.sectionIconContainer}>
            <Note size={20} color={colors.blue} />
          </View>
          <TextView style={styles.sectionTitle}>
            {t("collision.remarks")}
          </TextView>
          <View style={styles.sectionStatus}>
            {isSectionComplete("remark") ? (
              <CheckCircle size={20} color={colors.success} weight="fill" />
            ) : (
              <Warning size={20} color={colors.warning} />
            )}
            <PencilSimple size={16} color={colors.lightGreen} />
          </View>
        </TouchableOpacity>
        <View style={styles.sectionContent}>
          {remark && Object.keys(remark).length > 0 ? (
            Object.entries(remark)
              .slice(0, 3)
              .map(([key, value]) => (
                <View key={key} style={styles.detailRow}>
                  <TextView style={styles.detailLabel}>{key}:</TextView>
                  <TextView style={styles.detailValue} numberOfLines={2}>
                    {String(value)}
                  </TextView>
                </View>
              ))
          ) : (
            <TextView style={styles.emptyText}>
              {t("collision.noRemarks")}
            </TextView>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
      paddingBottom: 120,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    section: {
      backgroundColor: theme.background,
      borderRadius: 12,
      marginBottom: spacing.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sectionIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    sectionTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    sectionStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    sectionContent: {
      padding: spacing.md,
    },
    detailRow: {
      flexDirection: "row",
      marginBottom: spacing.xs,
    },
    detailLabel: {
      fontSize: 13,
      color: theme.textSecondary,
      width: 120,
    },
    detailValue: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
    },
    locationInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    locationText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    itemCard: {
      backgroundColor: theme.background,
      padding: spacing.sm,
      borderRadius: 8,
      marginBottom: spacing.xs,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    itemDetail: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    emptyText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontStyle: "italic",
    },
    moreText: {
      fontSize: 12,
      color: colors.lightGreen,
      marginTop: spacing.xs,
    },
    imagesRow: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    thumbnailContainer: {
      position: "relative",
    },
    thumbnail: {
      width: 50,
      height: 50,
      borderRadius: 6,
    },
    thumbnailPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 6,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    unsyncedDot: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.warning,
    },
    moreImages: {
      width: 50,
      height: 50,
      borderRadius: 6,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    moreImagesText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
    },
  });

export default ReviewStep;
