import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useAppSelector } from "@/src/store/hooks";
import { SignImage } from "@/src/types/models";
import ImagePicker from "@/src/components/ui/ImagePicker";

interface ImageStepProps {
  signId?: string;
  tempImages?: SignImage[];
  setTempImages?: React.Dispatch<React.SetStateAction<SignImage[]>>;
  isCreateMode?: boolean;
}

const ImageStep = ({
  signId,
  tempImages = [],
  setTempImages,
  isCreateMode = false,
}: ImageStepProps) => {
  const signs = useAppSelector((state) => state.signs.signs);
  const currentSign = signId ? signs.find((s) => s.id === signId) : null;
  const [images, setImages] = useState<SignImage[]>(
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
        itemId={signId}
        setTempImages={setTempImages}
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
