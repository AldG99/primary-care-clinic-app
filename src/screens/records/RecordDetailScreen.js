import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import { formatDate } from '../../utils/dateUtils';

const RecordDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { hasPermission, user } = useAuth();
  const { recordId } = route.params;

  const [record, setRecord] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecordData();
  }, [recordId, user]);

  const loadRecordData = async () => {
    setLoading(true);
    try {
      const recordDoc = await getDoc(doc(db, 'records', recordId));

      if (!recordDoc.exists()) {
        Alert.alert('Error', 'El registro no existe o ha sido eliminado');
        navigation.goBack();
        return;
      }

      const recordData = {
        id: recordDoc.id,
        ...recordDoc.data(),
      };

      if (recordData.createdBy !== user.uid) {
        Alert.alert(
          'Acceso denegado',
          'No tienes permiso para ver este registro'
        );
        navigation.goBack();
        return;
      }

      setRecord(recordData);

      if (recordData.patientId) {
        const patientDoc = await getDoc(
          doc(db, 'patients', recordData.patientId)
        );

        if (patientDoc.exists()) {
          const patientData = {
            id: patientDoc.id,
            ...patientDoc.data(),
          };

          if (patientData.createdBy !== user.uid) {
            console.warn('El paciente no pertenece al usuario actual');
          } else {
            setPatient(patientData);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del registro:', error);
      Alert.alert('Error', 'Ha ocurrido un error al cargar los datos');
    } finally {
      setLoading(false);
    }
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

  const createFollowupAlert = () => {
    if (!record || !patient) return;

    navigation.navigate('Alertas', {
      screen: 'CreateAlert',
      params: {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        initialData: {
          title: `Seguimiento: ${
            record.title || getRecordTypeInfo(record.type).label
          }`,
          description: `Seguimiento para ${patient.firstName} ${
            patient.lastName
          }${record.diagnosis ? `. Diagnóstico: ${record.diagnosis}` : ''}`,
          type: 'follow_up',
        },
      },
    });
  };

  const goToPatientDetail = () => {
    if (patient) {
      navigation.navigate('PatientDetail', { patientId: patient.id });
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Cargando datos del registro...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar style="auto" />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={[styles.errorText, { color: colors.text }]}>
            No se pudo cargar el registro
          </Text>
          <Button
            title="Volver"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const recordTypeInfo = getRecordTypeInfo(record.type);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="auto" />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          Detalle del Registro
        </Text>

        {hasPermission('doctor') && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              // Opción 1: Mostrar un mensaje
              Alert.alert(
                'Información',
                'La funcionalidad de edición está en desarrollo'
              );
            }}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={colors.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.recordHeader, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.typeContainer,
              { backgroundColor: recordTypeInfo.color + '20' },
            ]}
          >
            <Ionicons
              name={recordTypeInfo.icon}
              size={24}
              color={recordTypeInfo.color}
            />
          </View>

          <View style={styles.recordInfo}>
            <Text style={[styles.recordTitle, { color: colors.text }]}>
              {record.title || recordTypeInfo.label}
            </Text>

            <Text style={[styles.recordDate, { color: colors.subtext }]}>
              {formatDate(record.date)}
            </Text>

            {record.doctor && (
              <Text style={[styles.recordDoctor, { color: colors.secondary }]}>
                Dr. {record.doctor}
              </Text>
            )}
          </View>
        </View>

        {patient && (
          <TouchableOpacity
            style={[
              styles.patientCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={goToPatientDetail}
          >
            <View style={styles.patientInfo}>
              <Ionicons
                name="person"
                size={20}
                color={colors.secondary}
                style={styles.patientIcon}
              />
              <View>
                <Text style={[styles.patientName, { color: colors.text }]}>
                  {patient.firstName} {patient.lastName}
                </Text>

                <Text
                  style={[styles.patientSubInfo, { color: colors.subtext }]}
                >
                  Ver detalle del paciente
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>
        )}

        <View style={styles.sections}>
          {record.diagnosis && (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Diagnóstico
              </Text>
              <Text style={[styles.sectionContent, { color: colors.text }]}>
                {record.diagnosis}
              </Text>
            </View>
          )}

          {record.summary && (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Resumen
              </Text>
              <Text style={[styles.sectionContent, { color: colors.text }]}>
                {record.summary}
              </Text>
            </View>
          )}

          {record.treatmentPlan && (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Plan de tratamiento
              </Text>
              <Text style={[styles.sectionContent, { color: colors.text }]}>
                {record.treatmentPlan}
              </Text>
            </View>
          )}

          {record.medications && (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Medicamentos
              </Text>
              <Text style={[styles.sectionContent, { color: colors.text }]}>
                {record.medications}
              </Text>
            </View>
          )}

          {record.observations && (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Observaciones
              </Text>
              <Text style={[styles.sectionContent, { color: colors.text }]}>
                {record.observations}
              </Text>
            </View>
          )}

          {record.followUpDate && (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Fecha de seguimiento
              </Text>
              <Text style={[styles.sectionContent, { color: colors.accent }]}>
                {formatDate(record.followUpDate)}
              </Text>
            </View>
          )}

          {record.tags && record.tags.length > 0 && (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Etiquetas
              </Text>
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
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Button
          title="Crear recordatorio de seguimiento"
          onPress={createFollowupAlert}
          variant="secondary"
          leftIcon={
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.secondary}
            />
          }
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  recordHeader: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  typeContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  recordDoctor: {
    fontSize: 14,
    fontWeight: '500',
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientIcon: {
    marginRight: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  patientSubInfo: {
    fontSize: 12,
  },
  sections: {
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export default RecordDetailScreen;
