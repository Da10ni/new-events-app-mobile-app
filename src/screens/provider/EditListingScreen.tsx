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
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProviderListingsStackParamList } from '../../navigation/types';
import { listingApi } from '../../services/api/listingApi';
import { categoryApi } from '../../services/api/categoryApi';
import { Text, Button, TextInput, Card, Chip, Divider, Skeleton } from '../../components/ui';
import { LoadingOverlay, useSweetAlert } from '../../components/feedback';
import type { Category, Listing, ListingPackage } from '../../types';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ProviderListingsStackParamList, 'EditListingScreen'>;

const TOTAL_STEPS = 5;

const PRICE_UNITS = [
  { key: 'per event', label: 'Per Event' },
  { key: 'per day', label: 'Per Day' },
  { key: 'per person', label: 'Per Person' },
  { key: 'per hour', label: 'Per Hour' },
];

const AMENITIES_LIST = [
  'Sound System', 'Parking', 'Air Conditioning', 'WiFi', 'Catering', 'Stage',
  'Lighting', 'Projector', 'Generator', 'Decoration', 'Valet Parking',
  'Wheelchair Access', 'Security', 'Changing Room', 'Prayer Area', 'Kids Area',
];

interface LocalImage {
  uri: string;
  isPrimary: boolean;
  isExisting: boolean;
  publicId?: string;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  city: string;
  area: string;
  fullAddress: string;
  images: LocalImage[];
  basePrice: string;
  priceUnit: string;
  packages: ListingPackage[];
  capacityMin: string;
  capacityMax: string;
  amenities: string[];
  additionalInfo: string;
}

interface StepErrors {
  [key: string]: string;
}

export default function EditListingScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const { showAlert } = useSweetAlert();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', categoryId: '', tags: [],
    city: '', area: '', fullAddress: '', images: [],
    basePrice: '', priceUnit: 'per event', packages: [],
    capacityMin: '', capacityMax: '', amenities: [], additionalInfo: '',
  });
  const [errors, setErrors] = useState<StepErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [listingRes, catRes] = await Promise.all([
          listingApi.getBySlug(listingId),
          categoryApi.getAll(),
        ]);

        const listing: Listing = listingRes.data?.data?.listing;
        setCategories(catRes.data?.data?.categories || []);

        if (listing) {
          setFormData({
            title: listing.title || '',
            description: listing.description || '',
            categoryId: listing.category?._id || '',
            tags: listing.tags || [],
            city: listing.address?.city || '',
            area: listing.address?.area || '',
            fullAddress: listing.address?.street || '',
            images: (listing.images || []).map((img) => ({
              uri: img.url,
              isPrimary: img.isPrimary,
              isExisting: true,
              publicId: img.publicId,
            })),
            basePrice: listing.pricing?.basePrice?.toString() || '',
            priceUnit: listing.pricing?.priceUnit || 'per event',
            packages: listing.pricing?.packages || [],
            capacityMin: listing.capacity?.min?.toString() || '',
            capacityMax: listing.capacity?.max?.toString() || '',
            amenities: listing.amenities || [],
            additionalInfo: (listing.attributes as any)?.additionalInfo || '',
          });
        }
      } catch (err: any) {
        showAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to load listing' });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [listingId]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: StepErrors = {};
    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.categoryId) newErrors.categoryId = 'Please select a category';
        break;
      case 2:
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.area.trim()) newErrors.area = 'Area is required';
        break;
      case 3:
        if (formData.images.length < 3) newErrors.images = 'Please add at least 3 photos';
        break;
      case 4:
        if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) newErrors.basePrice = 'Please enter a valid price';
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
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
        const newImages: LocalImage[] = result.assets.map((asset) => ({
          uri: asset.uri,
          isPrimary: false,
          isExisting: false,
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
    if (wasPrimary && newImages.length > 0) newImages[0].isPrimary = true;
    updateField('images', newImages);
  };

  const handleSetCoverPhoto = (index: number) => {
    const newImages = formData.images.map((img, i) => ({ ...img, isPrimary: i === index }));
    updateField('images', newImages);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      updateField('tags', [...formData.tags, tag]);
      setTagInput('');
    }
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
    setPkgName(''); setPkgDesc(''); setPkgPrice('');
  };

  const handleToggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      updateField('amenities', formData.amenities.filter((a) => a !== amenity));
    } else {
      updateField('amenities', [...formData.amenities, amenity]);
    }
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;
    try {
      setSubmitting(true);
      const updateData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.categoryId,
        tags: formData.tags,
        address: {
          city: formData.city,
          area: formData.area,
          street: formData.fullAddress,
          country: 'Pakistan',
        },
        pricing: {
          basePrice: parseFloat(formData.basePrice),
          priceUnit: formData.priceUnit,
          currency: 'PKR',
          packages: formData.packages,
        },
        amenities: formData.amenities,
        attributes: { additionalInfo: formData.additionalInfo },
      };
      if (formData.capacityMin || formData.capacityMax) {
        updateData.capacity = {
          min: parseInt(formData.capacityMin) || 0,
          max: parseInt(formData.capacityMax) || 0,
        };
      }
      await listingApi.update(listingId, updateData);
      showAlert({ type: 'success', title: 'Success', message: 'Listing updated successfully', buttons: [
        { text: 'OK', onPress: () => navigation.goBack() },
      ] });
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to update listing' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <View className="px-4 pt-4">
          <Skeleton variant="text" width="60%" height={24} className="mb-4" />
          <Skeleton variant="rect" height={52} className="mb-4" />
          <Skeleton variant="rect" height={100} className="mb-4" />
          <Skeleton variant="rect" height={52} className="mb-4" />
          <Skeleton variant="rect" height={52} className="mb-4" />
        </View>
      </SafeAreaView>
    );
  }

  const stepTitles = ['Basic Info', 'Location', 'Photos', 'Pricing', 'Amenities'];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View className="px-4">
            <Text variant="h4" weight="bold" className="mb-1 text-neutral-600">Basic Information</Text>
            <Text variant="label" color={COLORS.neutral[400]} className="mb-6">Update your listing details</Text>
            <TextInput label="Listing Title" placeholder="e.g., Grand Ballroom for Events" value={formData.title} onChangeText={(t) => updateField('title', t)} error={errors.title} />
            <TextInput label="Description" placeholder="Describe your service..." value={formData.description} onChangeText={(t) => updateField('description', t)} multiline error={errors.description} />
            <Text variant="label" weight="medium" className="mb-1.5 text-neutral-500">Category</Text>
            {errors.categoryId && (
              <View className="mb-2 flex-row items-center">
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text variant="caption" color={COLORS.error} className="ml-1">{errors.categoryId}</Text>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {categories.map((cat) => (
                <Chip key={cat._id} label={cat.name} selected={formData.categoryId === cat._id} onPress={() => updateField('categoryId', cat._id)} className="mr-2" />
              ))}
            </ScrollView>
            <Text variant="label" weight="medium" className="mb-1.5 text-neutral-500">Tags</Text>
            <View className="flex-row items-center mb-2">
              <View className="flex-1 mr-2">
                <TextInput placeholder="Add a tag" value={tagInput} onChangeText={setTagInput} onSubmitEditing={handleAddTag} returnKeyType="done" containerClassName="mb-0" />
              </View>
              <TouchableOpacity onPress={handleAddTag} className="h-[52px] w-[52px] items-center justify-center rounded-xl bg-primary-500">
                <Ionicons name="add" size={24} color={COLORS.neutral[0]} />
              </TouchableOpacity>
            </View>
            {formData.tags.length > 0 && (
              <View className="flex-row flex-wrap mb-4">
                {formData.tags.map((tag) => (
                  <Chip key={tag} label={tag} selected closable onClose={() => updateField('tags', formData.tags.filter((t) => t !== tag))} className="mr-2 mb-2" />
                ))}
              </View>
            )}
          </View>
        );
      case 2:
        return (
          <View className="px-4">
            <Text variant="h4" weight="bold" className="mb-1 text-neutral-600">Location</Text>
            <Text variant="label" color={COLORS.neutral[400]} className="mb-6">Update your location details</Text>
            <TextInput label="City" placeholder="e.g., Lahore" value={formData.city} onChangeText={(t) => updateField('city', t)} leftIcon="location" error={errors.city} />
            <TextInput label="Area" placeholder="e.g., Gulberg" value={formData.area} onChangeText={(t) => updateField('area', t)} leftIcon="navigate" error={errors.area} />
            <TextInput label="Full Address (Optional)" placeholder="Complete street address" value={formData.fullAddress} onChangeText={(t) => updateField('fullAddress', t)} leftIcon="map" multiline />
          </View>
        );
      case 3:
        return (
          <View className="px-4">
            <Text variant="h4" weight="bold" className="mb-1 text-neutral-600">Photos</Text>
            <Text variant="label" color={COLORS.neutral[400]} className="mb-2">Manage your listing photos</Text>
            {errors.images && (
              <View className="mb-3 flex-row items-center">
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text variant="caption" color={COLORS.error} className="ml-1">{errors.images}</Text>
              </View>
            )}
            <View className="flex-row flex-wrap mb-4">
              {formData.images.map((img, index) => (
                <View key={index} className="w-1/3 p-1">
                  <View className="relative">
                    <Image source={{ uri: img.uri }} className="h-28 w-full rounded-xl" resizeMode="cover" />
                    {img.isPrimary && (
                      <View className="absolute top-1 left-1 rounded-md bg-primary-500 px-1.5 py-0.5">
                        <Text variant="caption" weight="semibold" color={COLORS.neutral[0]}>Cover</Text>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => handleRemoveImage(index)} className="absolute top-1 right-1 h-6 w-6 items-center justify-center rounded-full bg-black/60">
                      <Ionicons name="close" size={14} color={COLORS.neutral[0]} />
                    </TouchableOpacity>
                    {!img.isPrimary && (
                      <TouchableOpacity onPress={() => handleSetCoverPhoto(index)} className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5">
                        <Text variant="caption" color={COLORS.neutral[0]}>Set Cover</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              <View className="w-1/3 p-1">
                <TouchableOpacity onPress={handlePickImages} className="h-28 w-full items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                  <Ionicons name="camera-outline" size={28} color={COLORS.neutral[300]} />
                  <Text variant="caption" color={COLORS.neutral[300]} className="mt-1">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case 4:
        return (
          <View className="px-4">
            <Text variant="h4" weight="bold" className="mb-1 text-neutral-600">Pricing & Capacity</Text>
            <Text variant="label" color={COLORS.neutral[400]} className="mb-6">Update pricing details</Text>
            <TextInput label="Base Price (PKR)" placeholder="e.g., 50000" value={formData.basePrice} onChangeText={(t) => updateField('basePrice', t.replace(/[^0-9]/g, ''))} keyboardType="numeric" leftIcon="cash" error={errors.basePrice} />
            <Text variant="label" weight="medium" className="mb-1.5 text-neutral-500">Price Unit</Text>
            <View className="flex-row flex-wrap mb-4">
              {PRICE_UNITS.map((unit) => (
                <Chip key={unit.key} label={unit.label} selected={formData.priceUnit === unit.key} onPress={() => updateField('priceUnit', unit.key)} className="mr-2 mb-2" />
              ))}
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1"><TextInput label="Min Guests" placeholder="50" value={formData.capacityMin} onChangeText={(t) => updateField('capacityMin', t.replace(/[^0-9]/g, ''))} keyboardType="numeric" /></View>
              <View className="flex-1"><TextInput label="Max Guests" placeholder="500" value={formData.capacityMax} onChangeText={(t) => updateField('capacityMax', t.replace(/[^0-9]/g, ''))} keyboardType="numeric" /></View>
            </View>
            <Divider className="my-4" />
            <Text variant="h4" weight="bold" className="mb-1 text-neutral-600">Packages</Text>
            <Text variant="caption" color={COLORS.neutral[400]} className="mb-4">Manage custom packages</Text>
            {formData.packages.map((pkg, index) => (
              <Card key={index} padding="sm" className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text variant="label" weight="semibold" className="text-neutral-600">{pkg.name}</Text>
                    {pkg.description && <Text variant="caption" color={COLORS.neutral[400]}>{pkg.description}</Text>}
                    <Text variant="label" weight="bold" color={COLORS.primary[500]}>PKR {pkg.price.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { const p = [...formData.packages]; p.splice(index, 1); updateField('packages', p); }}>
                    <Ionicons name="close-circle" size={22} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
            <Card padding="md" className="mb-4 border border-dashed border-neutral-200">
              <TextInput placeholder="Package Name" value={pkgName} onChangeText={setPkgName} containerClassName="mb-2" />
              <TextInput placeholder="Description (optional)" value={pkgDesc} onChangeText={setPkgDesc} containerClassName="mb-2" />
              <View className="flex-row items-center">
                <View className="flex-1 mr-2"><TextInput placeholder="Price (PKR)" value={pkgPrice} onChangeText={(t) => setPkgPrice(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" containerClassName="mb-0" /></View>
                <Button title="Add" variant="secondary" size="md" onPress={handleAddPackage} />
              </View>
            </Card>
          </View>
        );
      case 5:
        return (
          <View className="px-4">
            <Text variant="h4" weight="bold" className="mb-1 text-neutral-600">Amenities & Details</Text>
            <Text variant="label" color={COLORS.neutral[400]} className="mb-6">Update amenities and extra information</Text>
            <Text variant="label" weight="medium" className="mb-2 text-neutral-500">Amenities</Text>
            <View className="flex-row flex-wrap mb-6">
              {AMENITIES_LIST.map((amenity) => (
                <Chip key={amenity} label={amenity} selected={formData.amenities.includes(amenity)} onPress={() => handleToggleAmenity(amenity)} className="mr-2 mb-2" variant="outlined" />
              ))}
            </View>
            <TextInput label="Additional Information (Optional)" placeholder="Any extra details or rules..." value={formData.additionalInfo} onChangeText={(t) => updateField('additionalInfo', t)} multiline />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {/* Progress Bar */}
        <View className="px-4 pt-2 pb-4">
          <Text variant="label" weight="semibold" className="mb-2 text-neutral-600">
            Step {currentStep} of {TOTAL_STEPS}
          </Text>
          <View className="flex-row gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <View key={i} className={`h-1.5 flex-1 rounded-full ${i < currentStep ? 'bg-primary-500' : 'bg-neutral-100'}`} />
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          {stepTitles.map((title, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            return (
              <TouchableOpacity key={title} className="mr-4 flex-row items-center" onPress={() => { if (isCompleted) setCurrentStep(stepNum); }}>
                <View className={`h-6 w-6 items-center justify-center rounded-full ${isActive ? 'bg-primary-500' : isCompleted ? 'bg-success' : 'bg-neutral-100'}`}>
                  {isCompleted ? <Ionicons name="checkmark" size={14} color={COLORS.neutral[0]} /> : <Text variant="caption" weight="bold" color={isActive ? COLORS.neutral[0] : COLORS.neutral[300]}>{stepNum}</Text>}
                </View>
                <Text variant="caption" weight={isActive ? 'semibold' : 'regular'} color={isActive ? COLORS.neutral[600] : COLORS.neutral[400]} className="ml-1.5">{title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Divider />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {renderCurrentStep()}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white px-4 pb-6 pt-4">
          <View className="flex-row gap-3">
            {currentStep > 1 && (
              <Button title="Previous" variant="outline" size="lg" fullWidth onPress={handlePrevious} leftIcon="chevron-back" className="flex-1" />
            )}
            {currentStep < TOTAL_STEPS ? (
              <Button title="Next" variant="primary" size="lg" fullWidth onPress={handleNext} rightIcon="chevron-forward" className="flex-1" />
            ) : (
              <Button title="Save Changes" variant="primary" size="lg" fullWidth onPress={handleSave} rightIcon="checkmark-circle" className="flex-1" loading={submitting} />
            )}
          </View>
        </View>

        <LoadingOverlay visible={submitting} message="Saving changes..." />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
