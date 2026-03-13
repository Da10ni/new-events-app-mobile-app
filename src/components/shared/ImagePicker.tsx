import React, { useCallback } from 'react';
import { View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

interface SelectedImage {
  uri: string;
  fileName?: string;
  type?: string;
}

interface ImagePickerProps {
  images: SelectedImage[];
  onImagesChange: (images: SelectedImage[]) => void;
  maxImages?: number;
  allowsMultiple?: boolean;
  className?: string;
}

const ImagePicker: React.FC<ImagePickerProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  allowsMultiple = true,
  className = '',
}) => {
  const requestPermission = useCallback(async (type: 'camera' | 'gallery'): Promise<boolean> => {
    if (type === 'camera') {
      const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } else {
      const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is needed to select images.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  }, []);

  const pickFromGallery = useCallback(async () => {
    const hasPermission = await requestPermission('gallery');
    if (!hasPermission) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: allowsMultiple,
      selectionLimit: remaining,
      quality: 0.8,
      allowsEditing: !allowsMultiple,
    });

    if (!result.canceled && result.assets) {
      const newImages: SelectedImage[] = result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName || undefined,
        type: asset.mimeType || 'image/jpeg',
      }));
      onImagesChange([...images, ...newImages]);
    }
  }, [images, maxImages, allowsMultiple, requestPermission, onImagesChange]);

  const takePhoto = useCallback(async () => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onImagesChange([
        ...images,
        {
          uri: asset.uri,
          fileName: asset.fileName || undefined,
          type: asset.mimeType || 'image/jpeg',
        },
      ]);
    }
  }, [images, maxImages, requestPermission, onImagesChange]);

  const showOptions = useCallback(() => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [takePhoto, pickFromGallery]);

  const removeImage = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  return (
    <View className={className}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {/* Existing images */}
        {images.map((image, index) => (
          <View key={`${image.uri}-${index}`} className="relative">
            <Image
              source={{ uri: image.uri }}
              className="rounded-xl"
              style={{ width: 100, height: 100 }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => removeImage(index)}
              className="absolute -right-1.5 -top-1.5 items-center justify-center rounded-full bg-error p-0.5"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons name="close" size={14} color={COLORS.neutral[0]} />
            </TouchableOpacity>
            {index === 0 && (
              <View className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5">
                <Text variant="caption" color={COLORS.neutral[0]} style={{ fontSize: 9 }}>
                  Cover
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Add button */}
        {images.length < maxImages && (
          <TouchableOpacity
            onPress={showOptions}
            activeOpacity={0.7}
            className="items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50"
            style={{ width: 100, height: 100 }}
          >
            <Ionicons name="add-circle-outline" size={28} color={COLORS.neutral[300]} />
            <Text variant="caption" color={COLORS.neutral[300]} className="mt-1">
              Add Photo
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Image count */}
      <Text variant="caption" color={COLORS.neutral[300]} className="mt-2">
        {images.length}/{maxImages} photos
      </Text>
    </View>
  );
};

export default ImagePicker;
