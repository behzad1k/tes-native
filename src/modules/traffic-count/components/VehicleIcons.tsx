import React from "react";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

// Scooter / Motorcycle icon
export const ScooterIcon = ({ size = 28, color = "#D4D4B0" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5" cy="18" r="2.5" stroke={color} strokeWidth="1.5" />
    <Circle cx="19" cy="18" r="2.5" stroke={color} strokeWidth="1.5" />
    <Path
      d="M7.5 18H16.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Path
      d="M5 15.5V13L8 8H11"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11 8L13 13H16.5L19 15.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 5H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M12 5V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Car icon
export const CarIcon = ({ size = 28, color = "#D4D4B0" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 14L4.5 8.5C4.8 7.3 5.9 6.5 7.1 6.5H16.9C18.1 6.5 19.2 7.3 19.5 8.5L21 14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect
      x="2"
      y="14"
      width="20"
      height="5"
      rx="2"
      stroke={color}
      strokeWidth="1.5"
    />
    <Circle cx="6.5" cy="19" r="1.5" stroke={color} strokeWidth="1.5" />
    <Circle cx="17.5" cy="19" r="1.5" stroke={color} strokeWidth="1.5" />
    <Line
      x1="8"
      y1="19"
      x2="16"
      y2="19"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Bus / Large vehicle icon
export const BusIcon = ({ size = 28, color = "#D4D4B0" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="4"
      width="18"
      height="14"
      rx="2"
      stroke={color}
      strokeWidth="1.5"
    />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5" />
    <Line x1="12" y1="4" x2="12" y2="10" stroke={color} strokeWidth="1.5" />
    <Circle cx="7" cy="18" r="1.5" stroke={color} strokeWidth="1.5" />
    <Circle cx="17" cy="18" r="1.5" stroke={color} strokeWidth="1.5" />
    <Rect
      x="6"
      y="12"
      width="3"
      height="3"
      rx="0.5"
      stroke={color}
      strokeWidth="1"
    />
    <Rect
      x="15"
      y="12"
      width="3"
      height="3"
      rx="0.5"
      stroke={color}
      strokeWidth="1"
    />
  </Svg>
);

// Truck icon
export const TruckIcon = ({ size = 28, color = "#D4D4B0" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12H15V5H1V12Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <Path
      d="M15 8H19L22 11V16H15V8Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.5" />
    <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.5" />
    <Line
      x1="8"
      y1="18.5"
      x2="16"
      y2="18.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Line
      x1="1"
      y1="12"
      x2="1"
      y2="16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Line
      x1="1"
      y1="16"
      x2="3"
      y2="16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Bicycle icon
export const BicycleIcon = ({ size = 28, color = "#D4D4B0" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="16" r="3" stroke={color} strokeWidth="1.5" />
    <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth="1.5" />
    <Path
      d="M6 16L9 8H15L18 16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 16V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M10 5H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Van / Medium vehicle icon
export const VanIcon = ({ size = 28, color = "#D4D4B0" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 7H15V17H2V7Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <Path
      d="M15 10H19L22 13V17H15V10Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <Circle cx="6" cy="17" r="2" stroke={color} strokeWidth="1.5" />
    <Circle cx="18" cy="17" r="2" stroke={color} strokeWidth="1.5" />
    <Line
      x1="8"
      y1="17"
      x2="16"
      y2="17"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Pedestrian icon
export const PedestrianIcon = ({ size = 28, color = "#D4D4B0" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="4" r="2" stroke={color} strokeWidth="1.5" />
    <Path d="M12 6V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path
      d="M12 12L8 20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Path
      d="M12 12L16 20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Path
      d="M8 9L12 10L16 9"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Map icon key (from appData vehicleTypes.icon or classificationName) -> icon component.
 * Keys match the `icon` field in mockAppData.json vehicleTypes and also
 * the classificationName that gets saved on each TrafficCount.
 */
export const VEHICLE_ICON_MAP: Record<string, React.FC<IconProps>> = {
  // By icon key (from appData vehicleTypes.icon)
  Scooter: ScooterIcon,
  Car: CarIcon,
  Truck: TruckIcon,
  Van: VanIcon,
  Cyclist: BicycleIcon,
  Pedestrian: PedestrianIcon,
  Bus: BusIcon,

  // By vehicle name (for classificationName lookup)
  Bicycle: BicycleIcon,
  Motorcycle: ScooterIcon,
};

export const getVehicleIcon = (
  classificationNameOrIcon: string,
): React.FC<IconProps> => {
  return VEHICLE_ICON_MAP[classificationNameOrIcon] || CarIcon;
};
