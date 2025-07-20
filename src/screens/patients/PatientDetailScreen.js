import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import RecordCard from '../../components/RecordCard';
import Button from '../../components/Button';

const PatientDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { hasPermission, user } = useAuth();
  const { patientId } = route.params;

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [schedulingAppointment, setSchedulingAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Una semana a partir de hoy
  );

  useEffect(() => {
    loadPatientData();
  }, [patientId, user]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      console.log('Intentando cargar datos del paciente:', patientId);

      const patientDoc = await getDoc(doc(db, 'patients', patientId));

      if (!patientDoc.exists()) {
        Alert.alert('Error', 'El paciente no existe o ha sido eliminado');
        navigation.goBack();
        return;
      }

      const patientData = {
        id: patientDoc.id,
        ...patientDoc.data(),
      };

      if (patientData.createdBy !== user.uid) {
        Alert.alert(
          'Acceso denegado',
          'No tienes permiso para ver este paciente'
        );
        navigation.goBack();
        return;
      }

      console.log(
        'Datos del paciente cargados:',
        patientData.firstName,
        patientData.lastName
      );
      setPatient(patientData);

      try {
        console.log('Intentando cargar registros del paciente...');
        const recordsRef = collection(db, 'records');

        const q = query(
          recordsRef,
          where('patientId', '==', patientId),
          where('createdBy', '==', user.uid)
        );

        const recordsSnapshot = await getDocs(q);
        console.log('Registros encontrados:', recordsSnapshot.docs.length);

        const recordsList = recordsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        recordsList.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA;
        });

        setRecords(recordsList);
      } catch (recordError) {
        console.error('Error al cargar registros:', recordError);
        setRecords([]);
        Alert.alert(
          'Error de carga',
          'No se pudieron cargar los registros médicos: ' + recordError.message
        );
      }
    } catch (error) {
      console.error('Error al cargar datos del paciente:', error);
      Alert.alert('Error', 'Ha ocurrido un error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = birthDateString => {
    if (!birthDateString) return '';

    const birthDate = new Date(birthDateString);
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
  };

  const formatDate = dateString => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return 'Fecha inválida';

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en fecha';
    }
  };

  const handleEditPatient = () => {
    setShowActionsModal(false);
    navigation.navigate('Pacientes', {
      screen: 'EditPatient',
      params: { patientId },
    });
  };

  const handleScheduleAppointment = async () => {
    try {
      const appointmentDateISO = appointmentDate + 'T12:00:00.000Z';

      const patientRef = doc(db, 'patients', patientId);
      await updateDoc(patientRef, {
        upcomingAppointment: appointmentDateISO,
        lastUpdated: serverTimestamp(),
      });

      const scheduledDate = new Date(appointmentDateISO);

      const alert = {
        title: `Cita con ${patient.firstName} ${patient.lastName}`,
        description: `Cita programada para el paciente`,
        type: 'appointment',
        priority: 'medium',
        scheduledDate: scheduledDate,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        assignedTo: [user.uid],
        completed: false,
        patientId: patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhotoURL: patient.photoURL,
      };

      await addDoc(collection(db, 'alerts'), alert);

      setSchedulingAppointment(false);
      setShowActionsModal(false);
      Alert.alert('Éxito', 'Cita programada correctamente');
      loadPatientData();
    } catch (error) {
      console.error('Error al programar cita:', error);
      Alert.alert('Error', 'No se pudo programar la cita');
    }
  };

  const handleDeletePatient = () => {
    setShowActionsModal(false);
    Alert.alert(
      'Eliminar paciente',
      '¿Estás seguro de que deseas eliminar a este paciente? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const patientRef = doc(db, 'patients', patientId);
              await deleteDoc(patientRef);
              Alert.alert('Éxito', 'Paciente eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              console.error('Error al eliminar paciente:', error);
              Alert.alert('Error', 'No se pudo eliminar el paciente');
            }
          },
        },
      ]
    );
  };

  const handleCreateRecord = () => {
    navigation.navigate('Registros', {
      screen: 'AddRecord',
      params: {
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhotoURL: patient.photoURL,
      },
    });
  };

  const updateLastVisit = async () => {
    try {
      const patientRef = doc(db, 'patients', patientId);
      await updateDoc(patientRef, {
        lastVisit: new Date().toISOString(),
        lastUpdated: serverTimestamp(),
      });

      loadPatientData();

      Alert.alert('Éxito', 'Se ha registrado la visita actual');
    } catch (error) {
      console.error('Error al actualizar última visita:', error);
      Alert.alert('Error', 'Ha ocurrido un error al registrar la visita');
    }
  };

  const renderAppointmentModal = () => (
    <Modal
      visible={schedulingAppointment}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setSchedulingAppointment(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Programar cita
          </Text>

          <View style={styles.dateInputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Fecha de la cita:
            </Text>
            <TextInput
              style={[
                styles.dateInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={appointmentDate}
              onChangeText={setAppointmentDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              onPress={() => setSchedulingAppointment(false)}
              variant="secondary"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Guardar"
              onPress={handleScheduleAppointment}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderActionsModal = () => (
    <Modal
      visible={showActionsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowActionsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.actionsContainer, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.actionsTitle, { color: colors.text }]}>
            Acciones del paciente
          </Text>

          <TouchableOpacity
            style={[
              styles.modalActionButton,
              { borderBottomColor: colors.border },
            ]}
            onPress={handleEditPatient}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={colors.secondary}
            />
            <Text style={[styles.modalActionText, { color: colors.text }]}>
              Editar información
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalActionButton,
              { borderBottomColor: colors.border },
            ]}
            onPress={() => {
              setShowActionsModal(false);
              setSchedulingAppointment(true);
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.secondary}
            />
            <Text style={[styles.modalActionText, { color: colors.text }]}>
              Programar cita
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalActionButton,
              { borderBottomColor: colors.border },
            ]}
            onPress={handleDeletePatient}
          >
            <Ionicons name="trash-outline" size={24} color={colors.error} />
            <Text style={[styles.modalActionText, { color: colors.error }]}>
              Eliminar paciente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.border }]}
            onPress={() => setShowActionsModal(false)}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Cargando datos del paciente...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          Detalles del Paciente
        </Text>

        {hasPermission('doctor') && (
          <TouchableOpacity
            style={styles.actionsIconButton}
            onPress={() => setShowActionsModal(true)}
          >
            <Ionicons
              name="settings-outline"
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
        <View style={[styles.patientHeader, { backgroundColor: colors.card }]}>
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
                {patient.firstName[0]}
                {patient.lastName[0]}
              </Text>
            )}
          </View>

          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: colors.text }]}>
              {patient.firstName} {patient.lastName}
            </Text>

            <Text style={[styles.patientSubInfo, { color: colors.subtext }]}>
              {calculateAge(patient.birthDate)} años -{' '}
              {patient.gender === 'male' ? 'Masculino' : 'Femenino'}
            </Text>

            <View style={styles.contactInfo}>
              <Ionicons
                name="call-outline"
                size={16}
                color={colors.secondary}
                style={styles.contactIcon}
              />
              <Text style={[styles.contactText, { color: colors.text }]}>
                {patient.phone}
              </Text>
            </View>

            {patient.email && (
              <View style={styles.contactInfo}>
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={colors.secondary}
                  style={styles.contactIcon}
                />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {patient.email}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            title="Registrar visita"
            onPress={updateLastVisit}
            variant="secondary"
            size="small"
            leftIcon={
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.secondary}
              />
            }
            style={styles.actionButton}
          />

          <Button
            title="Nuevo registro"
            onPress={handleCreateRecord}
            variant="primary"
            size="small"
            leftIcon={
              <Ionicons name="add-circle-outline" size={16} color="#FFF" />
            }
            style={styles.actionButton}
          />
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'overview' && {
                borderBottomColor: colors.secondary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'overview'
                      ? colors.secondary
                      : colors.subtext,
                  fontWeight: activeTab === 'overview' ? '600' : '400',
                },
              ]}
            >
              Resumen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'records' && {
                borderBottomColor: colors.secondary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab('records')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'records' ? colors.secondary : colors.subtext,
                  fontWeight: activeTab === 'records' ? '600' : '400',
                },
              ]}
            >
              Registros ({records.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' ? (
          <View style={styles.overviewContainer}>
            <View style={[styles.infoSection, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Información personal
              </Text>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                  Fecha de nacimiento:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatDate(patient.birthDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                  Ocupación:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {patient.occupation || 'No especificada'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                  Dirección:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {patient.address || 'No especificada'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                  Última visita:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {patient.lastVisit
                    ? formatDate(patient.lastVisit)
                    : 'Sin visitas registradas'}
                </Text>
              </View>

              {patient.upcomingAppointment && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                    Próxima cita:
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: colors.accent, fontWeight: '600' },
                    ]}
                  >
                    {formatDate(patient.upcomingAppointment)}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.infoSection, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Información médica
              </Text>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                  Alergias:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {patient.allergies || 'No registradas'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                  Medicamentos actuales:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {patient.medications || 'No registrados'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                  Notas:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {patient.notes || 'Sin notas adicionales'}
                </Text>
              </View>
            </View>

            {records.length > 0 && (
              <View style={styles.latestRecords}>
                <View style={styles.latestRecordsHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Últimos registros
                  </Text>
                  <TouchableOpacity onPress={() => setActiveTab('records')}>
                    <Text
                      style={[styles.viewAllText, { color: colors.secondary }]}
                    >
                      Ver todos
                    </Text>
                  </TouchableOpacity>
                </View>

                {records.slice(0, 2).map(record => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.recordsContainer}>
            {records.length > 0 ? (
              records.map(record => (
                <RecordCard key={record.id} record={record} />
              ))
            ) : (
              <View style={[styles.emptyState, { borderColor: colors.border }]}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={colors.secondary}
                />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No hay registros médicos para este paciente
                </Text>

                {/* Botón de diagnóstico con mejor formato */}
                <View style={styles.diagnosticButtonContainer}>
                  <Button
                    title="Cargar registros directamente"
                    onPress={async () => {
                      try {
                        // Obtener registros del paciente sin orderBy
                        const recordsRef = collection(db, 'records');
                        const q = query(
                          recordsRef,
                          where('patientId', '==', patientId)
                        );

                        const recordsSnapshot = await getDocs(q);
                        console.log(
                          'Registros encontrados:',
                          recordsSnapshot.docs.length
                        );

                        if (recordsSnapshot.empty) {
                          Alert.alert(
                            'Sin registros',
                            'No se encontraron registros para este paciente'
                          );
                          return;
                        }

                        const recordsList = recordsSnapshot.docs.map(doc => {
                          const data = doc.data();
                          console.log(
                            'Registro encontrado:',
                            doc.id,
                            data.type,
                            data.title
                          );
                          return {
                            id: doc.id,
                            ...data,
                          };
                        });

                        // Ordenar manualmente por fecha
                        recordsList.sort((a, b) => {
                          const dateA = a.date?.toDate
                            ? a.date.toDate()
                            : new Date(a.date);
                          const dateB = b.date?.toDate
                            ? b.date.toDate()
                            : new Date(b.date);
                          return dateB - dateA; // Orden descendente
                        });

                        setRecords(recordsList);
                        Alert.alert(
                          'Éxito',
                          `Se cargaron ${recordsList.length} registros directamente`
                        );
                      } catch (error) {
                        console.error('Error cargando registros:', error);
                        Alert.alert(
                          'Error',
                          'No se pudieron cargar los registros: ' +
                            error.message
                        );
                      }
                    }}
                    variant="primary"
                    size="small"
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {renderActionsModal()}
      {renderAppointmentModal()}
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
  actionsIconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  patientHeader: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patientSubInfo: {
    fontSize: 14,
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 0.48,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  overviewContainer: {
    flex: 1,
  },
  infoSection: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
  },
  latestRecords: {
    marginBottom: 16,
  },
  latestRecordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
  },
  recordsContainer: {
    flex: 1,
  },
  emptyState: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    margin: 8,
  },
  emptyStateText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  diagnosticButtonContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionsContainer: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 0.48,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalActionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PatientDetailScreen;
