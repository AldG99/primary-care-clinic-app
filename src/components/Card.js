import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const Card = ({
  title,
  subtitle,
  content,
  footer,
  onPress,
  leftIcon,
  rightIcon,
  style,
  elevation = 2,
  variant = 'default',
  disabled = false,
  bordered = false,
}) => {
  const { colors, theme } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.secondaryLight,
          borderColor: colors.secondary,
        };
      case 'accent':
        return {
          backgroundColor:
            theme === 'light' ? `${colors.accent}20` : `${colors.accent}40`,
          borderColor: colors.accent,
        };
      case 'warning':
        return {
          backgroundColor:
            theme === 'light' ? `${colors.warning}20` : `${colors.warning}40`,
          borderColor: colors.warning,
        };
      case 'error':
        return {
          backgroundColor:
            theme === 'light' ? `${colors.error}20` : `${colors.error}40`,
          borderColor: colors.error,
        };
      case 'success':
        return {
          backgroundColor:
            theme === 'light' ? `${colors.success}20` : `${colors.success}40`,
          borderColor: colors.success,
        };
      default:
        return {
          backgroundColor: colors.card,
          borderColor: colors.border,
        };
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.container,
        getVariantStyle(),
        bordered && styles.bordered,
        {
          shadowColor: theme === 'dark' ? colors.background : '#000',
          shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
          elevation: theme === 'dark' ? 0 : elevation,
        },
        style,
      ]}
      onPress={disabled ? null : onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {(title || leftIcon || rightIcon) && (
        <View style={styles.header}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <View style={styles.titleContainer}>
            {title && (
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
            )}

            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.subtext }]}>
                {subtitle}
              </Text>
            )}
          </View>

          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}

      {content && <View style={styles.content}>{content}</View>}

      {footer && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {footer}
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
  },
  bordered: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  rightIcon: {
    marginLeft: 12,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});

export default Card;
