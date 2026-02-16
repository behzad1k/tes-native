import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
  Text,
  useWindowDimensions,
} from "react-native";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import { useLocalSearchParams, router } from "expo-router";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import {
  addCountToWorkOrder,
  removeLastCountFromWorkOrder,
} from "@/src/store/slices/trafficCountSlice";
import { TrafficCount } from "../types";
import { getVehicleIcon } from "../components/VehicleIcons";
import { getSiteTypeConfig } from "../components/SiteTypeSelector";
import {
  ArrowLeft,
  PencilSimple,
  Prohibit,
  SpeakerHigh,
  Vibrate,
  DeviceRotate,
  ArrowCounterClockwise,
  ArrowClockwise,
} from "phosphor-react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { VehicleType } from "@/src/store/slices/appData";
import {
  useTrafficCountOperations,
  useVehicleTypes,
} from "../hooks/useTrafficCountOperations";

type Direction = "N" | "S" | "E" | "W";

interface DropZone {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
}

interface DragInfo {
  isDragging: boolean;
  originDirection: Direction | null;
  classificationId: string | null;
  classificationName: string | null;
}

interface RecordEntry {
  id: string;
  from: Direction;
  to: Direction;
  vehicle: string;
  vehicleId: string;
  timestamp: number;
}

const getStreetNames = (locationName: string): { ns: string; ew: string } => {
  const parts = locationName.split("@").map((s) => s.trim());
  return { ns: parts[0] || "Main St", ew: parts[1] || "Cross St" };
};

const FAST_SPRING = { damping: 40, stiffness: 600, mass: 0.3 };
const DRAG_START_SPRING = { damping: 20, stiffness: 400 };

const FALLBACK_VEHICLE_TYPES: VehicleType[] = [
  {
    id: "fb_1",
    name: "Scooter",
    icon: "Scooter",
    isPedestrian: false,
    sortOrder: 1,
  },
  { id: "fb_2", name: "Car", icon: "Car", isPedestrian: false, sortOrder: 2 },
  {
    id: "fb_3",
    name: "Truck",
    icon: "Truck",
    isPedestrian: false,
    sortOrder: 3,
  },
  { id: "fb_4", name: "Van", icon: "Van", isPedestrian: false, sortOrder: 4 },
  {
    id: "fb_5",
    name: "Bicycle",
    icon: "Cyclist",
    isPedestrian: false,
    sortOrder: 5,
  },
];

export default function TrafficCounterScreen() {
  const dispatch = useAppDispatch();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const params = useLocalSearchParams<{
    workOrderId: string;
    siteType: string;
    streetNames: string;
  }>();
  const workOrderId = params.workOrderId;
  const siteType = parseInt(params.siteType || "1", 10);
  const defaultCustomerId = useAppSelector(
    (state) => state.auth.user.defaultCustomerId,
  );
  const {
    getWorkOrderById,
    recordMovement,
    removeCount,
    getCountsForWorkOrder,
  } = useTrafficCountOperations();

  const { vehicleTypes, pedestrianTypes } = useVehicleTypes();

  const workOrder = getWorkOrderById(workOrderId);
  const counts = getCountsForWorkOrder(workOrderId);

  const customStreetNames = useMemo(() => {
    if (params.streetNames) {
      try {
        return JSON.parse(params.streetNames) as Record<string, string>;
      } catch {
        return null;
      }
    }
    return null;
  }, [params.streetNames]);

  const siteConfig = getSiteTypeConfig(siteType);
  const activeDirections = siteConfig.directions as Direction[];

  const defaultStreetNames = useMemo(
    () => getStreetNames(workOrder?.locationName || "RAINBOW DR @ STAR AV"),
    [workOrder?.locationName],
  );

  const directionLabels = useMemo(() => {
    if (customStreetNames) {
      return customStreetNames;
    }
    const labels: Record<string, string> = {};
    activeDirections.forEach((d) => {
      if (d === "N" || d === "S") labels[d] = defaultStreetNames.ns;
      else labels[d] = defaultStreetNames.ew;
    });
    return labels;
  }, [customStreetNames, activeDirections, defaultStreetNames]);

  const [hasBeenLandscape, setHasBeenLandscape] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);

  const rotateDirectionsClockwise = useCallback(() => {
    setRotationOffset((prev) => (prev + 1) % 4);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const rotateDirection = useCallback(
    (dir: Direction): Direction => {
      const order: Direction[] = ["N", "E", "S", "W"];
      const idx = order.indexOf(dir);
      return order[(idx + rotationOffset) % 4];
    },
    [rotationOffset],
  );

  const inverseRotateDirection = useCallback(
    (dir: Direction): Direction => {
      const order: Direction[] = ["N", "E", "S", "W"];
      const idx = order.indexOf(dir);
      return order[(idx - rotationOffset + 4) % 4];
    },
    [rotationOffset],
  );

  const rotatedDirections = useMemo(() => {
    return activeDirections.map(rotateDirection);
  }, [activeDirections, rotateDirection]);

  const rotatedDirectionLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    activeDirections.forEach((originalDir) => {
      const rotatedDir = rotateDirection(originalDir);
      labels[rotatedDir] = directionLabels[originalDir];
    });
    return labels;
  }, [activeDirections, directionLabels, rotateDirection]);

  // Maps screen position (N/E/S/W) to the original direction letter to display
  const originalDirectionAtPosition = useMemo(() => {
    const mapping: Record<string, Direction> = {};
    activeDirections.forEach((originalDir) => {
      const screenPosition = rotateDirection(originalDir);
      mapping[screenPosition] = originalDir;
    });
    return mapping;
  }, [activeDirections, rotateDirection]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  useEffect(() => {
    if (isLandscape && !hasBeenLandscape) {
      setHasBeenLandscape(true);
    }
  }, [isLandscape, hasBeenLandscape]);

  const [elapsed, setElapsed] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${ss}`;
  };

  type FeedbackMode = "vibrate" | "sound" | "none";
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("vibrate");
  const feedbackModeRef = useRef<FeedbackMode>("vibrate");
  useEffect(() => {
    feedbackModeRef.current = feedbackMode;
  }, [feedbackMode]);

  const cycleFeedbackMode = useCallback(() => {
    setFeedbackMode((prev) => {
      if (prev === "vibrate") return "sound";
      if (prev === "sound") return "none";
      return "vibrate";
    });
  }, []);

  const triggerFeedback = useCallback((type: "drag" | "drop") => {
    const mode = feedbackModeRef.current;
    if (mode === "vibrate") {
      if (type === "drag") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, []);

  const dragRef = useRef<DragInfo>({
    isDragging: false,
    originDirection: null,
    classificationId: null,
    classificationName: null,
  });
  const [dragUi, setDragUi] = useState<DragInfo>(dragRef.current);

  const recordHistoryRef = useRef<RecordEntry[]>([]);

  const [lastRecord, setLastRecord] = useState<RecordEntry | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((record: RecordEntry) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setLastRecord(record);
    toastTimerRef.current = setTimeout(() => {
      setLastRecord((current) => {
        if (current?.id === record.id) return null;
        return current;
      });
    }, 2500);
  }, []);

  const dropZonesRef = useRef<DropZone[]>([]);

  useEffect(() => {
    const zones: DropZone[] = [];
    const cx = width / 2;
    const cy = height / 2;
    const zs = Math.min(width, height) * 0.25;

    if (rotatedDirections.includes("N"))
      zones.push({
        direction: "N",
        x: cx - zs,
        y: 0,
        width: zs * 2,
        height: cy - zs * 0.2,
      });
    if (rotatedDirections.includes("S"))
      zones.push({
        direction: "S",
        x: cx - zs,
        y: cy + zs * 0.2,
        width: zs * 2,
        height: height - cy - zs * 0.2,
      });
    if (rotatedDirections.includes("W"))
      zones.push({
        direction: "W",
        x: 0,
        y: cy - zs,
        width: cx - zs * 0.2,
        height: zs * 2,
      });
    if (rotatedDirections.includes("E"))
      zones.push({
        direction: "E",
        x: cx + zs * 0.2,
        y: cy - zs,
        width: width - cx - zs * 0.2,
        height: zs * 2,
      });

    dropZonesRef.current = zones;
  }, [rotatedDirections, width, height]);

  const findDropZone = useCallback((x: number, y: number): Direction | null => {
    for (const z of dropZonesRef.current) {
      if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height)
        return z.direction;
    }
    return null;
  }, []);
  const handleVehicleCount = useCallback(
    (
      fromDirection: string,
      toDirection: string,
      classificationId: string,
      classificationName: string,
    ) => {
      // Convert rotated directions back to original directions for recording
      const originalFrom = inverseRotateDirection(fromDirection as Direction);
      const originalTo = inverseRotateDirection(toDirection as Direction);

      triggerFeedback("drop");

      recordMovement(
        workOrderId,
        originalFrom,
        originalTo,
        classificationId,
        classificationName,
        { lat: workOrder?.latitude, long: workOrder?.longitude },
        defaultCustomerId,
        workOrder?.aggregationInterval,
      );

      setTotalCount((p) => p + 1);

      const countId = uuidv4();
      const record: RecordEntry = {
        id: countId,
        from: originalFrom,
        to: originalTo,
        vehicle: classificationName,
        vehicleId: classificationId,
        timestamp: Date.now(),
      };
      recordHistoryRef.current.push(record);
      showToast(record);
    },
    [
      inverseRotateDirection,
      triggerFeedback,
      recordMovement,
      workOrderId,
      workOrder,
      defaultCustomerId,
      showToast,
    ],
  );

  // const recordMovement = useCallback(
  //   (from: Direction, to: Direction, classId: string, className: string) => {
  //     if (from === to) return;
  //     triggerFeedback("drop");

  //     const countId = uuidv4();
  //     const newCount: TrafficCount = {
  //       id: countId,
  //       siteId: workOrder?.studyId || "",
  //       isSynced: false,
  //       videoId: "",
  //       lat: workOrder?.latitude || 0,
  //       long: workOrder?.longitude || 0,
  //       userId: "current-user",
  //       dateTime: new Date().toISOString(),
  //       slot: workOrder?.aggregationInterval || 15,
  //       movements: { [`${from}_${to}`]: { [classId]: 1 } },
  //       classificationId: classId,
  //       classificationName: className,
  //     };

  //     dispatch(addCountToWorkOrder({ workOrderId, count: newCount }));
  //     setTotalCount((p) => p + 1);

  //     const record: RecordEntry = {
  //       id: countId,
  //       from,
  //       to,
  //       vehicle: className,
  //       vehicleId: classId,
  //       timestamp: Date.now(),
  //     };
  //     recordHistoryRef.current.push(record);
  //     showToast(record);
  //   },
  //   [dispatch, workOrderId, workOrder, showToast, triggerFeedback],
  // );

  const handleUndo = useCallback(() => {
    const history = recordHistoryRef.current;
    if (history.length === 0) return;

    const lastEntry = history.pop()!;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeCount(workOrderId, lastEntry.id);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setLastRecord(null);
  }, [dispatch, workOrderId]);

  const onDragStartCb = useCallback(
    (dir: Direction, classId: string, className: string) => {
      dragRef.current = {
        isDragging: true,
        originDirection: dir,
        classificationId: classId,
        classificationName: className,
      };
      setDragUi({ ...dragRef.current });
      triggerFeedback("drag");
    },
    [triggerFeedback],
  );

  const onDragEndCb = useCallback(() => {
    dragRef.current = {
      isDragging: false,
      originDirection: null,
      classificationId: null,
      classificationName: null,
    };
    setDragUi({ ...dragRef.current });
  }, []);

  const onDropCb = useCallback(
    (fromDir: Direction, absX: number, absY: number) => {
      const toDir = findDropZone(absX, absY);
      const d = dragRef.current;
      if (
        toDir &&
        toDir !== fromDir &&
        d.classificationId &&
        d.classificationName
      ) {
        handleVehicleCount(
          fromDir,
          toDir,
          d.classificationId,
          d.classificationName,
        );
      }
    },
    [findDropZone, recordMovement],
  );

  const vehicleRows = useMemo(() => {
    const nonPed = vehicleTypes.filter((v) => !v.isPedestrian);
    const ped = vehicleTypes.filter((v) => v.isPedestrian);

    const row1 = nonPed
      .slice(0, 3)
      .map((v) => ({ id: v.id, name: v.name, icon: v.icon }));
    const row2 = [...ped, ...nonPed.slice(3)].map((v) => ({
      id: v.id,
      name: v.name,
      icon: v.icon,
    }));

    return { row1, row2 };
  }, [vehicleTypes]);

  if (!isLandscape && !hasBeenLandscape) {
    return (
      <GestureHandlerRootView style={portraitGuard.root}>
        <StatusBar hidden />
        <View style={portraitGuard.container}>
          <DeviceRotate size={64} color="#C4A635" weight="light" />
          <Text style={portraitGuard.title}>Rotate Your Device</Text>
          <Text style={portraitGuard.sub}>
            Please rotate to landscape mode{"\n"}to use the Traffic Counter
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={portraitGuard.backBtn}
          >
            <Text style={portraitGuard.backText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!isLandscape && hasBeenLandscape) {
    return (
      <GestureHandlerRootView style={portraitGuard.root}>
        <StatusBar hidden />
        <View style={portraitGuard.container}>
          <DeviceRotate size={64} color="#C4A635" weight="light" />
          <Text style={portraitGuard.title}>Rotate Your Device</Text>
          <Text style={portraitGuard.sub}>
            Please rotate back to landscape mode
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={portraitGuard.backBtn}
          >
            <Text style={portraitGuard.backText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    );
  }

  const renderVehicles = (dir: Direction) => (
    <>
      <VehicleRow
        direction={dir}
        vehicles={vehicleRows.row1}
        onDragStart={onDragStartCb}
        onDragEnd={onDragEndCb}
        onDrop={onDropCb}
      />
      <VehicleRow
        direction={dir}
        vehicles={vehicleRows.row2}
        onDragStart={onDragStartCb}
        onDragEnd={onDragEndCb}
        onDrop={onDropCb}
      />
    </>
  );

  return (
    <GestureHandlerRootView style={s.root}>
      <StatusBar hidden />
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={22} color="#D4D4B0" />
          </TouchableOpacity>
          <View>
            <Text style={s.countText}>{totalCount}</Text>
            <Text style={s.timerText}>{fmt(elapsed)}</Text>
            <Text style={s.dateText}>{startDate}</Text>
          </View>
        </View>

        <View style={s.intersection}>
          <View style={[s.corner, s.cTL]} />
          <View style={[s.corner, s.cTR]} />
          <View style={[s.corner, s.cBL]} />
          <View style={[s.corner, s.cBR]} />

          {(rotatedDirections.includes("N") ||
            rotatedDirections.includes("S")) && (
            <View style={s.vRoad}>
              {Array.from({ length: Math.ceil(height / 14) }).map((_, i) => (
                <View key={`vd${i}`} style={i % 2 === 0 ? s.vDash : s.vGap} />
              ))}
            </View>
          )}

          {(rotatedDirections.includes("W") ||
            rotatedDirections.includes("E")) && (
            <View style={s.hRoad}>
              {Array.from({ length: Math.ceil(width / 14) }).map((_, i) => (
                <View key={`hd${i}`} style={i % 2 === 0 ? s.hDash : s.hGap} />
              ))}
            </View>
          )}

          {rotatedDirections.includes("N") && (
            <View style={s.northArea}>
              <DirLabel
                dir={originalDirectionAtPosition["N"]}
                street={rotatedDirectionLabels["N"]}
              />
              {renderVehicles("N")}
            </View>
          )}

          {rotatedDirections.includes("S") && (
            <View style={s.southArea}>
              {renderVehicles("S")}
              <DirLabel
                dir={originalDirectionAtPosition["S"]}
                street={rotatedDirectionLabels["S"]}
              />
            </View>
          )}

          {rotatedDirections.includes("W") && (
            <View style={s.westArea}>
              <DirLabel
                dir={originalDirectionAtPosition["W"]}
                street={rotatedDirectionLabels["W"]}
              />
              <View style={s.sideVehicles}>{renderVehicles("W")}</View>
            </View>
          )}

          {rotatedDirections.includes("E") && (
            <View style={s.eastArea}>
              <View style={s.sideVehicles}>{renderVehicles("E")}</View>
              <DirLabel
                dir={originalDirectionAtPosition["E"]}
                street={rotatedDirectionLabels["E"]}
              />
            </View>
          )}

          {dragUi.isDragging &&
            rotatedDirections
              .filter((d) => d !== dragUi.originDirection)
              .map((d) => <DropOverlay key={d} direction={d} />)}
        </View>

        <View style={s.toolbar}>
          <TouchableOpacity style={s.tbBtn} onPress={rotateDirectionsClockwise}>
            <ArrowClockwise size={22} color="#D4D4B0" weight="regular" />
          </TouchableOpacity>
          <View style={s.tbDivider} />
          <TouchableOpacity
            style={[s.tbBtn, feedbackMode === "none" && s.tbBtnActive]}
            onPress={
              feedbackMode === "none"
                ? () => setFeedbackMode("vibrate")
                : () => setFeedbackMode("none")
            }
          >
            <Prohibit
              size={22}
              color={feedbackMode === "none" ? "#C4A635" : "#D4D4B0"}
              weight={feedbackMode === "none" ? "bold" : "regular"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tbBtn, feedbackMode === "sound" && s.tbBtnActive]}
            onPress={() => setFeedbackMode("sound")}
          >
            <SpeakerHigh
              size={22}
              color={feedbackMode === "sound" ? "#C4A635" : "#D4D4B0"}
              weight={feedbackMode === "sound" ? "bold" : "regular"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tbBtn, feedbackMode === "vibrate" && s.tbBtnActive]}
            onPress={() => setFeedbackMode("vibrate")}
          >
            <Vibrate
              size={22}
              color={feedbackMode === "vibrate" ? "#C4A635" : "#D4D4B0"}
              weight={feedbackMode === "vibrate" ? "bold" : "regular"}
            />
          </TouchableOpacity>
        </View>

        {lastRecord && (
          <View style={s.toast}>
            <Text style={s.toastText}>
              ✓ {lastRecord.vehicle}: {lastRecord.from} → {lastRecord.to}
            </Text>
            <TouchableOpacity
              onPress={handleUndo}
              style={s.undoBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowCounterClockwise size={16} color="#FFF" weight="bold" />
              <Text style={s.undoText}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const DirLabel = ({ dir, street }: { dir: Direction; street?: string }) => (
  <View style={dl.wrap}>
    <View style={dl.row}>
      <Text style={dl.letter}>{dir}</Text>
      <PencilSimple size={12} color="#C4A635" />
    </View>
    {street && <Text style={dl.street}>{street}</Text>}
  </View>
);

const dl = StyleSheet.create({
  wrap: { alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 3 },
  letter: { fontSize: 16, fontWeight: "700", color: "#D4D4B0" },
  street: { fontSize: 9, color: "#999", marginTop: 1 },
});

interface DraggableVehicleProps {
  classification: { id: string; name: string; icon?: string };
  direction: Direction;
  onDragStart: (dir: Direction, classId: string, className: string) => void;
  onDragEnd: () => void;
  onDrop: (fromDir: Direction, absX: number, absY: number) => void;
}

const DraggableVehicle = React.memo(
  ({
    classification,
    direction,
    onDragStart,
    onDragEnd,
    onDrop,
  }: DraggableVehicleProps) => {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const sc = useSharedValue(1);
    const op = useSharedValue(1);

    const IconComponent = getVehicleIcon(
      classification.icon || classification.name,
    );

    const cbRef = useRef({ onDragStart, onDragEnd, onDrop });
    cbRef.current = { onDragStart, onDragEnd, onDrop };

    const dirRef = useRef(direction);
    dirRef.current = direction;
    const classRef = useRef(classification);
    classRef.current = classification;

    const jsStart = useCallback(() => {
      cbRef.current.onDragStart(
        dirRef.current,
        classRef.current.id,
        classRef.current.name,
      );
    }, []);

    const jsEnd = useCallback(() => {
      cbRef.current.onDragEnd();
    }, []);

    const jsDrop = useCallback((absX: number, absY: number) => {
      cbRef.current.onDrop(dirRef.current, absX, absY);
    }, []);

    const gesture = useMemo(
      () =>
        Gesture.Pan()
          .activateAfterLongPress(0)
          .onStart(() => {
            "worklet";
            sc.value = withSpring(1.2, DRAG_START_SPRING);
            op.value = 0.85;
            runOnJS(jsStart)();
          })
          .onUpdate((e) => {
            "worklet";
            tx.value = e.translationX;
            ty.value = e.translationY;
          })
          .onEnd((e) => {
            "worklet";
            runOnJS(jsDrop)(e.absoluteX, e.absoluteY);
            tx.value = withSpring(0, FAST_SPRING);
            ty.value = withSpring(0, FAST_SPRING);
            sc.value = withSpring(1, FAST_SPRING);
            op.value = withTiming(1, { duration: 50 });
            runOnJS(jsEnd)();
          }),
      [jsStart, jsEnd, jsDrop],
    );

    const aStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: tx.value } as const,
          { translateY: ty.value } as const,
          { scale: sc.value } as const,
        ],
        opacity: op.value,
      } as any;
    });

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[dv.wrap, aStyle]}>
          <IconComponent size={26} color="#D4D4B0" />
        </Animated.View>
      </GestureDetector>
    );
  },
);

const dv = StyleSheet.create({
  wrap: { padding: 6, borderRadius: 4 },
});

interface VehicleRowProps {
  direction: Direction;
  vehicles: { id: string; name: string; icon?: string }[];
  onDragStart: (dir: Direction, classId: string, className: string) => void;
  onDragEnd: () => void;
  onDrop: (fromDir: Direction, absX: number, absY: number) => void;
}

const VehicleRow = React.memo(
  ({
    direction,
    vehicles,
    onDragStart,
    onDragEnd,
    onDrop,
  }: VehicleRowProps) => (
    <View style={vr.row}>
      {vehicles.map((v) => (
        <DraggableVehicle
          key={`${direction}-${v.id}`}
          classification={v}
          direction={direction}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
        />
      ))}
    </View>
  ),
);

const vr = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});

const DropOverlay = ({ direction }: { direction: Direction }) => {
  const pos = useMemo(() => {
    switch (direction) {
      case "N":
        return dz.north;
      case "S":
        return dz.south;
      case "W":
        return dz.west;
      case "E":
        return dz.east;
    }
  }, [direction]);

  return (
    <View style={[dz.base, pos]}>
      <Text style={dz.label}>{direction}</Text>
    </View>
  );
};

const dz = StyleSheet.create({
  base: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(196,166,53,0.5)",
    borderRadius: 12,
    backgroundColor: "rgba(196,166,53,0.06)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 500,
  },
  north: { top: 8, left: "30%", right: "30%", height: "28%" },
  south: { bottom: 8, left: "30%", right: "30%", height: "28%" },
  west: { left: 8, top: "25%", bottom: "25%", width: "22%" },
  east: { right: 8, top: "25%", bottom: "25%", width: "22%" },
  label: { fontSize: 22, fontWeight: "700", color: "rgba(196,166,53,0.4)" },
});

const portraitGuard = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1E1E1E" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#D4D4B0" },
  sub: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
  backBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
  },
  backText: { color: "#D4D4B0", fontSize: 14, fontWeight: "600" },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#2A2A2A" },
  container: { flex: 1, backgroundColor: "#2A2A2A" },

  header: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(80,80,60,0.85)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  backBtn: { padding: 4 },
  countText: { fontSize: 28, fontWeight: "800", color: "#FFF" },
  timerText: { fontSize: 14, fontWeight: "700", color: "#D4D4B0" },
  dateText: { fontSize: 11, color: "#999" },

  intersection: { flex: 1 },

  corner: {
    position: "absolute",
    backgroundColor: "rgba(60,80,40,0.5)",
    borderRadius: 4,
    zIndex: 1,
  },
  cTL: { top: 0, left: 0, width: "28%", height: "30%" },
  cTR: { top: 0, right: 0, width: "28%", height: "30%" },
  cBL: { bottom: 0, left: 0, width: "28%", height: "30%" },
  cBR: { bottom: 0, right: 0, width: "28%", height: "30%" },

  vRoad: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    flexDirection: "column",
    alignItems: "center",
    zIndex: 2,
    overflow: "hidden",
  },
  vDash: { width: 2, height: 8, backgroundColor: "#C4A635" },
  vGap: { width: 2, height: 6, backgroundColor: "transparent" },

  hRoad: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    marginTop: -1,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
    overflow: "hidden",
  },
  hDash: { width: 8, height: 2, backgroundColor: "#C4A635" },
  hGap: { width: 6, height: 2, backgroundColor: "transparent" },

  northArea: {
    position: "absolute",
    top: 8,
    left: "30%",
    right: "30%",
    alignItems: "center",
    gap: 3,
    zIndex: 10,
  },
  southArea: {
    position: "absolute",
    bottom: 8,
    left: "30%",
    right: "30%",
    alignItems: "center",
    gap: 3,
    zIndex: 10,
  },
  westArea: {
    position: "absolute",
    left: 8,
    top: "32%",
    bottom: "32%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
  },
  eastArea: {
    position: "absolute",
    right: 8,
    top: "32%",
    bottom: "32%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
  },
  sideVehicles: { gap: 3 },

  toolbar: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(60,80,40,0.85)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 100,
    alignItems: "center",
  },
  tbBtn: { padding: 4 },
  tbBtnActive: {
    backgroundColor: "rgba(196,166,53,0.2)",
    borderRadius: 6,
  },
  tbDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(212,212,176,0.3)",
  },

  toast: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(60,120,40,0.9)",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 2000,
    gap: 12,
  },
  toastText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(220,50,50,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  undoText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
});
