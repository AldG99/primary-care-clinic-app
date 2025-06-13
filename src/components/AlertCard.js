import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from './Card';
import { useTheme } from '../hooks/useTheme';

const AlertCard = ({ alert }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const formatDate = date => {
    if (!date) return 'N/A';

    const dateObj = date instanceof Date ? date : new Date(date);

    return dateObj.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAlertInfo = () => {
    let iconName = 'notifications-outline';
    let variant = 'default';

    switch (alert.type) {
      case 'appointment':
        iconName = 'calendar-outline';
        break;
      case 'medication':
        iconName = 'medical-outline';
        break;
      case 'follow_up':
        iconName = 'pulse-outline';
        break;
      case 'lab_results':
        iconName = 'flask-outline';
        break;
      case 'task':
        iconName = 'checkbox-outline';
        break;
      default:
        iconName = 'notifications-outline';
    }

    switch (alert.priority) {
      case 'high':
        variant = 'error';
        break;
      case 'medium':
        variant = 'warning';
        break;
      case 'low':
        variant = 'primary';
        break;
      default:
        variant = 'default';
    }

    return { iconName, variant };
  };

  const { iconName, variant } = getAlertInfo();

  const isUpcoming = () => {
    const now = new Date();
    const alertDate = new Date(alert.scheduledDate);
    const diffTime = alertDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 && diffDays <= 3;
  };

  const isOverdue = () => {
    const now = new Date();
    const alertDate = new Date(alert.scheduledDate);

    return alertDate < now && !alert.completed;
  };

  const getStatusInfo = () => {
    if (alert.completed) {
      return {
        label: 'Completada',
        icon: 'checkmark-circle',
        color: colors.success,
      };
    } else if (isOverdue()) {
      return {
        label: 'Vencida',
        icon: 'alert-circle',
        color: colors.error,
      };
    } else if (isUpcoming()) {
      return {
        label: 'Próxima',
        icon: 'time',
        color: colors.warning,
      };
    } else {
      return {
        label: 'Pendiente',
        icon: 'ellipse-outline',
        color: colors.secondary,
      };
    }
  };

  const statusInfo = getStatusInfo();

  const handlePress = () => {
    if (alert.relatedRecordId) {
      navigation.navigate('Registros', {
        screen: 'RecordDetail',
        params: { recordId: alert.relatedRecordId },
      });
    } else if (alert.relatedPatientId) {
      navigation.navigate('Pacientes', {
        screen: 'PatientDetail',
        params: { patientId: alert.relatedPatientId },
      });
    }
  };

  return (
    <Card
      variant={variant}
      title={alert.title}
      subtitle={formatDate(alert.scheduledDate)}
      leftIcon={
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconName}
            size={20}
            color={colors[variant === 'default' ? 'secondary' : variant]}
          />
        </View>
      }
      rightIcon={
        <View style={styles.statusContainer}>
          <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      }
      content={
        <View style={styles.contentContainer}>
          {alert.description && (
            <Text style={[styles.description, { color: colors.text }]}>
              {alert.description}
            </Text>
          )}

          {alert.patientName && (
            <View style={styles.infoRow}>
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.secondary}
                style={styles.icon}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {alert.patientName}
              </Text>
            </View>
          )}

          {alert.assignedToName && (
            <View style={styles.infoRow}>
              <Ionicons
                name="people-outline"
                size={16}
                color={colors.secondary}
                style={styles.icon}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Asignado a: {alert.assignedToName}
              </Text>
            </View>
          )}
        </View>
      }
      onPress={handlePress}
    />
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    padding: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  contentContainer: {
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
  },
});

export default AlertCard;
