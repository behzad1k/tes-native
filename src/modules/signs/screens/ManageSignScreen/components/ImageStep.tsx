import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { SignImage } from "@/src/types/models";
import ImagePicker from "@/src/components/ui/ImagePicker";

interface ImageStepProps {
  signId: string;
  images: SignImage[];
  onImagesChange: (images: SignImage[]) => void;
}

const ImageStep = ({ signId, images, onImagesChange }: ImageStepProps) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImagePicker<SignImage>
        images={images}
        onChange={onImagesChange}
        extraImageFields={{ signId }}
        emptyLabel="Add images to this sign"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ImageStep;
