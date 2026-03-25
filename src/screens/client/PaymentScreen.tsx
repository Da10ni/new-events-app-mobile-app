import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput as RNTextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';
import { bookingApi } from '../../services/api/bookingApi';
import { paymentApi } from '../../services/api/paymentApi';
import { Text, Card, Divider } from '../../components/ui';
import { useSweetAlert } from '../../components/feedback';
import type { Booking } from '../../types';
import { COLORS } from '../../theme/colors';

// Platform-specific Stripe imports
const isWeb = Platform.OS === 'web';

// Native Stripe (lazy-loaded to avoid web bundling issues)
let CardField: any = null;
let useConfirmPayment: any = () => ({ confirmPayment: async () => ({}), loading: false });
if (!isWeb) {
  try {
    const stripeNative = require('@stripe/stripe-react-native');
    CardField = stripeNative.CardField;
    useConfirmPayment = stripeNative.useConfirmPayment;
  } catch {}
}

// Web Stripe
let Elements: any = null;
let CardElement: any = null;
let useStripe: any = () => null;
let useElements: any = () => null;
let stripePromise: any = null;
if (isWeb) {
  try {
    const stripeJs = require('@stripe/stripe-js');
    const stripeReact = require('@stripe/react-stripe-js');
    Elements = stripeReact.Elements;
    CardElement = stripeReact.CardElement;
    useStripe = stripeReact.useStripe;
    useElements = stripeReact.useElements;
    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    if (publishableKey) {
      stripePromise = stripeJs.loadStripe(publishableKey);
    }
  } catch {}
}

type Props = NativeStackScreenProps<ExploreStackParamList, 'PaymentScreen'>;

// ─── Card Brand Logos (SVG) ──────────────────────────────────────────────────

function VisaLogo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size * 1.6} height={size} viewBox="0 0 48 32">
      <Rect width="48" height="32" rx="4" fill="#1A1F71" />
      <Path
        d="M19.5 21h-2.7l1.7-10.5h2.7L19.5 21zM15.2 10.5l-2.6 7.2-.3-1.5-.9-4.6s-.1-.6-.8-1.1h-4.2l-.1.3s1 .2 2.1.9l1.8 6.8h2.8l4.2-8H15.2zM35.8 21h2.5l-2.2-10.5h-2.2c-.5 0-1 .3-1.2.8l-4 9.7h2.8l.6-1.5h3.4l.3 1.5zm-2.9-3.7l1.4-3.9.8 3.9h-2.2zM30.5 13.3l.4-2.2s-1.2-.5-2.4-.5c-1.3 0-4.5.6-4.5 3.5 0 2.7 3.8 2.8 3.8 4.2 0 1.4-3.4 1.2-4.5.3l-.4 2.3s1.2.6 3 .6c1.8 0 4.6-.9 4.6-3.6 0-2.7-3.9-3-3.9-4.2 0-1.2 2.7-1 3.9-.4z"
        fill="#fff"
      />
    </Svg>
  );
}

function MastercardLogo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size * 1.6} height={size} viewBox="0 0 48 32">
      <Rect width="48" height="32" rx="4" fill="#252525" />
      <Circle cx="19" cy="16" r="8" fill="#EB001B" />
      <Circle cx="29" cy="16" r="8" fill="#F79E1B" />
      <Path
        d="M24 10.3a8 8 0 0 1 0 11.4 8 8 0 0 1 0-11.4z"
        fill="#FF5F00"
      />
    </Svg>
  );
}

function AmexLogo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size * 1.6} height={size} viewBox="0 0 48 32">
      <Rect width="48" height="32" rx="4" fill="#006FCF" />
      <Path
        d="M6 16h3l1.5-3.5L12 16h3v-6.5l-2.5 0-1.5 3.5-1.5-3.5H7V16h-.5zM17 16h2.5v-2h2v-1.5h-2v-1h2.5V10H17v6zM23 16h2.5v-2h1.5l1.5 2h3l-2-2.5c.8-.3 1.5-1 1.5-2s-1-2.5-2.5-2.5H23v7zm2.5-5h2c.5 0 1 .3 1 .8s-.5.7-1 .7h-2v-1.5zM6 22.5h4.5l1-1 1 1H17l-2.5-3.2 2.5-3.3h-4l-1 1.2-1-1.2H6l2.5 3.3L6 22.5zm2.5-5h3l1 1.2 1-1.2h1l-2 2.5 2 2.5h-1l-1-1.2-1 1.2h-3l2-2.5-2-2.5z"
        fill="#fff"
      />
    </Svg>
  );
}

function StripeLogo({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  const width = size * 2.4;
  return (
    <Svg width={width} height={size} viewBox="0 0 60 25" fill="none">
      <Path
        d="M5 10.2c0-.7.6-1 1.5-1 1.4 0 3.1.4 4.5 1.2V6.3C9.5 5.7 8 5.3 6.5 5.3 2.7 5.3 0 7.4 0 10.5c0 4.8 6.6 4 6.6 6.1 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.9-1.5v4.2c1.7.7 3.3 1 4.9 1 3.9 0 6.6-1.9 6.6-5.1C11.5 11.8 5 12.8 5 10.2z"
        fill={color}
      />
      <Path d="M16.2 2l-4.8 1v3.5l4.8-1V2zM11.4 6.8h4.8v13.5h-4.8V6.8z" fill={color} />
      <Path
        d="M22 6.4l-.3 1.8h-2.1v5.5c0 2.3 1.5 3.2 3.6 3.2 1.1 0 1.9-.2 2.5-.5v-3.5c-.5.2-3.1.9-3.1-1.4V11.6h3.1V8.2h-3.1V6.4H22z"
        fill={color}
      />
      <Path
        d="M31.6 11c0-.8.6-1.1 1.3-1.1.9 0 2 .3 2.9.9V7.2c-1-.4-2-.6-2.9-.6-2.9 0-5.1 1.6-5.1 4.4 0 4.3 5.4 3.6 5.4 5.5 0 .9-.8 1.2-1.6 1.2-1.4 0-3.1-.6-4.3-1.4v3.6c1.5.6 2.9.9 4.3.9 3 0 5.2-1.5 5.2-4.4C36.8 12.2 31.6 13 31.6 11z"
        fill={color}
      />
      <Path
        d="M43.4 5.3c-1.7 0-2.8.8-3.4 1.3l-.2-1h-4.3v17.9l4.8-1v-4.3c.6.5 1.6 1.1 3.1 1.1 3.1 0 6-2.5 6-8C49.4 7.5 46.5 5.3 43.4 5.3zm-1 11.9c-1 0-1.6-.4-2-.8v-6.4c.4-.5 1.1-.9 2-.9 1.6 0 2.6 1.7 2.6 4.1 0 2.3-1 4-2.6 4z"
        fill={color}
      />
      <Path
        d="M55.9 5.3c-3.2 0-5.5 2.8-5.5 7.9 0 5.5 2.6 7.5 6.1 7.5 1.7 0 3-.4 4-1v-3.5c-.9.5-2 .8-3.3.8-1.3 0-2.4-.5-2.6-2h6.6c0-.2 0-.9 0-1.2C61.2 8.3 59.6 5.3 55.9 5.3zm-1.3 6.3c0-1.5.9-2.1 1.7-2.1.8 0 1.6.6 1.6 2.1h-3.3z"
        fill={color}
      />
    </Svg>
  );
}

// ─── Stripe Pay Button ───────────────────────────────────────────────────────

function StripePayButton({
  amount,
  currency,
  loading,
  disabled,
  onPress,
}: {
  amount: string;
  currency: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: disabled ? '#a0a0cc' : '#635BFF',
          borderRadius: 12,
          paddingVertical: 16,
          paddingHorizontal: 24,
          opacity: disabled ? 0.6 : 1,
          shadowColor: '#635BFF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        {loading ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#fff" />
            <Text
              variant="body"
              weight="semibold"
              color="#fff"
              className="ml-2"
              style={{ letterSpacing: 0.5 }}
            >
              Processing...
            </Text>
          </View>
        ) : (
          <View className="items-center">
            <View className="flex-row items-center justify-center">
              <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.8)" />
              <Text
                variant="body"
                weight="bold"
                color="#fff"
                className="ml-2"
                style={{ fontSize: 18, letterSpacing: 0.5 }}
              >
                Pay {currency} {amount}
              </Text>
            </View>
            <View className="mt-1.5 flex-row items-center justify-center">
              <Text
                variant="caption"
                color="rgba(255,255,255,0.6)"
                style={{ fontSize: 10, letterSpacing: 0.3 }}
              >
                powered by{' '}
              </Text>
              <StripeLogo size={12} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Simple Input Field ──────────────────────────────────────────────────────

function FormInput({
  label,
  required,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  focusedField,
  fieldName,
  setFocusedField,
  inputRef,
  returnKeyType,
  onSubmitEditing,
  maxLength,
  secureTextEntry,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  focusedField: string | null;
  fieldName: string;
  setFocusedField: (field: string | null) => void;
  inputRef?: React.RefObject<RNTextInput | null>;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  maxLength?: number;
  secureTextEntry?: boolean;
}) {
  const isFocused = focusedField === fieldName;
  return (
    <View className="mb-4">
      <View className="mb-1.5 flex-row">
        <Text variant="label" weight="medium" color={COLORS.neutral[600]}>
          {label}
        </Text>
        {required && (
          <Text variant="label" color="#EF4444"> *</Text>
        )}
      </View>
      <View
        className={`rounded-xl border ${
          isFocused ? 'border-primary-500' : 'border-neutral-200'
        }`}
        style={{
          height: 48,
          justifyContent: 'center',
          paddingHorizontal: 14,
          backgroundColor: '#fff',
        }}
      >
        <RNTextInput
          ref={inputRef as any}
          className="text-[15px] text-neutral-600"
          placeholder={placeholder}
          placeholderTextColor={COLORS.neutral[300]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocusedField(fieldName)}
          onBlur={() => setFocusedField(null)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          style={{ padding: 0 }}
        />
      </View>
    </View>
  );
}

// ─── Country Data ────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
];

// ─── Country Picker ──────────────────────────────────────────────────────────

function CountryPicker({
  selectedCode,
  onSelect,
}: {
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selected = COUNTRIES.find((c) => c.code === selectedCode);

  const filtered = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <>
      <View className="mb-4">
        <View className="mb-1.5 flex-row">
          <Text variant="label" weight="medium" color={COLORS.neutral[600]}>
            Country
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
          style={{
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.neutral[200],
            backgroundColor: '#fff',
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            variant="body"
            color={selected ? COLORS.neutral[600] : COLORS.neutral[300]}
            style={{ fontSize: 15 }}
          >
            {selected ? `${selected.flag}  ${selected.name}` : 'Select country'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.neutral[400]} />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '70%',
              paddingBottom: Platform.OS === 'ios' ? 34 : 16,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <Text variant="body" weight="bold" style={{ fontSize: 17 }}>
                Select Country
              </Text>
              <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }}>
                <Ionicons name="close" size={24} color={COLORS.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 8,
                height: 44,
                borderRadius: 10,
                backgroundColor: COLORS.neutral[50],
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="search" size={18} color={COLORS.neutral[400]} />
              <RNTextInput
                placeholder="Search country..."
                placeholderTextColor={COLORS.neutral[300]}
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, marginLeft: 8, fontSize: 15, padding: 0, color: COLORS.neutral[600] }}
              />
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item.code);
                    setVisible(false);
                    setSearch('');
                  }}
                  activeOpacity={0.6}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 13,
                    paddingHorizontal: 16,
                    backgroundColor: item.code === selectedCode ? COLORS.primary[50] : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 22, marginRight: 12 }}>{item.flag}</Text>
                  <Text variant="body" weight={item.code === selectedCode ? 'semibold' : 'regular'} style={{ flex: 1 }}>
                    {item.name}
                  </Text>
                  <Text variant="caption" color={COLORS.neutral[400]}>
                    {item.code}
                  </Text>
                  {item.code === selectedCode && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary[500]} style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: COLORS.neutral[100], marginHorizontal: 16 }} />
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

function PaymentScreenInner({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { showAlert } = useSweetAlert();
  const { confirmPayment } = useConfirmPayment();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Web Stripe hooks
  const webStripe = isWeb ? useStripe() : null;
  const webElements = isWeb ? useElements() : null;

  // Form state
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Billing address (Stripe format: Country + ZIP)
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const postalCodeRef = useRef<RNTextInput>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await bookingApi.getById(bookingId);
        setBooking(res.data.data.booking);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const isFormValid = useCallback(() => cardComplete, [cardComplete]);

  const handlePayNow = async () => {
    if (!cardComplete) return;

    setProcessing(true);
    setPaymentError(null);

    try {
      const intentRes = await paymentApi.createIntent(bookingId);
      const { clientSecret } = intentRes.data.data;

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      if (isWeb) {
        if (!webStripe || !webElements) {
          throw new Error('Stripe not initialized');
        }

        const cardElement = webElements.getElement('card');
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        const { error: confirmError, paymentIntent } = await webStripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                address: {
                  country: country.trim() || undefined,
                  postal_code: postalCode.trim() || undefined,
                },
              },
            },
          }
        );

        if (confirmError) {
          setPaymentError(confirmError.message || 'Payment failed');
          setProcessing(false);
          return;
        }

        if (paymentIntent?.status !== 'succeeded') {
          setPaymentError(`Payment status: ${paymentIntent?.status}`);
          setProcessing(false);
          return;
        }
      } else {
        const { error } = await confirmPayment(clientSecret, {
          paymentMethodType: 'Card',
        });

        if (error) {
          setPaymentError(error.message);
          setProcessing(false);
          return;
        }
      }

      await paymentApi.confirm(bookingId);

      showAlert({
        type: 'success',
        title: 'Payment Successful!',
        message: 'Your payment has been processed successfully.',
      });

      // Navigate to BookingDetailScreen in BookingsTab (works from any stack)
      (navigation as any).navigate('BookingsTab', {
        screen: 'BookingDetailScreen',
        params: { bookingId },
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Payment failed. Please try again.';
      setPaymentError(message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  const totalAmount = booking?.pricingSnapshot.totalAmount ?? 0;
  const currency = booking?.pricingSnapshot.currency || 'PKR';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4">
          {/* Order Summary */}
          {booking && (
            <Card padding="md" className="mb-5">
              <Text variant="body" weight="bold" className="mb-3">
                Order Summary
              </Text>

              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="label" color={COLORS.neutral[400]}>
                  Service
                </Text>
                <Text
                  variant="label"
                  weight="medium"
                  className="ml-4 flex-1 text-right"
                  numberOfLines={1}
                >
                  {booking.listing.title}
                </Text>
              </View>

              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="label" color={COLORS.neutral[400]}>
                  Event Date
                </Text>
                <Text variant="label" weight="medium">
                  {new Date(booking.eventDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {booking.pricingSnapshot.packageName && (
                <View className="mb-2 flex-row items-center justify-between">
                  <Text variant="label" color={COLORS.neutral[400]}>
                    Package
                  </Text>
                  <Text variant="label" weight="medium">
                    {booking.pricingSnapshot.packageName}
                  </Text>
                </View>
              )}

              <Divider className="my-3" />

              <View className="flex-row items-center justify-between">
                <Text variant="body" weight="bold">
                  Total
                </Text>
                <Text variant="h3" weight="bold" color={COLORS.primary[500]}>
                  {currency} {totalAmount.toLocaleString()}
                </Text>
              </View>
            </Card>
          )}

          {/* Card Information */}
          <Text variant="body" weight="bold" color={COLORS.neutral[700]} className="mb-3">
            Card information
          </Text>

          <View className="mb-2 flex-row items-center">
            <VisaLogo size={20} />
            <View className="ml-1.5">
              <MastercardLogo size={20} />
            </View>
            <View className="ml-1.5">
              <AmexLogo size={20} />
            </View>
          </View>

          {isWeb && CardElement ? (
            <View
              className="mb-4 rounded-xl border border-neutral-200"
              style={{
                backgroundColor: '#fff',
                paddingHorizontal: 14,
                paddingVertical: 14,
              }}
            >
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#333333',
                      '::placeholder': { color: '#BCBCBC' },
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    },
                    invalid: { color: '#DC2626' },
                  },
                  hidePostalCode: true,
                }}
                onChange={(event: any) => {
                  setCardComplete(event.complete);
                  if (event.error) {
                    setPaymentError(event.error.message);
                  } else {
                    setPaymentError(null);
                  }
                }}
              />
            </View>
          ) : (
            <CardField
              postalCodeEnabled={false}
              placeholders={{ number: 'Card number', expiration: 'MM/YY', cvc: 'CVC' }}
              cardStyle={{
                backgroundColor: '#FFFFFF',
                textColor: '#333333',
                borderWidth: 1,
                borderColor: '#E5E5E5',
                borderRadius: 12,
                fontSize: 15,
                placeholderColor: '#BCBCBC',
              }}
              style={{ width: '100%', height: 50, marginBottom: 16 }}
              onCardChange={(details: any) => {
                setCardComplete(details.complete);
                if (details.complete) setPaymentError(null);
              }}
            />
          )}

          {/* Billing Address */}
          <Text variant="body" weight="bold" color={COLORS.neutral[700]} className="mb-3">
            Billing address
          </Text>

          <CountryPicker selectedCode={country} onSelect={setCountry} />

          <FormInput
            label="ZIP"
            placeholder="12345"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="number-pad"
            focusedField={focusedField}
            fieldName="postalCode"
            setFocusedField={setFocusedField}
            inputRef={postalCodeRef}
            returnKeyType="done"
          />

          {/* Encryption note */}
          <View className="mb-6 flex-row items-center">
            <Ionicons name="lock-closed" size={12} color={COLORS.neutral[300]} />
            <Text variant="caption" color={COLORS.neutral[400]} className="ml-1">
              Your payment info is encrypted and secure.
            </Text>
          </View>

          {/* Payment Error */}
          {paymentError && (
            <View
              className="mb-4 flex-row items-center rounded-xl px-4 py-3"
              style={{ backgroundColor: '#FEF2F2' }}
            >
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text variant="caption" weight="medium" color="#DC2626" className="ml-2 flex-1">
                {paymentError}
              </Text>
            </View>
          )}

          {/* Pay Button */}
          <StripePayButton
            amount={totalAmount.toLocaleString()}
            currency={currency}
            loading={processing}
            disabled={!isFormValid()}
            onPress={handlePayNow}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Wrap in Stripe Elements provider on web
export default function PaymentScreen(props: Props) {
  if (isWeb && Elements && stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <PaymentScreenInner {...props} />
      </Elements>
    );
  }
  return <PaymentScreenInner {...props} />;
}
