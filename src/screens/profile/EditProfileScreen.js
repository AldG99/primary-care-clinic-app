import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Input from '../../components/Input';
import Button from '../../components/Button';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, refreshUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.photoURL) {
      setProfileImage(user.photoURL);
    }
  }, [user]);

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

      const imageRef = ref(storage, `profile_images/${user.uid}_${Date.now()}`);

      const uploadResult = await uploadBytes(imageRef, blob);

      const downloadURL = await getDownloadURL(imageRef);

      return downloadURL;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw error;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updateData = {
        displayName: formData.displayName,
        phone: formData.phone,
        organization: formData.organization,
      };

      if (profileImage && !profileImage.startsWith('http')) {
        const imageUrl = await uploadImage(profileImage);
        if (imageUrl) {
          updateData.photoURL = imageUrl;
        }
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);

      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
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
          Editar Perfil
        </Text>

        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Imagen de perfil */}
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
                <Text style={[styles.avatarText, { color: colors.secondary }]}>
                  {user?.displayName?.charAt(0) || 'U'}
                </Text>
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

            <Text style={[styles.changePhotoText, { color: colors.secondary }]}>
              Cambiar foto de perfil
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nombre completo"
              placeholder="Nombre y apellido"
              value={formData.displayName}
              onChangeText={value =>
                setFormData(prev => ({ ...prev, displayName: value }))
              }
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
            />

            <Input
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChangeText={value =>
                setFormData(prev => ({ ...prev, email: value }))
              }
              leftIcon={
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
              editable={false}
            />

            <Input
              label="Teléfono"
              placeholder="Número de teléfono"
              value={formData.phone}
              onChangeText={value =>
                setFormData(prev => ({ ...prev, phone: value }))
              }
              leftIcon={
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
              keyboardType="phone-pad"
            />

            <Input
              label="Organización/Institución"
              placeholder="Nombre de clínica, hospital o consultorio"
              value={formData.organization}
              onChangeText={value =>
                setFormData(prev => ({ ...prev, organization: value }))
              }
              leftIcon={
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={colors.secondary}
                />
              }
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
              title="Guardar cambios"
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 0.48,
  },
  saveButton: {
    flex: 0.48,
  },
});

export default EditProfileScreen;
