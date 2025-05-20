import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'medium',
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled
            ? colors.secondary + '80'
            : colors.secondary,
          borderColor: colors.secondary,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.secondary,
        };
      case 'accent':
        return {
          backgroundColor: disabled ? colors.accent + '80' : colors.accent,
          borderColor: colors.accent,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? colors.error + '80' : colors.error,
          borderColor: colors.error,
        };
      default:
        return {
          backgroundColor: disabled
            ? colors.secondary + '80'
            : colors.secondary,
          borderColor: colors.secondary,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 4,
        };
      case 'medium':
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
        };
      case 'large':
        return {
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 10,
        };
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
        };
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (size) {
      case 'small':
        baseTextStyle.fontSize = 12;
        break;
      case 'medium':
        baseTextStyle.fontSize = 14;
        break;
      case 'large':
        baseTextStyle.fontSize = 16;
        break;
    }

    if (variant === 'secondary') {
      baseTextStyle.color = colors.secondary;
    } else {
      baseTextStyle.color = '#FFF';
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      onPress={disabled || loading ? null : onPress}
      activeOpacity={0.8}
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && { width: '100%' },
        style,
      ]}
      disabled={disabled || loading}
    >
      {leftIcon && !loading ? leftIcon : null}

      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? colors.secondary : '#FFF'}
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}

      {rightIcon && !loading ? rightIcon : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 100,
    gap: 8,
  },
});

export default Button;
