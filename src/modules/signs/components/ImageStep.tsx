import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { SignImage, SupportImage } from "@/src/types/models";
import ImagePicker from "@/src/components/ui/ImagePicker";

interface ImageStepProps {
  itemId: string;
  images: Array<SupportImage | SignImage>;
  onImagesChange: React.Dispatch<
    React.SetStateAction<Array<SignImage | SupportImage>>
  >;
}

const ImageStep = ({ itemId, images, onImagesChange }: ImageStepProps) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImagePicker<SignImage>
        images={images}
        onChange={onImagesChange}
        extraImageFields={{ itemId }}
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
