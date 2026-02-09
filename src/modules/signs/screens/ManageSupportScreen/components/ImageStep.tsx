import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useAppSelector } from "@/src/store/hooks";
import { SignImage, SupportImage } from "@/src/types/models";
import ImagePicker from "@/src/components/ui/ImagePicker";

interface ImageStepProps {
  supportId?: string;
  tempImages?: SupportImage[];
  setTempImages?: React.Dispatch<React.SetStateAction<SupportImage[]>>;
  isCreateMode?: boolean;
}

const ImageStep = ({
  supportId,
  tempImages = [],
  setTempImages,
  isCreateMode = false,
}: ImageStepProps) => {
  const signs = useAppSelector((state) => state.supports.supports);
  const currentSign = supportId ? signs.find((s) => s.id === supportId) : null;
  const [images, setImages] = useState<SupportImage[]>(
    isCreateMode ? tempImages : currentSign?.images || [],
  );

  useEffect(() => {
    if (isCreateMode) {
      setImages(tempImages);
    } else if (currentSign) {
      setImages(currentSign.images);
    }
  }, [currentSign, tempImages, isCreateMode]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImagePicker
        images={images}
        itemId={supportId}
        setTempImages={setTempImages}
        isCreateMode={isCreateMode}
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
