import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ListRenderItemInfo,
} from 'react-native';
import Text from '../ui/Text';
import { COLORS } from '../../theme/colors';

interface ImageItem {
  _id: string;
  url: string;
  caption?: string;
}

interface ListingImageSliderProps {
  images: ImageItem[];
  height?: number;
  width?: number;
  showCounter?: boolean;
  showDots?: boolean;
  borderRadius?: number;
  className?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const ListingImageSlider: React.FC<ListingImageSliderProps> = ({
  images,
  height = 220,
  width,
  showCounter = true,
  showDots = true,
  borderRadius = 0,
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const sliderWidth = width ?? SCREEN_WIDTH;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / sliderWidth);
      setActiveIndex(index);
    },
    [sliderWidth]
  );

  const renderImage = useCallback(
    ({ item }: ListRenderItemInfo<ImageItem>) => (
      <Image
        source={{ uri: item.url }}
        style={{ width: sliderWidth, height }}
        resizeMode="cover"
      />
    ),
    [sliderWidth, height]
  );

  const keyExtractor = useCallback((item: ImageItem) => item._id, []);

  if (images.length === 0) {
    return (
      <View
        className={`items-center justify-center bg-neutral-50 ${className}`}
        style={{ width: sliderWidth, height, borderRadius }}
      >
        <Text variant="label" color={COLORS.neutral[300]}>
          No images
        </Text>
      </View>
    );
  }

  return (
    <View className={className} style={{ borderRadius, overflow: 'hidden' }}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderImage}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: sliderWidth,
          offset: sliderWidth * index,
          index,
        })}
      />

      {showCounter && images.length > 1 && (
        <View className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1">
          <Text variant="caption" weight="medium" color={COLORS.neutral[0]}>
            {activeIndex + 1}/{images.length}
          </Text>
        </View>
      )}

      {showDots && images.length > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center">
          {images.map((_, index) => (
            <View
              key={index}
              className={`mx-0.5 rounded-full ${
                index === activeIndex ? 'bg-white' : 'bg-white/50'
              }`}
              style={{
                width: index === activeIndex ? 7 : 6,
                height: index === activeIndex ? 7 : 6,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ListingImageSlider;
