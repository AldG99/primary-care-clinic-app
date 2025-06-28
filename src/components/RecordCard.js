import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import Card from './Card';

const RecordCard = ({ record, showPatientInfo = false }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const formatDate = timestamp => {
    if (!timestamp) return 'N/A';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRecordTypeInfo = type => {
    switch (type) {
      case 'consultation':
        return {
          icon: 'medical-outline',
          label: 'Consulta',
          color: colors.info,
        };
      case 'lab':
        return {
          icon: 'flask-outline',
          label: 'Resultados de Laboratorio',
          color: colors.success,
        };
      case 'prescription':
        return {
          icon: 'document-text-outline',
          label: 'Prescripción',
          color: colors.secondary,
        };
      case 'vital_signs':
        return {
          icon: 'pulse-outline',
          label: 'Signos Vitales',
          color: colors.warning,
        };
      case 'followup':
        return {
          icon: 'calendar-outline',
          label: 'Seguimiento',
          color: colors.accent,
        };
      case 'procedure':
        return {
          icon: 'bandage-outline',
          label: 'Procedimiento',
          color: colors.error,
        };
      default:
        return {
          icon: 'document-outline',
          label: 'Registro',
          color: colors.secondary,
        };
    }
  };

  const recordTypeInfo = getRecordTypeInfo(record.type);

  const handlePress = () => {
    navigation.navigate('Registros', {
      screen: 'RecordDetail',
      params: { recordId: record.id },
    });
  };

  return (
    <Card
      title={record.title || recordTypeInfo.label}
      subtitle={`${formatDate(record.date)}`}
      leftIcon={
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: recordTypeInfo.color + '20' },
          ]}
        >
          <Ionicons
            name={recordTypeInfo.icon}
            size={20}
            color={recordTypeInfo.color}
          />
        </View>
      }
      rightIcon={
        <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
      }
      content={
        <View style={styles.contentContainer}>
          {showPatientInfo && record.patientName && (
            <View style={styles.patientInfo}>
              {record.patientPhotoURL ? (
                <Image
                  source={{ uri: record.patientPhotoURL }}
                  style={styles.patientAvatar}
                />
              ) : (
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.secondary}
                  style={styles.infoIcon}
                />
              )}
              <Text style={[styles.patientName, { color: colors.text }]}>
                {record.patientName}
              </Text>
            </View>
          )}

          {record.diagnosis && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                Diagnóstico:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {record.diagnosis}
              </Text>
            </View>
          )}

          {record.doctor && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                Médico:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {record.doctor}
              </Text>
            </View>
          )}

          {record.summary && (
            <Text
              numberOfLines={2}
              style={[styles.summary, { color: colors.text }]}
            >
              {record.summary}
            </Text>
          )}

          {record.tags && record.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {record.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: colors.secondaryLight,
                      borderColor: colors.secondary,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.secondary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    marginTop: 8,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 8,
  },
  patientAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  summary: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default RecordCard;
