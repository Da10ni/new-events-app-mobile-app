import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setCredentials, setVendor } from '../../store/slices/authSlice';
import { authApi } from '../../services/api/authApi';
import { vendorApi } from '../../services/api/vendorApi';
import { setTokens } from '../../services/storage/secureStorage';
import { useSweetAlert } from '../feedback';
import { Text, TextInput, Button } from '../ui';
import { COLORS } from '../../theme/colors';
import type { Category } from '../../types';

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad',
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BecomeProviderModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PersonalForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface BusinessForm {
  businessName: string;
  description: string;
  categories: string[];
  city: string;
}

type FormErrors = Partial<Record<string, string>>;

const BecomeProviderModal: React.FC<BecomeProviderModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const storeCategories = useAppSelector((s) => s.category.categories) as Category[];
  const { showAlert } = useSweetAlert();

  const isLoggedIn = !!user;

  const [step, setStep] = useState(isLoggedIn ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [personal, setPersonal] = useState<PersonalForm>({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });

  const [business, setBusiness] = useState<BusinessForm>({
    businessName: '', description: '', categories: [], city: '',
  });

  // Slide animation
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
    }
  }, [visible, slideAnim, backdropOpacity]);

  const animateClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => handleClose());
  };

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Calculate completion progress (0 to 1)
  const completionProgress = useMemo(() => {
    if (isLoggedIn) {
      const fields = [
        business.businessName.trim().length > 0,
        business.categories.length > 0,
        business.city.length > 0,
        agreedToTerms,
      ];
      return fields.filter(Boolean).length / fields.length;
    }
    if (step === 1) {
      const fields = [
        personal.firstName.trim().length > 0,
        personal.lastName.trim().length > 0,
        personal.email.trim().length > 0,
        personal.phone.trim().length > 0,
        personal.password.length >= 8,
        personal.confirmPassword.length > 0 && personal.password === personal.confirmPassword,
      ];
      return (fields.filter(Boolean).length / fields.length) * 0.5;
    }
    const step1Done = 0.5;
    const fields = [
      business.businessName.trim().length > 0,
      business.categories.length > 0,
      business.city.length > 0,
      agreedToTerms,
    ];
    return step1Done + (fields.filter(Boolean).length / fields.length) * 0.5;
  }, [isLoggedIn, step, personal, business, agreedToTerms]);

  // Animate the progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: completionProgress,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [completionProgress, progressAnim]);

  // Step dots config
  const stepDots = useMemo(() => {
    if (isLoggedIn) {
      return [
        { label: 'Name', filled: business.businessName.trim().length > 0, icon: 'business-outline' as const },
        { label: 'Category', filled: business.categories.length > 0, icon: 'grid-outline' as const },
        { label: 'City', filled: business.city.length > 0, icon: 'location-outline' as const },
        { label: 'Terms', filled: agreedToTerms, icon: 'checkmark-circle-outline' as const },
      ];
    }
    if (step === 1) {
      return [
        { label: 'Name', filled: personal.firstName.trim().length > 0 && personal.lastName.trim().length > 0, icon: 'person-outline' as const },
        { label: 'Email', filled: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim()), icon: 'mail-outline' as const },
        { label: 'Phone', filled: personal.phone.trim().length > 0, icon: 'call-outline' as const },
        { label: 'Password', filled: personal.password.length >= 8 && personal.password === personal.confirmPassword, icon: 'lock-closed-outline' as const },
      ];
    }
    return [
      { label: 'Name', filled: business.businessName.trim().length > 0, icon: 'business-outline' as const },
      { label: 'Category', filled: business.categories.length > 0, icon: 'grid-outline' as const },
      { label: 'City', filled: business.city.length > 0, icon: 'location-outline' as const },
      { label: 'Terms', filled: agreedToTerms, icon: 'checkmark-circle-outline' as const },
    ];
  }, [isLoggedIn, step, personal, business, agreedToTerms]);

  const updatePersonal = (field: keyof PersonalForm, value: string) => {
    setPersonal((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateBusiness = (field: keyof BusinessForm, value: string) => {
    setBusiness((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleCategory = (catId: string) => {
    setBusiness((prev) => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId],
    }));
    if (errors.categories) setErrors((prev) => ({ ...prev, categories: undefined }));
  };

  const passwordStrength = useMemo(() => {
    const pw = personal.password;
    if (!pw) return { level: 0, label: '', color: COLORS.neutral[200] };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: COLORS.error };
    if (score === 2) return { level: 2, label: 'Fair', color: COLORS.warning };
    if (score === 3) return { level: 3, label: 'Good', color: COLORS.info };
    return { level: 4, label: 'Strong', color: COLORS.success };
  }, [personal.password]);

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!personal.firstName.trim()) e.firstName = 'First name is required';
    if (!personal.lastName.trim()) e.lastName = 'Last name is required';
    if (!personal.email.trim()) {
      e.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())) {
      e.email = 'Enter a valid email';
    }
    if (!personal.phone.trim()) {
      e.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{7,15}$/.test(personal.phone.trim())) {
      e.phone = 'Enter a valid phone number';
    }
    if (!personal.password) {
      e.password = 'Password is required';
    } else if (personal.password.length < 8) {
      e.password = 'At least 8 characters';
    }
    if (!personal.confirmPassword) {
      e.confirmPassword = 'Confirm your password';
    } else if (personal.password !== personal.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!business.businessName.trim()) e.businessName = 'Business name is required';
    if (business.categories.length === 0) e.categories = 'Select at least one category';
    if (!business.city) e.city = 'Select your city';
    if (!agreedToTerms) {
      showAlert({ type: 'warning', title: 'Terms Required', message: 'Please agree to the Terms of Service to continue.' });
      return false;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    try {
      if (isLoggedIn) {
        const response = await vendorApi.create({
          businessName: business.businessName.trim(),
          description: business.description.trim() || undefined,
          categories: business.categories,
          address: { city: business.city, country: 'Pakistan' },
        });
        const vendor = response.data.data.vendor;
        dispatch(setVendor(vendor));
      } else {
        const response = await authApi.registerVendor({
          firstName: personal.firstName.trim(),
          lastName: personal.lastName.trim(),
          email: personal.email.trim().toLowerCase(),
          phone: personal.phone.trim(),
          password: personal.password,
          businessName: business.businessName.trim(),
          description: business.description.trim() || undefined,
          categories: business.categories,
          address: { city: business.city, country: 'Pakistan' },
        });
        const { user: newUser, vendor, accessToken, refreshToken } = response.data.data;
        await setTokens(accessToken, refreshToken);
        dispatch(setCredentials({ user: newUser, vendor, accessToken, refreshToken }));
      }

      handleClose();
      onSuccess?.();
      showAlert({
        type: 'success',
        title: 'Application Submitted!',
        message: 'Your provider account is under review. Our admin team will verify your details and approve your account shortly. You\'ll be notified once approved!',
        buttons: [{ text: 'Got it!' }],
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      showAlert({ type: 'error', title: 'Error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(isLoggedIn ? 2 : 1);
    setErrors({});
    setAgreedToTerms(false);
    setBusiness({ businessName: '', description: '', categories: [], city: '' });
    setPersonal({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
    onClose();
  };

  const progressPercent = Math.round(completionProgress * 100);

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={animateClose}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: backdropOpacity,
          }}
        />
        {/* Sliding Content */}
        <Animated.View
          style={{
            flex: 1,
            marginTop: 40,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            transform: [{ translateY: slideAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Drag Handle */}
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.neutral[200] }} />
        </View>

        {/* ─── Top Header ─── */}
        <View style={{ backgroundColor: '#FFFFFF' }}>
          {/* Close + Title Row */}
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
            }}
          >
            <TouchableOpacity
              onPress={animateClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: COLORS.neutral[50],
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={COLORS.neutral[500]} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text variant="body" weight="bold" color={COLORS.neutral[700]}>
                Become a Provider
              </Text>
              {!isLoggedIn && (
                <Text variant="caption" color={COLORS.neutral[400]} style={{ marginTop: 1 }}>
                  Step {step} of 2
                </Text>
              )}
            </View>

            {/* Percentage Badge */}
            <View
              style={{
                backgroundColor: completionProgress === 1 ? COLORS.primary[50] : COLORS.neutral[50],
                borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
              }}
            >
              <Text
                variant="caption"
                weight="bold"
                color={completionProgress === 1 ? COLORS.primary[500] : COLORS.neutral[400]}
              >
                {progressPercent}%
              </Text>
            </View>
          </View>

          {/* ─── Animated Progress Bar ─── */}
          <View style={{ height: 4, backgroundColor: COLORS.neutral[100], marginHorizontal: 20, borderRadius: 2 }}>
            <Animated.View
              style={{
                height: 4, borderRadius: 2,
                backgroundColor: COLORS.primary[500],
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_WIDTH - 40],
                }),
              }}
            />
          </View>

          {/* ─── Step Dots ─── */}
          <View
            style={{
              flexDirection: 'row', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
            }}
          >
            {stepDots.map((dot, i) => (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: dot.filled ? COLORS.primary[500] : COLORS.neutral[100],
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 4,
                  }}
                >
                  {dot.filled ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : (
                    <Ionicons name={dot.icon} size={16} color={COLORS.neutral[300]} />
                  )}
                </View>
                <Text
                  variant="caption"
                  weight={dot.filled ? 'semibold' : 'medium'}
                  color={dot.filled ? COLORS.primary[500] : COLORS.neutral[300]}
                  style={{ fontSize: 10 }}
                >
                  {dot.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Separator */}
          <View style={{ height: 1, backgroundColor: COLORS.neutral[100] }} />
        </View>

        {/* ─── Form Content ─── */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{ flex: 1, backgroundColor: COLORS.neutral[50] }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              /* ──── STEP 1: Personal Info ──── */
              <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                {/* Welcome Banner */}
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: COLORS.primary[50], borderRadius: 16,
                    padding: 16, marginBottom: 20,
                  }}
                >
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 14,
                      backgroundColor: COLORS.primary[500],
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                    }}
                  >
                    <Ionicons name="person-add" size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" weight="bold" color={COLORS.primary[500]}>
                      Create your account
                    </Text>
                    <Text variant="caption" color={COLORS.primary[500]} style={{ marginTop: 2, opacity: 0.7 }}>
                      Fill in your personal details to get started
                    </Text>
                  </View>
                </View>

                {/* Name Section */}
                <Text variant="caption" weight="semibold" color={COLORS.neutral[400]} style={{ marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Full Name
                </Text>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.neutral[100] }}>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <TextInput
                        leftIcon="person-outline"
                        placeholder="First name"
                        value={personal.firstName}
                        onChangeText={(t) => updatePersonal('firstName', t)}
                        autoCapitalize="words"
                        error={errors.firstName}
                        containerClassName="mb-0"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <TextInput
                        leftIcon="person-outline"
                        placeholder="Last name"
                        value={personal.lastName}
                        onChangeText={(t) => updatePersonal('lastName', t)}
                        autoCapitalize="words"
                        error={errors.lastName}
                        containerClassName="mb-0"
                      />
                    </View>
                  </View>
                </View>

                {/* Contact Section */}
                <Text variant="caption" weight="semibold" color={COLORS.neutral[400]} style={{ marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Contact Details
                </Text>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.neutral[100] }}>
                  <TextInput
                    leftIcon="mail-outline"
                    placeholder="Email address"
                    value={personal.email}
                    onChangeText={(t) => updatePersonal('email', t)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email}
                  />
                  <TextInput
                    leftIcon="call-outline"
                    placeholder="+92 300 1234567"
                    value={personal.phone}
                    onChangeText={(t) => updatePersonal('phone', t)}
                    keyboardType="phone-pad"
                    error={errors.phone}
                    containerClassName="mb-0"
                  />
                </View>

                {/* Password Section */}
                <Text variant="caption" weight="semibold" color={COLORS.neutral[400]} style={{ marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Security
                </Text>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.neutral[100] }}>
                  <TextInput
                    leftIcon="lock-closed-outline"
                    placeholder="Create a strong password"
                    value={personal.password}
                    onChangeText={(t) => updatePersonal('password', t)}
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    error={errors.password}
                    containerClassName="mb-1"
                  />

                  {personal.password.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                        {[1, 2, 3, 4].map((level) => (
                          <View
                            key={level}
                            style={{
                              flex: 1, height: 4, marginHorizontal: 2, borderRadius: 2,
                              backgroundColor: level <= passwordStrength.level ? passwordStrength.color : COLORS.neutral[200],
                            }}
                          />
                        ))}
                      </View>
                      <Text variant="caption" color={passwordStrength.color} style={{ textAlign: 'right' }}>
                        {passwordStrength.label}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    leftIcon="lock-closed-outline"
                    placeholder="Confirm your password"
                    value={personal.confirmPassword}
                    onChangeText={(t) => updatePersonal('confirmPassword', t)}
                    secureTextEntry={!showConfirmPassword}
                    rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    error={errors.confirmPassword}
                    containerClassName="mb-0"
                  />
                </View>

                <Button title="Continue" variant="primary" size="lg" fullWidth onPress={handleContinue} rightIcon="arrow-forward" />
              </View>
            ) : (
              /* ──── STEP 2: Business Details ──── */
              <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                {/* Welcome Banner */}
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: COLORS.primary[50], borderRadius: 16,
                    padding: 16, marginBottom: 20,
                  }}
                >
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 14,
                      backgroundColor: COLORS.primary[500],
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                    }}
                  >
                    <Ionicons name="storefront" size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" weight="bold" color={COLORS.primary[500]}>
                      {isLoggedIn ? `Hey ${user?.firstName}, set up your business` : 'Business Details'}
                    </Text>
                    <Text variant="caption" color={COLORS.primary[500]} style={{ marginTop: 2, opacity: 0.7 }}>
                      Tell us about the services you offer
                    </Text>
                  </View>
                </View>

                {/* Business Info */}
                <Text variant="caption" weight="semibold" color={COLORS.neutral[400]} style={{ marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Business Info
                </Text>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.neutral[100] }}>
                  <TextInput
                    leftIcon="business-outline"
                    placeholder="Your business name"
                    value={business.businessName}
                    onChangeText={(t) => updateBusiness('businessName', t)}
                    autoCapitalize="words"
                    error={errors.businessName}
                  />
                  <TextInput
                    placeholder="Describe your services (optional)"
                    value={business.description}
                    onChangeText={(t) => updateBusiness('description', t)}
                    multiline
                    numberOfLines={3}
                    containerClassName="mb-0"
                  />
                </View>

                {/* Service Categories — tap to open full-screen picker */}
                <Text variant="caption" weight="semibold" color={COLORS.neutral[400]} style={{ marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Service Categories
                </Text>
                <TouchableOpacity
                  onPress={() => setCategoryDropdownOpen(true)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: errors.categories ? 4 : 16,
                    borderWidth: 1, borderColor: errors.categories ? COLORS.error : COLORS.neutral[100],
                    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
                  }}
                >
                  <Ionicons name="grid-outline" size={18} color={business.categories.length > 0 ? COLORS.primary[500] : COLORS.neutral[300]} style={{ marginRight: 10 }} />
                  <Text
                    variant="label"
                    color={business.categories.length > 0 ? COLORS.neutral[700] : COLORS.neutral[400]}
                    style={{ flex: 1 }}
                    numberOfLines={1}
                  >
                    {business.categories.length > 0
                      ? storeCategories.filter((c) => business.categories.includes(c._id)).map((c) => c.name).join(', ')
                      : 'Select service categories'}
                  </Text>
                  {business.categories.length > 0 && (
                    <View style={{ backgroundColor: COLORS.primary[500], borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8 }}>
                      <Text variant="caption" weight="bold" color="#FFFFFF" style={{ fontSize: 10 }}>{business.categories.length}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={COLORS.neutral[400]} />
                </TouchableOpacity>
                {errors.categories && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
                    <Ionicons name="alert-circle" size={13} color={COLORS.error} />
                    <Text variant="caption" color={COLORS.error} style={{ marginLeft: 4 }}>{errors.categories}</Text>
                  </View>
                )}

                {/* City — tap to open full-screen picker */}
                <Text variant="caption" weight="semibold" color={COLORS.neutral[400]} style={{ marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Location
                </Text>
                <TouchableOpacity
                  onPress={() => setCityDropdownOpen(true)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: errors.city ? 4 : 16,
                    borderWidth: 1, borderColor: errors.city ? COLORS.error : COLORS.neutral[100],
                    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
                  }}
                >
                  <Ionicons name="location-outline" size={18} color={business.city ? COLORS.primary[500] : COLORS.neutral[300]} style={{ marginRight: 10 }} />
                  <Text
                    variant="label"
                    color={business.city ? COLORS.neutral[700] : COLORS.neutral[400]}
                    style={{ flex: 1 }}
                  >
                    {business.city || 'Select your city'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.neutral[400]} />
                </TouchableOpacity>
                {errors.city && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
                    <Ionicons name="alert-circle" size={13} color={COLORS.error} />
                    <Text variant="caption" color={COLORS.error} style={{ marginLeft: 4 }}>{errors.city}</Text>
                  </View>
                )}

                {/* Terms */}
                <TouchableOpacity
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#FFFFFF', borderRadius: 16,
                    padding: 16, marginBottom: 24,
                    borderWidth: 1.5,
                    borderColor: agreedToTerms ? COLORS.primary[500] : COLORS.neutral[100],
                  }}
                >
                  <View
                    style={{
                      width: 24, height: 24, borderRadius: 8,
                      borderWidth: 2,
                      borderColor: agreedToTerms ? COLORS.primary[500] : COLORS.neutral[300],
                      backgroundColor: agreedToTerms ? COLORS.primary[500] : 'transparent',
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}
                  >
                    {agreedToTerms && <Ionicons name="checkmark" size={15} color="#FFF" />}
                  </View>
                  <Text variant="label" color={COLORS.neutral[500]} style={{ flex: 1, lineHeight: 20 }}>
                    I agree to the{' '}
                    <Text variant="label" weight="semibold" color={COLORS.primary[500]}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text variant="label" weight="semibold" color={COLORS.primary[500]}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {!isLoggedIn && (
                    <View style={{ flex: 1 }}>
                      <Button title="Back" variant="outline" size="lg" fullWidth leftIcon="arrow-back" onPress={() => setStep(1)} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Button
                      title={isLoggedIn ? 'Submit Application' : 'Create Account'}
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      onPress={handleSubmit}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Footer */}
            {!isLoggedIn && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                <Text variant="label" color={COLORS.neutral[400]}>Already have an account? </Text>
                <TouchableOpacity onPress={animateClose}>
                  <Text variant="label" weight="bold" color={COLORS.primary[500]}>Log In</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>

      {/* ─── Full-Screen Category Picker ─── */}
      <Modal visible={categoryDropdownOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setCategoryDropdownOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingVertical: 14,
              borderBottomWidth: 1, borderBottomColor: COLORS.neutral[100],
            }}
          >
            <TouchableOpacity
              onPress={() => setCategoryDropdownOpen(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: COLORS.neutral[50],
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.neutral[600]} />
            </TouchableOpacity>
            <Text variant="body" weight="bold" color={COLORS.neutral[700]}>Select Categories</Text>
            <TouchableOpacity onPress={() => setCategoryDropdownOpen(false)}>
              <Text variant="label" weight="bold" color={COLORS.primary[500]}>
                Done{business.categories.length > 0 ? ` (${business.categories.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.neutral[50] }}>
            <Text variant="caption" color={COLORS.neutral[400]}>Select all the services you offer</Text>
          </View>

          {/* List */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {storeCategories.map((cat, idx) => {
              const isSelected = business.categories.includes(cat._id);
              return (
                <TouchableOpacity
                  key={cat._id}
                  onPress={() => toggleCategory(cat._id)}
                  activeOpacity={0.6}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 20, paddingVertical: 16,
                    backgroundColor: isSelected ? COLORS.primary[50] : '#FFFFFF',
                    borderBottomWidth: 1, borderBottomColor: COLORS.neutral[50],
                  }}
                >
                  <View
                    style={{
                      width: 24, height: 24, borderRadius: 7,
                      borderWidth: 2,
                      borderColor: isSelected ? COLORS.primary[500] : COLORS.neutral[300],
                      backgroundColor: isSelected ? COLORS.primary[500] : 'transparent',
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                    }}
                  >
                    {isSelected && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                  </View>
                  <Text variant="body" color={isSelected ? COLORS.primary[600] : COLORS.neutral[700]} weight={isSelected ? 'semibold' : 'medium'}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ─── Full-Screen City Picker ─── */}
      <Modal visible={cityDropdownOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setCityDropdownOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingVertical: 14,
              borderBottomWidth: 1, borderBottomColor: COLORS.neutral[100],
            }}
          >
            <TouchableOpacity
              onPress={() => setCityDropdownOpen(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: COLORS.neutral[50],
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.neutral[600]} />
            </TouchableOpacity>
            <Text variant="body" weight="bold" color={COLORS.neutral[700]}>Select City</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Subtitle */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.neutral[50] }}>
            <Text variant="caption" color={COLORS.neutral[400]}>Where is your business based?</Text>
          </View>

          {/* List */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {CITIES.map((city) => {
              const isSelected = business.city === city;
              return (
                <TouchableOpacity
                  key={city}
                  onPress={() => {
                    setBusiness((prev) => ({ ...prev, city }));
                    if (errors.city) setErrors((prev) => ({ ...prev, city: undefined }));
                    setCityDropdownOpen(false);
                  }}
                  activeOpacity={0.6}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 20, paddingVertical: 16,
                    backgroundColor: isSelected ? COLORS.primary[50] : '#FFFFFF',
                    borderBottomWidth: 1, borderBottomColor: COLORS.neutral[50],
                  }}
                >
                  <View
                    style={{
                      width: 24, height: 24, borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? COLORS.primary[500] : COLORS.neutral[300],
                      backgroundColor: isSelected ? COLORS.primary[500] : 'transparent',
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                    }}
                  >
                    {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' }} />}
                  </View>
                  <Text variant="body" color={isSelected ? COLORS.primary[600] : COLORS.neutral[700]} weight={isSelected ? 'semibold' : 'medium'}>
                    {city}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary[500]} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default BecomeProviderModal;
