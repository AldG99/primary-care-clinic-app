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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';

const AddPatientScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    occupation: '',
    allergies: '',
    medications: '',
    notes: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!hasPermission('doctor')) {
      Alert.alert(
        'Acceso denegado',
        'No tienes permisos para registrar pacientes.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [hasPermission, navigation]);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Se necesitan permisos para acceder a la galería.'
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const uploadImage = async uri => {
    if (!uri) return null;

    try {
      setImageUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();

      const imageRef = ref(
        storage,
        `patient_images/${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`
      );

      await uploadBytes(imageRef, blob);

      const downloadURL = await getDownloadURL(imageRef);

      return downloadURL;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw error;
    } finally {
      setImageUploading(false);
    }
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    if (!formData.birthDate.trim()) {
      newErrors.birthDate = 'La fecha de nacimiento es obligatoria';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.birthDate)) {
      newErrors.birthDate = 'Formato inválido. Usa YYYY-MM-DD';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
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
      let photoURL = null;

      if (profileImage) {
        photoURL = await uploadImage(profileImage);
      }

      const patientData = {
        ...formData,
        photoURL,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        createdBy: user.uid,
      };

      await addDoc(collection(db, 'patients'), patientData);

      Alert.alert('Éxito', 'Paciente registrado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      Alert.alert('Error', 'Ha ocurrido un error al guardar el paciente');
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
          Nuevo Paciente
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
          <View style={styles.profileImageContainer}>
            <TouchableOpacity
              style={[
                styles.profileImage,
                { backgroundColor: colors.secondaryLight },
              ]}
              onPress={pickImage}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={40} color={colors.secondary} />
                </View>
              )}

              <View
                style={[
                  styles.cameraIconContainer,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.photoText, { color: colors.secondary }]}>
              {profileImage ? 'Cambiar foto' : 'Añadir foto (opcional)'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Información personal
            </Text>

            <View style={styles.row}>
              <Input
                label="Nombre*"
                placeholder="Nombre"
                value={formData.firstName}
                onChangeText={value => handleChange('firstName', value)}
                error={errors.firstName}
                touched={touched.firstName}
                style={styles.rowInput}
              />

              <Input
                label="Apellido*"
                placeholder="Apellido"
                value={formData.lastName}
                onChangeText={value => handleChange('lastName', value)}
                error={errors.lastName}
                touched={touched.lastName}
                style={styles.rowInput}
              />
            </View>

            <View style={styles.row}>
              <Input
                label="Fecha de nacimiento*"
                placeholder="YYYY-MM-DD"
                value={formData.birthDate}
                onChangeText={value => handleChange('birthDate', value)}
                error={errors.birthDate}
                touched={touched.birthDate}
                style={styles.rowInput}
              />

              <View style={[styles.rowInput, styles.genderContainer]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Género*
                </Text>

                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      formData.gender === 'male' && {
                        backgroundColor: colors.secondaryLight,
                        borderColor: colors.secondary,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleChange('gender', 'male')}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color:
                            formData.gender === 'male'
                              ? colors.secondary
                              : colors.text,
                          fontWeight:
                            formData.gender === 'male' ? '600' : '400',
                        },
                      ]}
                    >
                      Masculino
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      formData.gender === 'female' && {
                        backgroundColor: colors.secondaryLight,
                        borderColor: colors.secondary,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleChange('gender', 'female')}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color:
                            formData.gender === 'female'
                              ? colors.secondary
                              : colors.text,
                          fontWeight:
                            formData.gender === 'female' ? '600' : '400',
                        },
                      ]}
                    >
                      Femenino
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Información de contacto
            </Text>

            <Input
              label="Teléfono*"
              placeholder="Teléfono"
              value={formData.phone}
              onChangeText={value => handleChange('phone', value)}
              keyboardType="phone-pad"
              error={errors.phone}
              touched={touched.phone}
              leftIcon={
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Input
              label="Correo electrónico"
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={value => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              touched={touched.email}
              leftIcon={
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Input
              label="Dirección"
              placeholder="Dirección"
              value={formData.address}
              onChangeText={value => handleChange('address', value)}
              leftIcon={
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Input
              label="Ocupación"
              placeholder="Ocupación"
              value={formData.occupation}
              onChangeText={value => handleChange('occupation', value)}
              leftIcon={
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Información médica
            </Text>

            <Input
              label="Alergias"
              placeholder="Alergias (separadas por coma)"
              value={formData.allergies}
              onChangeText={value => handleChange('allergies', value)}
              multiline
              numberOfLines={2}
            />

            <Input
              label="Medicamentos actuales"
              placeholder="Medicamentos actuales (separados por coma)"
              value={formData.medications}
              onChangeText={value => handleChange('medications', value)}
              multiline
              numberOfLines={2}
            />

            <Input
              label="Notas adicionales"
              placeholder="Notas médicas o información adicional"
              value={formData.notes}
              onChangeText={value => handleChange('notes', value)}
              multiline
              numberOfLines={4}
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
              title="Guardar paciente"
              onPress={handleSave}
              loading={loading || imageUploading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowInput: {
    flex: 0.48,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 0.48,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderText: {
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

export default AddPatientScreen;
