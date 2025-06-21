import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import Card from './Card';

const PatientCard = ({ patient }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = birthDateString => {
    if (!birthDateString) return 'N/A';

    try {
      const birthDate = new Date(birthDateString);

      if (isNaN(birthDate.getTime())) return 'N/A';

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    } catch (error) {
      console.error('Error al calcular edad:', error);
      return 'N/A';
    }
  };

  const handlePress = () => {
    navigation.navigate('Pacientes', {
      screen: 'PatientDetail',
      params: { patientId: patient.id },
    });
  };

  return (
    <Card
      title={`${patient.firstName || ''} ${patient.lastName || ''}`}
      subtitle={`${calculateAge(patient.birthDate) || 'N/A'} años - ${
        patient.gender === 'male'
          ? 'Masculino'
          : patient.gender === 'female'
          ? 'Femenino'
          : 'No especificado'
      }`}
      leftIcon={
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: colors.secondaryLight },
          ]}
        >
          {patient.photoURL ? (
            <Image
              source={{ uri: patient.photoURL }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={[styles.avatarText, { color: colors.secondary }]}>
              {(patient.firstName || '?')[0]}
              {(patient.lastName || '?')[0]}
            </Text>
          )}
        </View>
      }
      rightIcon={
        <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
      }
      content={
        <View style={styles.infoContainer}>
          <InfoItem
            icon="call-outline"
            label="Teléfono"
            value={patient.phone || 'No disponible'}
            colors={colors}
          />

          <InfoItem
            icon="calendar-outline"
            label="Fecha de nacimiento"
            value={
              patient.birthDate
                ? formatDate(patient.birthDate)
                : 'No disponible'
            }
            colors={colors}
          />

          {patient.lastVisit && (
            <InfoItem
              icon="time-outline"
              label="Última visita"
              value={formatDate(patient.lastVisit)}
              colors={colors}
            />
          )}

          {patient.upcomingAppointment && (
            <InfoItem
              icon="calendar-outline"
              label="Próxima cita"
              value={formatDate(patient.upcomingAppointment)}
              colors={colors}
              highlight
            />
          )}
        </View>
      }
      onPress={handlePress}
    />
  );
};

const InfoItem = ({ icon, label, value, colors, highlight = false }) => (
  <View style={styles.infoItem}>
    <Ionicons
      name={icon}
      size={16}
      color={highlight ? colors.accent : colors.secondary}
      style={styles.infoIcon}
    />
    <View>
      <Text style={[styles.infoLabel, { color: colors.subtext }]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          {
            color: highlight ? colors.accent : colors.text,
            fontWeight: highlight ? '600' : '400',
          },
        ]}
      >
        {value}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
  },
});

export default PatientCard;
