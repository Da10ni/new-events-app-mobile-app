import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import type { ProviderListingsStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { listingApi } from '../../services/api/listingApi';
import { categoryApi } from '../../services/api/categoryApi';
import { uploadApi } from '../../services/api/uploadApi';
import { Text, Button, TextInput, Card, Chip, Divider } from '../../components/ui';
import { LoadingOverlay, useSweetAlert } from '../../components/feedback';
import type { Category, ListingPackage } from '../../types';
import { COLORS } from '../../theme/colors';

type AddListingNav = NativeStackNavigationProp<ProviderListingsStackParamList>;

const TOTAL_STEPS = 5;

const PRICE_UNITS = [
  { key: 'per_event', label: 'Per Event' },
  { key: 'per_day', label: 'Per Day' },
  { key: 'per_person', label: 'Per Person' },
  { key: 'per_hour', label: 'Per Hour' },
];

const AMENITIES_LIST = [
  'Sound System',
  'Parking',
  'Air Conditioning',
  'WiFi',
  'Catering',
  'Stage',
  'Lighting',
  'Projector',
  'Generator',
  'Decoration',
  'Valet Parking',
  'Wheelchair Access',
  'Security',
  'Changing Room',
  'Prayer Area',
  'Kids Area',
];

interface LocalImage {
  uri: string;
  isPrimary: boolean;
}

interface FormData {
  // Step 1
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  // Step 2
  city: string;
  area: string;
  fullAddress: string;
  // Step 3
  images: LocalImage[];
  // Step 4
  basePrice: string;
  priceUnit: string;
  packages: ListingPackage[];
  capacityMin: string;
  capacityMax: string;
  // Step 5
  amenities: string[];
  additionalInfo: string;
}

interface StepErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  categoryId: '',
  tags: [],
  city: '',
  area: '',
  fullAddress: '',
  images: [],
  basePrice: '',
  priceUnit: 'per_event',
  packages: [],
  capacityMin: '',
  capacityMax: '',
  amenities: [],
  additionalInfo: '',
};

export default function AddListingScreen() {
  const navigation = useNavigation<AddListingNav>();
  const { showAlert } = useSweetAlert();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<StepErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Package form state
  const [pkgName, setPkgName] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.getAll();
        setCategories(res.data?.data?.categories || []);
      } catch {
        // Categories may fail silently
      }
    };
    loadCategories();
  }, []);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: StepErrors = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        else if (formData.title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        else if (formData.description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters';
        if (!formData.categoryId) newErrors.categoryId = 'Please select a category';
        break;
      case 2:
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.area.trim()) newErrors.area = 'Area is required';
        break;
      case 3:
        if (formData.images.length < 3) newErrors.images = 'Please add at least 3 photos';
        break;
      case 4: {
        const price = parseFloat(formData.basePrice);
        if (!formData.basePrice || isNaN(price) || price <= 0)
          newErrors.basePrice = 'Please enter a valid price';
        break;
      }
      case 5:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSteps = (): boolean => {
    for (let step = 1; step <= TOTAL_STEPS; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: LocalImage[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          isPrimary: formData.images.length === 0 && index === 0,
        }));
        updateField('images', [...formData.images, ...newImages]);
      }
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'Failed to pick images' });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    const wasPrimary = newImages[index].isPrimary;
    newImages.splice(index, 1);
    if (wasPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    updateField('images', newImages);
  };

  const handleSetCoverPhoto = (index: number) => {
    const newImages = formData.images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    updateField('images', newImages);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      updateField('tags', [...formData.tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateField('tags', formData.tags.filter((t) => t !== tag));
  };

  const handleAddPackage = () => {
    if (!pkgName.trim() || !pkgPrice.trim()) {
      showAlert({ type: 'warning', title: 'Error', message: 'Package name and price are required' });
      return;
    }
    const newPkg: ListingPackage = {
      name: pkgName.trim(),
      description: pkgDesc.trim() || undefined,
      price: parseFloat(pkgPrice),
      includes: [],
    };
    updateField('packages', [...formData.packages, newPkg]);
    setPkgName('');
    setPkgDesc('');
    setPkgPrice('');
  };

  const handleRemovePackage = (index: number) => {
    const newPackages = [...formData.packages];
    newPackages.splice(index, 1);
    updateField('packages', newPackages);
  };

  const handleToggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      updateField('amenities', formData.amenities.filter((a) => a !== amenity));
    } else {
      updateField('amenities', [...formData.amenities, amenity]);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);

      // Upload images first if any
      const uploadedImages = formData.images.length > 0
        ? await uploadImages(formData.images)
        : [];

      const draftData: Record<string, any> = {
        title: formData.title || 'Untitled Draft',
        description: formData.description || 'Draft listing',
        status: 'draft',
        address: { country: 'Pakistan' },
        pricing: { currency: 'PKR' },
        images: uploadedImages,
      };

      if (formData.categoryId) draftData.category = formData.categoryId;
      if (formData.city) draftData.address.city = formData.city;
      if (formData.area) draftData.address.area = formData.area;
      if (formData.fullAddress) draftData.address.street = formData.fullAddress;
      if (formData.basePrice && !isNaN(parseFloat(formData.basePrice))) draftData.pricing.basePrice = parseFloat(formData.basePrice);
      if (formData.priceUnit) draftData.pricing.priceUnit = formData.priceUnit;

      await listingApi.create(draftData as any);
      showAlert({ type: 'success', title: 'Success', message: 'Listing saved as draft', buttons: [
        { text: 'OK', onPress: () => navigation.goBack() },
      ] });
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to save draft' });
    } finally {
      setSubmitting(false);
    }
  };

  const uploadImages = async (images: LocalImage[]) => {
    const imageFormData = new FormData() as any;

    for (let index = 0; index < images.length; index++) {
      const img = images[index];

      if (Platform.OS === 'web') {
        // On web, fetch the blob from the URI and append as File
        const response = await fetch(img.uri);
        const blob = await response.blob();
        imageFormData.append('images', blob, `image_${index}.jpg`);
      } else {
        imageFormData.append('images', {
          uri: img.uri,
          name: `image_${index}.jpg`,
          type: 'image/jpeg',
        } as any);
      }
    }

    const res = await uploadApi.uploadImages(imageFormData);
    const uploaded = (res.data as any)?.data?.images || [];
    return uploaded.map((img: any, index: number) => ({
      url: img.url,
      publicId: img.publicId,
      caption: '',
      isPrimary: images[index]?.isPrimary || false,
    }));
  };

  const handleSubmit = async () => {
    if (!validateAllSteps()) return;

    try {
      setSubmitting(true);

      // Upload images first
      const uploadedImages = formData.images.length > 0
        ? await uploadImages(formData.images)
        : [];

      // Build JSON body
      const basePrice = parseFloat(formData.basePrice);
      const listingData: Record<string, any> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.categoryId,
        address: {
          city: formData.city.trim(),
          area: formData.area.trim(),
          country: 'Pakistan',
          ...(formData.fullAddress && { street: formData.fullAddress.trim() }),
        },
        pricing: {
          basePrice: isNaN(basePrice) ? 0 : basePrice,
          priceUnit: formData.priceUnit,
          currency: 'PKR',
          ...(formData.packages.length > 0 && { packages: formData.packages }),
        },
        images: uploadedImages,
      };

      if (formData.capacityMin || formData.capacityMax) {
        listingData.capacity = {
          ...(formData.capacityMin && { min: parseInt(formData.capacityMin) || 0 }),
          ...(formData.capacityMax && { max: parseInt(formData.capacityMax) || 0 }),
        };
      }

      if (formData.tags.length > 0) listingData.tags = formData.tags;
      if (formData.amenities.length > 0) listingData.amenities = formData.amenities;
      if (formData.additionalInfo) {
        listingData.attributes = { additionalInfo: formData.additionalInfo };
      }

      await listingApi.create(listingData as any);
      setShowSuccess(true);
    } catch (err: any) {
      const errData = err?.response?.data;
      let msg = errData?.message || 'Failed to submit listing';
      if (errData?.errors?.length) {
        msg = errData.errors.map((e: any) => e.message).join('\n');
      }
      showAlert({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="mb-6 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS.primary[50] }}
          >
            <Ionicons name="checkmark-circle" size={48} color={COLORS.primary[500]} />
          </View>
          <Text variant="h3" weight="bold" className="mb-2 text-center" color={COLORS.primary[600]}>
            Listing Submitted!
          </Text>
          <Text variant="body" color={COLORS.neutral[400]} className="mb-8 text-center">
            Your listing has been submitted for review. You'll be notified once it's approved.
          </Text>
          <Button
            title="View My Listings"
            variant="primary"
            fullWidth
            onPress={() => navigation.navigate('MyListingsScreen')}
          />
          <Button
            title="Create Another"
            variant="outline"
            fullWidth
            className="mt-3"
            onPress={() => {
              setShowSuccess(false);
              setFormData(initialFormData);
              setCurrentStep(1);
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderStepperHeader = () => (
    <View className="px-4 pt-3 pb-3">
      {/* Top row: title + save draft */}
      <View className="flex-row items-center justify-between mb-3">
        <Text variant="label" weight="semibold" color={COLORS.neutral[500]}>
          Step {currentStep} of {TOTAL_STEPS}
        </Text>
        <TouchableOpacity
          onPress={handleSaveDraft}
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: COLORS.primary[50] }}
          activeOpacity={0.7}
        >
          <Ionicons name="save-outline" size={14} color={COLORS.primary[500]} style={{ marginRight: 4 }} />
          <Text variant="caption" weight="semibold" color={COLORS.primary[500]}>
            Save Draft
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step pills row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {stepTitles.map((title, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return (
            <TouchableOpacity
              key={title}
              onPress={() => { if (isCompleted) setCurrentStep(stepNum); }}
              activeOpacity={isCompleted ? 0.7 : 1}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: isActive
                  ? COLORS.primary[50]
                  : isCompleted
                  ? COLORS.successLight
                  : COLORS.neutral[50],
                borderWidth: isActive ? 1.5 : 0,
                borderColor: isActive ? COLORS.primary[500] : 'transparent',
              }}
            >
              <View
                style={{
                  height: 22,
                  width: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 5,
                  backgroundColor: isActive
                    ? COLORS.primary[500]
                    : isCompleted
                    ? COLORS.success
                    : COLORS.neutral[200],
                }}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={COLORS.neutral[0]} />
                ) : (
                  <Ionicons
                    name={stepIcons[index]}
                    size={12}
                    color={isActive ? COLORS.neutral[0] : COLORS.neutral[400]}
                  />
                )}
              </View>
              <Text
                variant="caption"
                weight={isActive ? 'bold' : isCompleted ? 'semibold' : 'medium'}
                color={
                  isActive
                    ? COLORS.primary[600]
                    : isCompleted
                    ? COLORS.success
                    : COLORS.neutral[400]
                }
              >
                {title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Thin progress bar */}
      <View className="flex-row mt-3" style={{ gap: 4 }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: i < currentStep ? COLORS.primary[500] : COLORS.neutral[100],
            }}
          />
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View className="px-4">
      <Text variant="h4" weight="bold" className="mb-1" color={COLORS.primary[600]}>
        Basic Information
      </Text>
      <Text variant="label" color={COLORS.neutral[400]} className="mb-6">
        Tell us about your service or venue
      </Text>

      <TextInput
        label="Listing Title"
        placeholder="e.g., Grand Ballroom for Events"
        value={formData.title}
        onChangeText={(text) => updateField('title', text)}
        error={errors.title}
      />

      <TextInput
        label="Description"
        placeholder="Describe your service, what's included, and what makes it special..."
        value={formData.description}
        onChangeText={(text) => updateField('description', text)}
        multiline
        error={errors.description}
      />

      {/* Category Selection */}
      <Text variant="label" weight="medium" className="mb-1.5 text-neutral-500">
        Category
      </Text>
      {errors.categoryId && (
        <View className="mb-2 flex-row items-center">
          <Ionicons name="alert-circle" size={14} color={COLORS.error} />
          <Text variant="caption" color={COLORS.error} className="ml-1">
            {errors.categoryId}
          </Text>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {categories.map((cat) => (
          <Chip
            key={cat._id}
            label={cat.name}
            selected={formData.categoryId === cat._id}
            onPress={() => updateField('categoryId', cat._id)}
            className="mr-2"
          />
        ))}
      </ScrollView>

      {/* Tags */}
      <Text variant="label" weight="medium" className="mb-1.5 text-neutral-500">
        Tags
      </Text>
      <View className="flex-row items-center mb-2">
        <View className="flex-1 mr-2">
          <TextInput
            placeholder="Add a tag"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
            containerClassName="mb-0"
          />
        </View>
        <TouchableOpacity
          onPress={handleAddTag}
          className="h-[52px] w-[52px] items-center justify-center rounded-xl bg-primary-500"
        >
          <Ionicons name="add" size={24} color={COLORS.neutral[0]} />
        </TouchableOpacity>
      </View>
      {formData.tags.length > 0 && (
        <View className="flex-row flex-wrap mb-4">
          {formData.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected
              closable
              onClose={() => handleRemoveTag(tag)}
              className="mr-2 mb-2"
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View className="px-4">
      <Text variant="h4" weight="bold" className="mb-1" color={COLORS.primary[600]}>
        Location
      </Text>
      <Text variant="label" color={COLORS.neutral[400]} className="mb-6">
        Where is your service located?
      </Text>

      <TextInput
        label="City"
        placeholder="e.g., Lahore"
        value={formData.city}
        onChangeText={(text) => updateField('city', text)}
        leftIcon="location"
        error={errors.city}
      />

      <TextInput
        label="Area"
        placeholder="e.g., Gulberg, DHA Phase 5"
        value={formData.area}
        onChangeText={(text) => updateField('area', text)}
        leftIcon="navigate"
        error={errors.area}
      />

      <TextInput
        label="Full Address (Optional)"
        placeholder="Complete street address"
        value={formData.fullAddress}
        onChangeText={(text) => updateField('fullAddress', text)}
        leftIcon="map"
        multiline
      />
    </View>
  );

  const renderStep3 = () => (
    <View className="px-4">
      <Text variant="h4" weight="bold" className="mb-1" color={COLORS.primary[600]}>
        Photos
      </Text>
      <Text variant="label" color={COLORS.neutral[400]} className="mb-2">
        Add at least 3 photos of your service
      </Text>
      {errors.images && (
        <View className="mb-3 flex-row items-center">
          <Ionicons name="alert-circle" size={14} color={COLORS.error} />
          <Text variant="caption" color={COLORS.error} className="ml-1">
            {errors.images}
          </Text>
        </View>
      )}

      {/* Images Grid */}
      <View className="flex-row flex-wrap mb-4">
        {formData.images.map((img, index) => (
          <View key={index} className="w-1/3 p-1">
            <View className="relative">
              <Image
                source={{ uri: img.uri }}
                className="h-28 w-full rounded-xl"
                resizeMode="cover"
              />
              {img.isPrimary && (
                <View className="absolute top-1 left-1 rounded-md bg-primary-500 px-1.5 py-0.5">
                  <Text variant="caption" weight="semibold" color={COLORS.neutral[0]}>
                    Cover
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
              >
                <Ionicons name="close" size={14} color={COLORS.neutral[0]} />
              </TouchableOpacity>
              {!img.isPrimary && (
                <TouchableOpacity
                  onPress={() => handleSetCoverPhoto(index)}
                  className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5"
                >
                  <Text variant="caption" color={COLORS.neutral[0]}>
                    Set Cover
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Add Image Button */}
        <View className="w-1/3 p-1">
          <TouchableOpacity
            onPress={handlePickImages}
            className="h-28 w-full items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50"
          >
            <Ionicons name="camera-outline" size={28} color={COLORS.neutral[300]} />
            <Text variant="caption" color={COLORS.neutral[300]} className="mt-1">
              Add Photos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text variant="caption" color={COLORS.neutral[400]}>
        Tip: Tap "Set Cover" to choose the main display photo. Long press to reorder.
      </Text>
    </View>
  );

  const renderStep4 = () => (
    <View className="px-4">
      <Text variant="h4" weight="bold" className="mb-1" color={COLORS.primary[600]}>
        Pricing & Capacity
      </Text>
      <Text variant="label" color={COLORS.neutral[400]} className="mb-6">
        Set your pricing and guest capacity
      </Text>

      <TextInput
        label="Base Price (PKR)"
        placeholder="e.g., 50000"
        value={formData.basePrice}
        onChangeText={(text) => updateField('basePrice', text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        leftIcon="cash"
        error={errors.basePrice}
      />

      {/* Price Unit */}
      <Text variant="label" weight="medium" className="mb-1.5 text-neutral-500">
        Price Unit
      </Text>
      <View className="flex-row flex-wrap mb-4">
        {PRICE_UNITS.map((unit) => (
          <Chip
            key={unit.key}
            label={unit.label}
            selected={formData.priceUnit === unit.key}
            onPress={() => updateField('priceUnit', unit.key)}
            className="mr-2 mb-2"
          />
        ))}
      </View>

      {/* Capacity */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextInput
            label="Min Guests"
            placeholder="e.g., 50"
            value={formData.capacityMin}
            onChangeText={(text) => updateField('capacityMin', text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <TextInput
            label="Max Guests"
            placeholder="e.g., 500"
            value={formData.capacityMax}
            onChangeText={(text) => updateField('capacityMax', text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Packages */}
      <Divider className="my-4" />
      <Text variant="h4" weight="bold" className="mb-1" color={COLORS.primary[600]}>
        Packages (Optional)
      </Text>
      <Text variant="caption" color={COLORS.neutral[400]} className="mb-4">
        Add custom packages with different pricing
      </Text>

      {formData.packages.map((pkg, index) => (
        <Card key={index} padding="sm" className="mb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text variant="label" weight="semibold" className="text-neutral-600">
                {pkg.name}
              </Text>
              {pkg.description && (
                <Text variant="caption" color={COLORS.neutral[400]}>
                  {pkg.description}
                </Text>
              )}
              <Text variant="label" weight="bold" color={COLORS.primary[500]}>
                PKR {pkg.price.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemovePackage(index)}>
              <Ionicons name="close-circle" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      <Card padding="md" className="mb-4 border border-dashed border-neutral-200">
        <TextInput
          placeholder="Package Name"
          value={pkgName}
          onChangeText={setPkgName}
          containerClassName="mb-2"
        />
        <TextInput
          placeholder="Description (optional)"
          value={pkgDesc}
          onChangeText={setPkgDesc}
          containerClassName="mb-2"
        />
        <View className="flex-row items-center">
          <View className="flex-1 mr-2">
            <TextInput
              placeholder="Price (PKR)"
              value={pkgPrice}
              onChangeText={(text) => setPkgPrice(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              containerClassName="mb-0"
            />
          </View>
          <Button
            title="Add"
            variant="secondary"
            size="md"
            onPress={handleAddPackage}
          />
        </View>
      </Card>
    </View>
  );

  const renderStep5 = () => (
    <View className="px-4">
      <Text variant="h4" weight="bold" className="mb-1" color={COLORS.primary[600]}>
        Amenities & Details
      </Text>
      <Text variant="label" color={COLORS.neutral[400]} className="mb-6">
        Select available amenities and add any extra details
      </Text>

      {/* Amenities */}
      <Text variant="label" weight="medium" className="mb-2 text-neutral-500">
        Amenities
      </Text>
      <View className="flex-row flex-wrap mb-6">
        {AMENITIES_LIST.map((amenity) => (
          <Chip
            key={amenity}
            label={amenity}
            selected={formData.amenities.includes(amenity)}
            onPress={() => handleToggleAmenity(amenity)}
            className="mr-2 mb-2"
            variant="outlined"
          />
        ))}
      </View>

      {/* Additional Info */}
      <TextInput
        label="Additional Information (Optional)"
        placeholder="Any extra details, rules, or special instructions for clients..."
        value={formData.additionalInfo}
        onChangeText={(text) => updateField('additionalInfo', text)}
        multiline
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const stepTitles = ['Basic Info', 'Location', 'Photos', 'Pricing', 'Amenities'];
  const stepIcons: (keyof typeof Ionicons.glyphMap)[] = [
    'document-text-outline',
    'location-outline',
    'camera-outline',
    'cash-outline',
    'sparkles-outline',
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Compact stepper header */}
        {renderStepperHeader()}

        <View
          style={{ height: 1, backgroundColor: COLORS.neutral[100] }}
        />

        {/* Scrollable step content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Bottom navigation */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: COLORS.neutral[0],
            paddingHorizontal: 16,
            paddingBottom: 28,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: COLORS.neutral[100],
            shadowColor: COLORS.neutral[700],
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {currentStep > 1 && (
              <View style={{ flex: 1 }}>
                <Button
                  title="Back"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onPress={handlePrevious}
                  leftIcon="chevron-back"
                />
              </View>
            )}
            <View style={{ flex: currentStep > 1 ? 2 : 1 }}>
              {currentStep < TOTAL_STEPS ? (
                <Button
                  title="Continue"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleNext}
                  rightIcon="chevron-forward"
                />
              ) : (
                <Button
                  title="Submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleSubmit}
                  rightIcon="checkmark-circle"
                  loading={submitting}
                />
              )}
            </View>
          </View>
        </View>

        <LoadingOverlay visible={submitting} message="Submitting your listing..." />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
