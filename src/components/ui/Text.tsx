import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<TextVariant, string> = {
  h1: 'text-[32px] leading-[38px]',
  h2: 'text-[26px] leading-[32px]',
  h3: 'text-[22px] leading-[28px]',
  h4: 'text-[18px] leading-[24px]',
  body: 'text-[16px] leading-[22px]',
  caption: 'text-[12px] leading-[16px]',
  label: 'text-[14px] leading-[18px]',
};

const weightClasses: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const Text: React.FC<TextProps> = ({
  variant = 'body',
  weight = 'regular',
  color,
  className = '',
  style,
  children,
  ...rest
}) => {
  return (
    <RNText
      className={`
        text-neutral-600
        ${variantClasses[variant]}
        ${weightClasses[weight]}
        ${className}
      `}
      style={[color ? { color } : undefined, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export default Text;
