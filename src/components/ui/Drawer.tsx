// @ts-nocheck
import { useDrawer } from "@/src/contexts/DrawerContext";
import { DrawerInstance } from "@/src/types/drawer";
import {
  createTimingConfig,
  getContentTransform,
  getDrawerTransform,
} from "@/src/utils/drawerAnimations";
import React, { useEffect } from "react";
import { Dimensions, Platform, StyleSheet } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DrawerProps {
  children: React.ReactNode;
}

interface SingleDrawerProps {
  drawer: DrawerInstance;
  isTopmost: boolean;
  onClose: () => void;
}

const useGradualAnimation = () => {
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: (event) => {
        "worklet";
        keyboardHeight.value = Math.max(event.height, 0);
      },
    },
    [],
  );
  return { keyboardHeight };
};

const SingleDrawer: React.FC<SingleDrawerProps> = ({
  drawer,
  isTopmost,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const isClosing = useSharedValue(false);
  const { keyboardHeight } = useGradualAnimation();

  const config = drawer.config;

  useEffect(() => {
    progress.value = withTiming(
      1,
      createTimingConfig(config.transitionDuration),
    );
    return () => {};
  }, [config.transitionDuration, progress]);

  const handleClose = () => {
    isClosing.value = true;
    progress.value = withTiming(
      0,
      createTimingConfig(config.transitionDuration),
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      },
    );
  };

  const panGesture = Gesture.Pan()
    .enabled(config.enableGestures && isTopmost)
    .onUpdate((event) => {
      if (!config.enableGestures || !isTopmost || isClosing.value) return;

      const { translationX, translationY } = event;
      const thresholdX = config.drawerWidth * 0.3;
      const drawerHeight = config.drawerHeight || SCREEN_HEIGHT * 0.5;
      const thresholdY = Number(drawerHeight) * 0.3;

      if (config.position === "left") {
        if (translationX < -thresholdX) {
          runOnJS(handleClose)();
        }
      } else if (config.position === "right") {
        if (translationX > thresholdX) {
          runOnJS(handleClose)();
        }
      } else if (config.position === "top") {
        if (translationY < -thresholdY) {
          runOnJS(handleClose)();
        }
      } else if (config.position === "bottom") {
        if (translationY > thresholdY) {
          runOnJS(handleClose)();
        }
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(isTopmost && config.enableOverlay)
    .onEnd(() => {
      if (isTopmost && !isClosing.value) {
        runOnJS(handleClose)();
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: config.enableOverlay
      ? interpolate(
          progress.value,
          [0, 1],
          [0, config.overlayOpacity],
          Extrapolate.CLAMP,
        )
      : 0,
    pointerEvents: "auto",
  }));

  const drawerStyle = useAnimatedStyle(() => {
    const transform = getDrawerTransform(
      progress,
      config.transitionType,
      config.position,
      config.drawerWidth,
      Number(config.drawerHeight) || SCREEN_HEIGHT * 0.5,
    );
    if (config.position === "bottom") {
      return {
        ...transform,
        bottom:
          keyboardHeight.value > 0
            ? Platform.OS === "ios"
              ? 0
              : insets.bottom
            : 0,
      };
    }
    return transform;
  });
  const getDrawerContainerStyle = () => {
    const baseStyle = {
      backgroundColor: "rgba(0,0,0,0)",
      zIndex: drawer.zIndex + 1,
    };

    if (config.position === "left" || config.position === "right") {
      return [
        styles.drawerContainer,
        baseStyle,
        {
          width: config.drawerWidth,
          [config.position]: 0,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          top: 0,
          bottom: 0,
        },
        drawerStyle,
      ];
    } else if (config.position === "top") {
      const drawerHeight = config.drawerHeight || SCREEN_HEIGHT * 0.5;
      return [
        styles.drawerContainerHorizontal,
        baseStyle,
        {
          width: config.drawerWidth,
          height: drawerHeight,
          top: 0,
          left: (SCREEN_WIDTH - config.drawerWidth) / 2,
        },
        drawerStyle,
      ];
    } else {
      const drawerHeight = config.drawerHeight || SCREEN_HEIGHT * 0.5;
      return [
        styles.drawerContainerHorizontal,
        baseStyle,
        {
          width: config.drawerWidth,
          height: drawerHeight,
          left: (SCREEN_WIDTH - config.drawerWidth) / 2,
        },
        drawerStyle,
      ];
    }
  };
  const overlayContainerStyle = [
    styles.overlay,
    {
      zIndex: drawer.zIndex,
    },
    overlayStyle,
  ];

  return (
    <>
      {/* Overlay */}
      {config.enableOverlay && (
        <GestureDetector gesture={tapGesture}>
          <Animated.View style={overlayContainerStyle} />
        </GestureDetector>
      )}
      {/* Drawer */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={getDrawerContainerStyle()}>
          {drawer.content}
        </Animated.View>
      </GestureDetector>
    </>
  );
};

export const Drawer: React.FC<DrawerProps> = ({ children }) => {
  const { drawers, closeDrawer, getTopDrawer } = useDrawer();
  const topDrawer = getTopDrawer();

  const contentProgress = useSharedValue(0);

  useEffect(() => {
    if (topDrawer && topDrawer.config.transitionType === "push") {
      contentProgress.value = withTiming(
        1,
        createTimingConfig(topDrawer.config.transitionDuration),
      );
    } else {
      const transitionDuration = topDrawer?.config.transitionDuration || 300;
      contentProgress.value = withTiming(
        0,
        createTimingConfig(transitionDuration),
      );
    }
  }, [topDrawer, contentProgress]);

  const contentStyle = useAnimatedStyle(() => {
    if (!topDrawer || topDrawer.config.transitionType !== "push") {
      return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    }
    return getContentTransform(
      contentProgress,
      topDrawer.config.transitionType,
      topDrawer.config.position,
      topDrawer.config.drawerWidth,
      Number(topDrawer.config.drawerHeight) || SCREEN_HEIGHT * 0.5,
    );
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Main Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        {children}
      </Animated.View>
      {/* Render all drawers */}
      {drawers.map((drawer) => (
        <SingleDrawer
          key={drawer.id}
          drawer={drawer}
          isTopmost={topDrawer?.id === drawer.id}
          onClose={() => closeDrawer(drawer.id)}
        />
      ))}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  drawerContainer: {
    position: "absolute",
  },
  drawerContainerHorizontal: {
    position: "absolute",
    backgroundColor: "white",
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
