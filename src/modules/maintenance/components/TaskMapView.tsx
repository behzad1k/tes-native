import React from "react";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { MaintenanceJob } from "@/src/types/models";
import JobDetailForm from "./JobDetailForm";
import MapView, {
  MapPinData,
  MapLegendItem,
} from "@/src/components/layouts/MapView";
import { colors } from "@/src/styles/theme/colors";
import { Wrench, MapPin } from "phosphor-react-native";

interface TaskMapViewProps {
  jobs: MaintenanceJob[];
  supports: any[];
  signs?: any[];
}

const TaskMapView = ({ jobs, supports }: TaskMapViewProps) => {
  const { openDrawer } = useDrawer();

  const jobAssetIds = jobs.flatMap((job) => job.assets.map((a) => a.assetId));

  const jobSupports = supports.filter((s) => jobAssetIds.includes(s.id));

  const jobSigns = supports
    .flatMap((s) => s.signs || [])
    .filter((sign) => jobAssetIds.includes(sign.id));

  const getMarkerColor = (statusName: string) => {
    const lower = statusName.toLowerCase();
    if (lower.includes("complete")) return colors.success;
    if (lower.includes("progress")) return colors.info;
    if (lower.includes("cancel")) return colors.error;
    return colors.warning;
  };

  const supportPins: MapPinData[] = jobSupports
    .filter(
      (s) => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0,
    )
    .map((s) => {
      const job = jobs.find((j) => j.assets.some((a) => a.assetId === s.id));
      const asset = job?.assets.find((a) => a.assetId === s.id);

      return {
        id: `support-${s.id}`,
        coordinate: { latitude: s.latitude, longitude: s.longitude },
        title: s.supportId || "Support",
        description: job?.statusName || "",
        color: getMarkerColor(job?.statusName || ""),
        icon: <MapPin size={20} color={colors.white} weight="fill" />,
        onPress: () => {
          if (job) {
            openDrawer(`job-detail-${job.id}`, <JobDetailForm job={job} />, {
              position: "bottom",
            });
          }
        },
      };
    });

  const signPins: MapPinData[] = jobSigns
    .map((sign) => {
      const support = supports.find(
        (s) => s.signs && s.signs.some((si: any) => si.id === sign.id),
      );
      const job = jobs.find((j) => j.assets.some((a) => a.assetId === sign.id));
      const asset = job?.assets.find((a) => a.assetId === sign.id);

      if (!support || !support.latitude || !support.longitude) return null;

      return {
        id: `sign-${sign.id}`,
        coordinate: {
          latitude: support.latitude,
          longitude: support.longitude,
        },
        title: sign.signId || "Sign",
        description: job?.statusName || "",
        color: getMarkerColor(job?.statusName || ""),
        icon: <Wrench size={20} color={colors.white} weight="bold" />,
        onPress: () => {
          if (job) {
            openDrawer(`job-detail-${job.id}`, <JobDetailForm job={job} />, {
              position: "bottom",
            });
          }
        },
      };
    })
    .filter((pin) => pin !== null);

  const allPins = [...supportPins, ...signPins];

  const legend: MapLegendItem[] = [
    {
      label: "Pending",
      color: colors.warning,
    },
    {
      label: "In Progress",
      color: colors.info,
    },
    {
      label: "Completed",
      color: colors.success,
    },
    {
      label: "Cancelled",
      color: colors.error,
    },
  ];

  return (
    <MapView
      pins={allPins}
      legend={legend}
      mode="view"
      controls={{
        showSearch: true,
        showZoomControls: true,
        showCompass: true,
        showStyleToggle: true,
        showMyLocation: true,
        showLegend: true,
      }}
      showUserLocation={true}
    />
  );
};

export default TaskMapView;
