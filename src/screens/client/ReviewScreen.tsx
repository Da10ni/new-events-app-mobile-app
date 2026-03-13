import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookingsStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { showToast } from '../../store/slices/uiSlice';
import { reviewApi } from '../../services/api/reviewApi';
import { Text, StarRating, Button, Divider, Card } from '../../components/ui';
import { LoadingOverlay, useSweetAlert } from '../../components/feedback';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<BookingsStackParamList, 'ReviewScreen'>;

const MIN_CHARS = 20;
const MAX_CHARS = 500;

export default function ReviewScreen({ route, navigation }: Props) {
  const { bookingId, listingId, vendorId } = route.params;
  const dispatch = useAppDispatch();
  const { showAlert } = useSweetAlert();

  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = overallRating > 0 && comment.trim().length >= MIN_CHARS;

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      showAlert({
        type: 'warning',
        title: 'Incomplete Review',
        message: 'Please provide a rating and write at least 20 characters.',
      });
      return;
    }

    const detailedRatings: Record<string, number> = {};
    if (qualityRating > 0) detailedRatings.quality = qualityRating;
    if (communicationRating > 0) detailedRatings.communication = communicationRating;
    if (valueRating > 0) detailedRatings.valueForMoney = valueRating;

    try {
      setSubmitting(true);
      await reviewApi.create({
        booking: bookingId,
        rating: overallRating,
        comment: comment.trim(),
        detailedRatings: Object.keys(detailedRatings).length > 0 ? detailedRatings : undefined,
      });
      dispatch(showToast({ message: 'Review submitted successfully!', type: 'success' }));
      navigation.goBack();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to submit review';
      showAlert({ type: 'error', title: 'Error', message });
    } finally {
      setSubmitting(false);
    }
  }, [
    isValid,
    overallRating,
    qualityRating,
    communicationRating,
    valueRating,
    comment,
    bookingId,
    dispatch,
    navigation,
  ]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <LoadingOverlay visible={submitting} message="Submitting review..." />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-6">
          {/* Overall Rating */}
          <View className="mb-6 items-center">
            <Text variant="h4" weight="bold" className="mb-2">
              How was your experience?
            </Text>
            <Text variant="body" color={COLORS.neutral[400]} className="mb-4 text-center">
              Tap a star to rate
            </Text>
            <StarRating
              rating={overallRating}
              onRatingChange={setOverallRating}
              interactive
              size={40}
              showValue
            />
          </View>

          <Divider className="my-4" />

          {/* Detailed Ratings */}
          <Text variant="body" weight="bold" className="mb-4">
            Detailed Ratings (Optional)
          </Text>

          <Card padding="md" className="mb-5">
            {/* Quality */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text variant="label" color={COLORS.neutral[500]}>
                Quality
              </Text>
              <StarRating
                rating={qualityRating}
                onRatingChange={setQualityRating}
                interactive
                size={24}
              />
            </View>

            {/* Communication */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text variant="label" color={COLORS.neutral[500]}>
                Communication
              </Text>
              <StarRating
                rating={communicationRating}
                onRatingChange={setCommunicationRating}
                interactive
                size={24}
              />
            </View>

            {/* Value */}
            <View className="flex-row items-center justify-between">
              <Text variant="label" color={COLORS.neutral[500]}>
                Value for Money
              </Text>
              <StarRating
                rating={valueRating}
                onRatingChange={setValueRating}
                interactive
                size={24}
              />
            </View>
          </Card>

          <Divider className="my-4" />

          {/* Review Text */}
          <Text variant="body" weight="bold" className="mb-3">
            Write Your Review
          </Text>
          <View
            className={`rounded-xl border-2 px-4 py-3 ${
              comment.trim().length > 0 && comment.trim().length < MIN_CHARS
                ? 'border-error'
                : 'border-neutral-200'
            }`}
          >
            <RNTextInput
              value={comment}
              onChangeText={(text) => {
                if (text.length <= MAX_CHARS) {
                  setComment(text);
                }
              }}
              placeholder="Share your experience with this service. What did you like? What could be improved?"
              placeholderTextColor={COLORS.neutral[300]}
              multiline
              textAlignVertical="top"
              className="min-h-[140px] text-[16px] text-neutral-600"
            />
          </View>
          <View className="mt-1.5 flex-row items-center justify-between">
            {comment.trim().length > 0 && comment.trim().length < MIN_CHARS ? (
              <Text variant="caption" color={COLORS.error}>
                Minimum {MIN_CHARS} characters required
              </Text>
            ) : (
              <View />
            )}
            <Text
              variant="caption"
              color={comment.length >= MAX_CHARS ? COLORS.error : COLORS.neutral[300]}
            >
              {comment.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* Submit Button */}
          <View className="mt-6">
            <Button
              title="Submit Review"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSubmit}
              disabled={!isValid || submitting}
              loading={submitting}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
