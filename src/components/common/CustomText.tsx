import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps {
  fontWeight?: '400' | '500' | '600' | '700' | '800' | '900';
}

const CustomText: React.FC<CustomTextProps> = ({ style, fontWeight = '400', ...props }) => {
  const getFontFamily = (weight: string) => {
    switch (weight) {
      case '400':
        return 'Outfit-Regular';
      case '500':
        return 'Outfit-Medium';
      case '600':
        return 'Outfit-SemiBold';
      case '700':
        return 'Outfit-Bold';
      case '800':
        return 'Outfit-Bold';
      case '900':
        return 'Outfit-Bold';
      default:
        return 'Outfit-Regular';
    }
  };

  const fontFamily = getFontFamily(fontWeight);

  return (
    <RNText
      {...props}
      style={[
        { fontFamily },
        style,
      ]}
    />
  );
};

export default CustomText; 