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
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { APP_CONFIG } from '../../constants/config';

const AddRecordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { user } = useAuth();

  const {
    patientId: preSelectedPatientId,
    patientName: preSelectedPatientName,
    patientPhotoURL: preSelectedPatientPhotoURL,
  } = route.params || {};

  const [formData, setFormData] = useState({
    title: '',
    type: 'consultation',
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    summary: '',
    treatmentPlan: '',
    medications: '',
    observations: '',
    followUpDate: '',
    tags: '',
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showPatientSearch, setShowPatientSearch] = useState(
    !preSelectedPatientId
  );
  const [selectedPatient, setSelectedPatient] = useState(
    preSelectedPatientId
      ? {
          id: preSelectedPatientId,
          name: preSelectedPatientName,
          photoURL: preSelectedPatientPhotoURL || null,
        }
      : null
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (preSelectedPatientId && preSelectedPatientName) {
      setSelectedPatient({
        id: preSelectedPatientId,
        name: preSelectedPatientName,
        photoURL: preSelectedPatientPhotoURL || null,
      });
    }
  }, [
    preSelectedPatientId,
    preSelectedPatientName,
    preSelectedPatientPhotoURL,
  ]);

  useEffect(() => {
    if (patientSearch.trim().length >= 2) {
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

      const searchTerms = patientSearch.toLowerCase().split(' ');

      const filtered = patientsList.filter(patient => {
        const firstName = (patient.firstName || '').toLowerCase();
        const lastName = (patient.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;

        return searchTerms.every(term => fullName.includes(term));
      });

      filtered.sort((a, b) => {
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        if (lastNameComparison !== 0) return lastNameComparison;
        return a.firstName.localeCompare(b.firstName);
      });

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los pacientes');
    }
  };

  const handleSelectPatient = patient => {
    setSelectedPatient({
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      photoURL: patient.photoURL || null,
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

    if (!selectedPatient) {
      newErrors.patient = 'Debe seleccionar un paciente';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.date.trim()) {
      newErrors.date = 'La fecha es obligatoria';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      newErrors.date = 'Formato inválido. Usa YYYY-MM-DD';
    }

    if (
      formData.followUpDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(formData.followUpDate)
    ) {
      newErrors.followUpDate = 'Formato inválido. Usa YYYY-MM-DD';
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
      const recordData = {
        title: formData.title,
        type: formData.type,
        date: new Date(formData.date),
        diagnosis: formData.diagnosis || '',
        summary: formData.summary || '',
        treatmentPlan: formData.treatmentPlan || '',
        medications: formData.medications || '',
        observations: formData.observations || '',
        followUpDate: formData.followUpDate
          ? new Date(formData.followUpDate)
          : null,
        doctor: user.displayName || 'N/A',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        ...(selectedPatient.photoURL && {
          patientPhotoURL: selectedPatient.photoURL,
        }),
      };

      if (formData.tags && formData.tags.trim() !== '') {
        recordData.tags = formData.tags.split(',').map(tag => tag.trim());
      }

      await addDoc(collection(db, 'records'), recordData);

      Alert.alert('Éxito', 'Registro guardado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error al guardar registro:', error);
      Alert.alert('Error', 'Ha ocurrido un error al guardar el registro');
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
          Nuevo Registro Médico
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
              Paciente
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
                  error={errors.patient}
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
              Información del registro
            </Text>

            <Input
              label="Título*"
              placeholder="Título del registro"
              value={formData.title}
              onChangeText={value => handleChange('title', value)}
              error={errors.title}
              touched={touched.title}
            />

            <View style={styles.typeSelector}>
              <Text style={[styles.label, { color: colors.text }]}>
                Tipo de registro
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeScrollView}
              >
                <View style={styles.typeOptions}>
                  {APP_CONFIG.recordTypes.map(type => (
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

            <Input
              label="Fecha*"
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={value => handleChange('date', value)}
              error={errors.date}
              touched={touched.date}
              rightIcon={
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Input
              label="Diagnóstico"
              placeholder="Diagnóstico"
              value={formData.diagnosis}
              onChangeText={value => handleChange('diagnosis', value)}
            />

            <Input
              label="Resumen"
              placeholder="Breve resumen del registro"
              value={formData.summary}
              onChangeText={value => handleChange('summary', value)}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Plan de tratamiento"
              placeholder="Plan de tratamiento"
              value={formData.treatmentPlan}
              onChangeText={value => handleChange('treatmentPlan', value)}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Medicamentos"
              placeholder="Medicamentos recetados (separados por coma)"
              value={formData.medications}
              onChangeText={value => handleChange('medications', value)}
            />

            <Input
              label="Observaciones"
              placeholder="Observaciones adicionales"
              value={formData.observations}
              onChangeText={value => handleChange('observations', value)}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Fecha de seguimiento"
              placeholder="YYYY-MM-DD (opcional)"
              value={formData.followUpDate}
              onChangeText={value => handleChange('followUpDate', value)}
              error={errors.followUpDate}
              touched={touched.followUpDate}
              rightIcon={
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Input
              label="Etiquetas"
              placeholder="Etiquetas separadas por coma (opcional)"
              value={formData.tags}
              onChangeText={value => handleChange('tags', value)}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.cancelButton}
            />

            <Button
              title="Guardar registro"
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

export default AddRecordScreen;
