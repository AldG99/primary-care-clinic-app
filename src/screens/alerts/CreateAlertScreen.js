import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  getDocs,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';

const CreateAlertScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { user, hasPermission } = useAuth();

  const {
    patientId: preselectedPatientId,
    patientName: preselectedPatientName,
  } = route.params || {};

  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showPatientSearch, setShowPatientSearch] = useState(
    !preselectedPatientId
  );
  const [selectedPatient, setSelectedPatient] = useState(
    preselectedPatientId
      ? { id: preselectedPatientId, name: preselectedPatientName }
      : null
  );

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'appointment',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    priority: 'medium',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!hasPermission('doctor') && !hasPermission('nurse')) {
      Alert.alert(
        'Acceso denegado',
        'No tienes permisos para crear recordatorios.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [hasPermission, navigation]);

  useEffect(() => {
    if (patientSearch.trim().length >= 1) {
      searchPatients();
    } else {
      setSearchResults([]);
    }
  }, [patientSearch]);

  const searchPatients = async () => {
    try {
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef);
      const querySnapshot = await getDocs(q);

      const patientsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const searchTermLower = patientSearch.toLowerCase();

      const filtered = patientsList.filter(patient => {
        const firstName = (patient.firstName || '').toLowerCase();
        const lastName = (patient.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;

        return fullName.includes(searchTermLower);
      });

      filtered.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
    }
  };

  const handleSelectPatient = patient => {
    setSelectedPatient({
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
    });
    setShowPatientSearch(false);
    setSearchResults([]);
    setPatientSearch('');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    if (value.trim() !== '' && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.scheduledDate.trim()) {
      newErrors.scheduledDate = 'La fecha es obligatoria';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.scheduledDate)) {
      newErrors.scheduledDate = 'Formato inválido. Usa YYYY-MM-DD';
    }

    if (!formData.scheduledTime.trim()) {
      newErrors.scheduledTime = 'La hora es obligatoria';
    } else if (!/^\d{2}:\d{2}$/.test(formData.scheduledTime)) {
      newErrors.scheduledTime = 'Formato inválido. Usa HH:MM';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores del formulario');
      return;
    }

    setLoading(true);
    try {
      const [year, month, day] = formData.scheduledDate.split('-');
      const [hour, minute] = formData.scheduledTime.split(':');
      const scheduledDate = new Date(year, month - 1, day, hour, minute);

      const alertData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        scheduledDate,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        assignedTo: [user.uid],
        completed: false,
      };

      if (selectedPatient) {
        alertData.patientId = selectedPatient.id;
        alertData.patientName = selectedPatient.name;
      }

      await addDoc(collection(db, 'alerts'), alertData);

      Alert.alert('Éxito', 'Recordatorio creado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error al guardar alerta:', error);
      Alert.alert('Error', 'Ha ocurrido un error al guardar el recordatorio');
    } finally {
      setLoading(false);
    }
  };

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
          Nuevo recordatorio
        </Text>

        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Asociar a paciente (opcional)
            </Text>

            {selectedPatient && !showPatientSearch ? (
              <View
                style={[
                  styles.selectedPatient,
                  { backgroundColor: colors.card },
                ]}
              >
                <View style={styles.patientInfo}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={colors.secondary}
                    style={styles.patientIcon}
                  />
                  <Text style={[styles.patientName, { color: colors.text }]}>
                    {selectedPatient.name}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.changePatientButton}
                  onPress={() => setShowPatientSearch(true)}
                >
                  <Text
                    style={[
                      styles.changePatientText,
                      { color: colors.secondary },
                    ]}
                  >
                    Cambiar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Input
                  placeholder="Buscar paciente por nombre..."
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                  leftIcon={
                    <Ionicons
                      name="search"
                      size={20}
                      color={colors.secondary}
                    />
                  }
                />

                {searchResults.length > 0 && (
                  <View
                    style={[
                      styles.searchResults,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {searchResults.map(patient => (
                      <TouchableOpacity
                        key={patient.id}
                        style={[
                          styles.patientItem,
                          { borderBottomColor: colors.border },
                        ]}
                        onPress={() => handleSelectPatient(patient)}
                      >
                        <Text
                          style={[
                            styles.patientItemName,
                            { color: colors.text },
                          ]}
                        >
                          {patient.firstName} {patient.lastName}
                        </Text>
                        <Text
                          style={[
                            styles.patientItemInfo,
                            { color: colors.subtext },
                          ]}
                        >
                          {calculateAge(patient.birthDate)} años -{' '}
                          {patient.gender === 'male' ? 'M' : 'F'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {patientSearch.trim().length >= 2 &&
                  searchResults.length === 0 && (
                    <Text style={[styles.noResults, { color: colors.error }]}>
                      No se encontraron pacientes
                    </Text>
                  )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Información del recordatorio
            </Text>

            <Input
              label="Título*"
              placeholder="Título del recordatorio"
              value={formData.title}
              onChangeText={value => handleChange('title', value)}
              error={errors.title}
              touched={touched.title}
            />

            <Input
              label="Descripción"
              placeholder="Descripción o detalles adicionales"
              value={formData.description}
              onChangeText={value => handleChange('description', value)}
              multiline
              numberOfLines={3}
            />

            <View style={styles.typeSelector}>
              <Text style={[styles.label, { color: colors.text }]}>
                Tipo de recordatorio
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeScrollView}
              >
                <View style={styles.typeOptions}>
                  {[
                    {
                      id: 'appointment',
                      label: 'Cita',
                      icon: 'calendar-outline',
                    },
                    {
                      id: 'medication',
                      label: 'Medicación',
                      icon: 'medical-outline',
                    },
                    {
                      id: 'follow_up',
                      label: 'Seguimiento',
                      icon: 'pulse-outline',
                    },
                    {
                      id: 'lab_results',
                      label: 'Resultados lab',
                      icon: 'flask-outline',
                    },
                    { id: 'task', label: 'Tarea', icon: 'checkbox-outline' },
                  ].map(type => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeOption,
                        formData.type === type.id && {
                          backgroundColor: colors.secondaryLight,
                          borderColor: colors.secondary,
                        },
                        { borderColor: colors.border },
                      ]}
                      onPress={() => handleChange('type', type.id)}
                    >
                      <Ionicons
                        name={type.icon}
                        size={18}
                        color={
                          formData.type === type.id
                            ? colors.secondary
                            : colors.subtext
                        }
                        style={styles.typeIcon}
                      />
                      <Text
                        style={[
                          styles.typeText,
                          {
                            color:
                              formData.type === type.id
                                ? colors.secondary
                                : colors.text,
                            fontWeight:
                              formData.type === type.id ? '600' : '400',
                          },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.row}>
              <Input
                label="Fecha*"
                placeholder="YYYY-MM-DD"
                value={formData.scheduledDate}
                onChangeText={value => handleChange('scheduledDate', value)}
                error={errors.scheduledDate}
                touched={touched.scheduledDate}
                rightIcon={
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.secondary}
                  />
                }
                style={styles.dateInput}
              />

              <Input
                label="Hora*"
                placeholder="HH:MM"
                value={formData.scheduledTime}
                onChangeText={value => handleChange('scheduledTime', value)}
                error={errors.scheduledTime}
                touched={touched.scheduledTime}
                rightIcon={
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.secondary}
                  />
                }
                style={styles.timeInput}
              />
            </View>

            <View style={styles.prioritySelector}>
              <Text style={[styles.label, { color: colors.text }]}>
                Prioridad
              </Text>

              <View style={styles.priorityOptions}>
                {[
                  { id: 'low', label: 'Baja', color: colors.info },
                  { id: 'medium', label: 'Media', color: colors.warning },
                  { id: 'high', label: 'Alta', color: colors.error },
                ].map(priority => (
                  <TouchableOpacity
                    key={priority.id}
                    style={[
                      styles.priorityOption,
                      formData.priority === priority.id && {
                        backgroundColor: `${priority.color}20`,
                        borderColor: priority.color,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleChange('priority', priority.id)}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: priority.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color:
                            formData.priority === priority.id
                              ? priority.color
                              : colors.text,
                          fontWeight:
                            formData.priority === priority.id ? '600' : '400',
                        },
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.cancelButton}
            />

            <Button
              title="Guardar recordatorio"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  selectedPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
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
  changePatientButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changePatientText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchResults: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  patientItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  patientItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  patientItemInfo: {
    fontSize: 12,
  },
  noResults: {
    marginTop: 8,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 0.65,
  },
  timeInput: {
    flex: 0.3,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeScrollView: {
    marginBottom: 8,
  },
  typeOptions: {
    flexDirection: 'row',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  typeIcon: {
    marginRight: 4,
  },
  typeText: {
    fontSize: 14,
  },
  prioritySelector: {
    marginTop: 16,
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    flex: 0.3,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 0.48,
  },
  saveButton: {
    flex: 0.48,
  },
});

export default CreateAlertScreen;
