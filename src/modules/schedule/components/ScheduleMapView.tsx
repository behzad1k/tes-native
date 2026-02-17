import React from "react";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { Task, InspectionTask } from "../types";
import MapView, {
  MapPinData,
  MapLegendItem,
} from "@/src/components/layouts/MapView";
import { colors } from "@/src/styles/theme/colors";
import { MapPin, Clock, CheckCircle } from "phosphor-react-native";
import TaskDetailDrawer from "./TaskDetailDrawer";
import MapViewInspectionTaskDrawer from "./MapViewInspectionTaskDrawer";

interface ScheduleMapViewProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
}

const ScheduleMapView: React.FC<ScheduleMapViewProps> = ({
  tasks,
  onTaskPress,
}) => {
  const { openDrawer } = useDrawer();

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "DONE":
        return colors.lightGreen;
      case "IN_PROGRESS":
        return colors.yellow;
      case "TO_DO":
      default:
        return colors.yellow;
    }
  };

  const getMarkerIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle size={20} color={colors.white} weight="fill" />;
      case "IN_PROGRESS":
        return <Clock size={20} color={colors.white} weight="fill" />;
      default:
        return <MapPin size={20} color={colors.white} weight="fill" />;
    }
  };

  // Create pins from tasks
  const pins: MapPinData[] = tasks
    .filter(
      (task) =>
        task.latitude &&
        task.longitude &&
        task.latitude !== 0 &&
        task.longitude !== 0,
    )
    .map((task) => ({
      id: `task-${task.id}`,
      coordinate: {
        latitude: task.latitude!,
        longitude: task.longitude!,
      },
      title: task.taskNumber,
      description: task.location,
      color: getMarkerColor(task.status),
      icon: getMarkerIcon(task.status),
      onPress: () => {
        // If task has inspection tasks, show the first one
        if (task.inspectionTasks.length > 0) {
          const inspectionTask = task.inspectionTasks[0];
          openDrawer(
            `inspection-task-${inspectionTask.id}`,
            <MapViewInspectionTaskDrawer
              inspectionTask={inspectionTask}
              onClaim={(t) => console.log("Claimed:", t)}
            />,
            { position: "bottom", drawerHeight: "auto" },
          );
        } else {
          openDrawer(
            `task-${task.id}`,
            <TaskDetailDrawer
              task={task}
              onSave={(t) => console.log("Saved:", t)}
              onResume={(t) => console.log("Resume:", t)}
            />,
            { position: "bottom", drawerHeight: "auto" },
          );
        }
      },
    }));

  const legend: MapLegendItem[] = [
    {
      label: "To Do",
      color: colors.yellow,
    },
    {
      label: "In Progress",
      color: colors.yellow,
    },
    {
      label: "Done",
      color: colors.lightGreen,
    },
  ];

  return (
    <MapView
      pins={pins}
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

export default ScheduleMapView;
