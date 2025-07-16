import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';

const RegisterScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'doctor',
    organization: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    if (!formData.email) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar registro
  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const displayName = `${formData.firstName} ${formData.lastName}`;
      await register(
        formData.email,
        formData.password,
        displayName,
        formData.role,
        formData.organization
      );
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      let errorMessage = 'Error al registrar usuario';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta con este correo electrónico';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Correo electrónico inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es demasiado débil';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu conexión a internet';
          break;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>
              Crear cuenta
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.nameRow}>
              <Input
                label="Nombre"
                placeholder="Nombre"
                value={formData.firstName}
                onChangeText={value => handleChange('firstName', value)}
                error={errors.firstName}
                touched={touched.firstName}
                style={styles.nameInput}
              />

              <Input
                label="Apellido"
                placeholder="Apellido"
                value={formData.lastName}
                onChangeText={value => handleChange('lastName', value)}
                error={errors.lastName}
                touched={touched.lastName}
                style={styles.nameInput}
              />
            </View>

            <Input
              label="Correo electrónico"
              placeholder="tucorreo@ejemplo.com"
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
              label="Contraseña"
              placeholder="Contraseña (min. 6 caracteres)"
              value={formData.password}
              onChangeText={value => handleChange('password', value)}
              secureTextEntry
              error={errors.password}
              touched={touched.password}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Input
              label="Confirmar contraseña"
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChangeText={value => handleChange('confirmPassword', value)}
              secureTextEntry
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Input
              label="Organización/Institución"
              placeholder="Nombre de clínica, hospital o consultorio"
              value={formData.organization}
              onChangeText={value => handleChange('organization', value)}
              leftIcon={
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Text style={[styles.roleLabel, { color: colors.text }]}>
              Rol en el sistema
            </Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'doctor' && {
                    backgroundColor: colors.secondaryLight,
                    borderColor: colors.secondary,
                  },
                  { borderColor: colors.border },
                ]}
                onPress={() => handleChange('role', 'doctor')}
              >
                <Ionicons
                  name="medical"
                  size={24}
                  color={
                    formData.role === 'doctor'
                      ? colors.secondary
                      : colors.subtext
                  }
                  style={styles.roleIcon}
                />
                <Text
                  style={[
                    styles.roleText,
                    {
                      color:
                        formData.role === 'doctor'
                          ? colors.secondary
                          : colors.text,
                      fontWeight: formData.role === 'doctor' ? '600' : '400',
                    },
                  ]}
                >
                  Médico
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'nurse' && {
                    backgroundColor: colors.secondaryLight,
                    borderColor: colors.secondary,
                  },
                  { borderColor: colors.border },
                ]}
                onPress={() => handleChange('role', 'nurse')}
              >
                <Ionicons
                  name="fitness"
                  size={24}
                  color={
                    formData.role === 'nurse'
                      ? colors.secondary
                      : colors.subtext
                  }
                  style={styles.roleIcon}
                />
                <Text
                  style={[
                    styles.roleText,
                    {
                      color:
                        formData.role === 'nurse'
                          ? colors.secondary
                          : colors.text,
                      fontWeight: formData.role === 'nurse' ? '600' : '400',
                    },
                  ]}
                >
                  Enfermera/o
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Registrarse"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.subtext }]}>
              ¿Ya tienes una cuenta?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginText, { color: colors.accent }]}>
                Iniciar sesión
              </Text>
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 0.48,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 0.48,
  },
  roleIcon: {
    marginRight: 8,
  },
  roleText: {
    fontSize: 14,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginRight: 4,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
