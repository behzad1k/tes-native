import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import TextView from "../ui/TextView";
import { ArrowRight } from "phosphor-react-native";
import { BlurView } from "expo-blur";

interface ModuleCardProps {
  title: string;
  backgroundImage: ImageSourcePropType;
  description: string;
  containerStyle?: StyleProp<ViewStyle>;
}
const ModuleCard = ({
  title,
  backgroundImage,
  description,
  containerStyle = {},
}: ModuleCardProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Image source={backgroundImage} style={styles.backgroundImage} />
      <BlurView intensity={15} style={styles.mainBox}>
        <View style={styles.textBox}>
          <TextView style={styles.titleText}>{title}</TextView>
          <TextView style={styles.descriptionText}>{description}</TextView>
        </View>
        <ArrowRight size={26} color="#FFF" />
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    aspectRatio: 10 / 5.5,
    width: "100%",
    overflow: "hidden",
  },
  backgroundImage: {
    objectFit: "cover",
    width: "100%",
    height: "100%",
  },
  mainBox: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    flexDirection: "row",
    position: "absolute",
    width: "100%",
    flex: 1,
    bottom: 0,
    alignItems: "center",
    gap: 12,
  },
  textBox: {
    width: "85%",
    gap: 10,
  },
  titleText: {
    fontWeight: 700,
    fontSize: 26,
  },
  descriptionText: {
    fontWeight: 400,
    fontSize: 11,
  },
});

export default ModuleCard;
