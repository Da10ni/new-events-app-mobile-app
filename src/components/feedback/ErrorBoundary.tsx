import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import Button from '../ui/Button';
import { COLORS } from '../../theme/colors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center bg-white px-8 py-12">
          <View className="mb-5 items-center justify-center rounded-full bg-error-light p-5">
            <Ionicons name="warning-outline" size={48} color={COLORS.error} />
          </View>

          <Text variant="h3" weight="bold" className="mb-2 text-center text-neutral-600">
            Something went wrong
          </Text>

          <Text variant="body" color={COLORS.neutral[400]} className="mb-2 text-center">
            An unexpected error occurred. Please try again.
          </Text>

          {this.state.error && (
            <View className="mb-6 w-full rounded-lg bg-neutral-50 p-3">
              <Text variant="caption" color={COLORS.neutral[400]} className="text-center" numberOfLines={3}>
                {this.state.error.message}
              </Text>
            </View>
          )}

          <Button
            title="Try Again"
            variant="primary"
            size="md"
            leftIcon="refresh"
            onPress={this.handleRetry}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
