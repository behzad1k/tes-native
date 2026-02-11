import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useAppSelector } from "@/src/store/hooks";
import { SupportImage } from "@/src/types/models";
import ImagePicker from "@/src/components/ui/ImagePicker";

interface ImageStepProps {
  supportId?: string;
  images?: SupportImage[];
  onImagesChange?: (images: SupportImage[]) => void;
}

const ImageStep = ({
  supportId,
  images: controlledImages,
  onImagesChange,
}: ImageStepProps) => {
  const supports = useAppSelector((state) => state.supports.supports);
  const currentSupport = supportId
    ? supports.find((s) => s.id === supportId)
    : null;

  const isControlled =
    controlledImages !== undefined && onImagesChange !== undefined;

  const [localImages, setLocalImages] = useState<SupportImage[]>(
    currentSupport?.images || [],
  );

  useEffect(() => {
    if (!isControlled && currentSupport) {
      setLocalImages(currentSupport.images);
    }
  }, [currentSupport, isControlled]);

  const images = isControlled ? controlledImages : localImages;

  const handleChange = (next: SupportImage[]) => {
    if (isControlled) {
      onImagesChange!(next);
    } else {
      setLocalImages(next);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImagePicker<SupportImage>
        images={images}
        onChange={handleChange}
        extraImageFields={{ supportId: supportId || "temp" }}
        emptyLabel={
          isControlled
            ? "Add images before creating the support"
            : "Add images to this support"
        }
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
